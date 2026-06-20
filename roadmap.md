# UnifiedMemory — Roadmap (Hackathon Pitch)

**Deadline:** Sunday, June 21, 2026 · 12:00 PM  
**Pitch focus:** 3-min live demo — Agent queries memory → pays USDC → user revokes NFT → agent blocked  
**As of:** June 20, 2026 (repo reality vs. spec)

---

## Executive Summary

| Area | Status | Pitch-critical? |
|------|--------|-----------------|
| NEAR ConsentNFT (`contracts/consent_nft.js`) | Code done, deploy pending | **Yes** |
| MCP Worker (`workers/mcp-server.js` + gates) | Code done, deploy pending | **Yes** |
| Local fallback (`workers/local_server.py`) | Code + tests done | **Yes** (backup) |
| Memory pipeline (`ingestion/synthesis.py`) | Done | **Yes** |
| Demo agent (`demo/agent.py`) | Done | **Yes** |
| 20+ connectors | Stubs only; live ingest not needed for pitch | No (demo data enough) |
| Next.js app (`app/`) | **Missing entirely** | Medium (static UI fallback) |
| Pitch UI (`frontend-test/`) | Static landing, no backend | Medium |
| EAS attestations | In spec, not in demo path | No |
| Tavily enrichment | In spec, not implemented | Optional (prize track) |

**Management takeaway:** Pitch does not need a finished product — needs **one stable end-to-end path** (load memory → agent → MCP → revoke). Frontend can stay minimal if revoke moment is visible.

---

## Done today

- [x] Architecture + spec (`README`, `AGENT_BRIEF`, `TEAM_BRIEF`, `DEPLOYMENT_GUIDE`)
- [x] Consent NFT smart contract (NEAR JS SDK)
- [x] MCP server + `consent-gate.js`, `x402-gate.js`, `ingest.js`
- [x] FastAPI local fallback + Vitest/Pytest tests
- [x] Synthesis + 30 demo memories loader
- [x] Demo agent with 4 scenarios (incl. post-revoke block)
- [x] Static pitch landing (`frontend-test/index.html`)
- [x] `.env.example`, Python deps (`pyproject.toml` / `requirements.txt`)

## Still missing for pitch

- [ ] All API keys in `.env` (OpenRouter, Pinecone, NEAR, Circle)
- [ ] NEAR contract deployed on testnet + `mint_consent` → `DEMO_CONSENT_TOKEN`
- [ ] Pinecone index (1536 dim) + demo data loaded
- [ ] MCP live (Wrangler deploy **or** local server on port 8000)
- [ ] `demo/agent.py` end-to-end with zero errors
- [ ] Live revoke on NEAR (not just HTML simulation)
- [ ] Pitch assets: slides, backup video, Q&A sheet

---

## Priorities

### P0 — Must ship before pitch (blockers)

| # | Task | Owner | ETA | Done |
|---|------|-------|-----|------|
| 1 | Fill `.env` (OpenRouter, Pinecone, NEAR, Circle, `MCP_URL`) | Dev 1 | 1 h | [ ] |
| 2 | Create Pinecone index + `load_demo_memories('demo-user')` | Dev 1 | 30 min | [ ] |
| 3 | Deploy NEAR contract + mint test consent | Dev 1 | 2 h | [ ] |
| 4 | Deploy MCP (`wrangler deploy`) **or** `uv run uvicorn workers.local_server:app --port 8000` | Dev 1 | 1 h | [ ] |
| 5 | Demo agent: all 4 scenarios green (A–D, D = blocked) | Dev 3 | 1 h | [ ] |
| 6 | Live revoke: NFT burn → agent query 403 with reason | Dev 1 + Dev 3 | 1 h | [ ] |
| 7 | Dry-run demo script (3 min) + record backup video | All | 2 h | [ ] |

### P1 — Strengthens pitch (after P0 green)

| # | Task | Owner | ETA | Done |
|---|------|-------|-----|------|
| 8 | Pitch dashboard: USDC balance + query log visible (minimal HTML or 2–3 Next.js screens) | Dev 2 | 4 h | [ ] |
| 9 | NEAR wallet + mint/revoke UI (even 1 page) | Dev 2 | 4 h | [ ] |
| 10 | Show x402 payment live (Circle testnet wallet funded) | Dev 1 | 2 h | [ ] |
| 11 | Slide deck: problem → architecture → demo → revoke moment → prizes | Dev 2 / Manager | 2 h | [ ] |
| 12 | 1 real connector live (GitHub **or** Gmail) — "not just fake data" | Dev 1 | 3 h | [ ] |

