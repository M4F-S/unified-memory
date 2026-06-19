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

## 🚀 Quick Start

### Prerequisites
```
node >= 18  |  python >= 3.11  |  wrangler CLI  |  near-cli
```

### Install
```bash
git clone https://github.com/M4F-S/unified-memory.git
cd unified-memory
cp .env.example .env          # fill in your API keys
npm install
pip install -r requirements.txt
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

### Run Demo Agent
```bash
cd demo && python agent.py
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
├── .env.example            All required API keys
└── requirements.txt        Python dependencies
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
