# ingestion/cognee_synthesis.py
# Cognee-powered memory synthesis pipeline
# Replaces Pinecone vector upserts with structured knowledge graph ingestion
#
# Usage:
#   uv run python -c "from ingestion.cognee_synthesis import load_demo_memories; load_demo_memories('demo-user')"
#   uv run python -m ingestion.cognee_synthesis --user demo-user

import os
import json
import hashlib
import argparse
from datetime import datetime, timedelta
from typing import List, Optional
from dataclasses import dataclass, field
from openai import OpenAI
from dotenv import load_dotenv

# Import our Cognee bridge
from ingestion.cognee_bridge import (
    RawMemory,
    run_cognee_remember,
    run_cognee_improve,
    provenance_hash,
)

load_dotenv()

CLASSIFY_MODEL = os.getenv("OPENROUTER_CLASSIFY_MODEL", "deepseek/deepseek-v3.2")
EMBED_MODEL = os.getenv("OPENROUTER_EMBED_MODEL", "openai/text-embedding-3-small")

_openrouter = None


def _get_openrouter():
    global _openrouter
    if _openrouter is None:
        _openrouter = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://github.com/M4F-S/unified-memory",
                "X-Title": "UnifiedMemory Cognee Hackathon"
            }
        )
    return _openrouter


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
    """Classify a raw memory using OpenRouter (DeepSeek V3.2)."""
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


def synthesize_batch_cognee(memories: List[RawMemory], user_id: str) -> int:
    """
    Ingest a batch of raw memories into the user's Cognee knowledge graph.
    Replaces the old Pinecone vector upsert pipeline.
    """
    print(f"▶ Synthesizing {len(memories)} memories into Cognee graph for user: {user_id}")
    count = run_cognee_remember(memories, user_id)
    # Optionally enrich the graph after ingestion
    print(f"▶ Running improve() on dataset={user_id} ...")
    run_cognee_improve(user_id)
    return count


def load_demo_memories(user_id: str = "demo-user"):
    """Load the same 30 demo memories from the original pipeline, now into Cognee."""
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
    return synthesize_batch_cognee(demo_data, user_id)


def main():
    parser = argparse.ArgumentParser(description="Ingest memories into Cognee graph.")
    parser.add_argument("--user", required=True, help="user_id / dataset name")
    args = parser.parse_args()
    count = load_demo_memories(args.user)
    print(f"✅ Ingested {count} demo memories into Cognee dataset={args.user}")
    return 0


if __name__ == "__main__":
    exit(main())