### P2 — Post-pitch / stretch

| # | Task | Owner | Note |
|---|------|-------|------|
| 13 | Full Next.js `app/` (onboard, memory, consent, dashboard) | Dev 2 | Spec in `FRONTEND_DESIGN.md` |
| 14 | EAS attestations on Base Sepolia | Dev 1 | Sponsor track |
| 15 | Tavily memory enrichment | Dev 3 | "Best Use of Tavily" prize |
| 16 | Production-ready connectors | Dev 1 | Post-hackathon |
| 17 | Windows-native NEAR SDK (`near-sdk-js` = Linux/WSL only) | Dev 1 | WSL or CI deploy |

---

## Day plan (June 20 → 21)

### Saturday June 20 — "Close the demo path"

**Morning (Dev 1)**
- Keys + Pinecone + load demo memories
- NEAR deploy + mint consent
- MCP deploy or wire local server

**Afternoon (Dev 3)**
- Hook agent to live MCP
- Test scenarios A–D, real on-chain revoke

**Evening (Dev 2 + Manager)**
- Slides v0
- Decision: extend static UI vs. mini Next.js
- First demo dry-run (3 min timer)

### Sunday June 21 — "Pitch day"

**08:00–10:00**
- Final end-to-end test
- Prep backup video + NEAR explorer tab
- Walk through fallback scenarios (see below)

**10:00–11:30**
- Slide polish, Q&A prep
- Last live run

**12:00**
- Submission + pitch

---

## Demo script ↔ roadmap mapping

| Demo minute | What judges must see | Roadmap task |
|-------------|----------------------|--------------|
| Min 1 — Setup | User has memory, Consent NFT with scope | #2, #3, #8/#9 |
| Min 2 — Agent | Query → x402 → answer with sources | #4, #5, #10 |
| Min 3 — Wow | Revoke → agent blocked, on-chain proof | #6, #7 |

---

## Risks & fallbacks

| Risk | Likelihood | Fallback |
|------|------------|----------|
| Cloudflare Worker down | Medium | `workers/local_server.py` on laptop, `MCP_URL=http://localhost:8000` |
| NEAR testnet slow | High | Pre-record revoke TX, show explorer tab |
| x402/Circle fails | Medium | Show wallet balance manually, agent with `X-PAYMENT` header |
| Pinecone timeout | Low | Cached agent response + "memory retrieved" |
| No `app/` ready | **High** | `frontend-test/index.html` + terminal demo + slides |
| Windows + `near-sdk-js` | High | Contract deploy via WSL, GitHub Actions, or Mac/Linux teammate |

---

## Prize tracks — gaps

| Prize | Track | Gap |
|-------|-------|-----|
| Agent Infrastructure | Nebius TokenFactory | MCP live + agent demo = **nearly done** after P0 |
| Blockchain for Good | Social Impact | Sharpen GDPR story in slides, live revoke |
| Best Use of Tavily | Tool Integration | **Not implemented** — P2 or short "roadmap" slide |

---

## Management checklist (daily)

- [ ] `.env` complete? (no placeholders)
- [ ] Pinecone > 30 memories for `demo-user`?
- [ ] `DEMO_CONSENT_TOKEN` set and validated?
- [ ] MCP reachable? (`curl …/.well-known/mcp`)
- [ ] `demo/agent.py` runs without crash?
- [ ] Revoke blocks query with clear error?
- [ ] Slides + backup video ready?
- [ ] Who speaks which minute? (roles clear)

---

## Next concrete step (now)

1. **Dev 1:** Fill `.env` keys → Pinecone demo data → NEAR deploy  
2. **Dev 3:** Wait for MCP URL → test agent  
3. **Dev 2 / Manager:** Start slides, decide UI path (static vs. mini-app)  
4. **Manager:** Daily standup 09:00 + 18:00 — P0 status only, no scope creep

---

## References

- Team roles & demo script: [`TEAM_BRIEF.md`](TEAM_BRIEF.md)
- Technical spec: [`AGENT_BRIEF.md`](AGENT_BRIEF.md)
- Deploy steps: [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)
- UI spec: [`FRONTEND_DESIGN.md`](FRONTEND_DESIGN.md)
