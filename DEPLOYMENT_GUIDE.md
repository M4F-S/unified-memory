# 🚀 DEPLOYMENT GUIDE — Get UnifiedMemory Live Step by Step
## Everything your team needs to do, in exact order, before the platform is live

---

## ⏱ Time Estimate: ~3–4 hours from zero to live demo

---

## STEP 1 — Clone the repo (2 min)

```bash
git clone https://github.com/M4F-S/unified-memory.git
cd unified-memory
cp .env.example .env
npm install
uv pip install -r requirements.txt
```

---

## STEP 2 — Get all API keys (30 min, do in parallel)

Open these 5 tabs simultaneously and create accounts/keys:

### A. OpenRouter API Key (5 min) — ALL LLM calls go here
1. Go to https://openrouter.ai
2. Sign up → Settings → API Keys → Create key
3. Add credit: $5 is enough for the entire hackathon
4. Paste into `.env`: `OPENROUTER_API_KEY=sk-or-v1-...`

### B. NEAR Testnet Account (5 min) — for Consent NFT
1. Go to https://testnet.mynearwallet.com
2. Create account (e.g. `unified-memory.testnet`)
3. Install near-cli: `npm install -g near-cli`
4. Login: `near login` (opens browser)
5. Paste into `.env`: `NEAR_ACCOUNT_ID=unified-memory.testnet`
6. Export key: `cat ~/.near-credentials/testnet/unified-memory.testnet.json`
7. Paste private key into `.env`: `NEAR_PRIVATE_KEY=ed25519:...`

### C. Pinecone (5 min) — vector memory store
1. Go to https://app.pinecone.io
2. Sign up → Create Index:
   - Name: `unified-memory`
   - Dimensions: `1536`
   - Metric: `cosine`
   - Cloud: `GCP` / Starter (free)
3. Paste into `.env`: `PINECONE_API_KEY=...` and `PINECONE_INDEX_NAME=unified-memory`

### D. Circle (10 min) — x402 USDC payments
1. Go to https://console.circle.com
2. Sign up → Create API key
3. Go to Wallets → Create wallet set → Create wallet
4. Fund with testnet USDC: https://faucet.circle.com
5. Paste into `.env`: `CIRCLE_API_KEY=...` and `CIRCLE_WALLET_ADDRESS=0x...`

### E. Cloudflare (5 min) — Workers deployment
1. Go to https://dash.cloudflare.com → Sign up
2. Workers & Pages → Create application
3. Install Wrangler: `npm install -g wrangler`
4. Login: `wrangler login`
5. Paste into `.env`: `CLOUDFLARE_ACCOUNT_ID=...`

---

## STEP 3 — Deploy NEAR ConsentNFT Contract (15 min)

```bash
cd contracts
npm install

# Compile (requires cargo + wasm-pack, or use pre-built)
# For hackathon speed: use NEAR JS SDK directly
near deploy --accountId unified-memory.testnet --wasmFile consent_nft.wasm

# Test it works:
near call unified-memory.testnet init '{"owner_id": "unified-memory.testnet"}' --accountId unified-memory.testnet

# Mint a test consent token:
near call unified-memory.testnet mint_consent '{
  "agent_id": "demo-agent.testnet",
  "allowed_platforms": ["gmail","github","spotify"],
  "allowed_memory_types": ["episodic","semantic","preferential"],
  "max_queries": 100,
  "max_usdc_budget": 1.0,
  "expires_at": "9999999999999",
  "data_root_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}' --accountId unified-memory.testnet --deposit 0.1

# Note the returned token_id — paste it into .env as DEMO_CONSENT_TOKEN
```

---

## STEP 4 — Deploy Cloudflare MCP Worker (15 min)

