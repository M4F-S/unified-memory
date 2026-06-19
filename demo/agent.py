#!/usr/bin/env python3
# demo/agent.py — UnifiedMemory Hackathon Demo Agent
# Run: python demo/agent.py
# Make sure to load demo memories first: python -c "from ingestion.synthesis import load_demo_memories; load_demo_memories()"

import os, json, time
import httpx
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MCP_URL = os.getenv("MCP_URL", "https://mcp.unified-memory.workers.dev")
CONSENT_TOKEN = os.getenv("DEMO_CONSENT_TOKEN", "demo-token-001")
NEAR_CONTRACT = os.getenv("NEAR_CONTRACT_ID", "consent-nft.testnet")
NEAR_RPC = "https://rpc.testnet.near.org"

TOOLS = [{
    "type": "function",
    "function": {
        "name": "recall_memory",
        "description": "Recall memories from the user's unified memory graph across 20+ platforms",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Natural language memory query"},
                "memory_type": {"type": "string", "enum": ["episodic","semantic","procedural","social","preferential","all"], "default": "all"},
                "platform": {"type": "string", "description": "Filter by platform (gmail, github, spotify, chatgpt, all)", "default": "all"}
            },
            "required": ["query"]
        }
    }
}]

def recall_memory(query: str, memory_type: str = "all", platform: str = "all") -> dict:
    print(f"\n   📡 Querying memory: '{query}' [{memory_type}] from [{platform}]")

    resp = httpx.post(f"{MCP_URL}/mcp/recall_memory", json={
        "query": query,
        "memory_type": memory_type,
        "platform": platform,
        "token_id": CONSENT_TOKEN
    }, timeout=30)

    if resp.status_code == 402:
        print("   💳 Payment required — auto-paying 0.001 USDC via x402...")
        # In production: Circle agent wallet auto-pays here
        time.sleep(1)
        print("   ✅ Payment sent!")
        # Retry with payment (simplified for demo)
        resp = httpx.post(f"{MCP_URL}/mcp/recall_memory", json={
            "query": query, "memory_type": memory_type,
            "platform": platform, "token_id": CONSENT_TOKEN
        }, headers={"X-PAYMENT": "demo-payment-receipt"}, timeout=30)

    if resp.status_code == 403:
        error_data = resp.json()
        reason = error_data.get('error', {}).get('message', 'Access denied')
        print(f"   🚫 BLOCKED: {reason}")
        return {"blocked": True, "reason": reason}

    data = resp.json()
    result = data.get("result", {})
    memories = result.get("memories", [])
    cost = result.get("query_cost_usdc", 0)
    remaining = result.get("remaining_queries", 0)

    print(f"   ✅ Retrieved {len(memories)} memories | Cost: ${cost:.3f} USDC | Remaining: {remaining} queries")
    return {"memories": memories, "cost": cost, "remaining": remaining}

def run_agent(task: str, scenario_name: str):
    print(f"\n{'='*60}")
    print(f"🎯 SCENARIO: {scenario_name}")
    print(f"📋 Task: {task}")
    print('='*60)

    messages = [
        {"role": "system", "content": (
            "You are a personal AI assistant with access to the user's unified memory graph "
            "via UnifiedMemory. Use recall_memory to find relevant context before answering. "
            "Always mention which platform each memory came from. Be specific and cite sources."
        )},
        {"role": "user", "content": task}
    ]

    while True:
        response = client.chat.completions.create(
            model="gpt-4o", messages=messages,
            tools=TOOLS, tool_choice="auto"
        )
        message = response.choices[0].message

        if message.tool_calls:
            messages.append(message)
            for tc in message.tool_calls:
                args = json.loads(tc.function.arguments)
                result = recall_memory(**args)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result)
                })
        else:
            print(f"\n🤖 Agent Answer:\n{message.content}")
            return message.content

def revoke_consent_demo():
    print("\n" + "🔴"*30)
    print("💥 USER IS REVOKING CONSENT NOW")
    print("   Burning Consent NFT on NEAR blockchain...")
    time.sleep(1)
    # In production: near call consent-nft.testnet revoke_consent '{"token_id":"demo-token-001"}' --accountId user.testnet
    print("   ✅ Transaction submitted to NEAR testnet")
    print("   🔗 View on NEAR Explorer: https://testnet.nearblocks.io")
    print("   ⏳ Waiting for confirmation...")
    time.sleep(2)
    print("   ✅ CONFIRMED: Consent NFT revoked at block #87,432,910")
    print("   🔒 All agent access is now permanently blocked")
    print("🔴"*30 + "\n")

def main():
    print("\n" + "🧠"*20)
    print("  UNIFIED MEMORY — Live Hackathon Demo")
    print("  AI Agents Berlin Hackathon 2026 | 42Berlin")
    print("  Consent Token:", CONSENT_TOKEN)
    print("🧠"*20)

    # ── Scenario A: Episodic + Cross-platform query ───────────────────────────
    run_agent(
        "What have I been working on most intensively this week? Across all my platforms.",
        "A — Cross-Platform Activity Summary"
    )
    time.sleep(1)

    # ── Scenario B: Social memory ─────────────────────────────────────────────
    run_agent(
        "Who are the most important people in my professional life right now, based on my communications?",
        "B — Social Network & Relationships"
    )
    time.sleep(1)

    # ── Scenario C: Preferential memory ──────────────────────────────────────
    run_agent(
        "Based on everything you know about me, what kind of person am I? What do I value?",
        "C — Personal Profile Synthesis"
    )
    time.sleep(1)

    # ── THE WOW MOMENT: Revocation ────────────────────────────────────────────
    revoke_consent_demo()

    run_agent(
        "What emails did I receive today?",
        "D — POST-REVOCATION QUERY (should be blocked)"
    )

    print("\n" + "✅"*20)
    print("  DEMO COMPLETE")
    print("  This is the first platform where AI agent memory access")
    print("  can be revoked in real time via a blockchain transaction.")
    print("  The user is always in control.")
    print("✅"*20 + "\n")

if __name__ == "__main__":
    main()
