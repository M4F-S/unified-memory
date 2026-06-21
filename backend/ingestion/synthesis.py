# ingestion/synthesis.py
# Memory pipeline — uses OpenRouter for all LLM calls
# DeepSeek V3.2 ($0.14/M) for classification, OpenAI embedding via OpenRouter passthrough

import os, json, hashlib
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from openai import OpenAI
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

CLASSIFY_MODEL = os.getenv("OPENROUTER_CLASSIFY_MODEL", "deepseek/deepseek-v3.2")
EMBED_MODEL    = os.getenv("OPENROUTER_EMBED_MODEL",    "openai/text-embedding-3-small")

_openrouter = None
_index = None

def _get_openrouter():
    global _openrouter
    if _openrouter is None:
        _openrouter = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://github.com/M4F-S/unified-memory",
                "X-Title": "UnifiedMemory Hackathon"
            }
        )
    return _openrouter

def _get_index():
    global _index
    if _index is None:
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        _index = pc.Index(os.getenv("PINECONE_INDEX_NAME", "unified-memory"))
    return _index


@dataclass
class RawMemory:
    content: str
    timestamp: datetime
    source: str
    url: Optional[str] = None
    metadata: dict = field(default_factory=dict)


CLASSIFIER_PROMPT = """You are a memory classification engine.

Classify into ONE type:
- episodic: specific events/conversations with timestamps
- semantic: facts, knowledge, skills, expertise
- procedural: workflows, habits, routines
- social: relationships, people, communication patterns
- preferential: preferences, values, opinions, decisions

Return ONLY valid JSON:
{"type":"...","summary":"1-2 sentence summary","importance":0-10,"tags":["tag1","tag2"]}

Importance: 8-10=life events/core skills/close relationships, 4-7=regular, 0-3=trivial"""


