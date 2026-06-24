# 🧠 Unified Memory × Cognee: "Token-Gated Cognitive Graphs"
## Hackathon Plan — The Hangover Part AI: Where's My Context?

**Event:** [WeMakeDevs Cognee Hackathon](https://www.wemakedevs.org/hackathons/cognee)  
**Dates:** June 29 – July 5, 2026  
**Prizes:** $10,000 + job interviews at Cognee  
**Tracks:** Best Use of Open Source (MacBook Neo) | Best Use of Cognee Cloud (iPhone 17) | $100/PR (Top 20)

---

## 1. Executive Summary

**The Big Idea:** Replace Unified Memory's flat Pinecone vector lake with Cognee's structured Knowledge Graph + Vector Store hybrid, creating the world's first **Token-Gated Cognitive Graph** — a Personal Knowledge Graph where every memory is a connected entity, and external AI agents must pay a micropayment (x402 USDC) + hold a NEAR Consent NFT to traverse it.

**Why this wins:**
- Cognee's `remember()` → `recall()` → `improve()` → `forget()` lifecycle maps *perfectly* onto our existing architecture.
- We demonstrate **multi-hop reasoning** across 20+ platforms (e.g., "Why am I tired?" → Health → GitHub → Spotify → Gmail).
- We showcase **Web3 monetization** of cognitive memory — no other hackathon submission will combine graph intelligence with token-gated access.
- We submit **open-source PRs** to Cognee (the x402/Web3 integration layer, multi-tenant consent hooks) to qualify for the $100/PR bounty.

---

## 2. Architecture Analysis: Before vs. After

### Current Architecture (Flat Vector Lake)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌─────────────┐
│ 20+ Connect │────▶│  Classify +  │────▶│  Pinecone       │◀────│  MCP Agent  │
│ (Gmail, GH, │     │  Embed       │     │  (1536-d cosine)│     │  Query      │
│  Spotify…)  │     │  (metadata)  │     │  namespace=uid  │     │  (vector sim) │
└─────────────┘     └──────────────┘     └─────────────────┘     └─────────────┘
                                              ▲
                                              │ metadata: platform, type, tags
                                       ┌──────┴──────┐
                                       │  NEAR + x402 │  ← Web3 gate (per-query)
                                       └─────────────┘
```

**Problems:**
- Memories are isolated vectors. No relationships between entities.
- Querying "What connects my health data to work emails?" requires manual keyword filtering.
- No memory evolution — stale data stays forever, no automatic enrichment.
- No graph traversal — just `cosine_similarity()`.

### Target Architecture (Token-Gated Cognitive Graph)

```
┌─────────────┐     ┌─────────────────────────────────────────┐     ┌─────────────┐
│ 20+ Connect │────▶│  Cognee.remember()                    │────▶│ Knowledge   │
│ (Gmail, GH, │     │  - Entity extraction (LLM)            │     │ Graph +     │
│  Spotify…)  │     │  - Relationship mapping               │     │ Vector Store│
└──────────────┘     │  - Auto-graph building (cognify)      │     └──────▲──────┘
                     │  - Metadata preserved as text nodes   │            │
                     └─────────────────────────────────────────┘            │
                                                                            │
                     ┌─────────────────────────────────────────┐              │
                     │  Cognee.improve()                     │              │
                     │  - Prune stale nodes                  │──────────────┘
                     │  - Adapt weights from feedback        │   (enrichment)
                     │  - Bridge sessions into graph         │
                     └─────────────────────────────────────────┘

                                       Web3 Monetization Layer
                     ┌─────────────────────────────────────────┐
                     │  NEAR Consent NFT  →  validate access  │
                     │  x402 USDC gate   →  per-query payment │
                     │  Cloudflare Worker →  proxy to Cognee  │
                     └─────────────────────────────────────────┘
```

**Key Wins:**
1. **Entity Relationships:** "Sarah" (from Gmail) is now a graph node connected to "hackathon deadline" (from Slack) and "seed round investor" (from LinkedIn).
2. **Multi-Hop Reasoning:** `recall("Why am I exhausted?")` can traverse: `low_sleep` → `late_night_coding` → `hackathon_deadline` → `team_pressure`.
3. **Memory Evolution:** `improve()` automatically enriches the graph as new data arrives, pruning stale connections.
4. **Surgical Forgetting:** `forget(dataset="last_nights_mistakes")` removes only the targeted subgraph.

---

## 3. Brainstorming: 5 Mind-Blowing Demo Use-Cases

These are designed to maximize **Creativity & Innovation** and **Best Use of Cognee** judging criteria.

### 🎯 Demo #1: "The Morning After" (The Hangover Agent)
> *"Your AI woke up in Vegas with no memory. Ours didn't."*

**Scenario:** The user (or a demo persona) has a chaotic life — hackathon coding, social events, work deadlines. The agent ingests a "night's worth" of cross-platform data and reconstructs the full story using **graph traversal**.

**Data Ingested:**
- Health: 5.5h sleep, resting HR 72 bpm, 8,234 steps
- Spotify: 4h lofi hip hop during coding
- GitHub: 3 commits at 2 AM, PR merged for Pinecone search
- Gmail: Email from Sarah about Sunday noon deadline
- Slack: "team standup moved to 8 AM" message

**Query:** `recall("What happened last night and why am I tired?")`

**Cognee Graph Traversal Result:**
```
low_sleep (5.5h) ──caused_by──▶ late_night_coding ──evidenced_by──▶ github_commits (2AM)
                                    │
                                    ▼
                              hackathon_deadline ──mentioned_in──▶ gmail (Sarah)
                                    │
                                    ▼
                              team_standup_moved ──from──▶ slack (8 AM)
```

**Agent Response:** *"You slept 5.5 hours because you were coding until 2 AM on the Pinecone PR for the hackathon deadline Sarah emailed you about. Your team standup was moved to 8 AM, so you probably had to wake up early. Your heart rate was elevated at 72 bpm — consistent with sleep deprivation."*

**Why it blows minds:** Flat vector search would return the sleep data and the GitHub data as separate results. Cognee's graph connects them into a causal chain. This is exactly the hackathon theme.

---

### 🎯 Demo #2: "Cross-Platform Life Detective" (Health → Work → Social)
> *"What do my health, my code, and my playlist have in common?"*

**Scenario:** A user is experiencing burnout but doesn't realize it. The agent performs a multi-hop query across seemingly unrelated platforms.

**Query:** `recall("Am I burning out? Connect my health, work, and music patterns.")`

**Cognee Graph Traversal:**
1. Start at `health` node → find `avg_sleep: 6.2h/night` (last 30 days)
2. Traverse `health → work_pattern` via temporal edges → find `github: peak productivity midnight–4 AM`
3. Traverse `work_pattern → mood` via `spotify` node → find `listening: focus beats, Berlin techno, jazz`
4. Cross-reference `gmail` → find `email_from_investor: interested in seed round` (pressure)
5. Cross-reference `notion` → find `decision: NEAR over Ethereum` (high-stakes technical choice)

**Agent Response:** *"Burnout indicators detected: (1) Your sleep has dropped to 6.2h/night for 30 days, with consistent 2 AM bedtimes. (2) Your GitHub activity shows you're coding during your biological night (midnight–4 AM). (3) Your Spotify shifted from 'focus beats' to 'Berlin techno' — often a stress signal. (4) An investor email and a high-stakes blockchain decision add pressure. Recommendation: delegate the NEAR contract review to a teammate."*

**Why it wins:** No flat vector database can perform this cross-platform causal reasoning. Cognee's `GRAPH_COMPLETION_COT` (chain-of-thought) search type is perfect here.

---

### 🎯 Demo #3: "Consent-Aware Agent Delegation" (The Web3 Killer Feature)
> *"Pay to access my mind. But only the parts I allow."*

**Scenario:** An external AI agent (e.g., a hiring assistant, a health coach, a dating app) wants to query the user's cognitive graph. The user has minted a **granular Consent NFT** on NEAR that specifies exactly which subgraphs the agent can access.

**Consent NFT Parameters:**
```json
{
  "agent_id": "health_coach_0x1234",
  "allowed_platforms": ["apple_health", "spotify"],
  "allowed_memory_types": ["episodic", "semantic"],
  "max_queries": 50,
  "max_usdc_budget": 5.00
}
```

**Demo Flow:**
1. External agent sends `recall("What's this person's stress level?")` with `token_id` and `X-PAYMENT` header.
2. Cloudflare Worker validates the Consent NFT on NEAR → `valid`.
3. x402 gate checks the USDC payment → `paid`.
4. Cognee `recall()` is called, but **scoped to only the allowed platforms and memory types**.
5. Cognee's graph traversal is filtered — it cannot access `gmail`, `github`, or `whatsapp` nodes even if they contain relevant data.

**Result:** The agent gets a deep, multi-hop answer about stress from health + music data, but **cannot see** the user's emails, code, or personal messages. Payment is recorded on-chain.

**Why it wins:** This is the only hackathon submission that combines **deep graph intelligence** with **granular, monetized consent**. It demonstrates "Potential Impact" (privacy-preserving AI economy) and "Technical Excellence" (Web3 + graph + LLM).

---

### 🎯 Demo #4: "Temporal Memory Evolution" (The `improve()` Magic Trick)
> *"My memory gets smarter while I sleep."*

**Scenario:** Show the before/after of `cognee.improve()` on the user's personal graph.

**Before `improve()`:**
- The graph has 30 raw memories from 5 platforms.
- Nodes: `hackathon`, `Sarah`, `GitHub`, `Pinecone`, `unified_memory` (isolated).

**After `improve()`:**
- New inferred edges discovered by the LLM:
  - `Sarah` ──is──▶ `project_manager` (inferred from communication patterns)
  - `Pinecone` ──replaced_by──▶ `cognee` (inferred from recent commits + decision notes)
  - `unified_memory` ──has_goal──▶ `seed_round` (inferred from investor email + biz model note)
  - `hackathon` ──located_at──▶ `42Berlin` (inferred from Slack + Telegram)

**Query:** `recall("What is the current status of my project?")`

**Before Response:** *"You have 30 memories about Unified Memory, GitHub, and a hackathon."* (flat list)
**After Response:** *"Your project 'Unified Memory' is in active development. You recently replaced Pinecone with Cognee for graph memory. Your PM Sarah is tracking a Sunday deadline. An investor expressed interest in a seed round. You're currently at a hackathon in Berlin."* (structured, inferred graph)

**Why it wins:** This directly showcases Cognee's `improve()` / `memify()` lifecycle, which is a core judging criterion: **"How deeply and effectively does the project lean on Cognee's memory lifecycle APIs?"**

---

### 🎯 Demo #5: "Memory Marketplace Dashboard" (Live Visualization + Graph Explorer)
> *"Browse your own mind. Sell access to it."*

**Scenario:** A live web dashboard that visualizes the user's cognitive graph as an interactive 3D/network graph (using Cognee's built-in visualization or a custom D3/vis.js renderer). Users can:

1. **Explore the Graph:** Click on "Sarah" and see all connected nodes (emails, deadlines, relationships).
2. **Mint Consent NFTs:** Select a subgraph (e.g., only "technical skills" from GitHub + Notion) and mint a new Consent NFT with a price.
3. **Simulate External Agent Query:** An AI agent "pays" $0.001 USDC and queries the allowed subgraph. The graph highlights the traversed path in real-time.
4. **Revoke Access:** Burn the Consent NFT and watch the external agent's query get denied with `403`.

**Technical Stack:**
- Cognee's graph data (nodes + edges) → exported to JSON
- Cytoscape.js or D3.js for frontend visualization
- NEAR contract for minting/burning
- x402 for real-time payment simulation
- WebSocket or SSE for live query path highlighting

**Why it wins:** This is the ultimate **User Experience** demo. Judges can interact with it directly. It tells a complete story: "This is my brain. This is how I control it. This is how I monetize it."

---

## 4. Step-by-Step Technical Migration Plan

### Phase 1: Dependency & Environment Setup (Day 1)

```bash
# 1. Add Cognee to pyproject.toml
cd unified-memory
# In pyproject.toml, add "cognee>=0.1.0" to dependencies
# (Cognee uses poetry/uv; we can install via pip or uv)

# 2. Install Cognee with relevant extras
uv pip install cognee[postgres,neo4j,docs]  # or pip install

# 3. Set up Cognee environment variables
# .env additions:
LLM_API_KEY=$OPENROUTER_API_KEY
LLM_PROVIDER=custom
LLM_ENDPOINT=https://openrouter.ai/api/v1
LLM_MODEL=openai/gpt-4o-mini
EMBEDDING_PROVIDER=custom
EMBEDDING_ENDPOINT=https://openrouter.ai/api/v1
EMBEDDING_API_KEY=$OPENROUTER_API_KEY
EMBEDDING_MODEL=openai/text-embedding-3-small

# 4. Default Cognee databases (no extra setup needed)
# Relational: SQLite (metadata storage)
# Vector: LanceDB (embeddings)
# Graph: Ladybug (knowledge graph) — all local, zero-config
```

### Phase 2: Ingestion Pipeline Migration (Day 1–2)

**File to modify:** `ingestion/synthesis.py`  
**Strategy:** Keep the valuable classification layer, replace the vector upsert with `cognee.remember()`.

**Step 2a:** Create `ingestion/cognee_bridge.py` — a thin wrapper that:
- Initializes Cognee with OpenRouter configuration
- Formats each `RawMemory` as structured text (so Cognee's LLM extracts entities from metadata)
- Calls `cognee.remember(text, dataset_name=user_id)`
- Handles async batching

**Step 2b:** Modify `ingestion/synthesis.py`:
- Replace `pinecone_upsert()` calls with `cognee_remember()` calls
- Keep `classify_memory()` for rich metadata generation
- Keep `load_demo_memories()` but route through Cognee

**Key insight:** Instead of embedding metadata into a vector database, we embed it into the **text itself** so Cognee's LLM extracts it as graph nodes:

```python
structured_text = f"""
[Memory from {raw.source} | Type: {classified['type']} | Importance: {classified['importance']}/10]
Date: {raw.timestamp.isoformat()}
Tags: {', '.join(classified['tags'])}
Summary: {classified['summary']}
Content: {raw.content}
"""
await cognee.remember(structured_text, dataset_name=user_id)
```

This means Cognee will create entities like:
- Node: `Memory` (type: document)
- Node: `gmail` (type: platform)
- Node: `episodic` (type: memory_type)
- Node: `Sarah` (type: person, extracted from content)
- Edge: `Sarah` → `mentioned_in` → `Memory`
- Edge: `Memory` → `from_platform` → `gmail`
- Edge: `Memory` → `has_type` → `episodic`

### Phase 3: MCP Server / Recall API Migration (Day 2–3)

**Files to modify:** `workers/local_server.py` (primary), `workers/mcp-server.js` (proxy layer)  
**Strategy:** Replace Pinecone vector queries with Cognee graph queries. Keep the Web3 layer intact.

**Step 3a:** Modify `workers/local_server.py`:
- Replace `pinecone_query()` with `cognee.recall()`
- Replace `pinecone_upsert()` with `cognee.remember()`
- Update `get_memory_stats()` to query Cognee's dataset metadata

**Key changes in `recall_memory` endpoint:**
```python
# OLD: vector similarity search
embedding = await get_embedding(query)
matches = await pinecone_query(embedding, filter, namespace=token_id)

# NEW: Cognee graph + semantic hybrid search
results = await cognee.recall(
    query,
    datasets=[token_id],  # dataset = user namespace
    auto_route=True,      # Cognee picks best search strategy
    top_k=15
)
```

**Step 3b:** Keep `workers/mcp-server.js` as a proxy/gateway:
- The Cloudflare Worker validates NEAR consent + x402 payment
- Instead of querying Pinecone directly, it forwards to the FastAPI backend via `COGNEE_BACKEND_URL`
- This preserves the Web3 monetization layer while Cognee runs in Python

**Architecture:**
```
Agent Request → Cloudflare Worker (NEAR + x402 validation) → FastAPI (Cognee recall) → Response
```

### Phase 4: Demo Script & Visualization (Day 3–4)

**Create:** `demo/cognee_hackathon_demo.py`

A single script that:
1. Seeds demo memories using `cognee.remember()`
2. Runs `cognee.cognify()` to build the graph
3. Runs `cognee.improve()` to enrich it
4. Executes the 5 mind-blowing queries from Section 3
5. Exports the graph to JSON for visualization

**Create:** `demo/visualize_graph.py` (optional, for the dashboard)
- Export Cognee graph nodes/edges to Cytoscape.js JSON
- Generate an HTML file that can be opened in a browser

### Phase 5: Open-Source PRs for Cognee (Day 4–5)

To qualify for the **"$100 per PR"** bounty, we can contribute:

1. **PR #1: OpenRouter LLM Provider Configuration Guide**
   - Add a `.md` guide to `cognee/docs/` on how to configure Cognee with OpenRouter (custom provider).
   - This helps the community use cheaper models (DeepSeek, etc.).

2. **PR #2: x402 Payment Gateway Example**
   - Add an example script to `cognee/examples/` showing how to wrap `cognee.recall()` with an x402 payment gate.
   - Demonstrates "memory as a service" monetization.

3. **PR #3: Multi-Tenant Dataset Isolation Helper**
   - Add a utility function for per-user dataset isolation (like our `dataset_name=user_id` pattern).
   - Makes it easier for SaaS builders to use Cognee with multiple users.

---

## 5. Judging Strategy: How We Maximize Each Criteria

| Criteria | How We Win |
|---|---|
| **Potential Impact** | We solve the "AI amnesia" problem for real users. Token-gated memory creates a **new economic primitive** — monetized personal context. GDPR-aligned, user-owned. |
| **Creativity & Innovation** | No one else is combining Web3 consent + graph memory + cross-platform reasoning. The "Hangover Agent" demo is memorable and thematic. |
| **Technical Excellence** | Clean async Python, proper error handling, full test coverage, Cognee lifecycle APIs used end-to-end. FastAPI + Cloudflare Workers + NEAR + Cognee = sophisticated stack. |
| **Best Use of Cognee** | We use **all 4 lifecycle APIs**: `remember()` for ingestion, `recall()` for querying (with auto-routing), `improve()` for graph enrichment, `forget()` for GDPR erasure. We demonstrate graph traversal, not just vector search. |
| **User Experience** | Live dashboard with graph visualization, one-click Consent NFT minting, real-time query path highlighting. The demo is interactive. |
| **Presentation Quality** | We have a 3-minute video script, a live demo URL, and a README that tells the story from problem → solution → impact. |

---

## 6. File-by-File Implementation Checklist

| File | Action | Priority |
|---|---|---|
| `pyproject.toml` | Add `cognee` dependency | P0 |
| `.env.example` | Add Cognee env vars | P0 |
| `ingestion/cognee_bridge.py` | **NEW** — Cognee initialization + memory formatting | P0 |
| `ingestion/synthesis.py` | Replace Pinecone upsert with `cognee.remember()` | P0 |
| `workers/local_server.py` | Replace Pinecone query with `cognee.recall()`, keep Web3 layer | P0 |
| `workers/mcp-server.js` | Convert to proxy layer (forward to FastAPI backend) | P1 |
| `demo/cognee_hackathon_demo.py` | **NEW** — Full demo script with 5 mind-blowing queries | P0 |
| `demo/visualize_graph.py` | **NEW** — Graph export to HTML/JSON | P1 |
| `README.md` | Update with Cognee architecture, new screenshots, demo video | P1 |
| `docs/COGNEE_SETUP.md` | **NEW** — Setup guide for judges/team | P2 |

---

## 7. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Cognee takes too long to build large graphs | Use `run_in_background=True` for `remember()` and `improve()`. Demo with 30 memories, not 3,000. |
| Cognee LLM costs are high | Configure OpenRouter with DeepSeek ($0.14/M) instead of GPT-4o. |
| Cloudflare Worker can't run Python | Worker stays as a JS proxy; Cognee runs in FastAPI backend. This is the intended architecture. |
| NEAR testnet is unstable | Use `rpc.testnet.fastnear.com` (already in your code). Fallback to local mock consent for demo. |
| Graph visualization is too complex | Use Cognee's built-in `cognee-cli -ui` for basic visualization, or export to Cytoscape.js for custom. |
| Cognee dataset isolation isn't perfect | Use `dataset_name=user_id` and `ENABLE_BACKEND_ACCESS_CONTROL=true`. Test thoroughly. |

---

## 8. Next Steps (Start Now)

1. **Read this plan aloud** to your team. Pick 2–3 demo use-cases from Section 3 to focus on.
2. **Run the code** in the `cognee-hackathon` branch:
   ```bash
   git checkout cognee-hackathon
   uv pip install cognee
   python demo/cognee_hackathon_demo.py
   ```
3. **Record a 2-minute Loom video** of Demo #1 ("The Morning After") as soon as the graph builds successfully.
4. **Submit the PRs** to Cognee's repo for the $100 bounty (Section 5).
5. **Iterate** on the graph visualization dashboard for the final 2 days.

---

**Good luck! The house always remembers, and so will we.** 🎰🧠
