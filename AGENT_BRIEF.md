# 🤖 AGENT_BRIEF.md — Complete Specification for AI Agent Builders
## UnifiedMemory | AI Agents Berlin Hackathon 2026

---

## MISSION

Build a production-grade platform called UnifiedMemory that:
1. Ingests a user's personal data from 20+ platforms
2. Synthesizes it into a searchable vector memory graph
3. Enforces access control via a NEAR Consent NFT (soulbound token)
4. Serves memory to any AI agent via a standard MCP endpoint
5. Charges agents per query using x402/USDC (Circle Programmable Wallets)
6. Logs every query as an EAS attestation on Base Sepolia

---

## TECH STACK

| Layer | Technology |
|---|---|
| Smart Contract | NEAR JS SDK (consent_nft contract on testnet) |
| Edge Runtime | Cloudflare Workers + Hono + Durable Objects |
| Vector DB | Pinecone (text-embedding-3-small, 1536 dims) |
| LLM | OpenAI GPT-4o (synthesis) + GPT-4o-mini (classification) |
| Payments | Circle Programmable Wallets + x402 protocol |
| Attestations | EAS (Ethereum Attestation Service) on Base Sepolia |
| Frontend | Next.js 14 App Router + Tailwind + NEAR Wallet Selector |
| Memory Enrichment | Tavily Search API |

---

## FILE EXECUTION ORDER

Build files in this exact order — each depends on the previous:

1. `.env.example` → fill with real keys → save as `.env`
2. `contracts/consent_nft.js` → deploy to NEAR testnet
3. `workers/consent-gate.js` → deploy first (dependency of mcp-server)
4. `workers/x402-gate.js` → deploy second
5. `workers/mcp-server.js` → deploy third (main agent endpoint)
6. `workers/ingest.js` → deploy fourth
7. `ingestion/synthesis.py` → test locally before connectors
8. `ingestion/connectors/*.py` → run in order listed
9. `demo/agent.py` → run last, after memories are loaded
10. `app/` → deploy to Vercel after workers are live

---

## NEAR CONTRACT SPEC

File: `contracts/consent_nft.js`

Deploy command:
```bash
near dev-deploy --accountId YOUR_ACCOUNT.testnet --wasmFile consent_nft.wasm
```

Methods:
- `mint_consent({agent_id, allowed_platforms, allowed_memory_types, max_queries, max_usdc_budget, expires_at, data_root_hash})` → returns token_id (string)
- `revoke_consent({token_id})` → void (sets is_active=false, logs timestamp)
- `validate_query({token_id, platform, memory_type, query_cost_usdc})` → {valid: bool, reason: string, remaining_queries: int}
- `record_query({token_id, usdc_spent})` → void (increments counters)
- `get_consent({token_id})` → ConsentRecord object

ConsentRecord schema:
```json
{
  "owner": "alice.testnet",
  "agent_id": "demo-agent.testnet",
  "allowed_platforms": ["gmail", "github", "spotify"],
  "allowed_memory_types": ["episodic", "semantic", "preferential"],
  "max_queries": 100,
  "max_usdc_budget": 1.0,
  "usdc_spent": 0.0,
  "queries_used": 0,
  "expires_at": "1750000000000",
  "data_root_hash": "0xabc123...",
  "is_active": true,
  "created_at": "1749900000000000000",
  "revoked_at": null
}
```

---

## MCP SERVER SPEC

File: `workers/mcp-server.js`
URL: `https://mcp.unified-memory.workers.dev`

MCP tools exposed:

### Tool 1: `recall_memory`
- Input: `{query: string, memory_type?: string, platform?: string, token_id: string}`
- Process: validate NEAR NFT → x402 payment check → Pinecone vector search → EAS attestation → record query on NEAR
- Output: `{memories: [{content, source, type, timestamp, score}], query_cost, remaining_queries}`
- On invalid consent: HTTP 403 + reason
- On missing payment: HTTP 402 + payment challenge header

