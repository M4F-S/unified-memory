// workers/mcp-server.js
// Cloudflare Worker — MCP endpoint for UnifiedMemory
// URL: https://unified-memory-mcp.YOUR-SUBDOMAIN.workers.dev

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { validateConsent, getConsent, recordQuery } from './consent-gate.js';
import { checkPayment } from './x402-gate.js';

const app = new Hono();
app.use('*', cors());

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getEmbedding(text, env) {
  const resp = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/M4F-S/unified-memory',
      'X-Title': 'UnifiedMemory Hackathon'
    },
    body: JSON.stringify({ model: 'openai/text-embedding-3-small', input: text.slice(0, 8000) })
  });
  const data = await resp.json();
  return data.data[0].embedding;
}

async function classifyMemory(content, source, env) {
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/M4F-S/unified-memory',
      'X-Title': 'UnifiedMemory Hackathon'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-v3.2',
      messages: [
        {
          role: 'system',
          content: 'Classify memory. Return ONLY JSON: {"type":"episodic|semantic|procedural|social|preferential","summary":"1-2 sentences","importance":0-10,"tags":["tag1"]}'
        },
        { role: 'user', content: `Platform: ${source}\nContent: ${content.slice(0, 2000)}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 150
    })
  });
  const data = await resp.json();
  return JSON.parse(data.choices[0].message.content);
}

async function pineconeQuery(embedding, filter, topK, env) {
  const host = env.PINECONE_HOST; // e.g. unified-memory-abc123.svc.gcp-starter.pinecone.io
  const resp = await fetch(`https://${host}/query`, {
    method: 'POST',
    headers: { 'Api-Key': env.PINECONE_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ vector: embedding, filter, topK, includeMetadata: true })
  });
  const data = await resp.json();
  return data.matches || [];
}

async function pineconeUpsert(vectors, namespace, env) {
  const host = env.PINECONE_HOST;
  await fetch(`https://${host}/vectors/upsert`, {
    method: 'POST',
    headers: { 'Api-Key': env.PINECONE_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ vectors, namespace })
  });
}

