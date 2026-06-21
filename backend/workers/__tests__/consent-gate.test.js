import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateConsent, getConsent, recordQuery } from '../consent-gate.js'
import { toNearResult, mockNearView, mockNearError, MOCK_ENV, MOCK_CTX, VALID_VALIDATION, REVOKED_VALIDATION, MOCK_CONSENT } from './setup.js'

beforeEach(() => {
  vi.restoreAllMocks()
  MOCK_CTX.waitUntil.mockClear()
})

// ── validateConsent ───────────────────────────────────────────────────────────

describe('validateConsent', () => {
  it('returns valid result when NEAR confirms access', async () => {
    global.fetch = mockNearView(VALID_VALIDATION)
    const result = await validateConsent('tok_1', 'gmail', 'episodic', MOCK_ENV)
    expect(result.valid).toBe(true)
    expect(result.remaining_queries).toBe(99)
  })

  it('returns invalid result when consent is revoked', async () => {
    global.fetch = mockNearView(REVOKED_VALIDATION)
    const result = await validateConsent('tok_revoked', 'gmail', 'episodic', MOCK_ENV)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Consent revoked')
  })

  it('throws when NEAR RPC returns an error', async () => {
    global.fetch = mockNearError('timeout')
    await expect(validateConsent('tok_1', 'gmail', 'episodic', MOCK_ENV)).rejects.toThrow('NEAR RPC error')
  })

  it('throws when result field is missing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ result: {} })
    })
    await expect(validateConsent('tok_1', 'gmail', 'episodic', MOCK_ENV)).rejects.toThrow()
  })

  it('sends the correct NEAR method name', async () => {
    global.fetch = mockNearView(VALID_VALIDATION)
    await validateConsent('tok_1', 'all', 'all', MOCK_ENV)
    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.params.method_name).toBe('validate_query')
  })

  it('encodes args as base64 in the request', async () => {
    global.fetch = mockNearView(VALID_VALIDATION)
    await validateConsent('tok_1', 'github', 'semantic', MOCK_ENV)
    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    const args = JSON.parse(atob(body.params.args_base64))
    expect(args.token_id).toBe('tok_1')
    expect(args.platform).toBe('github')
    expect(args.memory_type).toBe('semantic')
    expect(args.query_cost_usdc).toBe(0.001)
  })

  it('uses the contract ID from env', async () => {
    global.fetch = mockNearView(VALID_VALIDATION)
    await validateConsent('tok_1', 'all', 'all', MOCK_ENV)
    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.params.account_id).toBe(MOCK_ENV.NEAR_CONTRACT_ID)
  })
})

// ── getConsent ────────────────────────────────────────────────────────────────

describe('getConsent', () => {
  it('returns consent object on success', async () => {
    global.fetch = mockNearView(MOCK_CONSENT)
    const result = await getConsent('tok_1', MOCK_ENV)
    expect(result.is_active).toBe(true)
    expect(result.owner).toBe('alice.testnet')
  })

  it('returns null when NEAR returns an error (token not found)', async () => {
    global.fetch = mockNearError('token not found')
    const result = await getConsent('bad_tok', MOCK_ENV)
    expect(result).toBeNull()
  })

  it('returns null when result is missing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ result: {} })
    })
    const result = await getConsent('tok_1', MOCK_ENV)
    expect(result).toBeNull()
  })

  it('sends get_consent as method name', async () => {
    global.fetch = mockNearView(MOCK_CONSENT)
    await getConsent('tok_1', MOCK_ENV)
    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.params.method_name).toBe('get_consent')
  })
})

// ── recordQuery ───────────────────────────────────────────────────────────────

describe('recordQuery', () => {
  it('calls ctx.waitUntil without throwing', () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
    expect(() => recordQuery('tok_1', 0.001, MOCK_ENV, MOCK_CTX)).not.toThrow()
    expect(MOCK_CTX.waitUntil).toHaveBeenCalledOnce()
  })

  it('does not propagate fetch errors (fire and forget)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'))
    recordQuery('tok_1', 0.001, MOCK_ENV, MOCK_CTX)
    // waitUntil resolves the inner promise; errors are swallowed
    expect(MOCK_CTX.waitUntil).toHaveBeenCalledOnce()
  })
})
