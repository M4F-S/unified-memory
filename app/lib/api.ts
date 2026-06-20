const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || "http://localhost:8000";

async function post(path: string, body: object) {
  try {
    const r = await fetch(`${MCP_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return { ok: false, status: r.status, data: await r.json().catch(() => ({})) };
    return { ok: true, status: r.status, data: await r.json() };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

async function get(path: string) {
  try {
    const r = await fetch(`${MCP_URL}${path}`);
    if (!r.ok) return { ok: false, status: r.status, data: await r.json().catch(() => ({})) };
    return { ok: true, status: r.status, data: await r.json() };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

// ── x402 USDC micropayment ────────────────────────────────────────────────────
// The Worker returns HTTP 402 with a `PAYMENT-REQUIRED` header describing the
// USDC charge. We settle it (Circle, demo-grade) and retry with `X-PAYMENT`.

export interface X402Challenge {
  scheme: string;
  network: string;       // e.g. "base-sepolia"
  asset: string;         // USDC contract address
  payTo: string;         // Circle wallet receiving the payment
  description: string;
  maxAmountRequired: string; // micro-USDC (6 decimals), e.g. "1000"
  amountUsdc: number;        // derived human amount, e.g. 0.001
}

export interface X402Receipt {
  receipt: string;        // value sent in the X-PAYMENT header
  challenge: X402Challenge;
}

// Sensible default if the browser can't read the header (CORS) or it's absent.
const DEFAULT_CHALLENGE: X402Challenge = {
  scheme: "exact",
  network: "base-sepolia",
  asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC base-sepolia
  payTo: "",
  description: "Memory query - UnifiedMemory",
  maxAmountRequired: "1000",
  amountUsdc: 0.001,
};

export function defaultChallenge(): X402Challenge {
  return { ...DEFAULT_CHALLENGE };
}

export function parsePaymentChallenge(headers: Headers): X402Challenge {
  try {
    const raw = headers.get("PAYMENT-REQUIRED");
    if (!raw) return DEFAULT_CHALLENGE;
    const c = JSON.parse(raw);
    const micro = c.maxAmountRequired ?? DEFAULT_CHALLENGE.maxAmountRequired;
    return {
      scheme: c.scheme ?? DEFAULT_CHALLENGE.scheme,
      network: c.network ?? DEFAULT_CHALLENGE.network,
      asset: c.asset ?? DEFAULT_CHALLENGE.asset,
      payTo: c.payTo ?? DEFAULT_CHALLENGE.payTo,
      description: c.description ?? DEFAULT_CHALLENGE.description,
      maxAmountRequired: String(micro),
      amountUsdc: Number(micro) / 1e6,
    };
  } catch {
    return DEFAULT_CHALLENGE;
  }
}

// Demo-grade Circle settlement. The Worker accepts any non-empty X-PAYMENT, so
// here we mint a signed-looking receipt and simulate network latency. Swap this
// for a real Circle/x402 facilitator call to settle on-chain.
export async function settleUsdcPayment(challenge: X402Challenge): Promise<X402Receipt> {
  await new Promise((r) => setTimeout(r, 800));
  const payload = {
    scheme: challenge.scheme,
    network: challenge.network,
    asset: challenge.asset,
    amount: challenge.maxAmountRequired,
    payTo: challenge.payTo,
    settledVia: "circle",
    ts: Date.now(),
    nonce: Math.random().toString(16).slice(2, 18),
  };
  // base64url-encoded receipt, the shape an x402 facilitator would return
  const receipt = typeof btoa !== "undefined"
    ? btoa(JSON.stringify(payload))
    : Buffer.from(JSON.stringify(payload)).toString("base64");
  return { receipt, challenge };
}

export interface RecallOptions {
  memoryType?: string;
  platform?: string;
  onPaymentRequired?: (challenge: X402Challenge) => void;
  onPaymentSettled?: (receipt: X402Receipt) => void;
}

// ── MCP Memory Routes ─────────────────────────────────────────────────────────
// Full x402 round-trip: call → 402 → settle USDC → retry with X-PAYMENT.
export async function recallMemory(query: string, tokenId: string, opts: RecallOptions = {}) {
  const { memoryType = "all", platform = "all", onPaymentRequired, onPaymentSettled } = opts;
  const body = { query, token_id: tokenId, memory_type: memoryType, platform };

  try {
    let r = await fetch(`${MCP_URL}/mcp/recall_memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    let payment: X402Receipt | null = null;

    if (r.status === 402) {
      const challenge = parsePaymentChallenge(r.headers);
      onPaymentRequired?.(challenge);
      payment = await settleUsdcPayment(challenge);
      onPaymentSettled?.(payment);

      r = await fetch(`${MCP_URL}/mcp/recall_memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-PAYMENT": payment.receipt },
        body: JSON.stringify(body),
      });
    }

    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, status: r.status, data, payment };
    return { ok: true, status: r.status, data, payment };
  } catch {
    return { ok: false, status: 0, data: {}, payment: null };
  }
}

export async function addMemory(content: string, memoryType: string, source: string, tokenId: string) {
  return post("/mcp/add_memory", { content, memory_type: memoryType, source, token_id: tokenId });
}

export async function getMemoryStats(tokenId: string) {
  return post("/mcp/get_memory_stats", { token_id: tokenId });
}

export async function getMcpManifest() {
  return get("/.well-known/mcp");
}

// Backend health — hits the same MCP host the app talks to (localhost:8000 by default).
export const MCP_BASE_URL = MCP_URL;
export async function checkHealth() {
  return get("/health");
}

// ── Consent API (Team A implements these endpoints) ────────────────────────────────
export async function revokeConsent(tokenId: string) {
  return post("/api/revoke", { token_id: tokenId });
}

export async function mintConsent(body: {
  agent_id: string;
  allowed_platforms: string[];
  allowed_memory_types: string[];
  max_queries: number;
  max_usdc_budget: number;
  expires_days: number;
}) {
  return post("/api/mint", body);
}

export async function getConsentStatus(tokenId: string) {
  return get(`/api/consent/${tokenId}`);
}

// ── Mock data for when backend is unavailable ─────────────────────────────────
export const MOCK_MEMORY_STATS = {
  result: {
    nft_status: "active",
    total_memories: 847,
    queries_used: 3,
    queries_remaining: 17,
    usdc_spent: 0.003,
    usdc_remaining: 0.497,
    expires_at: "2026-06-22T12:00:00.000Z",
  },
};

export const MOCK_RECALL_RESPONSE = {
  result: {
    memories: [
      { content: "Committed NEAR ConsentNFT contract — unified memory hackathon Berlin", summary: "Hackathon project commit on GitHub", source: "github", type: "episodic", timestamp: "2026-06-19T22:00:00Z", score: 0.95 },
      { content: "Email from Sarah: hackathon deadline Sunday noon, demo must work!", summary: "Team deadline reminder via email", source: "gmail", type: "episodic", timestamp: "2026-06-18T14:00:00Z", score: 0.91 },
      { content: "Deployed Cloudflare Worker mcp-server — live at mcp.unified-memory.workers.dev", summary: "Backend deployment completed", source: "github", type: "procedural", timestamp: "2026-06-19T21:00:00Z", score: 0.88 },
    ],
    query_cost_usdc: 0.001,
    remaining_queries: 17,
  },
};

export const MOCK_REVOKED_RESPONSE = {
  jsonrpc: "2.0",
  error: { code: -32603, message: "Access denied: Consent revoked" },
};

export const CONNECTORS = [
  { platform: "gmail", label: "Gmail", auth: "OAuth", connected: true, memories: 847 },
  { platform: "github", label: "GitHub", auth: "OAuth", connected: true, memories: 312 },
  { platform: "spotify", label: "Spotify", auth: "OAuth", connected: true, memories: 1240 },
  { platform: "chatgpt", label: "ChatGPT", auth: "Upload", connected: true, memories: 203 },
  { platform: "slack", label: "Slack", auth: "OAuth", connected: true, memories: 560 },
  { platform: "notion", label: "Notion", auth: "API Key", connected: true, memories: 94 },
  { platform: "twitter", label: "Twitter/X", auth: "DSAR", connected: false, memories: 0 },
  { platform: "linkedin", label: "LinkedIn", auth: "DSAR", connected: false, memories: 0 },
  { platform: "instagram", label: "Instagram", auth: "DSAR", connected: false, memories: 0 },
  { platform: "whatsapp", label: "WhatsApp", auth: "Upload", connected: true, memories: 128 },
  { platform: "discord", label: "Discord", auth: "Bot Token", connected: true, memories: 445 },
  { platform: "youtube", label: "YouTube", auth: "Upload", connected: true, memories: 4200 },
  { platform: "apple_health", label: "Apple Health", auth: "Upload", connected: true, memories: 365 },
  { platform: "reddit", label: "Reddit", auth: "OAuth", connected: true, memories: 89 },
  { platform: "telegram", label: "Telegram", auth: "Bot Token", connected: true, memories: 234 },
  { platform: "claude", label: "Claude", auth: "Upload", connected: true, memories: 156 },
  { platform: "facebook", label: "Facebook", auth: "DSAR", connected: false, memories: 0 },
  { platform: "tiktok", label: "TikTok", auth: "DSAR", connected: false, memories: 0 },
  { platform: "google_fit", label: "Google Fit", auth: "OAuth", connected: true, memories: 180 },
  { platform: "apple_mail", label: "Apple Mail", auth: "Upload", connected: true, memories: 340 },
];
