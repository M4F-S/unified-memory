// Shared test helpers for all Worker tests

/** Encodes a JS value to a NEAR RPC byte-array result */
export function toNearResult(value) {
  return Array.from(new TextEncoder().encode(JSON.stringify(value)));
}

/** Returns a mock fetch that yields a successful NEAR RPC view call */
export function mockNearView(value) {
  return vi.fn().mockResolvedValue({
    json: async () => ({ result: { result: toNearResult(value) } }),
  });
}

/** Returns a mock fetch that yields a NEAR RPC error */
export function mockNearError(message = 'RPC error') {
  return vi.fn().mockResolvedValue({
    json: async () => ({ error: { code: -32700, message } }),
  });
}

export const MOCK_ENV = {
  NEAR_CONTRACT_ID:     'consent-nft.testnet',
  NEAR_RPC:             'https://rpc.testnet.near.org',
  OPENROUTER_API_KEY:   'test-openrouter-key',
  PINECONE_API_KEY:     'test-pinecone-key',
  PINECONE_HOST:        'test-host.svc.gcp-starter.pinecone.io',
  CIRCLE_WALLET_ADDRESS:'0xTEST_WALLET',
  EAS_SCHEMA_UID:       '0xTEST_EAS_UID',
  INGEST_BACKEND_URL:   '',
};

export const MOCK_CTX = { waitUntil: vi.fn() };

export const VALID_VALIDATION   = { valid: true,  reason: '',                 remaining_queries: 99 };
export const REVOKED_VALIDATION = { valid: false, reason: 'Consent revoked',  remaining_queries: 0  };
export const EXPIRED_VALIDATION = { valid: false, reason: 'Consent expired',  remaining_queries: 0  };

export const MOCK_CONSENT = {
  is_active: true, revoked_at: null,
  queries_used: 1, max_queries: 100,
  usdc_spent: 0.001, max_usdc_budget: 1.0,
  expires_at: '9999999999999', owner: 'alice.testnet',
};

export const MOCK_MATCHES = [
  {
    id: 'mem-001', score: 0.92,
    metadata: {
      content: 'Committed NEAR contract',
      summary: 'User committed the NEAR contract',
      platform: 'github',
      memory_type: 'episodic',
      timestamp: '2026-06-20T10:00:00',
    },
  },
];