```bash
cd workers

# Set secrets (never commit these):
wrangler secret put OPENROUTER_API_KEY
wrangler secret put PINECONE_API_KEY
wrangler secret put CIRCLE_API_KEY

# Update wrangler.toml with your NEAR contract address
# Then deploy:
wrangler deploy

# Note the worker URL: https://unified-memory-mcp.YOUR-SUBDOMAIN.workers.dev
# Paste into .env: MCP_URL=https://unified-memory-mcp.YOUR-SUBDOMAIN.workers.dev
```

---

## STEP 5 — Load Demo Memories (10 min)

```bash
# From repo root:
uv run python -c "from ingestion.synthesis import load_demo_memories; load_demo_memories('demo-user')"

# You should see: "✅ Total synthesized: 30 memories for user demo-user"
# This loads all synthetic demo data into Pinecone so the demo works instantly
```

---

## STEP 6 — Test the Full Flow (10 min)

```bash
# Set your demo token in .env:
# DEMO_CONSENT_TOKEN=<token_id from Step 3>

# Run the demo agent end-to-end:
uv run python demo/agent.py

# Expected output:
# Scenario A: retrieves cross-platform activity memories ✅
# Scenario B: retrieves social/relationship memories ✅
# Scenario C: synthesizes personal profile ✅
# Scenario D: BLOCKED after revocation ✅ (THE WOW MOMENT)
```

---

## STEP 7 — Deploy Frontend to Vercel (15 min)

```bash
cd app
npm install
npm run build  # test it builds

# Deploy to Vercel:
npx vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_NEAR_CONTRACT_ID=unified-memory.testnet
# NEXT_PUBLIC_MCP_URL=https://unified-memory-mcp.YOUR-SUBDOMAIN.workers.dev
# NEXT_PUBLIC_NEAR_NETWORK=testnet
```

---

## STEP 8 — Connect Real Platforms (optional, enhances demo)

**Gmail (15 min):**
```bash
# Create Google OAuth credentials:
# console.cloud.google.com → New project → Enable Gmail API → Create OAuth credentials
# Download credentials.json → place in repo root
uv run python -c "
from ingestion.connectors.gmail import GmailConnector
g = GmailConnector()
g.authenticate('credentials.json')
memories = g.fetch_data(max_results=100)
from ingestion.synthesis import synthesize_batch
synthesize_batch(memories, 'real-user')
print(f'Imported {len(memories)} emails')
"
```

**GitHub (5 min):**
```bash
# Go to github.com/settings/tokens → Generate token (read:user, repo)
export GITHUB_TOKEN=ghp_your_token
uv run python -c "
from ingestion.connectors.github import GitHubConnector
g = GitHubConnector()
g.authenticate()
memories = g.fetch_data()
from ingestion.synthesis import synthesize_batch
synthesize_batch(memories, 'real-user')
print(f'Imported {len(memories)} GitHub memories')
"
```

**Spotify (10 min):**
```bash
# developer.spotify.com → Create app → get client_id + client_secret
# Set in .env then:
uv run python -c "
from ingestion.connectors.spotify import SpotifyConnector
s = SpotifyConnector()
s.authenticate()
memories = s.fetch_data()
from ingestion.synthesis import synthesize_batch
synthesize_batch(memories, 'real-user')
"
```

---

## CHECKLIST — Platform Is Live When All Are ✅

- [ ] `NEAR ConsentNFT` deployed and callable on testnet
- [ ] `MCP Worker` live at workers.dev URL — test: `curl https://YOUR-WORKER.workers.dev/.well-known/mcp`
- [ ] `Pinecone index` has >30 memories loaded
- [ ] `uv run python demo/agent.py` runs all 4 scenarios without errors
- [ ] `Revocation scenario` blocks the agent and shows reason
- [ ] `Frontend` live on Vercel with connect buttons working
- [ ] `Demo consent token` minted and saved in .env

---

## 🆘 Emergency Fallback (if Workers fail)

Run the MCP server locally with FastAPI:
```bash
uv run uvicorn workers.local_server:app --host 0.0.0.0 --port 8000 --reload
# Set MCP_URL=http://localhost:8000 in .env
```
This guarantees your demo runs even if Cloudflare deployment fails.
