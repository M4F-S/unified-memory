# AGENT.md — Backend Action Plan

## Status: Hackathon Day 2 — June 20, 2026

The critical gap: **getting things live.**

| # | Task | Status |
|---|------|--------|
| 1 | NEAR ConsentNFT contract deployed + token minted | ✅ DONE |
| 2 | Load demo data into Pinecone (30 vectors, namespace `0`) | ✅ DONE |
| 3 | Connector deps in pyproject.toml | ✅ DONE |
| 4 | End-to-end demo test (local FastAPI server) | ✅ DONE |
| 5 | Deploy Cloudflare Worker | ✅ DONE (`unified-memory-mcp.rapid-king-4a64.workers.dev`) |
| 6 | Real on-chain revocation in the demo agent | ✅ DONE |

### Live deployment values (in .env)
```
NEAR_CONTRACT_ID=aihackathon.testnet
DEMO_CONSENT_TOKEN=0
NEAR_RPC=https://rpc.testnet.fastnear.com
PINECONE_INDEX_NAME=unified-memory   # dim 1536, cosine, serverless aws us-east-1
PINECONE_HOST=unified-memory-rsv5o69.svc.aped-4627-b74a.pinecone.io
```
Contract owner/signer: `aihackathon.testnet`. Verified: `validate_query` returns `{valid:true, remaining_queries:100}`.

### End-to-end verified (local FastAPI vs. live NEAR + Pinecone + OpenRouter)
- `recall_memory` no payment → `402` ✅
- `recall_memory` + `X-PAYMENT` → 5 memories from namespace `0`, `remaining_queries` decrements ✅
- `get_memory_stats` → `active`, 30 memories ✅
- invalid token → `403 Access denied: Token not found` ✅

### Namespace model (important)
Pinecone namespace = `token_id` everywhere (read, write, stats). Demo data lives in
namespace `0` (= `DEMO_CONSENT_TOKEN`). The original code had a bug: `recall_memory`
queried the default namespace instead of `token_id` — fixed in `mcp-server.js` and
`local_server.py`. To re-seed: `uv run python -c "from ingestion.synthesis import
load_demo_memories; load_demo_memories('0')"`.

---

## Priority 1 — NEAR ConsentNFT Contract ✅ DONE

> Deployed to `aihackathon.testnet`, token `0` minted, validated on-chain.
> Re-run instructions below only if redeploying from scratch.

### Two gotchas that cost us time (READ BEFORE REDEPLOYING)

1. **The deprecated RPC server.** `rpc.testnet.near.org` is dead and returns
   `-429 THIS ENDPOINT IS DEPRECATED`. The classic `near-cli` (v4.0.13) reads the
   override from the env var **`NEAR_TESTNET_RPC`** (NOT `NEAR_CLI_TESTNET_RPC_SERVER_URL`).
   Always start your terminal session with:
   ```bash
   export NEAR_TESTNET_RPC=https://rpc.testnet.fastnear.com
   ```
   This must stay set for login, deploy, call, AND view.

2. **wasi-stub is mandatory.** If you compile the WASM manually (bypassing
   `near-sdk-js build`), you MUST run the wasi-stub step afterward or deploy fails
   with `CompilationError: PrepareError: Instantiate`. NEAR's VM has no WASI:
   ```bash
   bash node_modules/near-sdk-js/lib/cli/deps/binaryen/wasi-stub/run.sh contracts/consent_nft.wasm
   ```

3. **near-cli v4 uses positional args + `--force`** to redeploy over existing code:
   ```bash
   near deploy aihackathon.testnet contracts/consent_nft.wasm \
     --initFunction init --initArgs '{"owner_id":"aihackathon.testnet"}' --force
   ```

Without a live contract, every MCP call returns 503 (NEAR RPC error). This blocks everything.

### What to do

**Step 1: Build the WASM**

The contract at `contracts/consent_nft.js` is written in NEAR JS SDK.
Build it:
```bash
cd contracts
npm install near-sdk-js
npx near-sdk-js build consent_nft.js --out consent_nft.wasm
```

If `near-sdk-js` CLI is not available, use the prebuilt quickstart:
```bash
npx create-near-app@latest --template js --contract consent_nft
```
Or use the NEAR JS sandbox — the contract is pure JS and can be deployed directly via `near-cli`:

