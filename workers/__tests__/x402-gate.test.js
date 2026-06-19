import { describe, it, expect, beforeEach } from 'vitest'
import { checkPayment } from '../x402-gate.js'
import { MOCK_ENV } from './setup.js'

const RESOURCE_URL = 'https://mcp.unified-memory.workers.dev/mcp/recall_memory'

function makeRequest(headers = {}) {
  return new Request(RESOURCE_URL, { method: 'POST', headers })
}

// ── checkPayment ──────────────────────────────────────────────────────────────

describe('checkPayment', () => {
  it('returns null when X-PAYMENT header is present', () => {
    const req = makeRequest({ 'X-PAYMENT': 'exact:base-sepolia:1000:0xABC' })
    expect(checkPayment(req, RESOURCE_URL, MOCK_ENV)).toBeNull()
  })

  it('returns a Response when X-PAYMENT header is missing', () => {
    const req = makeRequest()
    const result = checkPayment(req, RESOURCE_URL, MOCK_ENV)
    expect(result).toBeInstanceOf(Response)
  })

  it('returns HTTP 402 when payment is missing', () => {
    const req = makeRequest()
    const result = checkPayment(req, RESOURCE_URL, MOCK_ENV)
    expect(result.status).toBe(402)
  })

  it('includes PAYMENT-REQUIRED header in 402 response', () => {
    const req = makeRequest()
    const result = checkPayment(req, RESOURCE_URL, MOCK_ENV)
    expect(result.headers.has('PAYMENT-REQUIRED')).toBe(true)
  })

  it('PAYMENT-REQUIRED header contains valid JSON', () => {
    const req = makeRequest()
    const result = checkPayment(req, RESOURCE_URL, MOCK_ENV)
    expect(() => JSON.parse(result.headers.get('PAYMENT-REQUIRED'))).not.toThrow()
  })

  it('payment challenge contains correct network', () => {
    const req = makeRequest()
    const result = checkPayment(req, RESOURCE_URL, MOCK_ENV)
    const challenge = JSON.parse(result.headers.get('PAYMENT-REQUIRED'))
    expect(challenge.network).toBe('base-sepolia')
  })

  it('payment challenge contains USDC asset address', () => {
    const req = makeRequest()
    const result = checkPayment(req, RESOURCE_URL, MOCK_ENV)
    const challenge = JSON.parse(result.headers.get('PAYMENT-REQUIRED'))
    // USDC on Base Sepolia
    expect(challenge.asset).toBe('0x036CbD53842c5426634e7929541eC2318f3dCF7e')
  })

  it('payment challenge payTo matches env wallet address', () => {
    const req = makeRequest()
    const result = checkPayment(req, RESOURCE_URL, MOCK_ENV)
    const challenge = JSON.parse(result.headers.get('PAYMENT-REQUIRED'))
    expect(challenge.payTo).toBe(MOCK_ENV.CIRCLE_WALLET_ADDRESS)
  })

  it('payment challenge resource matches the given URL', () => {
    const req = makeRequest()
    const result = checkPayment(req, RESOURCE_URL, MOCK_ENV)
    const challenge = JSON.parse(result.headers.get('PAYMENT-REQUIRED'))
    expect(challenge.resource).toBe(RESOURCE_URL)
  })

  it('payment challenge maxAmountRequired is 1000 micro-USDC', () => {
    const req = makeRequest()
    const result = checkPayment(req, RESOURCE_URL, MOCK_ENV)
    const challenge = JSON.parse(result.headers.get('PAYMENT-REQUIRED'))
    expect(challenge.maxAmountRequired).toBe('1000')
  })

  it('payment challenge uses exact scheme', () => {
    const req = makeRequest()
    const result = checkPayment(req, RESOURCE_URL, MOCK_ENV)
    const challenge = JSON.parse(result.headers.get('PAYMENT-REQUIRED'))
    expect(challenge.scheme).toBe('exact')
  })

  it('returns null even with an empty X-PAYMENT value (presence matters)', () => {
    // An empty string header value — some agents might send this
    const req = new Request(RESOURCE_URL, {
      method: 'POST',
      headers: { 'X-PAYMENT': '' }
    })
    // empty string is falsy — should still request payment
    const result = checkPayment(req, RESOURCE_URL, MOCK_ENV)
    expect(result?.status).toBe(402)
  })
})
