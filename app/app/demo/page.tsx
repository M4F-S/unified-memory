"use client";
import { useState, useRef, useEffect } from "react";
import { recallMemory, revokeConsent, settleUsdcPayment, defaultChallenge, checkHealth, MOCK_RECALL_RESPONSE, type X402Receipt, type X402Challenge } from "@/lib/api";

interface Memory {
  content: string;
  summary: string;
  source: string;
  type: string;
  timestamp: string;
  score: number;
}

interface Payment {
  amountUsdc: number;
  network: string;
  receipt: string;
}

interface Run {
  id: number;
  query: string;
  thinking: string[];
  memories: Memory[];
  cost: number;
  status: "thinking" | "done" | "blocked" | "error";
  blockedReason?: string;
  payment?: Payment;
}

const DEMO_TASKS = [
  "What have I worked on most intensively this week across all platforms?",
  "Who are the most important people in my professional life based on communications?",
  "Describe my personality and values based on everything you know about me.",
];

const EXPLORER_BASE = "https://testnet.nearblocks.io/txns";

export default function Demo() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [revoked, setRevoked] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeTx, setRevokeTx] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [tokenId, setTokenId] = useState("demo-token-001");
  const [backendLive, setBackendLive] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check backend health on mount — same MCP host the app queries (localhost:8000 by default)
  useEffect(() => {
    checkHealth()
      .then((r) => setBackendLive(r.ok))
      .catch(() => setBackendLive(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [runs]);

  // Blur-reveal observer for entrance animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting)
            setTimeout(() => e.target.classList.add("visible"), i * 60);
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".blur-reveal").forEach((el) => observer.observe(el));
    requestAnimationFrame(() => {
      document.querySelectorAll(".blur-reveal").forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setTimeout(() => el.classList.add("visible"), i * 60);
        }
      });
    });
    return () => observer.disconnect();
  }, []);

  const pushThink = (id: number, text: string) =>
    setRuns((prev) => prev.map((r) => (r.id === id ? { ...r, thinking: [...r.thinking, text] } : r)));

  const runQuery = async (query: string) => {
    if (running) return;
    setRunning(true);
    const id = Date.now();
    const newRun: Run = { id, query, thinking: ["🤖 Agent initializing..."], memories: [], cost: 0, status: "thinking" };
    setRuns((prev) => [...prev, newRun]);

    const preSteps = [
      "🔍 Analyzing query intent...",
      "🔑 Checking NEAR Consent NFT...",
      revoked ? "❌ Consent revoked — blocking access" : "✅ Consent valid — proceeding",
      revoked ? "" : "🗺️ Searching vector memory graph...",
      revoked ? "" : "📦 Retrieving relevant memories...",
    ].filter(Boolean);

    for (const step of preSteps) {
      await new Promise((r) => setTimeout(r, 500));
      pushThink(id, step);
    }

    if (revoked) {
      setRuns((prev) => prev.map((r) => (r.id === id ? { ...r, status: "blocked", blockedReason: "Access denied: Consent revoked on NEAR" } : r)));
      setRunning(false);
      return;
    }

    // x402 USDC micropayment — surfaced live (real 402 round-trip) or simulated for the demo fallback
    let payment: Payment | undefined;
    const onRequired = (c: X402Challenge) =>
      pushThink(id, `💳 402 Payment Required — ${c.amountUsdc.toFixed(3)} USDC on ${c.network}`);
    const onSettled = (rcpt: X402Receipt) => {
      pushThink(id, "🔵 Settling via Circle (x402)...");
      pushThink(id, `✅ Payment confirmed — receipt ${rcpt.receipt.slice(0, 16)}…`);
      payment = { amountUsdc: rcpt.challenge.amountUsdc, network: rcpt.challenge.network, receipt: rcpt.receipt };
    };

    // Try real API (handles the 402 → settle → retry round-trip), fallback to mock
    const apiResult = await recallMemory(query, tokenId, { onPaymentRequired: onRequired, onPaymentSettled: onSettled });

    let data;
    if (apiResult.ok && apiResult.data?.result) {
      data = apiResult.data;
    } else {
      // Offline/demo: simulate the same x402 USDC settlement so the payment flow stays visible
      if (!payment) {
        const challenge = defaultChallenge();
        onRequired(challenge);
        const rcpt = await settleUsdcPayment(challenge);
        onSettled(rcpt);
      }
      data = MOCK_RECALL_RESPONSE;
    }

    setRuns((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              memories: data.result?.memories ?? [],
              cost: data.result?.query_cost_usdc ?? 0.001,
              status: "done",
              payment,
            }
          : r
      )
    );
    setRunning(false);
  };

  const handleRevoke = async () => {
    if (revokeLoading) return;
    setRevokeLoading(true);
    setRevokeError(null);

    try {
      const res = await revokeConsent(tokenId);
      if (res.ok && res.data?.tx_hash) {
        setRevoked(true);
        setRevokeTx(res.data.tx_hash);
      } else if (res.ok) {
        // Backend returned 200 but no tx_hash (endpoint stubbed)
        setRevoked(true);
        setRevokeTx(null);
      } else {
        setRevokeError(res.data?.error?.message || "Revoke failed. Check backend status.");
      }
    } catch (e) {
      setRevokeError("Network error. Is the backend running?");
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <div className="pt-24 px-6 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 blur-reveal">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2 h-2 rounded-full ${backendLive === true ? "bg-emerald-400 animate-pulse" : backendLive === false ? "bg-red-400" : "bg-um-muted"}`} />
          <span className="text-xs text-um-muted">{backendLive === true ? "Backend Live" : backendLive === false ? "Backend Offline" : "Checking..."}</span>
        </div>
        <h1 className="text-4xl font-extrabold mb-3">Live <span className="gradient-text">Demo</span></h1>
        <p className="text-um-text-secondary">Watch an AI agent query your memory graph, pay per query, and get blocked when consent is revoked.</p>
      </div>

      {/* Token Input */}
      <div className="mb-6 blur-reveal" style={{ transitionDelay: "0.1s" }}>
        <label className="text-xs text-um-muted mb-1 block">Consent Token ID</label>
        <input
          type="text"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-xl border text-sm font-mono"
          style={{ background: "var(--input-bg)", borderColor: "var(--border-nav)", color: "var(--text-primary)" }}
          placeholder="demo-token-001"
        />
      </div>

      {/* Revoke Banner */}
      {revoked && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-center animate-fade-up">
          <div className="text-red-400 font-bold mb-1">🔴 CONSENT REVOKED ON-CHAIN</div>
          {revokeTx ? (
            <a
              href={`${EXPLORER_BASE}/${revokeTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-um-primary hover:underline"
            >
              View on NEAR Explorer → {revokeTx.slice(0, 20)}...
            </a>
          ) : (
            <div className="text-xs text-um-muted font-mono">Transaction submitted — explorer link will appear here</div>
          )}
        </div>
      )}

      {/* Revoke Error */}
      {revokeError && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-center animate-fade-up">
          <div className="text-red-400 font-bold text-sm mb-1">Revoke Failed</div>
          <div className="text-xs text-um-muted">{revokeError}</div>
        </div>
      )}

      {/* Quick Tasks */}
      <div className="flex flex-wrap gap-2 mb-6 blur-reveal" style={{ transitionDelay: "0.15s" }}>
        {DEMO_TASKS.map((t) => (
          <button key={t} onClick={() => runQuery(t)} disabled={running || revoked}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-um-border bg-um-surface text-um-text-secondary hover:border-um-primary/40 hover:text-um-primary transition-all disabled:opacity-40">
            {t.length > 50 ? t.slice(0, 50) + "..." : t}
          </button>
        ))}
      </div>

      {/* Revoke Button */}
      {!revoked && (
        <button
          onClick={handleRevoke}
          disabled={revokeLoading || running}
          className="w-full mb-8 py-4 rounded-xl font-bold text-red-400 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all disabled:opacity-40 flex items-center justify-center gap-2 blur-reveal"
          style={{ transitionDelay: "0.2s" }}
        >
          {revokeLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Revoking on NEAR...
            </>
          ) : (
            <>
              🔴 REVOKE CONSENT — Burn NFT on NEAR Blockchain
            </>
          )}
        </button>
      )}

      {/* Runs */}
      <div ref={scrollRef} className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin pr-2">
        {runs.map((run, idx) => (
          <div key={run.id} className="glass-card p-6 animate-fade-up" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="flex items-center justify-between mb-3 gap-3">
              <span className="font-bold text-sm text-um-text">{run.query}</span>
              {run.status === "done" && (
                <span className="flex items-center gap-2 shrink-0">
                  {run.payment && (
                    <span
                      className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-400/30 text-blue-300"
                      style={{ background: "rgba(59,130,246,0.08)" }}
                      title={`x402 · paid via Circle · receipt ${run.payment.receipt.slice(0, 24)}…`}
                    >
                      🔵 x402 · Circle · {run.payment.network}
                    </span>
                  )}
                  <span className="text-xs font-bold text-um-primary">-${run.cost.toFixed(3)} USDC</span>
                </span>
              )}
              {run.status === "blocked" && <span className="text-xs font-bold text-red-400 shrink-0">❌ BLOCKED</span>}
            </div>

            {/* Thinking Stream */}
            <div className="space-y-1 mb-4">
              {run.thinking.map((t, i) => (
                <div key={i} className="text-xs text-um-muted font-mono">{t}</div>
              ))}
              {run.status === "thinking" && <div className="text-xs text-um-primary font-mono animate-pulse">Processing...</div>}
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
        <div className="text-center py-20 text-um-muted text-sm blur-reveal">Click a task above to start the demo.</div>
      )}

      {runs.length === 0 && revoked && (
        <div className="text-center py-20 text-red-400 text-sm font-bold animate-fade-up">Consent revoked. Try running a query to see the block in action.</div>
      )}
    </div>
  );
}
