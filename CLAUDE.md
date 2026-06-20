# CLAUDE.md — UnifiedMemory Project Guide for AI Assistants

## What This Project Is

UnifiedMemory is a consent-controlled AI agent memory platform built for the AI Agents Berlin Hackathon 2026 (June 19–21, 42Berlin). It collects a user's digital life from 20+ platforms, synthesizes it into a vector memory graph, and serves it to AI agents via a standard MCP endpoint — gated by a NEAR blockchain Consent NFT and micropayments via Circle/x402.

**Hackathon deadline: Sunday June 21, 12:00 PM.**

---

## Current State (as of June 20)

### What is built and tested
- `workers/mcp-server.js` — Cloudflare Worker (Hono), all 3 MCP routes working
- `workers/consent-gate.js` — NEAR RPC validation middleware
- `workers/x402-gate.js` — x402 payment header gate
- `workers/ingest.js` — ingestion trigger and status routes
- `workers/local_server.py` — FastAPI fallback, mirrors Worker exactly
- `ingestion/synthesis.py` — classify + embed + upsert pipeline
- `ingestion/connectors/*.py` — 20 connectors (Gmail, GitHub, Spotify, etc.)
- `ingestion/connectors/__init__.py` — connector registry + lazy loader
- `ingestion/run.py` — unified connector runner + CLI
- `demo/agent.py` — demo agent with 4 scenarios + revocation
- **175 tests passing**: 92 JS (Vitest) + 83 Python (pytest)

### Status (updated June 20) — all four original blockers DONE
1. ✅ NEAR ConsentNFT deployed — `aihackathon.testnet`, demo token `0`
2. ✅ Pinecone seeded — 30 demo memories in namespace `0`
3. ✅ Connector deps installed — all 8 SDKs in `pyproject.toml` (`uv sync`)
4. ✅ Cloudflare Worker deployed — `unified-memory-mcp.rapid-king-4a64.workers.dev`

Connectors are now wired (registry + runner). Intentionally deferred (post-MVP):
live ingestion endpoints (`POST /run`, `/ingest/*`) + frontend Connect wiring —
the demo still runs on the seeded namespace `0`.

---

## Branching Convention

Always branch from `main`. Never commit directly to main.

| Branch | Purpose |
|---|---|
| `feature/api-structure` | ✅ Merged — built the full API layer |
| `feature/api-tests` | ✅ Merged — 126-test suite |
| `feature/uv-setup` | ✅ Merged — switched to uv + pyproject.toml |
| `feature/demo-setup` | 🔄 Active — NEAR deploy, Pinecone seed, connector deps |

---

## How to Run

```bash
# Install all deps
uv sync

# Run Python tests
uv run pytest tests/ -v

# Run JS tests
cd workers && npm test

# Run local FastAPI fallback
uv run uvicorn workers.local_server:app --host 0.0.0.0 --port 8000 --reload

# Load demo data into Pinecone (needs OPENROUTER_API_KEY + PINECONE_API_KEY in .env)
uv run python ingestion/synthesis.py

# Run a single connector end-to-end (authenticate -> fetch -> synthesize -> Pinecone)
uv run python -m ingestion.run github  --user 0                       # API connector (env creds)
uv run python -m ingestion.run chatgpt --user 0 --file conversations.json  # export parser

# Run demo agent (needs MCP_URL + DEMO_CONSENT_TOKEN in .env)
uv run python demo/agent.py
```

---

## Key Files Map

