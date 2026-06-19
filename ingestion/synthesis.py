# ingestion/synthesis.py
# Memory classification and embedding pipeline
# Converts raw platform data into structured, searchable vector memories

import os, json, hashlib
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from openai import OpenAI
from pinecone import Pinecone

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME", "unified-memory"))

@dataclass
class RawMemory:
    content: str
    timestamp: datetime
    source: str
    url: Optional[str] = None
    metadata: dict = field(default_factory=dict)

@dataclass
class SynthesizedMemory:
    content: str
    summary: str
    memory_type: str   # episodic|semantic|procedural|social|preferential
    importance: int    # 0-10
    tags: List[str]
    platform: str
    timestamp: datetime
    embedding: List[float]
    provenance_hash: str

CLASSIFIER_PROMPT = """
You are a memory classification engine for a personal AI memory system.

Given raw data from a user's digital life, classify it and extract structured info.

Memory types:
- episodic: specific events, meetings, conversations with timestamps
- semantic: facts, knowledge, skills, professional expertise the user has
- procedural: how the user does things, workflows, habits, routines
- social: relationships, communication patterns, important people in their life
- preferential: preferences, values, opinions, decisions, tastes

Return ONLY valid JSON:
{
  "type": "episodic|semantic|procedural|social|preferential",
  "summary": "1-2 sentence clean summary of this memory",
  "importance": 0-10,
  "tags": ["tag1", "tag2", "tag3"]
}

Important: importance 8-10 = life events, key skills, important relationships
importance 4-7 = regular activities, preferences
importance 0-3 = trivial/routine
"""

def classify_memory(raw: RawMemory) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": CLASSIFIER_PROMPT},
            {"role": "user", "content": f"Platform: {raw.source}\nTimestamp: {raw.timestamp}\nContent: {raw.content[:2000]}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.1
    )
    return json.loads(response.choices[0].message.content)

def get_embedding(text: str) -> List[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text[:8000]
    )
    return response.data[0].embedding

def provenance_hash(content: str) -> str:
    return "0x" + hashlib.sha256(content.encode()).hexdigest()

def synthesize_batch(memories: List[RawMemory], user_id: str, batch_size: int = 50) -> int:
    """Synthesize a batch of raw memories and upsert to Pinecone."""
    total_upserted = 0
    vectors = []

    for raw in memories:
        try:
            classified = classify_memory(raw)
            embedding = get_embedding(classified["summary"])
            ph = provenance_hash(raw.content)
            vector_id = f"{user_id}-{raw.source}-{ph[:16]}"

            vectors.append({
                "id": vector_id,
                "values": embedding,
                "metadata": {
                    "user_id": user_id,
                    "content": raw.content[:1000],
                    "summary": classified["summary"],
                    "memory_type": classified["type"],
                    "platform": raw.source,
                    "timestamp": raw.timestamp.isoformat(),
                    "importance": classified["importance"],
                    "tags": classified["tags"],
                    "provenance_hash": ph,
                    "url": raw.url or ""
                }
            })

            # Upsert in batches of 100
            if len(vectors) >= batch_size:
                index.upsert(vectors=vectors, namespace=user_id)
                total_upserted += len(vectors)
                print(f"  ✅ Upserted {total_upserted} memories...")
                vectors = []

        except Exception as e:
            print(f"  ⚠️  Failed to synthesize memory from {raw.source}: {e}")
            continue

    # Upsert remaining
    if vectors:
        index.upsert(vectors=vectors, namespace=user_id)
        total_upserted += len(vectors)

    print(f"  ✅ Total synthesized: {total_upserted} memories for user {user_id}")
    return total_upserted

