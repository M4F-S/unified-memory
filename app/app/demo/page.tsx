"use client";
import { useState, useRef, useEffect } from "react";
import { recallMemory, MOCK_RECALL_RESPONSE, MOCK_REVOKED_RESPONSE } from "@/lib/api";

interface Memory {
  content: string;
  summary: string;
  source: string;
  type: string;
  timestamp: string;
  score: number;
}

interface Run {
  id: number;
  query: string;
  thinking: string[];
  memories: Memory[];
  cost: number;
  status: "thinking" | "done" | "blocked" | "error";
  blockedReason?: string;
}

const DEMO_TASKS = [
  "What have I worked on most intensively this week across all platforms?",
  "Who are the most important people in my professional life based on communications?",
  "Describe my personality and values based on everything you know about me.",
];

export default function Demo() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [revoked, setRevoked] = useState(false);
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [runs]);

  const runQuery = async (query: string) => {
    if (running) return;
    setRunning(true);
    const id = Date.now();
    const newRun: Run = { id, query, thinking: ["Agent initializing..."], memories: [], cost: 0, status: "thinking" };
    setRuns((prev) => [...prev, newRun]);

    const thinkingSteps = [
      "Analyzing query intent...",
      "Checking NEAR Consent NFT...",
      revoked ? "Consent revoked - blocking access" : "Consent valid - proceeding",
      revoked ? "" : "Searching vector memory graph...",
      revoked ? "" : "Retrieving relevant memories...",
      revoked ? "" : "Calculating query cost...",
    ].filter(Boolean);

    for (let i = 0; i < thinkingSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setRuns((prev) => prev.map((r) => (r.id === id ? { ...r, thinking: [...r.thinking, thinkingSteps[i]] } : r)));
    }

    if (revoked) {
      setRuns((prev) => prev.map((r) => (r.id === id ? { ...r, status: "blocked", blockedReason: "Access denied: Consent revoked" } : r)));
      setRunning(false);
      return;
    }

    // Try real API, fallback to mock
    const apiResult = await recallMemory(query, "demo-token-001");
    const data = apiResult.ok && apiResult.data?.result ? apiResult.data : MOCK_RECALL_RESPONSE;

    setRuns((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              memories: data.result?.memories ?? [],
              cost: data.result?.query_cost_usdc ?? 0.001,
              status: "done",
            }
          : r
      )
    );
    setRunning(false);
  };

  return (
    <div className="pt-24 px-6 pb-24 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-3">Live <span className="gradient-text">Demo</span></h1>
        <p className="text-um-text-secondary">Watch an AI agent query your memory graph, pay per query, and get blocked when consent is revoked.</p>
      </div>

      {/* Revoke Banner */}
      {revoked && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-center">
          <div className="text-red-400 font-bold mb-1">CONSENT REVOKED ON-CHAIN</div>
          <div className="text-xs text-um-muted font-mono">NEAR Testnet - Block #87,432,910 - All access permanently blocked</div>
        </div>
      )}

      {/* Quick Tasks */}
      <div className="flex flex-wrap gap-2 mb-6">
        {DEMO_TASKS.map((t) => (
          <button key={t} onClick={() => runQuery(t)} disabled={running || revoked}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-um-border bg-um-surface text-um-text-secondary hover:border-um-primary/40 hover:text-um-primary transition-all disabled:opacity-40">
            {t.length > 50 ? t.slice(0, 50) + "..." : t}
          </button>
        ))}
      </div>

      {/* Revoke Button */}
      {!revoked && (
        <button onClick={() => setRevoked(true)} disabled={running}
          className="w-full mb-8 py-4 rounded-xl font-bold text-red-400 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all disabled:opacity-40">
          REVOKE CONSENT - Burn NFT on NEAR Blockchain
        </button>
      )}

      {/* Runs */}
      <div ref={scrollRef} className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin pr-2">
        {runs.map((run) => (
          <div key={run.id} className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-um-text">{run.query}</span>
              {run.status === "done" && <span className="text-xs font-bold text-um-primary">-${run.cost.toFixed(3)} USDC</span>}
              {run.status === "blocked" && <span className="text-xs font-bold text-red-400">BLOCKED</span>}
            </div>

            {/* Thinking Stream */}
            <div className="space-y-1 mb-4">
              {run.thinking.map((t, i) => (
                <div key={i} className="text-xs text-um-muted font-mono">{`>`} {t}</div>
              ))}
              {run.status === "thinking" && <div className="text-xs text-um-primary font-mono animate-pulse">{`>`} Processing...</div>}
            </div>

            {/* Blocked State */}
            {run.status === "blocked" && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <div className="text-red-400 font-bold text-sm mb-1">{run.blockedReason}</div>
                <div className="text-xs text-um-muted">This agent can no longer access your memory. The revocation is permanently recorded on the NEAR blockchain.</div>
              </div>
            )}

            {/* Memories */}
            {run.memories.length > 0 && (
              <div className="space-y-3">
                {run.memories.map((m, i) => (
                  <div key={i} className="p-4 rounded-xl border border-um-border" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-um-border text-um-muted">{m.source}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-um-border text-um-muted">{m.type}</span>
                      <span className="text-[10px] text-um-muted">{(m.score * 100).toFixed(0)}% match</span>
                    </div>
                    <div className="text-sm text-um-text mb-1">{m.summary}</div>
                    <div className="text-xs text-um-muted">{m.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {runs.length === 0 && !revoked && (
        <div className="text-center py-20 text-um-muted text-sm">Click a task above or type a query to start the demo.</div>
      )}

      {runs.length === 0 && revoked && (
        <div className="text-center py-20 text-red-400 text-sm font-bold">Consent has been revoked. Try running a query to see the block in action.</div>
      )}
    </div>
  );
}
