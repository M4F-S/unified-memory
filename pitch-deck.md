# UnifiedMemory — Pitch Deck

## Slide 1: Title

# UnifiedMemory
### Your Digital Life. One Unified Memory. Agent-Ready.

> Speaker note: Open with energy. We're solving the memory problem for AI agents — not chat history, your entire digital life, securely and with consent.

---

## Slide 2: Problem

AI agents have no memory of **your** life.

- Every chat starts from zero — no context from your emails, code, music, or conversations
- Users repeat the same context to every agent, every time
- Platforms hoard your data in silos — Gmail doesn't talk to GitHub, Spotify doesn't talk to ChatGPT
- No standard way to grant an agent temporary, revocable access to who you are

> Speaker note: Ask the room — how many times have you re-explained your job, your preferences, your codebase to a new AI tool this week? That's the problem.

---

## Slide 3: Solution

A personal knowledge graph + consent layer + micropayments.

- **Memory Graph**: 20+ platforms synthesized into vector embeddings (Pinecone)
- **Consent Layer**: NEAR ConsentNFT — you decide exactly what an agent can access, for how long, and for how much
- **Micropayments**: agents pay $0.001 USDC per query via Circle x402 — no subscriptions, no over-provisioned access
- **Revocation**: burn the NFT, access stops instantly, on-chain

> Speaker note: This is the missing infrastructure layer — like OAuth, but for AI agent memory, with payment and revocation built in.

---

## Slide 4: Demo Flow

**Onboard → Mint NFT → Agent Queries → Revoke** (3 minutes)

1. User connects platforms (Gmail, GitHub, Spotify, ...)
2. User mints a Consent NFT scoping agent access (platforms, query limit, USDC budget, expiry)
3. Agent calls the MCP endpoint, pays per query, gets relevant memories back
4. User revokes consent on-chain — agent is locked out immediately, verified live

> Speaker note: Walk through the live demo here — mint, query, then revoke and show the agent get a 403 in real time. That's the "wow" moment.

---

## Slide 5: Tech Stack

- **NEAR** — Consent NFT contract, on-chain audit log (`aihackathon.testnet`)
- **Pinecone** — vector memory graph (1536-d, cosine similarity)
- **Circle x402** — USDC micropayment gate per query
- **Cloudflare Workers** — MCP server (`unified-memory-mcp.rapid-king-4a64.workers.dev`)
- **Next.js** — frontend (`https://unified-memory.kawai-labs.com`)

> Speaker note: Everything here is live, not mocked — real NEAR testnet, real Pinecone index, real Circle payment gate.

---

## Slide 6: Business Model

- **Freemium**: 3 free queries/day per agent
- **Pay-per-query**: $0.001 USDC per query beyond the free tier
- **Enterprise**: flat-rate licensing for high-volume agent platforms
- Revenue scales directly with agent usage, not user count

> Speaker note: This is infrastructure pricing — we make money when agents actually use memory, which aligns our incentives with usefulness, not engagement tricks.

---

## Slide 7: Team + Ask

Built at AI Agents Berlin Hackathon 2026 — 42Berlin.

**We're looking for AI agent platform partnerships** — any team building agents that need persistent, consent-controlled memory.

> Speaker note: Close with the ask clearly — we want pilot integrations with agent platforms, not just hackathon judges' applause.
