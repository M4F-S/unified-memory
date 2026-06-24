# ingestion/cognee_bridge.py
# Thin Cognee integration layer for Unified Memory
# Wraps remember/recall/improve/forget lifecycle with our custom metadata formatting

import os
import asyncio
import json
import hashlib
from datetime import datetime
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field

import cognee
from dotenv import load_dotenv

load_dotenv()

# ── Cognee Configuration (OpenRouter passthrough) ───────────────────────────────

def configure_cognee():
    """Set Cognee env vars to route through OpenRouter for both LLM + embeddings."""
    os.environ.setdefault("LLM_API_KEY", os.getenv("OPENROUTER_API_KEY", ""))
    os.environ.setdefault("LLM_PROVIDER", "custom")
    os.environ.setdefault("LLM_ENDPOINT", "https://openrouter.ai/api/v1")
    os.environ.setdefault(
        "LLM_MODEL",
        os.getenv("OPENROUTER_CLASSIFY_MODEL", "openai/gpt-4o-mini")
    )
    os.environ.setdefault("EMBEDDING_PROVIDER", "custom")
    os.environ.setdefault("EMBEDDING_ENDPOINT", "https://openrouter.ai/api/v1")
    os.environ.setdefault("EMBEDDING_API_KEY", os.getenv("OPENROUTER_API_KEY", ""))
    os.environ.setdefault(
        "EMBEDDING_MODEL",
        os.getenv("OPENROUTER_EMBED_MODEL", "openai/text-embedding-3-small")
    )
    # Default to local SQLite/LanceDB/Ladybug (zero-config)
    os.environ.setdefault("DB_PROVIDER", "sqlite")
    os.environ.setdefault("VECTOR_DB_PROVIDER", "lancedb")
    os.environ.setdefault("GRAPH_DATABASE_PROVIDER", "ladybug")
    # Data root under project directory so it's portable
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.environ.setdefault("DATA_ROOT_DIRECTORY", os.path.join(repo_root, "cognee_data"))
    os.environ.setdefault("SYSTEM_ROOT_DIRECTORY", os.path.join(repo_root, "cognee_system"))


configure_cognee()


# ── Data Model (same as synthesis.py for compatibility) ────────────────────────

@dataclass
class RawMemory:
    content: str
    timestamp: datetime
    source: str
    url: Optional[str] = None
    metadata: dict = field(default_factory=dict)


@dataclass
class ClassifiedMemory:
    raw: RawMemory
    memory_type: str          # episodic | semantic | procedural | social | preferential
    summary: str
    importance: int           # 0–10
    tags: List[str]


# ── Metadata Formatting ───────────────────────────────────────────────────────

def format_memory_for_cognee(raw: RawMemory, classified: dict) -> str:
    """
    Format a raw memory as structured text so Cognee's LLM extractor
    parses the metadata (platform, type, importance, tags, timestamp)
    into graph nodes and edges automatically.

    Example extracted entities:
      - Node: "gmail" (type: platform)
      - Node: "episodic" (type: memory_type)
      - Node: "Sarah" (type: person) — from content
      - Edge: "Sarah" → mentioned_in → Memory
      - Edge: Memory → from_platform → "gmail"
      - Edge: Memory → has_importance → "9"
    """
    tags = ", ".join(classified.get("tags", []))
    return f"""[Memory Record]
Source Platform: {raw.source}
Memory Type: {classified['type']}
Importance Score: {classified['importance']}/10
Recorded At: {raw.timestamp.isoformat()}
Tags: {tags}
Summary: {classified['summary']}
Provenance Hash: {provenance_hash(raw.content)}
URL: {raw.url or 'N/A'}
Full Content:
{raw.content}
"""


def provenance_hash(content: str) -> str:
    return "0x" + hashlib.sha256(content.encode()).hexdigest()


# ── Async Cognee Lifecycle Wrappers ───────────────────────────────────────────

async def cognee_remember(
    memories: List[RawMemory],
    user_id: str,
    batch_size: int = 20
) -> int:
    """
    Ingest a list of RawMemory objects into Cognee's knowledge graph.
    Each user gets their own dataset (namespace isolation).

    Args:
        memories: List of RawMemory objects to ingest
        user_id:  Dataset name (equivalent to Pinecone namespace)
        batch_size: Number of memories to pass per batch (Cognee handles internal batching)

    Returns:
        Number of successfully ingested memories
    """
    from ingestion.synthesis import classify_memory  # re-use existing classifier

    total = 0
    for raw in memories:
        try:
            classified = classify_memory(raw)
            structured_text = format_memory_for_cognee(raw, classified)

            await cognee.remember(
                structured_text,
                dataset_name=user_id,
                self_improvement=True,   # runs improve() in background for graph enrichment
                run_in_background=False  # sequential for demo stability; set True for prod
            )
            total += 1
            if total % 5 == 0:
                print(f"   ✅ Ingested {total} memories into Cognee graph (dataset={user_id})")
        except Exception as e:
            print(f"   ⚠️ {raw.source}: {e}")
    print(f" ✅ Done: {total} memories for {user_id} into Cognee graph")
    return total