def classify_memory(raw: RawMemory) -> dict:
    resp = _get_openrouter().chat.completions.create(
        model=CLASSIFY_MODEL,
        messages=[
            {"role": "system", "content": CLASSIFIER_PROMPT},
            {"role": "user", "content": f"Platform: {raw.source}\nTime: {raw.timestamp}\nContent: {raw.content[:2000]}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.1, max_tokens=150
    )
    return json.loads(resp.choices[0].message.content)


def get_embedding(text: str) -> List[float]:
    resp = _get_openrouter().embeddings.create(model=EMBED_MODEL, input=text[:8000])
    return resp.data[0].embedding


def provenance_hash(content: str) -> str:
    return "0x" + hashlib.sha256(content.encode()).hexdigest()


def synthesize_batch(memories: List[RawMemory], user_id: str, batch_size: int = 50) -> int:
    total, vectors = 0, []
    for raw in memories:
        try:
            classified = classify_memory(raw)
            embedding  = get_embedding(classified["summary"])
            ph         = provenance_hash(raw.content)
            vectors.append({
                "id": f"{user_id}-{raw.source}-{ph[:16]}",
                "values": embedding,
                "metadata": {
                    "user_id": user_id, "content": raw.content[:1000],
                    "summary": classified["summary"], "memory_type": classified["type"],
                    "platform": raw.source, "timestamp": raw.timestamp.isoformat(),
                    "importance": classified["importance"], "tags": classified["tags"],
                    "provenance_hash": ph, "url": raw.url or ""
                }
            })
            if len(vectors) >= batch_size:
                _get_index().upsert(vectors=vectors, namespace=user_id)
                total += len(vectors); vectors = []
                print(f"  ✅ Upserted {total}...")
        except Exception as e:
            print(f"  ⚠️  {raw.source}: {e}")
    if vectors:
        _get_index().upsert(vectors=vectors, namespace=user_id)
        total += len(vectors)
    print(f"  ✅ Done: {total} memories for {user_id}")
    return total


def load_demo_memories(user_id: str = "demo-user"):
    from datetime import timedelta
    now = datetime.now()
    demo_data = [
        RawMemory("Committed NEAR ConsentNFT contract — unified memory hackathon Berlin", now-timedelta(hours=2), "github"),
        RawMemory("Email from Sarah: hackathon deadline Sunday noon, demo must work!", now-timedelta(days=1), "gmail"),
        RawMemory("User expertise: NEAR blockchain, Python, AI agents, Cloudflare Workers", now-timedelta(days=30), "github"),
        RawMemory("Listened to 4h lofi hip hop during all-night hackathon coding session", now-timedelta(hours=5), "spotify"),
        RawMemory("ChatGPT: designed MCP server architecture, x402 payment flow for memory queries", now-timedelta(days=2), "chatgpt"),
        RawMemory("Top contacts: Sarah (PM), Alex (co-founder), Bayram (backend) — daily Slack", now-timedelta(days=1), "slack"),
        RawMemory("GitHub PR merged: Pinecone vector search in memory synthesis — 847 lines", now-timedelta(hours=6), "github"),
        RawMemory("Prefers dark mode, vim keybindings, TypeScript, Python for data pipelines", now-timedelta(days=60), "notion"),
        RawMemory("Deployed Cloudflare Worker mcp-server — live at mcp.unified-memory.workers.dev", now-timedelta(hours=3), "github"),
        RawMemory("Email to team: load demo data before 10 AM, NEAR contract on testnet tonight", now-timedelta(hours=8), "gmail"),
        RawMemory("Discord: x402 integration done, Circle testnet wallet funded 10 USDC", now-timedelta(hours=4), "discord"),
        RawMemory("Watched: NEAR JS SDK, EAS attestation, Circle programmable wallets tutorials", now-timedelta(days=3), "youtube"),
        RawMemory("Health: 8,234 steps, 5.5h sleep (hackathon), resting HR 72 bpm", now-timedelta(days=1), "apple_health"),
        RawMemory("Notion: UnifiedMemory biz model — 0.5% x402 fee + enterprise SLA tier", now-timedelta(days=4), "notion"),
        RawMemory("Reddit: GDPR Article 20 data portability is the legal basis for platform export", now-timedelta(days=10), "reddit"),
        RawMemory("Telegram team: hackathon coordination, Berlin venue at 42Berlin campus confirmed", now-timedelta(days=5), "telegram"),
        RawMemory("Coding pattern: starts 10 PM, peak productivity midnight–4 AM", now-timedelta(days=20), "github"),
        RawMemory("Close contacts: Sarah (Web3 Berlin 2025), Alex (co-founder 2024), Yuki (crypto Twitter)", now-timedelta(days=45), "twitter"),
        RawMemory("Favorite tools: Cursor IDE, Claude for code review, Wrangler CLI, GPT-4o for arch", now-timedelta(days=15), "notion"),
        RawMemory("Spotify: focus beats, Berlin techno, jazz this month. Top artist: Nils Frahm", now-timedelta(days=2), "spotify"),
        RawMemory("GitHub stars: memorymesh, near-sdk-js, circle-sdk, hono, x402-js", now-timedelta(days=7), "github"),
        RawMemory("Email from investor: interested in UnifiedMemory seed round after hackathon", now-timedelta(hours=1), "gmail"),
        RawMemory("Built Gmail connector — imported 3,241 emails, synthesized into 847 memories", now-timedelta(hours=7), "github"),
        RawMemory("Claude: reviewed NEAR ConsentNFT contract, suggested batch revocation method", now-timedelta(hours=10), "claude"),
        RawMemory("WhatsApp family: mom birthday next week, Dubai flight July 15 booked", now-timedelta(days=3), "whatsapp"),
        RawMemory("Key skill: built 3 production AI agent systems, LangChain and LangGraph expert", now-timedelta(days=90), "github"),
        RawMemory("Instagram: follows AI/Web3 accounts, posts hackathon life in Berlin", now-timedelta(days=14), "instagram"),
        RawMemory("LinkedIn: open to co-founder roles in AI infrastructure companies", now-timedelta(days=30), "linkedin"),
        RawMemory("Sleep: avg 6.2h/night this month, consistently sleeping at 2 AM", now-timedelta(days=5), "apple_health"),
        RawMemory("Decision: NEAR over Ethereum for ConsentNFT — lower gas, better JS SDK", now-timedelta(days=6), "notion"),
    ]
    print(f"Loading {len(demo_data)} demo memories for user: {user_id}")
    return synthesize_batch(demo_data, user_id)


if __name__ == "__main__":
    load_demo_memories("demo-user")
