"use client";
import { useEffect } from "react";
import { CONNECTORS } from "@/lib/api";

export default function Onboard() {
  const totalMemories = CONNECTORS.reduce((sum, c) => sum + c.memories, 0);
  const connectedCount = CONNECTORS.filter((c) => c.connected).length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting)
            setTimeout(() => e.target.classList.add("visible"), i * 50);
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
      <div className="mb-10 blur-reveal">
        <h1 className="text-4xl font-extrabold mb-3">Connect your <span className="gradient-text">platforms</span></h1>
        <p className="text-um-text-secondary">Link your digital life sources to build your unified memory graph.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CONNECTORS.map((c, i) => (
            <div key={c.platform} className="glass-card p-5 flex items-center justify-between blur-reveal" style={{ transitionDelay: `${i * 0.03}s` }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-um-text">{c.label}</span>
                  {c.connected ? (
                    <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-400/20 bg-emerald-400/10">CONNECTED</span>
                  ) : (
                    <span className="text-[10px] font-bold text-um-muted px-2 py-0.5 rounded-full border border-um-border">{c.auth}</span>
                  )}
                </div>
                <div className="text-xs text-um-muted">{c.memories.toLocaleString()} memories</div>
              </div>
              <button className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                c.connected
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-um-primary/10 text-um-primary border border-um-primary/20 hover:bg-um-primary/20"
              }`}>
                {c.connected ? "Manage" : "Connect"}
              </button>
            </div>
          ))}
        </div>

        {/* Memory Graph Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6 blur-reveal" style={{ transitionDelay: "0.1s" }}>
            <h3 className="font-bold mb-4">Memory Graph</h3>
            <div className="text-3xl font-extrabold gradient-text mb-1">{totalMemories.toLocaleString()}</div>
            <div className="text-xs text-um-muted mb-5">Total memories synthesized</div>
            <div className="space-y-2.5">
              {[
                { label: "Episodic", pct: 38, count: 3200 },
                { label: "Semantic", pct: 22, count: 1800 },
                { label: "Social", pct: 19, count: 1200 },
                { label: "Preferential", pct: 12, count: 900 },
                { label: "Procedural", pct: 9, count: 700 },
              ].map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-um-muted">{b.label}</span>
                    <span className="text-um-text-secondary">{b.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(160,130,230,0.12)" }}>
                    <div className="h-full rounded-full bg-um-primary" style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 blur-reveal" style={{ transitionDelay: "0.15s" }}>
            <h3 className="font-bold mb-3">Progress</h3>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(160,130,230,0.12)" }}>
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${(connectedCount / CONNECTORS.length) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-um-primary">{Math.round((connectedCount / CONNECTORS.length) * 100)}%</span>
            </div>
            <div className="text-xs text-um-muted">{connectedCount} of {CONNECTORS.length} platforms connected</div>
          </div>
        </div>
      </div>
    </div>
  );
}