### Tool 2: `add_memory`
- Input: `{content: string, memory_type: string, source: string, token_id: string}`
- Process: validate NFT → classify + embed → upsert Pinecone → EAS attestation
- Output: `{memory_id, type, importance_score}`

### Tool 3: `get_memory_stats`
- Input: `{token_id: string}`
- Output: `{total_memories, by_platform, by_type, oldest_memory, newest_memory, nft_status}`

MCP manifest at: `GET /.well-known/mcp`

---

## COMPLETE API ROUTE REFERENCE

> **Cloudflare Worker:** `https://unified-memory-mcp.YOUR-SUBDOMAIN.workers.dev`
> **Local fallback:** `http://localhost:8000` (`uv run uvicorn workers.local_server:app --port 8000`)

### MCP Memory Routes (`workers/mcp-server.js`)

| Method | Path | Auth | Body |
|--------|------|------|------|
| `GET`  | `/.well-known/mcp` | none | — |
| `POST` | `/mcp/recall_memory` | `X-PAYMENT` header + NEAR token | `{query, token_id, memory_type?, platform?}` |
| `POST` | `/mcp/add_memory` | NEAR token | `{content, memory_type, source, token_id}` |
| `POST` | `/mcp/get_memory_stats` | NEAR token | `{token_id}` |

### Ingestion Routes (`workers/ingest.js`)

| Method | Path | Body / Params |
|--------|------|------|
| `GET`  | `/ingest/connectors` | — → list of 20 connectors with `auth` type |
| `POST` | `/ingest/trigger` | `{user_id, platform, token_id}` → `{job_id, status}` |
| `POST` | `/ingest/trigger/batch` | `{user_id, platforms: string[], token_id}` → `{jobs: [{job_id, platform, status}]}` |
| `GET`  | `/ingest/status/:job_id` | — → `{job_id, status, memories_processed}` |

### Local Server Only

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Returns `{"status":"ok"}` |

### Response shapes

```jsonc
// recall_memory → 200
{ "jsonrpc": "2.0", "result": {
    "memories": [{ "content": "", "summary": "", "source": "gmail", "type": "episodic", "timestamp": "", "score": 0.92 }],
    "query_cost_usdc": 0.001, "remaining_queries": 19 }}

// recall_memory → 403 (revoked / expired NFT)
{ "jsonrpc": "2.0", "error": { "code": -32603, "message": "Access denied: Consent revoked" }}

// recall_memory → 402 (missing payment)
// Status 402 + header: PAYMENT-REQUIRED: {"scheme":"exact","network":"base-sepolia",...}

// add_memory → 200
{ "jsonrpc": "2.0", "result": { "memory_id": "agent-gmail-abc123", "type": "episodic", "importance_score": 7 }}

// get_memory_stats → 200
{ "jsonrpc": "2.0", "result": {
    "nft_status": "active", "total_memories": 847,
    "queries_used": 1, "queries_remaining": 19,
    "usdc_spent": 0.001, "usdc_remaining": 0.499,
    "expires_at": "2026-06-22T12:00:00.000Z" }}
```

### Error codes

| HTTP | code | Meaning |
|------|------|---------|
| 400 | -32602 | Missing required field |
| 402 | -32402 | x402 payment required |
| 403 | -32603 | NFT invalid / revoked / expired |
| 404 | -32604 | Token not found |
| 503 | -32603 | NEAR RPC unreachable |

---

## INGESTION CONNECTORS SPEC

Each connector in `ingestion/connectors/*.py` must implement:

```python
class BaseConnector:
    def authenticate(self, credentials: dict) -> bool
    def fetch_data(self, since: datetime = None) -> List[RawMemory]
    def get_export_instructions(self) -> dict  # for DSAR-only platforms
```