| File | What it does |
|---|---|
| `contracts/consent_nft.js` | NEAR JS SDK contract — needs `near-sdk-js` build to produce `.wasm` |
| `workers/mcp-server.js` | Main MCP endpoint — Hono app, routes: `/.well-known/mcp`, `/mcp/recall_memory`, `/mcp/add_memory`, `/mcp/get_memory_stats` |
| `workers/consent-gate.js` | NEAR RPC calls — `validateConsent()`, `getConsent()`, `recordQuery()` |
| `workers/x402-gate.js` | `checkPayment(req, url, env)` — returns `null` (ok) or 402 Response |
| `workers/ingest.js` | `/ingest/connectors`, `/ingest/trigger`, `/ingest/trigger/batch`, `/ingest/status/:job_id` |
| `workers/local_server.py` | FastAPI mirror of Worker. Run as fallback if Cloudflare fails |
| `ingestion/synthesis.py` | `synthesize_batch(memories, user_id)`, `load_demo_memories(user_id)` |
| `ingestion/connectors/__init__.py` | Connector registry — `CONNECTORS`, `get_connector(platform)`, `list_connectors()` (lazy SDK imports) |
| `ingestion/run.py` | `run_connector(platform, user_id, source_path=...)` + CLI (`python -m ingestion.run`) |
| `workers/wrangler.toml` | Worker config — secrets listed, vars defined |
| `pyproject.toml` | All Python deps; `uv sync` installs everything |

---

## Environment Variables

All vars live in `.env` (copy from `.env.example`). Key ones:

| Var | Used by |
|---|---|
| `OPENROUTER_API_KEY` | All LLM + embedding calls (Workers + Python) |
| `NEAR_CONTRACT_ID` | e.g. `unified-memory.testnet` — needed after deploy |
| `NEAR_RPC` | `https://rpc.testnet.near.org` |
| `PINECONE_API_KEY` | Vector store read/write |
| `PINECONE_INDEX_NAME` | `unified-memory` |
| `PINECONE_HOST` | Full host from Pinecone console (e.g. `unified-memory-abc.svc.gcp-starter.pinecone.io`) |
| `CIRCLE_WALLET_ADDRESS` | x402 payment target |
| `MCP_URL` | Worker URL or `http://localhost:8000` for local |
| `DEMO_CONSENT_TOKEN` | Token ID minted from NEAR contract — needed for demo agent |

Worker secrets (set via `wrangler secret put`):
- `OPENROUTER_API_KEY`, `PINECONE_API_KEY`, `CIRCLE_API_KEY`

---

## Known Gotchas — Do Not Repeat These Bugs

### 1. NEAR RPC byte-array decoding
NEAR `call_function` RPC returns `result.result` as a byte array (not base64).

**JS (correct):**
```js
JSON.parse(new TextDecoder().decode(new Uint8Array(data.result.result)))
```
**Python (correct):**
```python
json.loads(bytes(data["result"]["result"]).decode("utf-8"))
```
Do NOT use `atob()` in JS or `base64.b64decode()` in Python — both fail silently.

### 2. Em dash in HTTP headers crashes Node
The `description` field in x402-gate payment challenge must use ASCII hyphen `-`, NOT em dash `—` (U+2014). Em dash in an HTTP header value throws `TypeError: Cannot convert argument to a ByteString` in Node's `Response` constructor.

### 3. Worker env vars — use `c.env.*`
In Cloudflare Workers with Hono, env vars are on the request context: `c.env.PINECONE_API_KEY`. Bare globals like `PINECONE_API_KEY` are undefined at runtime.

### 4. Python package manager
This project uses `uv`, not `pip`. Always:
- `uv sync` — install deps
- `uv add <package>` — add a new dep
- `uv run python ...` — run scripts
- Never use `pip install` or write `pip` in any docs.

### 5. NEAR testnet RPC is dead — use FastNEAR
`rpc.testnet.near.org` is deprecated and returns `-429`. Use `https://rpc.testnet.fastnear.com`.
- App code: `NEAR_RPC` in `.env` (already set correctly)
- **Classic near-cli (v4.x)** reads `NEAR_TESTNET_RPC` — NOT `NEAR_CLI_TESTNET_RPC_SERVER_URL`. Export it before any `near` command: `export NEAR_TESTNET_RPC=https://rpc.testnet.fastnear.com`

