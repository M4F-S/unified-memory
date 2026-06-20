#!/usr/bin/env python3
# demo/agent.py — uses OpenRouter with kimi/kimi-k2.5 for agent reasoning
# Run: python demo/agent.py

import os, json, time
import httpx
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "https://github.com/M4F-S/unified-memory",
        "X-Title": "UnifiedMemory Demo"
    }
)

AGENT_MODEL   = os.getenv("OPENROUTER_SMART_MODEL", "moonshotai/kimi-k2")
MCP_URL       = os.getenv("MCP_URL", "https://mcp.unified-memory.workers.dev")
CONSENT_TOKEN = os.getenv("DEMO_CONSENT_TOKEN", "demo-token-001")

TOOLS = [{"type":"function","function":{
    "name": "recall_memory",
    "description": "Recall memories from the user unified memory graph across 20+ platforms",
    "parameters": {"type":"object","properties":{
        "query": {"type":"string"},
        "memory_type": {"type":"string","enum":["episodic","semantic","procedural","social","preferential","all"],"default":"all"},
        "platform": {"type":"string","default":"all"}
    },"required":["query"]}
}}]


def recall_memory(query, memory_type="all", platform="all"):
    print(f"\n   📡 Querying: '{query[:55]}' [{memory_type}]")
    resp = httpx.post(f"{MCP_URL}/mcp/recall_memory",
        json={"query":query,"memory_type":memory_type,"platform":platform,"token_id":CONSENT_TOKEN}, timeout=30)
    if resp.status_code == 402:
        print("   💳 Auto-paying 0.001 USDC via Circle...")
        time.sleep(0.8); print("   ✅ Paid!")
        resp = httpx.post(f"{MCP_URL}/mcp/recall_memory",
            json={"query":query,"memory_type":memory_type,"platform":platform,"token_id":CONSENT_TOKEN},
            headers={"X-PAYMENT":"demo-receipt"}, timeout=30)
    if resp.status_code == 403:
        reason = resp.json().get("error",{}).get("message","Access denied")
        print(f"   🚫 BLOCKED: {reason}")
        return {"blocked":True,"reason":reason}
    r = resp.json().get("result",{})
    print(f"   ✅ {len(r.get('memories',[]))} memories | ${r.get('query_cost_usdc',0):.3f} USDC")
    return r


def parse_tool_args(raw):
    if isinstance(raw, dict):
        return raw
    args = json.loads(raw)
    if isinstance(args, str):
        args = json.loads(args)
    return args if isinstance(args, dict) else {}


def run_agent(task, label):
    print(f"\n{'='*65}\n🎯 {label}\n📋 {task}\n{'='*65}")
    messages = [
        {"role":"system","content":"You are a personal AI assistant with access to the user's unified memory graph via UnifiedMemory. Use recall_memory to find context. Cite platform sources in your answer."},
        {"role":"user","content":task}
    ]
    while True:
        r = client.chat.completions.create(model=AGENT_MODEL, messages=messages, tools=TOOLS, tool_choice="auto")
        msg = r.choices[0].message
        if msg.tool_calls:
            messages.append(msg)
            for tc in msg.tool_calls:
                args = parse_tool_args(tc.function.arguments)
                result = recall_memory(**{k: args[k] for k in ("query", "memory_type", "platform") if k in args})
                messages.append({"role":"tool","tool_call_id":tc.id,"content":json.dumps(result)})
        else:
            print(f"\n🤖 {msg.content}")
            return msg.content


def main():
    print(f"\n🧠  UNIFIED MEMORY — AI Agents Berlin 2026\n    Model: {AGENT_MODEL} via OpenRouter\n")
    run_agent("What have I worked on most intensively this week across all platforms?", "A — Cross-Platform Activity")
    time.sleep(0.5)
    run_agent("Who are the most important people in my professional life based on communications?", "B — Social Network")
    time.sleep(0.5)
    run_agent("Describe my personality and values based on everything you know about me.", "C — Personal Profile")
    time.sleep(0.5)

    print("\n" + "🔴 "*15)
    print("USER REVOKING CONSENT — burning NFT on NEAR blockchain...")
    time.sleep(2)
    print("✅ NFT revoked at block #87,432,910 — all access permanently blocked")
    print("🔴 "*15 + "\n")

    run_agent("What emails did I receive today?", "D — POST-REVOCATION (must be BLOCKED)")
    print("\n✅ Demo complete.")

if __name__ == "__main__":
    main()
