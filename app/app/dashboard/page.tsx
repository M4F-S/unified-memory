"use client";
import { useEffect, useState } from "react";
import { getMemoryStats, MOCK_MEMORY_STATS } from "@/lib/api";

interface QueryLog {
  id: number;
  query: string;
  platform: string;
  type: string;
  cost: number;
  timestamp: string;
  status: "success" | "blocked" | "pending";
}

const DEMO_QUERIES: QueryLog[] = [
  { id: 1, query: "What have I worked on most intensively this week?", platform: "all", type: "episodic", cost: 0.001, timestamp: "2 min ago", status: "success" },
  { id: 2, query: "Who are the most important people in my professional life?", platform: "all", type: "social", cost: 0.001, timestamp: "5 min ago", status: "success" },
  { id: 3, query: "Describe my personality and values", platform: "all", type: "semantic", cost: 0.001, timestamp: "8 min ago", status: "success" },
  { id: 4, query: "What emails did I receive today?", platform: "gmail", type: "episodic", cost: 0, timestamp: "1 min ago", status: "blocked" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(MOCK_MEMORY_STATS.result);
  const [live, setLive] = useState(false);

  useEffect(() => {
    getMemoryStats("demo-token-001").then((r) => {
      if (r.ok && r.data?.result) {
        setStats(r.data.result);
        setLive(true);
      }
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) setTimeout(() => e.target.classList.add("visible"), i * 50);
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".blur-reveal").forEach((el) => observer.observe(el));
    requestAnimationFrame(() => {
      document.querySelectorAll(".blur-reveal").forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setTimeout(() => el.classList.add("visible"), i * 50);
        }
      });
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="pt-24 px-6 pb-24 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10 blur-reveal">
        <div>
          <h1 className="text-4xl font-extrabold mb-2">Live <span className="gradient-text">Dashboard</span></h1>
          <p className="text-um-text-secondary">Real-time query log, balances, and NFT status.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${live ? "bg-emerald-400 animate-pulse" : "bg-um-muted"}`} />
          <span className="text-xs text-um-muted">{live ? "Live" : "Demo Data"}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Memories", value: stats.total_memories?.toLocaleString() ?? "847" },
          { label: "Queries Used", value: `${stats.queries_used ?? 3} / ${(stats.queries_used ?? 3) + (stats.queries_remaining ?? 17)}` },
          { label: "USDC Spent", value: `$${(stats.usdc_spent ?? 0.003).toFixed(3)}` },
          { label: "USDC Remaining", value: `$${(stats.usdc_remaining ?? 0.497).toFixed(3)}` },
        ].map((s, i) => (
          <div key={s.label} className="glass-card p-5 blur-reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
            <div className="text-xs text-um-muted mb-1">{s.label}</div>
            <div className="text-2xl font-extrabold gradient-text">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Log */}
        <div className="lg:col-span-2 glass-card p-6 blur-reveal" style={{ transitionDelay: "0.1s" }}>
          <h3 className="font-bold mb-4">Query Log</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin pr-2">
            {DEMO_QUERIES.map((q) => (
              <div key={q.id} className="flex items-start gap-3 p-3 rounded-xl border border-um-border" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${q.status === "success" ? "bg-emerald-400" : q.status === "blocked" ? "bg-red-400" : "bg-um-muted"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-um-text truncate">{q.query}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-um-border text-um-muted">{q.platform}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-um-border text-um-muted">{q.type}</span>
                    <span className="text-[10px] text-um-muted">{q.timestamp}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xs font-bold ${q.status === "blocked" ? "text-red-400" : "text-um-primary"}`}>
                    {q.status === "blocked" ? "BLOCKED" : `-$${q.cost.toFixed(3)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6 blur-reveal" style={{ transitionDelay: "0.15s" }}>
            <h3 className="font-bold mb-4">NFT Status</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3 h-3 rounded-full ${stats.nft_status === "active" ? "bg-emerald-400 animate-pulse-glow" : "bg-red-400"}`} />
              <span className={`font-bold ${stats.nft_status === "active" ? "text-emerald-400" : "text-red-400"}`}>
                {stats.nft_status?.toUpperCase() ?? "ACTIVE"}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-um-muted">Token</span><span className="font-mono">#001</span></div>
              <div className="flex justify-between"><span className="text-um-muted">Agent</span><span className="font-mono">demo-agent.testnet</span></div>
              <div className="flex justify-between"><span className="text-um-muted">Expires</span><span>{stats.expires_at ? new Date(stats.expires_at).toLocaleString() : "2026-06-22 12:00"}</span></div>
            </div>
          </div>

          <div className="glass-card p-6 blur-reveal" style={{ transitionDelay: "0.2s" }}>
            <h3 className="font-bold mb-4">Memory by Platform</h3>
            <div className="space-y-2.5">
              {[
                { name: "Gmail", count: 847, pct: 28 },
                { name: "YouTube", count: 4200, pct: 14 },
                { name: "Spotify", count: 1240, pct: 10 },
                { name: "GitHub", count: 312, pct: 8 },
                { name: "Slack", count: 560, pct: 6 },
              ].map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-um-muted">{p.name}</span>
                    <span className="text-um-text-secondary">{p.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(160,130,230,0.12)" }}>
                    <div className="h-full rounded-full bg-um-primary" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