RawMemory schema:
```python
@dataclass
class RawMemory:
    content: str        # raw text content
    timestamp: datetime # when it happened
    source: str         # platform name
    url: str = None     # optional source URL
    metadata: dict = None  # platform-specific extra fields
```

### Connector Implementation Methods

| Platform | Method | Auth Type |
|---|---|---|
| Gmail | `fetch_data()` | OAuth2 (google-auth) |
| GitHub | `fetch_data()` | OAuth2 (PyGithub) |
| Notion | `fetch_data()` | API Key |
| Slack | `fetch_data()` | Bot Token |
| Discord | `fetch_data()` | Bot Token |
| Spotify | `fetch_data()` | OAuth2 (spotipy) |
| Reddit | `fetch_data()` | OAuth2 (praw) |
| ChatGPT | `fetch_data()` | File upload (conversations.json) |
| Claude | `fetch_data()` | File upload (claude_export.json) |
| WhatsApp | `fetch_data()` | File upload (_chat.txt parser) |
| Apple Health | `fetch_data()` | File upload (export.xml parser) |
| YouTube | `fetch_data()` | File upload (watch-history.json) |
| Twitter/X | `get_export_instructions()` | DSAR + archive zip parser |
| LinkedIn | `get_export_instructions()` | DSAR + archive zip parser |
| Instagram | `get_export_instructions()` | DSAR + archive zip parser |
| Facebook | `get_export_instructions()` | DSAR + archive zip parser |
| TikTok | `get_export_instructions()` | DSAR + archive zip parser |
| Telegram | `fetch_data()` | Bot Token |

---

## MEMORY SYNTHESIS PIPELINE

File: `ingestion/synthesis.py`

Pipeline steps for each RawMemory:
1. **Classify** — GPT-4o-mini classifies into: episodic / semantic / procedural / social / preferential
2. **Summarize** — extract a clean 1-2 sentence summary
3. **Score importance** — 0–10 integer score
4. **Extract tags** — list of keyword tags
5. **Embed** — `text-embedding-3-small` on the summary (1536 dims)
6. **Upsert to Pinecone** — with full metadata

Pinecone vector metadata schema:
```json
{
  "user_id": "alice.testnet",
  "content": "full raw content",
  "summary": "1-2 sentence summary",
  "memory_type": "episodic",
  "platform": "gmail",
  "timestamp": "2026-06-01T10:00:00Z",
  "importance": 7,
  "tags": ["work", "project", "deadline"],
  "provenance_hash": "0xabc123..."
}
```

---

## DEMO AGENT SPEC

File: `demo/agent.py`

The demo agent must run these 3 scenarios in order:

**Scenario A — Successful query with payment:**
Task: "What are the top 3 projects this user worked on this month?"
Expected: Agent calls recall_memory(memory_type="procedural"), pays 0.001 USDC, returns answer

**Scenario B — Cross-platform synthesis:**
Task: "Who are the 5 people this user communicated with most, across all platforms?"
Expected: Agent calls recall_memory(memory_type="social", platform="all"), synthesizes answer

**Scenario C — Revocation (THE WOW MOMENT):**
1. Print: "USER REVOKES CONSENT — burning NFT on NEAR"
2. Call NEAR revoke_consent({token_id}) — show transaction hash
3. Agent calls recall_memory with same token_id
4. Response: HTTP 403, "Access denied: Consent revoked"
5. Print the on-chain revocation timestamp
6. Print: "First time in history — AI agent access revoked in real time via blockchain"

---

## FRONTEND PAGES SPEC

### /onboard
- Grid of 20 platform cards with connect/import buttons
- OAuth platforms: show "Connect" → redirect flow
- Archive platforms: show "Upload export" → file upload
- DSAR platforms: show "Request data" → automated DSAR submission with status tracker
- Progress bar showing % of memory graph populated

### /consent
- Form: agent_id, platform checkboxes, memory type checkboxes, sliders for max_queries/budget/expiry
- "Mint Consent NFT" button → NEAR Wallet popup → transaction → show token_id
- Table of all active consent NFTs with revoke button per row

