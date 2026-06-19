import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MOCK_ENV, MOCK_CTX, VALID_VALIDATION, REVOKED_VALIDATION } from './setup.js'

// Mock consent-gate before importing ingest worker
vi.mock('../consent-gate.js', () => ({
  validateConsent: vi.fn(),
  getConsent:      vi.fn(),
  recordQuery:     vi.fn(),
}))

import { validateConsent } from '../consent-gate.js'
import app from '../ingest.js'

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

beforeEach(() => {
  vi.clearAllMocks()
  validateConsent.mockResolvedValue(VALID_VALIDATION)
})

// ── GET /ingest/connectors ────────────────────────────────────────────────────

describe('GET /ingest/connectors', () => {
  it('returns 200', async () => {
    const r = await req('/ingest/connectors')
    expect(r.status).toBe(200)
  })

  it('returns 20 connectors', async () => {
    const r = await req('/ingest/connectors')
    const body = await r.json()
    expect(body.connectors).toHaveLength(20)
  })

  it('each connector has platform, auth, and label', async () => {
    const r = await req('/ingest/connectors')
    const { connectors } = await r.json()
    for (const c of connectors) {
      expect(c).toHaveProperty('platform')
      expect(c).toHaveProperty('auth')
      expect(c).toHaveProperty('label')
    }
  })

  it('includes gmail connector with oauth2 auth', async () => {
    const r = await req('/ingest/connectors')
    const { connectors } = await r.json()
    const gmail = connectors.find(c => c.platform === 'gmail')
    expect(gmail).toBeDefined()
    expect(gmail.auth).toBe('oauth2')
  })

  it('includes twitter connector with dsar auth', async () => {
    const r = await req('/ingest/connectors')
    const { connectors } = await r.json()
    const twitter = connectors.find(c => c.platform === 'twitter')
    expect(twitter).toBeDefined()
    expect(twitter.auth).toBe('dsar')
  })

  it('includes chatgpt connector with upload auth', async () => {
    const r = await req('/ingest/connectors')
    const { connectors } = await r.json()
    const chatgpt = connectors.find(c => c.platform === 'chatgpt')
    expect(chatgpt).toBeDefined()
    expect(chatgpt.auth).toBe('upload')
  })
})

// ── POST /ingest/trigger ──────────────────────────────────────────────────────

describe('POST /ingest/trigger', () => {
  it('returns 400 when user_id is missing', async () => {
    const r = await req('/ingest/trigger', { method: 'POST', body: { platform: 'gmail', token_id: 'tok_1' } })
    expect(r.status).toBe(400)
  })

  it('returns 400 when platform is missing', async () => {
    const r = await req('/ingest/trigger', { method: 'POST', body: { user_id: 'alice', token_id: 'tok_1' } })
    expect(r.status).toBe(400)
  })

  it('returns 400 when token_id is missing', async () => {
    const r = await req('/ingest/trigger', { method: 'POST', body: { user_id: 'alice', platform: 'gmail' } })
    expect(r.status).toBe(400)
  })

  it('returns 503 when NEAR RPC throws', async () => {
    validateConsent.mockRejectedValue(new Error('NEAR timeout'))
    const r = await req('/ingest/trigger', {
      method: 'POST',
      body: { user_id: 'alice', platform: 'gmail', token_id: 'tok_1' },
    })
    expect(r.status).toBe(503)
  })

  it('returns 403 when consent is denied', async () => {
    validateConsent.mockResolvedValue(REVOKED_VALIDATION)
    const r = await req('/ingest/trigger', {
      method: 'POST',
      body: { user_id: 'alice', platform: 'gmail', token_id: 'tok_1' },
    })
    expect(r.status).toBe(403)
  })

  it('returns 200 with job_id on success', async () => {
    const r = await req('/ingest/trigger', {
      method: 'POST',
      body: { user_id: 'alice', platform: 'gmail', token_id: 'tok_1' },
    })
    expect(r.status).toBe(200)
    const body = await r.json()
    expect(body).toHaveProperty('job_id')
    expect(body.status).toBe('queued')
  })

  it('job_id is a non-empty string', async () => {
    const r = await req('/ingest/trigger', {
      method: 'POST',
      body: { user_id: 'alice', platform: 'github', token_id: 'tok_1' },
    })
    const { job_id } = await r.json()
    expect(typeof job_id).toBe('string')
    expect(job_id.length).toBeGreaterThan(0)
  })

  it('response contains created_at timestamp', async () => {
    const r = await req('/ingest/trigger', {
      method: 'POST',
      body: { user_id: 'alice', platform: 'spotify', token_id: 'tok_1' },
    })
    const body = await r.json()
    expect(body).toHaveProperty('created_at')
    expect(() => new Date(body.created_at)).not.toThrow()
  })

  it('echoes user_id and platform in response', async () => {
    const r = await req('/ingest/trigger', {
      method: 'POST',
      body: { user_id: 'alice', platform: 'notion', token_id: 'tok_1' },
    })
    const body = await r.json()
    expect(body.user_id).toBe('alice')
    expect(body.platform).toBe('notion')
  })

  it('calls validateConsent with correct args', async () => {
    await req('/ingest/trigger', {
      method: 'POST',
      body: { user_id: 'alice', platform: 'gmail', token_id: 'tok_1' },
    })
    expect(validateConsent).toHaveBeenCalledWith('tok_1', 'gmail', 'all', MOCK_ENV)
  })
})