// fire-and-forget EAS attestation per successful query
function postEasAttestation(token_id, queryHash, memory_type, platform, ctx, env) {
  ctx.waitUntil(
    fetch('https://base-sepolia.easscan.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { createAttestation(data: {
          schemaUID: "${env.EAS_SCHEMA_UID}",
          recipient: "0x0000000000000000000000000000000000000000",
          expirationTime: 0, revocable: false,
          data: { token_id: "${token_id}", query_hash: "${queryHash}", memory_type: "${memory_type}", platform: "${platform}" }
        }) { uid } }`
      })
    }).catch(() => {})
  );
}

// ── MCP Manifest ──────────────────────────────────────────────────────────────
app.get('/.well-known/mcp', (c) => c.json({
  name: 'UnifiedMemory',
  version: '1.0.0',
  description: 'Unified memory graph for AI agents — NEAR consent-controlled, x402-paid',
  tools: [
    {
      name: 'recall_memory',
      description: "Recall memories from the user's unified memory graph across 20+ platforms",
      inputSchema: {
        type: 'object',
        properties: {
          query:       { type: 'string', description: 'Natural language memory query' },
          memory_type: { type: 'string', enum: ['episodic','semantic','procedural','social','preferential','all'], default: 'all' },
          platform:    { type: 'string', description: 'Filter by platform or "all"', default: 'all' },
          token_id:    { type: 'string', description: 'NEAR Consent NFT token ID' }
        },
        required: ['query', 'token_id']
      }
    },
    {
      name: 'add_memory',
      description: "Store a new memory in the user's memory graph",
      inputSchema: {
        type: 'object',
        properties: {
          content:     { type: 'string' },
          memory_type: { type: 'string', enum: ['episodic','semantic','procedural','social','preferential'] },
          source:      { type: 'string', description: 'Platform name (gmail, github, etc.)' },
          token_id:    { type: 'string' }
        },
        required: ['content', 'memory_type', 'source', 'token_id']
      }
    },
    {
      name: 'get_memory_stats',
      description: "Get NFT status and usage stats for the user's memory graph",
      inputSchema: {
        type: 'object',
        properties: { token_id: { type: 'string' } },
        required: ['token_id']
      }
    }
  ]
}));

// ── recall_memory ─────────────────────────────────────────────────────────────
app.post('/mcp/recall_memory', async (c) => {
  const { query, memory_type = 'all', platform = 'all', token_id } = await c.req.json();
  if (!query || !token_id) {
    return c.json({ jsonrpc: '2.0', error: { code: -32602, message: 'query and token_id are required' } }, 400);
  }

  // 1. Validate consent on NEAR
  let validation;
  try {
    validation = await validateConsent(token_id, platform, memory_type, c.env);
  } catch (err) {
    return c.json({ jsonrpc: '2.0', error: { code: -32603, message: `NEAR error: ${err.message}` } }, 503);
  }

  if (!validation.valid) {
    return c.json({ jsonrpc: '2.0', error: { code: -32603, message: `Access denied: ${validation.reason}` } }, 403);
  }

  // 2. x402 payment check
  const paymentBlock = checkPayment(c.req.raw, c.req.url, c.env);
  if (paymentBlock) return paymentBlock;

  // 3. Vector search
  const embedding = await getEmbedding(query, c.env);
  const filter = {};
  if (memory_type !== 'all') filter.memory_type = { '$eq': memory_type };
  if (platform !== 'all')    filter.platform     = { '$eq': platform };

  const matches = await pineconeQuery(embedding, filter, 5, c.env);

  // 4. EAS attestation + NEAR record_query (fire and forget)
  const queryHash = '0x' + Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(query)))
  ).map(b => b.toString(16).padStart(2, '0')).join('');

  postEasAttestation(token_id, queryHash, memory_type, platform, c.executionCtx, c.env);
  recordQuery(token_id, 0.001, c.env, c.executionCtx);

  return c.json({
    jsonrpc: '2.0',
    result: {
      memories: matches.map(m => ({
        content:   m.metadata.content,
        summary:   m.metadata.summary,
        source:    m.metadata.platform,
        type:      m.metadata.memory_type,
        timestamp: m.metadata.timestamp,
        score:     m.score
      })),
      query_cost_usdc:   0.001,
      remaining_queries: validation.remaining_queries - 1
    }
  });
});

// ── add_memory ────────────────────────────────────────────────────────────────
app.post('/mcp/add_memory', async (c) => {
  const { content, memory_type, source, token_id } = await c.req.json();
  if (!content || !memory_type || !source || !token_id) {
    return c.json({ jsonrpc: '2.0', error: { code: -32602, message: 'content, memory_type, source, token_id are required' } }, 400);
  }

  let validation;
  try {
    validation = await validateConsent(token_id, source, memory_type, c.env);
  } catch (err) {
    return c.json({ jsonrpc: '2.0', error: { code: -32603, message: `NEAR error: ${err.message}` } }, 503);
  }

  if (!validation.valid) {
    return c.json({ jsonrpc: '2.0', error: { code: -32603, message: `Access denied: ${validation.reason}` } }, 403);
  }

  // Classify + embed
  const classified = await classifyMemory(content, source, c.env);
  const embedding  = await getEmbedding(classified.summary, c.env);

  const ph = '0x' + Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content)))
  ).map(b => b.toString(16).padStart(2, '0')).join('');

  const memory_id = `agent-${source}-${ph.slice(2, 18)}`;

  await pineconeUpsert([{
    id: memory_id,
    values: embedding,
    metadata: {
      user_id: token_id, content: content.slice(0, 1000),
      summary: classified.summary, memory_type: classified.type,
      platform: source, timestamp: new Date().toISOString(),
      importance: classified.importance, tags: classified.tags,
      provenance_hash: ph, url: ''
    }
  }], token_id, c.env);

  return c.json({
    jsonrpc: '2.0',
    result: { memory_id, type: classified.type, importance_score: classified.importance }
  });
});

// ── get_memory_stats ──────────────────────────────────────────────────────────
app.post('/mcp/get_memory_stats', async (c) => {
  const { token_id } = await c.req.json();
  if (!token_id) {
    return c.json({ jsonrpc: '2.0', error: { code: -32602, message: 'token_id is required' } }, 400);
  }

  const consent = await getConsent(token_id, c.env);
  if (!consent) {
    return c.json({ jsonrpc: '2.0', error: { code: -32604, message: 'Token not found' } }, 404);
  }

  // Pinecone stats for this user namespace
  let total_memories = 0, by_platform = {}, by_type = {};
  try {
    const host = c.env.PINECONE_HOST;
    const statsResp = await fetch(`https://${host}/describe_index_stats`, {
      method: 'POST',
      headers: { 'Api-Key': c.env.PINECONE_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter: {} })
    });
    const stats = await statsResp.json();
    total_memories = stats.namespaces?.[token_id]?.vectorCount ?? 0;
  } catch { /* non-fatal */ }

  return c.json({
    jsonrpc: '2.0',
    result: {
      nft_status:        consent.is_active ? 'active' : (consent.revoked_at ? 'revoked' : 'expired'),
      total_memories,
      by_platform,
      by_type,
      queries_used:      consent.queries_used,
      queries_remaining: consent.max_queries - consent.queries_used,
      usdc_spent:        consent.usdc_spent,
      usdc_remaining:    consent.max_usdc_budget - consent.usdc_spent,
      expires_at:        new Date(parseInt(consent.expires_at)).toISOString()
    }
  });
});

export default app;