### /dashboard
- Real-time query log (last 20 queries with platform, type, cost, timestamp)
- USDC balance widget (Circle wallet balance)
- Memory stats: total memories, breakdown by platform and type
- NFT status cards: active/expired/revoked for each token

### /demo
- Auto-runs the 3 demo scenarios when page loads
- Shows agent "thinking" stream in real time
- Shows memory retrieved with source platform badge
- Shows USDC balance ticking down
- BIG RED "REVOKE CONSENT" button for the demo moment

---

## EAS ATTESTATION SPEC

Schema to register on Base Sepolia:
```
string token_id
address agent_id  
bytes32 query_hash
string memory_type
string platform
bytes32 response_hash
uint256 usdc_paid
uint64 timestamp
```

Post one attestation per successful memory query.
Attestations are permanent, public proof of every agent memory access.

---

## PRIORITY ORDER FOR 48-HOUR BUILD

MUST HAVE (demo breaks without these):
- NEAR ConsentNFT contract deployed and callable
- MCP server returning memories for valid token
- x402 payment flow working (even if just Circle testnet)
- Revocation blocking queries (THE critical demo moment)
- 30+ synthetic memories loaded in Pinecone
- Demo agent running 3 scenarios end-to-end

SHOULD HAVE (judges will ask about these):
- At least 2 real platform connectors live (Gmail + GitHub recommended)
- EAS attestations being posted per query
- Live dashboard showing query log + USDC balance
- Frontend /consent page for minting NFT

NICE TO HAVE (adds $500 Tavily prize):
- Tavily enrichment on stale memories (>30 days old)
- DSAR submission UI for Twitter/LinkedIn
- Memory stats page

---

## SYNTHETIC DEMO DATA

Load these 30 memories into Pinecone before the demo:

```python
DEMO_MEMORIES = [
  {"content": "Committed NEAR ConsentNFT contract — unified memory hackathon", "type": "episodic", "platform": "github", "timestamp": "2026-06-19"},
  {"content": "Email from Sarah: deadline for hackathon pitch is Sunday noon", "type": "episodic", "platform": "gmail", "timestamp": "2026-06-18"},
  {"content": "User expertise: NEAR blockchain, Python, AI agent development, Web3", "type": "semantic", "platform": "github", "timestamp": "2026-06-01"},
  {"content": "Listened to 3h of focus music (Lofi Hip Hop) during coding sessions", "type": "preferential", "platform": "spotify", "timestamp": "2026-06-19"},
  {"content": "ChatGPT conversation: designed MCP server architecture for memory platform", "type": "procedural", "platform": "chatgpt", "timestamp": "2026-06-15"},
  {"content": "Top contacts: Sarah (PM), Alex (CTO), Bayram (teammate) — daily communication", "type": "social", "platform": "slack", "timestamp": "2026-06-17"},
  # ... add 24 more covering all platforms and memory types
]
```

---

## Q&A DEFENSE ANSWERS

**"Is this GDPR compliant?"**
Yes. Data via OAuth or GDPR Article 20 DSAR. Stored encrypted off-chain. Only hashes on-chain. Erasure = burn NFT + delete store.

**"How is this different from Mem0 or Supermemory?"**
They only capture AI chat history. We capture your entire digital life (20+ platforms). We add on-chain consent enforcement — nothing like it exists.

**"What about the 30-day DSAR wait?"**
OAuth platforms (Gmail, GitHub, Notion, Spotify) are immediate. DSAR platforms arrive as a richer second layer. Useful from day one.

**"Can the agent read anything it wants?"**
No. Hard gate in NEAR smart contract. Agent cannot exceed defined scope, budget, or expiry. Enforced in contract code, not application logic.

**"What's the business model?"**
0.5% fee on x402 USDC transactions. Enterprise SLA subscriptions. API access fees for developers. GDPR compliance layer for enterprises.
