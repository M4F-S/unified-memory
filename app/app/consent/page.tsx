"use client";
import { useState } from "react";

const PLATFORMS = ["Gmail", "GitHub", "Spotify", "ChatGPT", "Slack", "Notion", "Twitter", "LinkedIn", "Instagram", "WhatsApp", "Discord", "YouTube", "Apple Health", "Reddit", "Telegram"];
const MEMORY_TYPES = ["Episodic", "Semantic", "Procedural", "Social", "Preferential"];

export default function Consent() {
  const [agentId, setAgentId] = useState("demo-agent.testnet");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Gmail", "GitHub", "Spotify"]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Episodic", "Semantic"]);
  const [maxQueries, setMaxQueries] = useState(100);
  const [maxBudget, setMaxBudget] = useState(1.0);
  const [expiryDays, setExpiryDays] = useState(1);
  const [minted, setMinted] = useState(false);
  const [revoked, setRevoked] = useState(false);

  const toggle = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  return (
    <div className="pt-24 px-6 pb-24 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold mb-3">Manage <span className="gradient-text">consent</span></h1>
        <p className="text-um-text-secondary">Mint and revoke Consent NFTs on NEAR. Your agent access, your rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mint Form */}
        <div className="glass-card p-7">
          <h2 className="font-bold text-xl mb-6">Mint a Consent NFT</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-um-muted uppercase tracking-wider mb-2">Agent ID</label>
              <input type="text" value={agentId} onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-um-border bg-um-surface text-um-text outline-none focus:border-um-primary transition-colors text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-um-muted uppercase tracking-wider mb-2">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button key={p} onClick={() => toggle(selectedPlatforms, p, setSelectedPlatforms)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedPlatforms.includes(p)
                        ? "bg-um-primary/20 text-um-primary border-um-primary/40"
                        : "bg-um-surface text-um-muted border-um-border hover:border-um-primary/30"
                    }`}>{p}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-um-muted uppercase tracking-wider mb-2">Memory Types</label>
              <div className="flex flex-wrap gap-2">
                {MEMORY_TYPES.map((t) => (
                  <button key={t} onClick={() => toggle(selectedTypes, t, setSelectedTypes)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedTypes.includes(t)
                        ? "bg-um-primary/20 text-um-primary border-um-primary/40"
                        : "bg-um-surface text-um-muted border-um-border hover:border-um-primary/30"
                    }`}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-um-muted uppercase tracking-wider mb-2">Max Queries: {maxQueries}</label>
              <input type="range" min={1} max={1000} value={maxQueries} onChange={(e) => setMaxQueries(Number(e.target.value))}
                className="w-full accent-um-primary" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-um-muted uppercase tracking-wider mb-2">Max USDC Budget: ${maxBudget.toFixed(2)}</label>
              <input type="range" min={0.1} max={10} step={0.1} value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-um-primary" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-um-muted uppercase tracking-wider mb-2">Expires in: {expiryDays} day(s)</label>
              <input type="range" min={1} max={30} value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="w-full accent-um-primary" />
            </div>

            <button onClick={() => setMinted(true)} disabled={minted}
              className={`w-full py-3 rounded-xl font-bold transition-all ${
                minted
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
                  : "btn-primary"
              }`}>
              {minted ? "Minted - Token #001" : "Mint Consent NFT on NEAR"}
            </button>
          </div>
        </div>

        {/* Active NFTs */}
        <div className="space-y-6">
          <div className="glass-card p-7">
            <h2 className="font-bold text-xl mb-5">Active Consent NFTs</h2>
            {minted ? (
              <div className={`p-5 rounded-xl border transition-all ${revoked ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm">Token #001</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${revoked ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                    {revoked ? "REVOKED" : "ACTIVE"}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-um-muted">Agent</span><span className="font-mono text-um-text-secondary">{agentId}</span></div>
                  <div className="flex justify-between"><span className="text-um-muted">Platforms</span><span className="text-um-text-secondary">{selectedPlatforms.join(", ")}</span></div>
                  <div className="flex justify-between"><span className="text-um-muted">Types</span><span className="text-um-text-secondary">{selectedTypes.join(", ")}</span></div>
                  <div className="flex justify-between"><span className="text-um-muted">Queries</span><span className="text-um-text-secondary">{maxQueries} max</span></div>
                  <div className="flex justify-between"><span className="text-um-muted">Budget</span><span className="text-um-text-secondary">${maxBudget.toFixed(2)} USDC</span></div>
                </div>
                {!revoked && (
                  <button onClick={() => setRevoked(true)} className="btn-danger w-full text-center mt-4 text-sm">
                    Revoke Consent (Burn NFT)
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-um-muted text-sm">No active Consent NFTs. Mint one to get started.</div>
            )}
          </div>

          <div className="glass-card p-6">
            <h3 className="font-bold mb-3">What is a Consent NFT?</h3>
            <p className="text-sm text-um-text-secondary leading-relaxed">
              A soulbound token on NEAR blockchain that defines exactly what an AI agent can access.
              It includes platform scope, memory types, query limits, budget caps, and expiry.
              Burn it anytime to revoke access permanently - logged on-chain forever.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