### 6. NEAR contract WASM needs wasi-stub
If compiling `contracts/consent_nft.js` manually, the `near-sdk-js` pipeline's final
step (`wasi-stub`) is mandatory — NEAR's VM has no WASI. Skipping it causes
`CompilationError: PrepareError: Instantiate` on deploy. Source of truth is
`contracts/consent_nft_src.js` (clean ESM); build via `npm run build` in `contracts/`.
Live contract: `aihackathon.testnet`, demo token `0`.

### 7. pyproject.toml is the source of truth
`requirements.txt` still exists (legacy) but `pyproject.toml` is authoritative. `uv sync` reads `pyproject.toml`. If adding deps, use `uv add <package>` — it updates both pyproject.toml and uv.lock.

---

## Test Architecture

### JS tests (`workers/__tests__/`)
- Framework: Vitest (`cd workers && npm test`)
- All external I/O is mocked: NEAR RPC via `global.fetch` mock, Pinecone via fetch mock
- Shared helpers in `workers/__tests__/setup.js`: `MOCK_ENV`, `toNearResult()`, `mockNearView()`, etc.
- `vi.mock('../consent-gate.js')` and `vi.mock('../x402-gate.js')` used in mcp-server tests

### Python tests (`tests/`)
- Framework: pytest + pytest-asyncio (`uv run pytest tests/ -v`)
- Uses FastAPI `TestClient` (synchronous, despite async routes)
- All external calls mocked with `unittest.mock.patch` + `AsyncMock`
- `conftest.py` has shared fixtures: `client`, `mock_env`
- `test_connectors.py` — registry/runner: parametrized interface conformance over all 20
  connectors, real export-parser fixtures (chatgpt/whatsapp via `tmp_path`), one mocked API
  connector (github), runner wiring. No network.
- `test_project_conditions.py` — connector SDKs importable, `RawMemory` contract, pyproject deps.

---

## API Route Reference (quick)

| Method | Path | File | Auth |
|---|---|---|---|
| GET | `/.well-known/mcp` | mcp-server.js | none |
| POST | `/mcp/recall_memory` | mcp-server.js | NEAR token + X-PAYMENT |
| POST | `/mcp/add_memory` | mcp-server.js | NEAR token |
| POST | `/mcp/get_memory_stats` | mcp-server.js | NEAR token |
| GET | `/ingest/connectors` | ingest.js | none |
| POST | `/ingest/trigger` | ingest.js | NEAR token |
| POST | `/ingest/trigger/batch` | ingest.js | NEAR token |
| GET | `/ingest/status/:job_id` | ingest.js | none |
| POST | `/api/mint` | local_server.py only | signer key |
| POST | `/api/revoke/:token_id` | local_server.py only | signer key |
| GET | `/api/consent/:token_id` | local_server.py only | none |
| GET | `/health` | mcp-server.js + local_server.py | none |

Full request/response shapes are in `AGENT_BRIEF.md`.

### Consent-management endpoints (`/api/*`) — FastAPI host only

These SIGN NEAR transactions (mint/revoke), so they shell out to `near-cli` via
`demo/near_consent.py` and only run on the FastAPI host (the Cloudflare Worker
can't sign on-chain). The frontend consent/onboard/dashboard pages call these.

- `POST /api/mint` — body `{agent_id?, platforms?[], types?[], max_queries?, max_usdc?, expires_days?}` (all optional → full demo scope). Returns `{token_id, tx_hash, explorer_url}`.
- `POST /api/revoke/:token_id` — real on-chain revoke. Returns `{status, token_id, tx_hash, explorer_url}`. **Refuses token `0`** (protected baseline; revoke is irreversible) with `409`.
- `GET /api/consent/:token_id` — view-only. Returns `{token_id, status, agent_id, owner, platforms, types, max_queries, queries_used, max_usdc_budget, usdc_spent, expires_at}`. Unknown token → `404`.

Note: after mint/revoke, NEAR view nodes lag ~1–2s before reflecting the new
state (poll `/api/consent/:id` until `status` flips).
