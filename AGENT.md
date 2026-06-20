# AGENT.md — Backend Action Plan

## Status: Hackathon Day 2 — June 20, 2026

Everything is built and tested. The critical gap: **nothing is live yet.**
No deployed contract, no Pinecone data, no Worker URL. Demo will fail if these aren't done.

---

## Priority 1 — NEAR ConsentNFT Contract (BLOCKING)

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

## Priority 6 — Revocation Demo Flow (the wow moment)

After the demo agent runs Scenarios A–C, trigger the revocation on-chain:

```bash
near call $NEAR_CONTRACT_ID revoke_consent \
  '{"token_id":"0"}' --accountId $NEAR_ACCOUNT_ID
# → prints tx hash — show this on NEAR Explorer: https://testnet.nearblocks.io
```

Then Scenario D in `demo/agent.py` will automatically get HTTP 403 "Access denied: Consent revoked".

This is the core demo moment — the on-chain transaction hash proves it happened in real time.

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
