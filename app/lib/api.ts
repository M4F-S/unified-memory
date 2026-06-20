// UnifiedMemory API Client — calls Cloudflare Worker MCP endpoints
const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || "https://unified-memory-mcp.rapid-king-4a64.workers.dev";
const DEMO_TOKEN="***"; // Real NEAR testnet token ID for aihackathon.testnet

async function post(path: string, body: object, opts?: { demo?: boolean }) {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (opts?.demo) headers["X-PAYMENT"] = "demo";
    const r = await fetch(`${MCP_URL}${path}`, {
      method: "POST",
      headers,
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
export async function recallMemory(query: string, tokenId: string, memoryType = "all", platform = "all", demo = false) {
  return post("/mcp/recall_memory", { query, token_id: tokenId, memory_type: memoryType, platform }, { demo });
}

export async function addMemory(content: string, memoryType: string, source: string, tokenId: string) {
  return post("/mcp/add_memory", { content, memory_type: memoryType, source, token_id: tokenId });
}

export async function getMemoryStats(tokenId: string) {
  return post("/mcp/get_memory_stats", { token_id: tokenId }, { demo: true });
}

export async function getMcpManifest() {
  return get("/.well-known/mcp");
}

// ── Health Check ──────────────────────────────────────────────────────────────
export async function healthCheck() {
  return get("/health");
}

// ── Consent API (Simulated for demo) ──────────────────────────────────────────
export async function revokeConsent(tokenId: string) {
  // Simulated: returns realistic tx hash for demo
  const txHash = "0x" + Array.from({length:64},()=>"0123456789abcdef"[Math.floor(Math.random()*16)]).join("");
  return { ok: true, status: 200, data: { tx_hash: txHash, revoked: true, token_id: tokenId } };
}

export async function mintConsent(body: {
  agent_id: string;
  allowed_platforms: string[];
  allowed_memory_types: string[];
  max_queries: number;
  max_usdc_budget: number;
  expires_days: number;
}) {
  // Simulated: returns new token ID
  const newTokenId = Math.floor(Math.random() * 1000000).toString();
  const txHash = "0x" + Array.from({length:64},()=>"0123456789abcdef"[Math.floor(Math.random()*16)]).join("");
  return { ok: true, status: 200, data: { token_id: newTokenId, tx_hash: txHash, ...body } };
}

export async function getConsentStatus(tokenId: string) {
  return post("/mcp/get_memory_stats", { token_id: tokenId }, { demo: true });
}

export { DEMO_TOKEN };

// ── Platform Connectors ────────────────────────────────────────────────────────────────────
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
