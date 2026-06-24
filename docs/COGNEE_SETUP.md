# docs/COGNEE_SETUP.md
# Setup Guide: Migrating Unified Memory from Pinecone to Cognee

## Quick Start (5 minutes)

```bash
# 1. Clone / switch to the hackathon branch
git checkout cognee-hackathon

# 2. Install Cognee (Python 3.11–3.14 required)
uv pip install cognee
# or: pip install cognee

# 3. Copy and fill environment variables
cp .env.example .env
# Add these Cognee-specific variables (see below)

# 4. Run the demo
uv run python demo/cognee_hackathon_demo.py

# 5. Start the FastAPI MCP server
uv run uvicorn workers.cognee_local_server:app --host 0.0.0.0 --port 8000
```

## Required Environment Variables

Add these to your `.env` file:

```bash
# ── OpenRouter (same key you already use) ───────────────────────────────────
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_CLASSIFY_MODEL=openai/gpt-4o-mini   # or deepseek/deepseek-v3.2
OPENROUTER_EMBED_MODEL=openai/text-embedding-3-small

# ── Cognee LLM Configuration ────────────────────────────────────────────────
LLM_API_KEY=$OPENROUTER_API_KEY
LLM_PROVIDER=custom
LLM_ENDPOINT=https://openrouter.ai/api/v1
LLM_MODEL=openai/gpt-4o-mini

# ── Cognee Embedding Configuration ──────────────────────────────────────────
EMBEDDING_API_KEY=$OPENROUTER_API_KEY
EMBEDDING_PROVIDER=custom
EMBEDDING_ENDPOINT=https://openrouter.ai/api/v1
EMBEDDING_MODEL=openai/text-embedding-3-small

# ── Cognee Database (zero-config defaults) ────────────────────────────────
# Relational: SQLite (metadata storage)
DB_PROVIDER=sqlite
# Vector: LanceDB (embeddings)
VECTOR_DB_PROVIDER=lancedb
# Graph: Ladybug (knowledge graph)
GRAPH_DATABASE_PROVIDER=ladybug

# Data directories (auto-created)
DATA_ROOT_DIRECTORY=./cognee_data
SYSTEM_ROOT_DIRECTORY=./cognee_system

# ── NEAR + x402 (same as your existing config) ──────────────────────────────
NEAR_RPC=https://rpc.testnet.fastnear.com
NEAR_CONTRACT_ID=consent-nft.testnet
CIRCLE_WALLET_ADDRESS=0xYOUR_WALLET
```

## Architecture Changes

### What Changed

| Component | Before (Pinecone) | After (Cognee) |
|---|---|---|
| **Ingestion** | `synthesize_batch` → classify + embed → `pinecone_upsert` | `cognee_remember` → structured text → `cognee.remember()` |
| **Storage** | Flat 1536-d cosine vectors in Pinecone namespaces | Knowledge Graph (Ladybug) + Vector Store (LanceDB) per dataset |
| **Query** | Vector similarity search with metadata filters | `cognee.recall()` with auto-routing (graph traversal + semantic) |
| **Enrichment** | None — stale data persisted forever | `cognee.improve()` — prunes stale nodes, infers new edges |
| **Erasure** | Delete vectors by ID | `cognee.forget(dataset)` — surgical subgraph deletion |
| **MCP Server** | Cloudflare Worker queried Pinecone directly | Worker proxies to FastAPI backend running Cognee |

### What Stayed the Same

- **20+ Platform Connectors** — Gmail, GitHub, Spotify, Slack, etc. still fetch data.
- **NEAR Consent NFTs** — Still validate access on-chain before every query.
- **x402 USDC Micropayments** — Still require payment per query.
- **EAS Attestations** — Still log successful queries on Base Sepolia.
- **FastAPI Fallback** — The local server is now the primary backend, not a fallback.

## File Reference

