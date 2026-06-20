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

// ── MCP Memory Routes ─────────────────────────────────────────────────────────
export async function recallMemory(query: string, tokenId: string, memoryType = "all", platform = "all") {
  return post("/mcp/recall_memory", { query, token_id: tokenId, memory_type: memoryType, platform });
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
