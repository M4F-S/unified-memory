"use client";
import { useState, useEffect } from "react";
import { mintConsent, getConsentStatus } from "@/lib/api";

const PLATFORMS = [
  "Gmail", "GitHub", "Spotify", "ChatGPT", "Slack", "Notion",
  "Twitter", "LinkedIn", "Instagram", "WhatsApp", "Discord", "YouTube",
  "Apple Health", "Reddit", "Telegram"
];
const MEMORY_TYPES = ["Episodic", "Semantic", "Procedural", "Social", "Preferential"];

export default function Consent() {
  const [agentId, setAgentId] = useState("demo-agent.testnet");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Gmail", "GitHub", "Spotify", "ChatGPT", "Slack", "Notion"]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Episodic", "Semantic", "Procedural", "Social", "Preferential"]);
  const [maxQueries, setMaxQueries] = useState(100);
  const [maxUsdc, setMaxUsdc] = useState(1.0);
  const [expiresDays, setExpiresDays] = useState(1);
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [mintTx, setMintTx] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [activeTokens, setActiveTokens] = useState<{ id: string; agent: string; expires: string }[]>([
    { id: "001", agent: "demo-agent.testnet", expires: "2026-06-22" }
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) setTimeout(() => e.target.classList.add("visible"), i * 60);
        });
      },
      { threshold: 0.1 }
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

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };
  const toggleType = (t: string) => {
    setSelectedTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const handleMint = async () => {
    if (minting) return;
    setMinting(true);
    setMintError(null);
    try {
      const res = await mintConsent({
        agent_id: agentId,
        allowed_platforms: selectedPlatforms.map((p) => p.toLowerCase().replace(" ", "_")),
        allowed_memory_types: selectedTypes.map((t) => t.toLowerCase()),
        max_queries: maxQueries,
        max_usdc_budget: maxUsdc,
        expires_days: expiresDays,
      });
      if (res.ok && res.data?.token_id) {
        setMinted(true);
        setMintTx(res.data.tx_hash || null);
        setActiveTokens((prev) => [...prev, { id: res.data.token_id, agent: agentId, expires: new Date(Date.now() + expiresDays * 86400000).toISOString().slice(0, 10) }]);
      } else if (res.ok) {
        setMinted(true);
      } else {
        setMintError(res.data?.error?.message || "Mint failed. Backend endpoint not ready.");
      }
    } catch (e) {
      setMintError("Network error. Is the backend running?");
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="pt-24 px-6 pb-24 max-w-4xl mx-auto">
      <div className="mb-10 blur-reveal">
        <h1 className="text-4xl font-extrabold mb-3">Manage <span className="gradient-text">consent</span></h1>
        <p className="text-um-text-secondary">Mint and revoke Consent NFTs on NEAR. Your agent access, your rules.</p>
      </div>

      {/* Mint Section */}
      <div className="glass-card p-6 mb-8 blur-reveal" style={{ transitionDelay: "0.05s" }}>
        <h2 className="font-bold text-lg mb-5">Mint a Consent NFT</h2>

        {/* Agent ID */}
        <div className="mb-5">
          <label className="text-xs text-um-muted mb-1.5 block">Agent ID</label>
          <input
            type="text" value={agentId} onChange={(e) => setAgentId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm font-mono bg-um-input-bg"
            style={{ borderColor: "var(--border-nav)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Platforms */}
        <div className="mb-5">
          <label className="text-xs text-um-muted mb-2 block">Allowed Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button key={p} onClick={() => togglePlatform(p)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  selectedPlatforms.includes(p)
                    ? "bg-um-primary/15 text-um-primary border-um-primary/30"
                    : "bg-transparent text-um-muted border-um-border hover:border-um-primary/30"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Memory Types */}
        <div className="mb-5">
          <label className="text-xs text-um-muted mb-2 block">Allowed Memory Types</label>
          <div className="flex flex-wrap gap-2">
            {MEMORY_TYPES.map((t) => (
              <button key={t} onClick={() => toggleType(t)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  selectedTypes.includes(t)
                    ? "bg-um-primary/15 text-um-primary border-um-primary/30"
                    : "bg-transparent text-um-muted border-um-border hover:border-um-primary/30"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs text-um-muted mb-1.5 block">MAX QUERIES: {maxQueries}</label>
            <input type="range" min={1} max={1000} value={maxQueries} onChange={(e) => setMaxQueries(Number(e.target.value))}
              className="w-full accent-um-primary" />
          </div>
          <div>
            <label className="text-xs text-um-muted mb-1.5 block">MAX USDC BUDGET: ${maxUsdc.toFixed(2)}</label>
            <input type="range" min={0.1} max={10} step={0.1} value={maxUsdc} onChange={(e) => setMaxUsdc(Number(e.target.value))}
              className="w-full accent-um-primary" />
          </div>
          <div>
            <label className="text-xs text-um-muted mb-1.5 block">EXPIRES IN: {expiresDays} DAY(S)</label>
            <input type="range" min={1} max={30} value={expiresDays} onChange={(e) => setExpiresDays(Number(e.target.value))}
              className="w-full accent-um-primary" />
          </div>
        </div>

        {/* Mint Button */}
        <button onClick={handleMint} disabled={minting}
          className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          {minting ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Minting on NEAR...
            </>
          ) : (
            "💎 Mint Consent NFT on NEAR"
          )}
        </button>

        {/* Mint Success / Error */}
        {minted && (
          <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center animate-fade-up">
            <div className="text-emerald-400 font-bold mb-1">✅ Consent NFT Minted!</div>
            {mintTx && (
              <a href={`https://testnet.nearblocks.io/txns/${mintTx}`} target="_blank" rel="noopener noreferrer"
                className="text-xs font-mono text-um-primary hover:underline">
                View on Explorer → {mintTx.slice(0, 20)}...
              </a>
            )}
          </div>
        )}
        {mintError && (
          <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-center animate-fade-up">
            <div className="text-red-400 font-bold text-sm mb-1">Mint Failed</div>
            <div className="text-xs text-um-muted">{mintError}</div>
          </div>
        )}
      </div>

      {/* Active Tokens */}
      <div className="glass-card p-6 mb-8 blur-reveal" style={{ transitionDelay: "0.1s" }}>
        <h2 className="font-bold text-lg mb-4">Active Consent NFTs</h2>
        {activeTokens.length === 0 ? (
          <div className="text-sm text-um-muted">No active tokens. Mint one above.</div>
        ) : (
          <div className="space-y-3">
            {activeTokens.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-um-border" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div>
                  <div className="text-sm font-bold text-um-text">Token #{t.id}</div>
                  <div className="text-xs text-um-muted font-mono">{t.agent}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-400 font-bold">ACTIVE</div>
                  <div className="text-[10px] text-um-muted">Expires {t.expires}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* What is Consent NFT */}
      <div className="glass-card p-6 blur-reveal" style={{ transitionDelay: "0.15s" }}>
        <h3 className="font-bold mb-3">What is a Consent NFT?</h3>
        <p className="text-sm text-um-text-secondary leading-relaxed">
          A Consent NFT is a non-fungible token on the NEAR blockchain that acts as a smart-contract-based permission slip.
          It defines exactly what an AI agent can access: which platforms, which memory types, how many queries, and how much budget.
          You can revoke it anytime by burning the NFT — and the agent loses access instantly. Immutable proof. Total control.
        </p>
      </div>
    </div>
  );
}