def load_demo_memories(user_id: str = "demo-user"):
    """Load synthetic demo memories for hackathon demo."""
    from datetime import timedelta
    now = datetime.now()

    demo_data = [
        RawMemory("Committed NEAR ConsentNFT contract — unified memory hackathon Berlin", now - timedelta(hours=2), "github"),
        RawMemory("Email from Sarah: pitch deadline is Sunday noon, make sure demo works!", now - timedelta(days=1), "gmail"),
        RawMemory("User expertise: NEAR blockchain, Python, AI agents, Web3 infrastructure, Cloudflare Workers", now - timedelta(days=30), "github"),
        RawMemory("Listened to 4 hours of lofi hip hop focus music during all-night hackathon coding session", now - timedelta(hours=5), "spotify"),
        RawMemory("ChatGPT conversation: designed MCP server architecture, discussed x402 payment flow for memory queries", now - timedelta(days=2), "chatgpt"),
        RawMemory("Top contacts this week: Sarah (PM), Alex (co-founder), Bayram (backend dev) — daily Slack messages", now - timedelta(days=1), "slack"),
        RawMemory("GitHub PR merged: add Pinecone vector search to memory synthesis pipeline — 847 lines changed", now - timedelta(hours=6), "github"),
        RawMemory("User prefers dark mode, vim keybindings, TypeScript over JavaScript, Python for data pipelines", now - timedelta(days=60), "notion"),
        RawMemory("Deployed Cloudflare Worker mcp-server.js to production — endpoint live at mcp.unified-memory.workers.dev", now - timedelta(hours=3), "github"),
        RawMemory("Email to team: we need to load demo data before 10 AM, NEAR contract must be on testnet tonight", now - timedelta(hours=8), "gmail"),
        RawMemory("Discord message: great progress on x402 integration, Circle testnet wallet funded with 10 USDC", now - timedelta(hours=4), "discord"),
        RawMemory("Watched: Web3 tutorial on NEAR JS SDK, EAS attestation guide, Circle programmable wallets quickstart", now - timedelta(days=3), "youtube"),
        RawMemory("User health: walked 8,234 steps, slept 5.5 hours (hackathon), resting HR 72 bpm", now - timedelta(days=1), "apple_health"),
        RawMemory("Notion notes: UnifiedMemory business model — 0.5% fee on x402 transactions, enterprise SLA tier", now - timedelta(days=4), "notion"),
        RawMemory("Reddit post about GDPR Article 20 data portability — this is the legal mechanism for social media export", now - timedelta(days=10), "reddit"),
        RawMemory("Telegram group: hackathon team coordination, Berlin venue confirmed at 42Berlin campus", now - timedelta(days=5), "telegram"),
        RawMemory("User consistently starts coding at 10 PM, most productive between midnight and 4 AM", now - timedelta(days=20), "github"),
        RawMemory("Close friends: Sarah (met at Web3 Berlin 2025), Alex (co-founder since 2024), Yuki (crypto Twitter)", now - timedelta(days=45), "twitter"),
        RawMemory("Favorite tools: Cursor IDE, Claude Sonnet for code review, GPT-4o for architecture, Wrangler CLI", now - timedelta(days=15), "notion"),
        RawMemory("Spotify: top genres this month — focus beats, Berlin techno, jazz. Top artist: Nils Frahm", now - timedelta(days=2), "spotify"),
        RawMemory("GitHub stars: memorymesh, agentmemoryprotocol, near-sdk-js, circle-sdk, hono, x402-js", now - timedelta(days=7), "github"),
        RawMemory("Email from investor: interested in UnifiedMemory seed round after hackathon, set up call Monday", now - timedelta(hours=1), "gmail"),
        RawMemory("Built Gmail OAuth connector — successfully imported 3,241 emails, synthesized into 847 memories", now - timedelta(hours=7), "github"),
        RawMemory("Claude conversation: reviewed NEAR ConsentNFT contract, suggested adding batch revocation method", now - timedelta(hours=10), "claude"),
        RawMemory("WhatsApp family group: mom's birthday next week, flight to Dubai booked for July 15", now - timedelta(days=3), "whatsapp"),
        RawMemory("Key skill: designed and deployed 3 production AI agent systems, experienced with LangChain and LangGraph", now - timedelta(days=90), "github"),
        RawMemory("Instagram: follows AI/Web3 accounts, posts about hackathons and developer life in Berlin", now - timedelta(days=14), "instagram"),
        RawMemory("LinkedIn: currently open to co-founder roles in AI infrastructure companies, Web3 background", now - timedelta(days=30), "linkedin"),
        RawMemory("Apple Health sleep: average 6.2 hours/night this month, consistently going to bed at 2 AM", now - timedelta(days=5), "apple_health"),
        RawMemory("User decision: chose NEAR over Ethereum for ConsentNFT because of lower gas fees and JS SDK", now - timedelta(days=6), "notion"),
    ]

    print(f"Loading {len(demo_data)} demo memories for user: {user_id}")
    return synthesize_batch(demo_data, user_id)

if __name__ == "__main__":
    load_demo_memories("demo-user")