**Step 2: Deploy**
```bash
# Make sure you have near-cli installed: npm install -g near-cli
near login   # opens browser, log in with testnet account

# Deploy (creates a new dev account automatically):
near dev-deploy contracts/consent_nft.wasm
# → prints: Account ID: dev-1234567890-12345678
# → Save that as NEAR_CONTRACT_ID in .env

# OR deploy to your named account:
near deploy --accountId unified-memory.testnet --wasmFile contracts/consent_nft.wasm
```

**Step 3: Initialize**
```bash
near call $NEAR_CONTRACT_ID init '{"owner_id":"'$NEAR_ACCOUNT_ID'"}' \
  --accountId $NEAR_ACCOUNT_ID
```

**Step 4: Mint a demo Consent Token**
```bash
near call $NEAR_CONTRACT_ID mint_consent '{
  "agent_id": "demo-agent.testnet",
  "allowed_platforms": ["gmail","github","spotify","chatgpt","slack","discord","notion","apple_health","twitter","whatsapp","youtube","reddit","telegram","instagram","linkedin"],
  "allowed_memory_types": ["episodic","semantic","procedural","social","preferential"],
  "max_queries": 100,
  "max_usdc_budget": 1.0,
  "expires_at": "9999999999999",
  "data_root_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}' --accountId $NEAR_ACCOUNT_ID --deposit 0.1
# → prints token_id (probably "0")
```

**Step 5: Verify**
```bash
near view $NEAR_CONTRACT_ID validate_query \
  '{"token_id":"0","platform":"all","memory_type":"all","query_cost_usdc":0.001}'
# Expected: {"valid":true,"remaining_queries":100}
```

**Step 6: Save to .env**
```
NEAR_CONTRACT_ID=dev-XXXXXXXXXX-XXXXXXXX   # or unified-memory.testnet
DEMO_CONSENT_TOKEN=0
```

---

## Priority 2 — Load Demo Data into Pinecone (BLOCKING)

Without data in Pinecone, `recall_memory` returns 0 memories — demo fails silently.

### What to do

**Needs in .env first:** `OPENROUTER_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `PINECONE_HOST`

Get `PINECONE_HOST` from Pinecone console → your index → "Host" tab.

```bash
# Load the 30 pre-written demo memories
uv run python ingestion/synthesis.py

# Or explicitly:
uv run python -c "from ingestion.synthesis import load_demo_memories; load_demo_memories('demo-user')"
# Expected output: "Loading 30 demo memories for user: demo-user"
#                  "  ✅ Upserted 30..."
#                  "  ✅ Done: 30 memories for demo-user"
```

**Verify with a quick Pinecone check:**
```bash
uv run python -c "
from pinecone import Pinecone
import os
from dotenv import load_dotenv
load_dotenv()
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
idx = pc.Index(os.getenv('PINECONE_INDEX_NAME'))
print(idx.describe_index_stats())
"
# Should show totalVectorCount: 30 (or more)
```

---

## Priority 3 — Add Connector Dependencies to pyproject.toml

Current `pyproject.toml` is missing the platform-specific connector libraries. Without these, any import of a connector crashes with `ModuleNotFoundError`.

### What to add
```bash
uv add google-api-python-client google-auth-oauthlib
uv add PyGithub
uv add spotipy
uv add praw
uv add slack-sdk
uv add discord.py
uv add python-telegram-bot
uv add notion-client
```

After adding, verify:
```bash
uv run python -c "from ingestion.connectors.gmail import GmailConnector; print('ok')"
uv run python -c "from ingestion.connectors.github import GitHubConnector; print('ok')"
uv run python -c "from ingestion.connectors.spotify import SpotifyConnector; print('ok')"
```

---

## Priority 4 — End-to-End Demo Test

After priorities 1–3 are done, run the full demo flow against the local FastAPI server first, then against the live Worker.

```bash
# Terminal 1: start local server
uv run uvicorn workers.local_server:app --host 0.0.0.0 --port 8000

# Terminal 2: test with local server
MCP_URL=http://localhost:8000 uv run python demo/agent.py
```

Expected output:
- Scenario A: retrieves cross-platform activity memories ✅
- Scenario B: retrieves social/relationship memories ✅
- Scenario C: retrieves personal profile ✅
- Scenario D: BLOCKED after revocation ✅ (the wow moment)

---

## Priority 5 — Deploy Cloudflare Worker (for live demo)

Only needed if you want the demo to hit a real Workers URL (recommended for judges).

```bash
cd workers

