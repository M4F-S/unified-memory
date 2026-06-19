import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MOCK_ENV, MOCK_CTX, VALID_VALIDATION, REVOKED_VALIDATION, EXPIRED_VALIDATION, MOCK_CONSENT, MOCK_MATCHES } from './setup.js'

// Mock all external module deps before importing the app
vi.mock('../consent-gate.js', () => ({
  validateConsent: vi.fn(),
  getConsent:      vi.fn(),
  recordQuery:     vi.fn(),
}))
vi.mock('../x402-gate.js', () => ({
  checkPayment: vi.fn(),
}))

import { validateConsent, getConsent, recordQuery } from '../consent-gate.js'
import { checkPayment } from '../x402-gate.js'
import app from '../mcp-server.js'

const PAID_HEADER = { 'X-PAYMENT': 'exact:base-sepolia:1000:0xABC' }
const EMBEDDING   = new Array(1536).fill(0.01)
const CLASSIFIED  = { type: 'episodic', summary: 'Test summary', importance: 7, tags: ['test'] }

async function req(path, { method = 'GET', body, headers = {} } = {}) {
  return app.fetch(
    new Request(`http://localhost${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body != null ? JSON.stringify(body) : undefined,
    }),
    MOCK_ENV,
    MOCK_CTX,
  )
}

function mockFetchFor({ embedding = EMBEDDING, classified = CLASSIFIED, matches = MOCK_MATCHES } = {}) {
  global.fetch = vi.fn().mockImplementation(async (url) => {
    if (String(url).includes('/embeddings'))
      return { json: async () => ({ data: [{ embedding }] }) }
    if (String(url).includes('/chat/completions'))
      return { json: async () => ({ choices: [{ message: { content: JSON.stringify(classified) } }] }) }
    if (String(url).includes('/query'))
      return { json: async () => ({ matches }) }
    if (String(url).includes('/vectors/upsert'))
      return { ok: true, json: async () => ({}) }
    if (String(url).includes('/describe_index_stats'))
      return { json: async () => ({ namespaces: {} }) }
    return { json: async () => ({}) }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  checkPayment.mockReturnValue(null)                    // payment ok by default
  validateConsent.mockResolvedValue(VALID_VALIDATION)   // consent ok by default
  getConsent.mockResolvedValue(MOCK_CONSENT)
  mockFetchFor()
})

// ── GET /.well-known/mcp ──────────────────────────────────────────────────────

describe('GET /.well-known/mcp', () => {
  it('returns 200', async () => {
    expect((await req('/.well-known/mcp')).status).toBe(200)
  })

  it('returns name and version', async () => {
    const body = await (await req('/.well-known/mcp')).json()
    expect(body.name).toBe('UnifiedMemory')
    expect(body.version).toBe('1.0.0')
  })

  it('exposes recall_memory tool', async () => {
    const { tools } = await (await req('/.well-known/mcp')).json()
    expect(tools.find(t => t.name === 'recall_memory')).toBeDefined()
  })

  it('exposes add_memory tool', async () => {
    const { tools } = await (await req('/.well-known/mcp')).json()
    expect(tools.find(t => t.name === 'add_memory')).toBeDefined()
  })

  it('exposes get_memory_stats tool', async () => {
    const { tools } = await (await req('/.well-known/mcp')).json()
    expect(tools.find(t => t.name === 'get_memory_stats')).toBeDefined()
  })

  it('recall_memory requires query and token_id', async () => {
    const { tools } = await (await req('/.well-known/mcp')).json()
    const schema = tools.find(t => t.name === 'recall_memory').inputSchema
    expect(schema.required).toContain('query')
    expect(schema.required).toContain('token_id')
  })
})

// ── POST /mcp/recall_memory ───────────────────────────────────────────────────

describe('POST /mcp/recall_memory', () => {
  it('returns 400 when query is missing', async () => {
    const r = await req('/mcp/recall_memory', { method: 'POST', body: { token_id: 'tok_1' } })
    expect(r.status).toBe(400)
  })

  it('returns 400 when token_id is missing', async () => {
    const r = await req('/mcp/recall_memory', { method: 'POST', body: { query: 'projects' } })
    expect(r.status).toBe(400)
  })

  it('returns 503 when NEAR throws', async () => {
    validateConsent.mockRejectedValue(new Error('NEAR timeout'))
    const r = await req('/mcp/recall_memory', {
      method: 'POST', body: { query: 'projects', token_id: 'tok_1' },
    })
    expect(r.status).toBe(503)
  })

  it('returns 403 when consent is revoked', async () => {
    validateConsent.mockResolvedValue(REVOKED_VALIDATION)
    const r = await req('/mcp/recall_memory', {
      method: 'POST', body: { query: 'projects', token_id: 'tok_1' },
    })
    expect(r.status).toBe(403)
    const body = await r.json()
    expect(body.error.message).toContain('Consent revoked')
  })

  it('returns 403 when consent is expired', async () => {
    validateConsent.mockResolvedValue(EXPIRED_VALIDATION)
    const r = await req('/mcp/recall_memory', {
      method: 'POST', body: { query: 'projects', token_id: 'tok_1' },
    })
    expect(r.status).toBe(403)
  })

  it('delegates payment check to x402-gate', async () => {
    const paymentBlock = new Response('{}', { status: 402 })
    checkPayment.mockReturnValue(paymentBlock)
    const r = await req('/mcp/recall_memory', {
      method: 'POST', body: { query: 'projects', token_id: 'tok_1' },
    })
    expect(r.status).toBe(402)
    expect(checkPayment).toHaveBeenCalledOnce()
  })

  it('returns 200 with memories on success', async () => {
    const r = await req('/mcp/recall_memory', {
      method: 'POST',
      body: { query: 'projects', token_id: 'tok_1' },
      headers: PAID_HEADER,
    })
    expect(r.status).toBe(200)
    const body = await r.json()
    expect(body.jsonrpc).toBe('2.0')
    expect(Array.isArray(body.result.memories)).toBe(true)
  })

  it('memories contain required fields', async () => {
    const r = await req('/mcp/recall_memory', {
      method: 'POST',
      body: { query: 'projects', token_id: 'tok_1' },
      headers: PAID_HEADER,
    })
    const mem = (await r.json()).result.memories[0]
    expect(mem).toHaveProperty('content')
    expect(mem).toHaveProperty('source')
    expect(mem).toHaveProperty('type')
    expect(mem).toHaveProperty('timestamp')
    expect(mem).toHaveProperty('score')
  })

  it('result includes query_cost_usdc', async () => {
    const r = await req('/mcp/recall_memory', {
      method: 'POST',
      body: { query: 'projects', token_id: 'tok_1' },
      headers: PAID_HEADER,
    })
    expect((await r.json()).result.query_cost_usdc).toBe(0.001)
  })

  it('remaining_queries is decremented by 1', async () => {
    validateConsent.mockResolvedValue({ ...VALID_VALIDATION, remaining_queries: 50 })
    const r = await req('/mcp/recall_memory', {
      method: 'POST',
      body: { query: 'projects', token_id: 'tok_1' },
      headers: PAID_HEADER,
    })
    expect((await r.json()).result.remaining_queries).toBe(49)
  })

  it('calls recordQuery after successful response', async () => {
    await req('/mcp/recall_memory', {
      method: 'POST',
      body: { query: 'projects', token_id: 'tok_1' },
      headers: PAID_HEADER,
    })
    expect(recordQuery).toHaveBeenCalledWith('tok_1', 0.001, MOCK_ENV, MOCK_CTX)
  })

  it('passes memory_type filter to pinecone', async () => {
    const fetchSpy = vi.fn().mockImplementation(async (url, opts) => {
      if (String(url).includes('/embeddings')) return { json: async () => ({ data: [{ embedding: EMBEDDING }] }) }
      if (String(url).includes('/query')) {
        const body = JSON.parse(opts.body)
        expect(body.filter?.memory_type).toEqual({ '$eq': 'episodic' })
        return { json: async () => ({ matches: [] }) }
      }
      return { json: async () => ({}) }
    })
    global.fetch = fetchSpy
    await req('/mcp/recall_memory', {
      method: 'POST',
      body: { query: 'q', token_id: 'tok_1', memory_type: 'episodic' },
      headers: PAID_HEADER,
    })
  })

  it('no platform filter when platform=all', async () => {
    const fetchSpy = vi.fn().mockImplementation(async (url, opts) => {
      if (String(url).includes('/embeddings')) return { json: async () => ({ data: [{ embedding: EMBEDDING }] }) }
      if (String(url).includes('/query')) {
        const body = JSON.parse(opts.body)
        expect(body.filter?.platform).toBeUndefined()
        return { json: async () => ({ matches: [] }) }
      }
      return { json: async () => ({}) }
    })
    global.fetch = fetchSpy
    await req('/mcp/recall_memory', {
      method: 'POST',
      body: { query: 'q', token_id: 'tok_1', platform: 'all' },
      headers: PAID_HEADER,
    })
  })

  it('returns empty memories array when pinecone finds nothing', async () => {
    global.fetch = vi.fn().mockImplementation(async (url) => {
      if (String(url).includes('/embeddings')) return { json: async () => ({ data: [{ embedding: EMBEDDING }] }) }
      if (String(url).includes('/query'))      return { json: async () => ({ matches: [] }) }
      return { json: async () => ({}) }
    })
    const r = await req('/mcp/recall_memory', {
      method: 'POST',
      body: { query: 'no results', token_id: 'tok_1' },
      headers: PAID_HEADER,
    })
    expect((await r.json()).result.memories).toEqual([])
  })
})

// ── POST /mcp/add_memory ──────────────────────────────────────────────────────

describe('POST /mcp/add_memory', () => {
  const VALID_BODY = {
    content: 'Deployed NEAR contract to testnet',
    memory_type: 'episodic',
    source: 'github',
    token_id: 'tok_1',
  }

  it('returns 400 when content is missing', async () => {
    const { content, ...body } = VALID_BODY
    expect((await req('/mcp/add_memory', { method: 'POST', body })).status).toBe(400)
  })

  it('returns 400 when memory_type is missing', async () => {
    const { memory_type, ...body } = VALID_BODY
    expect((await req('/mcp/add_memory', { method: 'POST', body })).status).toBe(400)
  })

  it('returns 400 when source is missing', async () => {
    const { source, ...body } = VALID_BODY
    expect((await req('/mcp/add_memory', { method: 'POST', body })).status).toBe(400)
  })

  it('returns 400 when token_id is missing', async () => {
    const { token_id, ...body } = VALID_BODY
    expect((await req('/mcp/add_memory', { method: 'POST', body })).status).toBe(400)
  })

  it('returns 503 when NEAR throws', async () => {
    validateConsent.mockRejectedValue(new Error('NEAR timeout'))
    expect((await req('/mcp/add_memory', { method: 'POST', body: VALID_BODY })).status).toBe(503)
  })

  it('returns 403 when consent is denied', async () => {
    validateConsent.mockResolvedValue(REVOKED_VALIDATION)
    expect((await req('/mcp/add_memory', { method: 'POST', body: VALID_BODY })).status).toBe(403)
  })

  it('returns 200 with memory_id on success', async () => {
    const r = await req('/mcp/add_memory', { method: 'POST', body: VALID_BODY })
    expect(r.status).toBe(200)
    const body = await r.json()
    expect(body.jsonrpc).toBe('2.0')
    expect(body.result).toHaveProperty('memory_id')
  })

  it('result contains type and importance_score', async () => {
    const r = await req('/mcp/add_memory', { method: 'POST', body: VALID_BODY })
    const { result } = await r.json()
    expect(result).toHaveProperty('type')
    expect(result).toHaveProperty('importance_score')
  })

  it('memory_id contains the source platform', async () => {
    const r = await req('/mcp/add_memory', { method: 'POST', body: VALID_BODY })
    const { memory_id } = (await r.json()).result
    expect(memory_id).toContain('github')
  })

  it('calls pinecone upsert once', async () => {
    const upsertSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    global.fetch = vi.fn().mockImplementation(async (url, opts) => {
      if (String(url).includes('/embeddings'))    return { json: async () => ({ data: [{ embedding: EMBEDDING }] }) }
      if (String(url).includes('/chat'))          return { json: async () => ({ choices: [{ message: { content: JSON.stringify(CLASSIFIED) } }] }) }
      if (String(url).includes('/vectors/upsert')) return upsertSpy(url, opts)
      return { json: async () => ({}) }
    })
    await req('/mcp/add_memory', { method: 'POST', body: VALID_BODY })
    expect(upsertSpy).toHaveBeenCalledOnce()
  })
})

// ── POST /mcp/get_memory_stats ────────────────────────────────────────────────

describe('POST /mcp/get_memory_stats', () => {
  it('returns 400 when token_id is missing', async () => {
    expect((await req('/mcp/get_memory_stats', { method: 'POST', body: {} })).status).toBe(400)
  })

  it('returns 404 when getConsent returns null', async () => {
    getConsent.mockResolvedValue(null)
    const r = await req('/mcp/get_memory_stats', { method: 'POST', body: { token_id: 'bad_tok' } })
    expect(r.status).toBe(404)
  })

  it('returns 200 with nft_status active', async () => {
    const r = await req('/mcp/get_memory_stats', { method: 'POST', body: { token_id: 'tok_1' } })
    expect(r.status).toBe(200)
    const body = await r.json()
    expect(body.result.nft_status).toBe('active')
  })

  it('nft_status is revoked when is_active=false and revoked_at set', async () => {
    getConsent.mockResolvedValue({ ...MOCK_CONSENT, is_active: false, revoked_at: '1750000000000000000' })
    const r = await req('/mcp/get_memory_stats', { method: 'POST', body: { token_id: 'tok_1' } })
    expect((await r.json()).result.nft_status).toBe('revoked')
  })

  it('nft_status is expired when is_active=false and no revoked_at', async () => {
    getConsent.mockResolvedValue({ ...MOCK_CONSENT, is_active: false, revoked_at: null })
    const r = await req('/mcp/get_memory_stats', { method: 'POST', body: { token_id: 'tok_1' } })
    expect((await r.json()).result.nft_status).toBe('expired')
  })

  it('result contains quota and usdc fields', async () => {
    const r = await req('/mcp/get_memory_stats', { method: 'POST', body: { token_id: 'tok_1' } })
    const { result } = await r.json()
    expect(result).toHaveProperty('queries_used')
    expect(result).toHaveProperty('queries_remaining')
    expect(result).toHaveProperty('usdc_spent')
    expect(result).toHaveProperty('usdc_remaining')
    expect(result).toHaveProperty('expires_at')
  })

  it('queries_remaining is max minus used', async () => {
    getConsent.mockResolvedValue({ ...MOCK_CONSENT, queries_used: 25, max_queries: 100 })
    const r = await req('/mcp/get_memory_stats', { method: 'POST', body: { token_id: 'tok_1' } })
    expect((await r.json()).result.queries_remaining).toBe(75)
  })

  it('usdc_remaining is max minus spent', async () => {
    getConsent.mockResolvedValue({ ...MOCK_CONSENT, usdc_spent: 0.3, max_usdc_budget: 1.0 })
    const r = await req('/mcp/get_memory_stats', { method: 'POST', body: { token_id: 'tok_1' } })
    const remaining = (await r.json()).result.usdc_remaining
    expect(Math.abs(remaining - 0.7)).toBeLessThan(1e-9)
  })

  it('jsonrpc field is 2.0', async () => {
    const r = await req('/mcp/get_memory_stats', { method: 'POST', body: { token_id: 'tok_1' } })
    expect((await r.json()).jsonrpc).toBe('2.0')
  })
})