// ── POST /ingest/trigger/batch ────────────────────────────────────────────────

describe('POST /ingest/trigger/batch', () => {
  it('returns 400 when platforms is not an array', async () => {
    const r = await req('/ingest/trigger/batch', {
      method: 'POST',
      body: { user_id: 'alice', platforms: 'gmail', token_id: 'tok_1' },
    })
    expect(r.status).toBe(400)
  })

  it('returns 400 when user_id is missing', async () => {
    const r = await req('/ingest/trigger/batch', {
      method: 'POST',
      body: { platforms: ['gmail', 'github'], token_id: 'tok_1' },
    })
    expect(r.status).toBe(400)
  })

  it('returns 403 when consent is denied', async () => {
    validateConsent.mockResolvedValue(REVOKED_VALIDATION)
    const r = await req('/ingest/trigger/batch', {
      method: 'POST',
      body: { user_id: 'alice', platforms: ['gmail'], token_id: 'tok_1' },
    })
    expect(r.status).toBe(403)
  })

  it('returns a job per platform on success', async () => {
    const r = await req('/ingest/trigger/batch', {
      method: 'POST',
      body: { user_id: 'alice', platforms: ['gmail', 'github', 'spotify'], token_id: 'tok_1' },
    })
    expect(r.status).toBe(200)
    const body = await r.json()
    expect(body.jobs).toHaveLength(3)
  })

  it('each job has job_id, platform, and status', async () => {
    const r = await req('/ingest/trigger/batch', {
      method: 'POST',
      body: { user_id: 'alice', platforms: ['gmail', 'github'], token_id: 'tok_1' },
    })
    const { jobs } = await r.json()
    for (const job of jobs) {
      expect(job).toHaveProperty('job_id')
      expect(job).toHaveProperty('platform')
      expect(job.status).toBe('queued')
    }
  })

  it('all job_ids are unique', async () => {
    const r = await req('/ingest/trigger/batch', {
      method: 'POST',
      body: { user_id: 'alice', platforms: ['gmail', 'github', 'spotify', 'notion'], token_id: 'tok_1' },
    })
    const { jobs } = await r.json()
    const ids = jobs.map(j => j.job_id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ── GET /ingest/status/:job_id ────────────────────────────────────────────────

describe('GET /ingest/status/:job_id', () => {
  it('returns 200 for any job_id when no backend configured', async () => {
    const r = await req('/ingest/status/job_abc123')
    expect(r.status).toBe(200)
  })

  it('response contains job_id', async () => {
    const r = await req('/ingest/status/job_abc123')
    const body = await r.json()
    expect(body.job_id).toBe('job_abc123')
  })

  it('response contains status field', async () => {
    const r = await req('/ingest/status/job_abc123')
    const body = await r.json()
    expect(body).toHaveProperty('status')
  })
})