async def cognee_recall(
    query: str,
    user_id: str,
    memory_type: Optional[str] = None,
    platform: Optional[str] = None,
    top_k: int = 15
) -> List[Dict[str, Any]]:
    """
    Query the Cognee knowledge graph for a user's memories.
    Auto-routes between semantic search and graph traversal.

    Args:
        query: Natural language query
        user_id: Dataset name (user namespace)
        memory_type: Optional filter (episodic, semantic, etc.) — passed as node_name hint
        platform: Optional filter (gmail, github, etc.) — passed as node_name hint
        top_k: Max results to return

    Returns:
        List of result dicts with content, source, score, and graph path info
    """
    node_name_hints = []
    if memory_type and memory_type != "all":
        node_name_hints.append(memory_type)
    if platform and platform != "all":
        node_name_hints.append(platform)

    results = await cognee.recall(
        query,
        datasets=[user_id],
        auto_route=True,              # Cognee picks best search strategy
        top_k=top_k,
        node_name=node_name_hints or None,
        node_name_filter_operator="OR",
        only_context=False,           # return full enriched results, not just context
    )

    # Normalize Cognee results into our legacy MCP response format
    normalized = []
    for r in results:
        # Cognee results are RecallResponse objects with various fields
        normalized.append({
            "content": getattr(r, "text", getattr(r, "content", str(r))),
            "summary": getattr(r, "summary", ""),
            "source": getattr(r, "source", getattr(r, "metadata", {}).get("platform", "unknown")),
            "type": getattr(r, "memory_type", getattr(r, "metadata", {}).get("memory_type", "semantic")),
            "timestamp": getattr(r, "timestamp", datetime.utcnow().isoformat()),
            "score": getattr(r, "score", getattr(r, "relevance", 0.95)),
            "graph_path": getattr(r, "graph_path", None),  # Cognee may expose traversal path
        })
    return normalized


async def cognee_improve(user_id: str) -> None:
    """
    Run Cognee improve() on a user's dataset to enrich the graph,
    prune stale nodes, and adapt weights based on feedback.
    """
    await cognee.improve(
        dataset=user_id,
        build_global_context_index=True
    )
    print(f" ✅ Graph improved for dataset={user_id}")


async def cognee_forget(user_id: str, memory_only: bool = True) -> dict:
    """
    Surgically delete a user's graph memory (GDPR erasure support).
    """
    result = await cognee.forget(
        dataset=user_id,
        memory_only=memory_only
    )
    print(f" ✅ Forgot dataset={user_id}: {result}")
    return result


async def cognee_stats(user_id: str) -> dict:
    """
    Get graph statistics for a user's dataset.
    """
    try:
        # Cognee doesn't expose a direct stats API yet, so we approximate
        # by running a broad recall query and inspecting metadata
        # In production, this should query the underlying graph DB directly
        return {
            "dataset": user_id,
            "engine": "cognee",
            "graph_db": os.getenv("GRAPH_DATABASE_PROVIDER", "ladybug"),
            "vector_db": os.getenv("VECTOR_DB_PROVIDER", "lancedb"),
            "note": "Cognee graph stats available via underlying DB adapters (future enhancement)"
        }
    except Exception as e:
        return {"dataset": user_id, "error": str(e)}


# ── Sync Wrappers for Non-Async Callers ───────────────────────────────────────

def run_cognee_remember(memories: List[RawMemory], user_id: str) -> int:
    return asyncio.run(cognee_remember(memories, user_id))


def run_cognee_recall(query: str, user_id: str, **kwargs) -> List[Dict[str, Any]]:
    return asyncio.run(cognee_recall(query, user_id, **kwargs))


def run_cognee_improve(user_id: str) -> None:
    asyncio.run(cognee_improve(user_id))


def run_cognee_forget(user_id: str, memory_only: bool = True) -> dict:
    return asyncio.run(cognee_forget(user_id, memory_only))