| File | Purpose |
|---|---|
| `ingestion/cognee_bridge.py` | Cognee lifecycle wrapper (remember, recall, improve, forget) |
| `ingestion/cognee_synthesis.py` | Ingestion pipeline using Cognee instead of Pinecone |
| `workers/cognee_local_server.py` | FastAPI MCP server with Cognee graph queries |
| `demo/cognee_hackathon_demo.py` | Full demo script with 5 mind-blowing use-cases |
| `HACKATHON_PLAN.md` | Complete strategy, architecture, and judging guide |

## Running the Full Stack

### Option A: Local Development (Recommended for hacking)

```bash
# Terminal 1 — FastAPI backend (Cognee graph engine)
uv run uvicorn workers.cognee_local_server:app --host 0.0.0.0 --port 8000

# Terminal 2 — Demo script
uv run python demo/cognee_hackathon_demo.py

# Terminal 3 — Cognee CLI + UI (for graph visualization)
cognee-cli -ui
```

### Option B: With Cloudflare Worker Proxy (Production-like)

```bash
# 1. Deploy the FastAPI backend somewhere (Railway, Fly.io, or local tunnel)
# 2. Set COGNEE_BACKEND_URL in the Cloudflare Worker
# 3. Deploy the worker:
cd workers && wrangler deploy

# The worker validates NEAR + x402, then forwards to the FastAPI backend.
```

## Troubleshooting

| Issue | Fix |
|---|---|
| `ModuleNotFoundError: cognee` | Run `uv pip install cognee` or `pip install cognee` |
| `LLM API error` | Check `LLM_API_KEY` and `LLM_ENDPOINT` are set correctly |
| `Graph is empty after ingestion` | Ensure `cognee.cognify()` ran. `remember()` calls it automatically, but if you use `add()` directly, call `cognify()` after. |
| `Slow ingestion` | Set `run_in_background=True` in `cognee_remember()` for async batching |
| `NEAR testnet down` | Switch to `rpc.testnet.fastnear.com` |
| `Cognee data directory grows large` | Run `cognee.forget(dataset="demo-user", everything=True)` to clear |

## Cognee Advanced Configuration

### Switch to Neo4j (for production graph scale)

```bash
pip install cognee[neo4j]
GRAPH_DATABASE_PROVIDER=neo4j
GRAPH_DATABASE_URL=bolt://localhost:7687
GRAPH_DATABASE_USERNAME=neo4j
GRAPH_DATABASE_PASSWORD=yourpassword
```

### Switch to PostgreSQL (for multi-tenant metadata)

```bash
pip install cognee[postgres]
DB_PROVIDER=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=cognee
DB_PASSWORD=cognee
DB_NAME=cognee_db
```

### Enable Strict Multi-Tenant Access Control

```bash
ENABLE_BACKEND_ACCESS_CONTROL=true
```

This ensures each `dataset_name` (user_id) is fully isolated.

## Hackathon Submission Checklist

- [ ] Demo script runs end-to-end (`demo/cognee_hackathon_demo.py`)
- [ ] FastAPI server responds to `recall_memory` with graph results
- [ ] NEAR consent validation still works (test with token `0`)
- [ ] x402 payment gate returns 402 without `X-PAYMENT`
- [ ] At least one open-source PR submitted to `topoteretes/cognee`
- [ ] Loom video recorded (2–3 minutes)
- [ ] README updated with Cognee architecture diagram
- [ ] Live demo URL deployed (optional but recommended)

## Resources

- [Cognee Docs](https://docs.cognee.ai/)
- [Cognee GitHub](https://github.com/topoteretes/cognee)
- [Cognee Hackathon Boilerplates](https://github.com/topoteretes/cognee-hackathons)
- [WeMakeDevs Hackathon Page](https://www.wemakedevs.org/hackathons/cognee)
- [OpenRouter](https://openrouter.ai/) (for cheap LLM + embedding APIs)
