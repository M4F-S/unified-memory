// Cloudflare Worker — MCP Server
// Endpoint: https://mcp.unified-memory.workers.dev
// Called by any AI agent to query user memory

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());

const NEAR_RPC = 'https://rpc.testnet.near.org';
const PINECONE_URL = `https://${PINECONE_INDEX_NAME}-${PINECONE_PROJECT}.svc.${PINECONE_ENV}.pinecone.io`;
const EAS_SCHEMA_UID = SCHEMA_UID; // set in wrangler.toml

// ── Helpers ────────────────────────────────────────────────────────────────────

async function nearView(contractId, method, args) {
  const resp = await fetch(NEAR_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'query',
      params: {
        request_type: 'call_function',
        finality: 'final',
        account_id: contractId,
        method_name: method,
        args_base64: btoa(JSON.stringify(args))
      }
    })
  });
  const data = await resp.json();
  return JSON.parse(atob(data.result.result.join('')));
}

async function pineconeSearch(embedding, filter, topK = 5, env) {
  const resp = await fetch(`${PINECONE_URL}/query`, {
    method: 'POST',
    headers: { 'Api-Key': env.PINECONE_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ vector: embedding, filter, topK, includeMetadata: true })
  });
  const data = await resp.json();
  return data.matches || [];
}

async function getEmbedding(text, env) {
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  });
  const data = await resp.json();
  return data.data[0].embedding;
}

// ── MCP Manifest ──────────────────────────────────────────────────────────────
app.get('/.well-known/mcp', (c) => c.json({
  name: 'UnifiedMemory',
  version: '1.0.0',
  description: 'Unified memory graph for AI agents — NEAR consent-controlled, x402-paid',
  tools: [
    {
      name: 'recall_memory',
      description: 'Recall memories from a user\'s unified memory graph across 20+ platforms',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Natural language memory query' },
          memory_type: { type: 'string', enum: ['episodic','semantic','procedural','social','preferential','all'], default: 'all' },
          platform: { type: 'string', description: 'Filter by platform or "all"', default: 'all' },
          token_id: { type: 'string', description: 'NEAR Consent NFT token ID' }
        },
        required: ['query', 'token_id']
      }
    },
    {
      name: 'add_memory',
      description: 'Store a new memory in the user\'s memory graph',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          memory_type: { type: 'string' },
          source: { type: 'string' },
          token_id: { type: 'string' }
        },
        required: ['content', 'memory_type', 'source', 'token_id']
      }
    },
    {
      name: 'get_memory_stats',
      description: 'Get statistics about the user\'s memory graph',
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
  const env = c.env;
  const { query, memory_type = 'all', platform = 'all', token_id } = await c.req.json();

  // 1. Validate consent on NEAR
  const validation = await nearView(env.NEAR_CONTRACT_ID, 'validate_query', {
    token_id, platform, memory_type, query_cost_usdc: 0.001
  });

  if (!validation.valid) {
    return c.json({ jsonrpc: '2.0', error: { code: -32603, message: `Access denied: ${validation.reason}` } }, 403);
  }

  // 2. Check x402 payment header
  const paymentHeader = c.req.header('X-PAYMENT');
  if (!paymentHeader) {
    return c.json({}, 402, {
      'PAYMENT-REQUIRED': JSON.stringify({
        scheme: 'exact', network: 'base-sepolia',
        maxAmountRequired: '1000', // 0.001 USDC (6 decimals)
        resource: `${c.req.url}`,
        description: 'Memory query fee',
        mimeType: 'application/json',
        payTo: env.CIRCLE_WALLET_ADDRESS,
        maxTimeoutSeconds: 30,
        asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // USDC on Base Sepolia
      })
    });
  }

  // 3. Vector search Pinecone
  const embedding = await getEmbedding(query, env);
  const filter = {};
  if (memory_type !== 'all') filter.memory_type = { '$eq': memory_type };
  if (platform !== 'all') filter.platform = { '$eq': platform };

  const matches = await pineconeSearch(embedding, filter, 5, env);

  // 4. Record query on NEAR (fire and forget)
  c.executionCtx.waitUntil(
    fetch(NEAR_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'broadcast_tx_async',
        params: [/* signed record_query tx */]
      })
    })
  );

  return c.json({
    jsonrpc: '2.0',
    result: {
      memories: matches.map(m => ({
        content: m.metadata.content,
        summary: m.metadata.summary,
        source: m.metadata.platform,
        type: m.metadata.memory_type,
        timestamp: m.metadata.timestamp,
        score: m.score
      })),
      query_cost_usdc: 0.001,
      remaining_queries: validation.remaining_queries - 1
    }
  });
});

// ── get_memory_stats ──────────────────────────────────────────────────────────
app.post('/mcp/get_memory_stats', async (c) => {
  const { token_id } = await c.req.json();
  const consent = await nearView(c.env.NEAR_CONTRACT_ID, 'get_consent', { token_id });
  if (!consent) return c.json({ error: 'Token not found' }, 404);
  return c.json({
    jsonrpc: '2.0',
    result: {
      nft_status: consent.is_active ? 'active' : (consent.revoked_at ? 'revoked' : 'expired'),
      queries_used: consent.queries_used,
      queries_remaining: consent.max_queries - consent.queries_used,
      usdc_spent: consent.usdc_spent,
      usdc_remaining: consent.max_usdc_budget - consent.usdc_spent,
      expires_at: new Date(parseInt(consent.expires_at)).toISOString()
    }
  });
});

export default app;
