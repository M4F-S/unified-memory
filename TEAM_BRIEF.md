# 🧠 UnifiedMemory — Team Brief
## AI Agents Berlin Hackathon 2026 | Submission Deadline: Sunday June 21 @ 12:00 PM

---

## What Are We Building? (30 seconds)

**UnifiedMemory** is the first platform that collects a person's entire digital life
(emails, social media, AI chat history, music, health data) and gives their AI agents
access to it — with the human always in control via a blockchain consent system.

Think of it as: **your personal memory OS for all your AI agents.**

---

## The Problem

AI agents are amnesiac. Every ChatGPT, Claude, or custom agent you use knows nothing
about your life. You are a stranger to every AI, every single time.

Meanwhile your real context lives across 20+ platforms — Gmail, GitHub, Instagram,
Spotify, ChatGPT history, Apple Health — completely disconnected.

---

## What UnifiedMemory Does

1. **CONNECT** — You give us access to your platforms via OAuth or GDPR data export
2. **SYNTHESIZE** — We classify your data into 5 memory types (episodic, semantic,
   procedural, social, preferential) and store it as a searchable vector graph
3. **CONSENT** — You mint a Consent NFT on NEAR: defines exactly what agent can access,
   for how long, with what budget
4. **SERVE** — Any AI agent queries your memory via a standard MCP endpoint
5. **REVOKE** — Burn the NFT anytime → all agent access stops instantly, logged on-chain

---

## Team Roles

### Dev 1 — Backend + Blockchain
**Hours 0–12:** Deploy NEAR ConsentNFT contract → set up Pinecone index →
  build ingestion pipeline for Gmail + GitHub (OAuth)
**Hours 12–24:** Build MCP server Worker → consent validation → x402 payment gate
**Hours 24–36:** EAS attestations → memory synthesis pipeline → DSAR queue
**Hours 36–48:** Debug + integration testing

### Dev 2 — Frontend + Integration  
**Hours 0–12:** Set up Next.js app → NEAR Wallet Selector → onboarding flow UI
**Hours 12–24:** Consent NFT minting page → revocation UI → platform connect buttons
**Hours 24–36:** Live dashboard (query log, USDC balance, NFT status)
**Hours 36–48:** Demo page → polish → slide deck

### Dev 3 — Agent + Demo
**Hours 0–12:** Set up demo agent (Python + OpenAI tools) → load synthetic memories
**Hours 12–24:** Wire agent to live MCP endpoint → test x402 auto-pay flow
**Hours 24–36:** Add Tavily enrichment → test all demo scenarios
**Hours 36–48:** Rehearse demo → record backup video → prepare Q&A answers

---

## Critical Path (Do These First, In Order)

1. Deploy NEAR ConsentNFT contract (need contract address for everything else)
2. Set up Pinecone index (need this for memory storage)
3. Get Circle agent wallet funded with test USDC (need for x402 demo)
4. Deploy MCP Worker (need URL for demo agent)
5. Load 30 synthetic memories into Pinecone (needed for demo to work)

---

## The Demo Script (3 minutes on stage)

**Minute 1 — Setup:**
"Here is a user who has connected Gmail, GitHub, and Spotify to UnifiedMemory.
They mint a Consent NFT: agent can access episodic and semantic memories,
max 20 queries, max $0.50 USDC, expires in 24 hours."

**Minute 2 — Agent runs:**
Demo agent receives task: "What are the top 3 projects this user worked on this month?"
→ Agent queries MCP → pays 0.001 USDC via x402 → gets memories → gives answer
→ Judges see USDC balance decrease in real time on dashboard

**Minute 3 — The Wow Moment:**
"Now the user revokes consent." → Burn NFT on NEAR → live transaction on explorer
→ Agent tries to query again → blocked: "Consent revoked" → on-chain proof shown
→ "This is the first time in history an AI agent's data access was revoked
   in real time via a blockchain transaction. The user is always in control."

---

## Judging Criteria — How We Score

| Criterion | Our Score | Why |
|---|---|---|
| Genuine Autonomy | ✅ 10/10 | Agent queries + pays + gets blocked — zero human clicks |
| Real-World Viability | ✅ 10/10 | GDPR-legal, real APIs, real problem every AI user has |
| Technical Quality | ✅ 9/10 | NEAR + x402 + Circle + MCP + EAS — all sponsor tools |
| Demo Quality | ✅ 10/10 | Revocation moment is visceral and unforgettable |
| Innovation | ✅ 10/10 | Nothing like this exists in production today |

---

## If Something Breaks During Demo

- MCP Worker down → fall back to local FastAPI server: `uv run uvicorn workers.local_server:app --port 8000`
- NEAR testnet slow → show pre-recorded transaction on NEAR Explorer
- x402 payment fails → show Circle wallet balance change manually
- Pinecone timeout → show cached response with "memory retrieved" message
- Always have the 60-second backup video ready on your phone

---

## Key Links

- Repo: https://github.com/M4F-S/unified-memory
- NEAR Testnet Explorer: https://testnet.nearblocks.io
- EAS Explorer (Base Sepolia): https://base-sepolia.easscan.org
- Circle Developer Console: https://console.circle.com
- Cloudflare Dashboard: https://dash.cloudflare.com
- Pinecone Console: https://app.pinecone.io