# Set secrets (one-time):
wrangler secret put OPENROUTER_API_KEY
wrangler secret put PINECONE_API_KEY
wrangler secret put CIRCLE_API_KEY

# Update wrangler.toml vars:
# NEAR_CONTRACT_ID = "dev-XXXXXXXXXX-XXXXXXXX"
# PINECONE_HOST = "unified-memory-abc.svc.gcp-starter.pinecone.io"

wrangler deploy
# → prints: https://unified-memory-mcp.YOUR-SUBDOMAIN.workers.dev
```

Then update `.env`:
```
MCP_URL=https://unified-memory-mcp.YOUR-SUBDOMAIN.workers.dev
```

And test:
```bash
curl https://unified-memory-mcp.YOUR-SUBDOMAIN.workers.dev/.well-known/mcp
```

---

## Priority 6 — Revocation Demo Flow (the wow moment) ✅ DONE

The revocation is now **real and on-chain**, wired straight into the demo agent — no
more hard-coded fake block number. Scenario D is genuinely blocked by NEAR.

### How it works

- `demo/near_consent.py` — thin near-cli wrapper: `mint_demo_consent()`,
  `revoke_consent(token_id) -> (tx_hash, explorer_url)`, `validate_query(token_id)`.
  Forces `NEAR_TESTNET_RPC=FastNEAR` on every call (the dead-RPC gotcha).
- `demo/reset_consent.py` — **run this OFF-STAGE before each rehearsal.** Mints a fresh
  Consent NFT, seeds *its* Pinecone namespace with the 30 demo memories, and writes
  `DEMO_CONSENT_TOKEN=<new id>` into `.env`. Needed because `revoke_consent` is
  **irreversible** — every run needs a new token, and Pinecone namespace == token_id.
- `demo/agent.py` — runs Scenarios A–C on the prepared token, then does a **real
  `revoke_consent`** before D, prints the live tx hash + explorer link, and **waits for
  the revoke to propagate to NEAR view nodes** before Scenario D (there's a ~1–2s lag;
  without the wait the agent can read stale consent and fail to block).

### Run it

```bash
uv run python demo/reset_consent.py     # off-stage: fresh token + seed + .env
uv run python demo/agent.py             # A–C ✅, real revoke, D → 403 blocked ✅
```

### Safety guards baked in

- **Token `0` is the protected baseline** (the seeded namespace the API tests rely on).
  If `DEMO_CONSENT_TOKEN=0`, agent.py refuses the on-chain revoke and simulates it, so
  the baseline is never burned. Run `reset_consent.py` to get a real, burnable token.
- `DEMO_SIMULATE_REVOKE=1` forces simulated revocation (no NEAR call) if testnet is down.
- A failed live revoke degrades gracefully to a simulated block — the demo never crashes.

### Verified

- Mint → fresh `token_id`; seed → 30 memories in namespace `token_id`.
- `revoke_consent` returns a real tx hash (e.g. `https://testnet.nearblocks.io/txns/<hash>`).
- After propagation: `validate_query` → `{valid:false, reason:'Consent revoked'}`,
  `recall_memory` → `403 Access denied: Consent revoked`. ✅

---

## Fallback Plan (if something breaks at demo time)

| What breaks | What to do |
|---|---|
| Cloudflare Worker down | `uv run uvicorn workers.local_server:app --port 8000` + set `MCP_URL=http://localhost:8000` |
| NEAR testnet slow | Pre-record the `near call revoke_consent` transaction, show tx hash from explorer |
| Pinecone timeout | Show cached `demo/agent.py` output recorded before the demo |
| x402 payment fails | Pass `X-PAYMENT: demo-receipt` header manually — Worker accepts any non-empty value |
| Everything down | Have a 60-second screen recording of the working demo on your phone |

---

## Current Branch: `feature/demo-setup`

Commit each priority as it's completed:
```bash
git add -A
git commit -m "feat: <what you just did>"
git push -u origin feature/demo-setup
```

Merge to main when all priorities 1–3 are done and demo runs end-to-end.
