# 🧠 UnifiedMemory
### AI Agents Berlin Hackathon 2026 · 42Berlin · June 19–21

> The first platform that gives any AI agent — regardless of LLM provider — secure,
> consent-controlled access to a human's entire digital memory: emails, social media,
> AI chat history, calendars, code, music, health data, and more.

[![NEAR](https://img.shields.io/badge/NEAR-Testnet-green)](https://testnet.nearblocks.io)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com)
[![Circle](https://img.shields.io/badge/Circle-x402_USDC-blue)](https://circle.com)
[![EAS](https://img.shields.io/badge/EAS-Base_Sepolia-purple)](https://attest.sh)

---

## 🏗 Architecture

```
User → Consent NFT (NEAR) → MCP Server (Cloudflare Workers)
         ↑ revoke anytime         ↓ x402 USDC payment (Circle)
    On-chain audit log      Memory Graph (Pinecone vectors)
                                   ↑
                        20+ Platform Connectors
                  (Gmail, GitHub, Twitter, ChatGPT, Spotify...)
```

## ✅ Live Status (June 20, 2026)

The backend is **live and verified end-to-end** against real NEAR + Pinecone + OpenRouter.

| Component | Status | Detail |
|---|---|---|
| NEAR ConsentNFT | 🟢 deployed | `aihackathon.testnet`, demo token `0` |
| Memory store | 🟢 seeded | Pinecone `unified-memory` (1536-d cosine), 30 demo memories in namespace `0` |
| MCP API | 🟢 verified | `recall_memory` / `add_memory` / `get_memory_stats` working |
| x402 gate | 🟢 verified | 402 without `X-PAYMENT`, passes with it |
| Consent gate | 🟢 verified | invalid/revoked token → `403 Access denied` |
| Cloudflare Worker | 🟢 deployed | `unified-memory-mcp.rapid-king-4a64.workers.dev` (FastAPI fallback still available) |
| Consent REST API | 🟢 verified | `POST /api/mint`, `POST /api/revoke/:id`, `GET /api/consent/:id` on FastAPI host — real on-chain mint→read→revoke (token `0` protected) |
| Revocation demo | 🟢 live | real on-chain `revoke_consent` → tx hash → Scenario D blocked |

End-to-end check (local FastAPI vs. live services): no-payment → `402`, with payment →
5 memories returned + `remaining_queries` decrements, invalid token → `403`.

> **Note for the team:** NEAR testnet RPC `rpc.testnet.near.org` is dead. Use
> `https://rpc.testnet.fastnear.com`. For the classic near-cli, export it as
> `NEAR_TESTNET_RPC`. See `AGENT.md` for the full backend runbook.

---

## 🚀 Quick Start

### Prerequisites
```
node >= 18  |  python >= 3.11  |  uv  |  wrangler CLI  |  near-cli
```

Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`

### Install
```bash
git clone https://github.com/M4F-S/unified-memory.git
cd unified-memory
cp .env.example .env          # fill in your API keys
npm install
uv sync                       # installs all Python deps from pyproject.toml
```

### Deploy NEAR Contract
```bash
cd contracts && npm install
near dev-deploy --wasmFile consent_nft.wasm
```

### Deploy Cloudflare Workers
```bash
cd workers && wrangler deploy
```

### Run Frontend
```bash
cd app && npm run dev
```

### Run Local Fallback Server
```bash
uv run uvicorn workers.local_server:app --host 0.0.0.0 --port 8000
```

### Load Demo Memories
```bash
uv run python -c "from ingestion.synthesis import load_demo_memories; load_demo_memories('demo-user')"
```

### Run Demo Agent
```bash
uv run python demo/agent.py
```

---

## 📁 Project Structure

```
unified-memory/
├── contracts/              NEAR smart contracts
│   └── consent_nft.js      Soulbound Consent NFT (access control)
├── workers/                Cloudflare Workers
│   ├── mcp-server.js       MCP endpoint for agent memory queries
│   ├── ingest.js           Platform ingestion controller
│   ├── consent-gate.js     Consent NFT validation middleware
│   └── x402-gate.js        x402 USDC micropayment gate
├── ingestion/              Platform connectors (20+)
│   ├── connectors/
│   │   ├── gmail.py
│   │   ├── github.py
│   │   ├── twitter.py
│   │   ├── linkedin.py
│   │   ├── instagram.py
│   │   ├── notion.py
│   │   ├── slack.py
│   │   ├── discord.py
│   │   ├── spotify.py
│   │   ├── chatgpt.py
│   │   ├── claude.py
│   │   ├── whatsapp.py
│   │   ├── apple_health.py
│   │   ├── youtube.py
│   │   ├── facebook.py
│   │   ├── tiktok.py
│   │   ├── reddit.py
│   │   ├── telegram.py
│   │   ├── apple_mail.py
│   │   └── google_fit.py
│   └── synthesis.py        Memory classification + embedding
├── app/                    Next.js 14 frontend
│   ├── onboard/            Platform connection flow
│   ├── memory/             Memory graph explorer
│   ├── consent/            Mint / revoke Consent NFTs
│   └── dashboard/          Live query log + USDC balance
├── demo/
│   └── agent.py            Live hackathon demo agent
├── AGENT_BRIEF.md          Complete spec for AI agent builders
├── TEAM_BRIEF.md           Simple brief for human teammates
├── CLAUDE.md               Project guide for AI assistants (gotchas, conventions)
├── AGENT.md                Backend action plan + live deployment runbook
├── .env.example            All required API keys
└── pyproject.toml          Python dependencies (uv sync)
```

---

## 🎯 Hackathon Prize Targets

| Prize | Track | Why We Win |
|---|---|---|
| **Agent Infrastructure** | Nebius TokenFactory | MCP server = token-gated agent memory infra |
| **Blockchain for Good** | Social Impact | GDPR empowerment for 450M EU citizens |
| **Best Use of Tavily** | Tool Integration | Tavily enriches stale memories in real time |

---

## ⚖️ Legal & Privacy

- Data collected via **official OAuth APIs** or **GDPR Article 20 DSAR** (legal right)
- Personal data stored **encrypted off-chain** — never on-chain
- Only cryptographic hashes anchored on NEAR + Base Sepolia  
- GDPR erasure: burn Consent NFT + wipe off-chain store
- User retains full ownership at all times

---

## 👥 Team

Built at AI Agents Berlin Hackathon 2026 — 42Berlin
