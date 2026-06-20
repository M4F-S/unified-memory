"use client";
import { useEffect, useRef, useState } from "react";
import { CONNECTORS, mintConsent } from "@/lib/api";
import UploadConnector from "@/components/UploadConnector";
import { useToast } from "@/components/Toast";

// Only ChatGPT is live end-to-end (request export → mint consent → upload →
// agent embeds + enriches into the user's private vault). Everything else is
// flagged "Coming soon".
const LIVE_CONNECTORS = new Set(["chatgpt"]);

// Direct link to ChatGPT's data-export screen. Opening it lands the user on
// Settings → Data Controls, where the "Export data" button lives (they must be
// signed in to ChatGPT first).
const CHATGPT_EXPORT_URL = "https://chatgpt.com/#settings/DataControls";

export default function Onboard() {
  const { toast, update } = useToast();
  const flowRef = useRef<HTMLDivElement>(null);
  const [minting, setMinting] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

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

  function openExport() {
    window.open(CHATGPT_EXPORT_URL, "_blank", "noopener,noreferrer");
    toast({
      title: "ChatGPT export opened",
      description: "Sign in if asked, then click “Export data”. The download link arrives by email.",
      variant: "info",
    });
  }

  function focusFlow() {
    flowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleMint() {
    if (minting) return;
    setMinting(true);
    const id = toast({
      title: "Minting your Consent NFT…",
      description: "Signing the consent token on NEAR testnet.",
      variant: "loading",
    });
    try {
      const res = await mintConsent({
        agent_id: "demo-agent.testnet",
        allowed_platforms: ["chatgpt"],
        allowed_memory_types: ["episodic", "semantic", "procedural", "social", "preferential"],
        max_queries: 100,
        max_usdc_budget: 1.0,
        expires_days: 1,
      });
      if (res.ok && res.data?.token_id != null) {
        update(id, {
          title: `Consent NFT #${res.data.token_id} minted ✅`,
          description: res.data.tx_hash
            ? `On-chain proof recorded. Tx ${String(res.data.tx_hash).slice(0, 14)}…`
            : "Your agent now has consent-controlled access — revocable anytime.",
          variant: "success",
        });
      } else {
        update(id, {
          title: "Mint failed",
          description: res.data?.error || "On-chain signing is unavailable right now.",
          variant: "error",
        });
      }
    } catch {
      update(id, { title: "Mint failed", description: "Network error — is the backend running?", variant: "error" });
    } finally {
      setMinting(false);
    }
  }

  return (
    <div className="pt-24 px-6 pb-24 max-w-6xl mx-auto">
      <div className="mb-10 blur-reveal">
        <h1 className="text-4xl font-extrabold mb-3">Connect your <span className="gradient-text">platforms</span></h1>
        <p className="text-um-text-secondary max-w-2xl">
          Start with ChatGPT. Request your export, mint a Consent NFT, then upload the file — our agent
          embeds and enriches every conversation into your private memory vault.
        </p>
      </div>

      {/* ── ChatGPT guided flow ─────────────────────────────────────────── */}
      <div ref={flowRef} className="glass-card p-6 sm:p-8 mb-12 blur-reveal">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white bg-gradient-to-br from-violet-600 to-cyan-500">
            ✦
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">ChatGPT</h2>
              <span className="text-[10px] font-bold text-[#7c3aed] px-2 py-0.5 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10">LIVE</span>
            </div>
            <p className="text-xs text-um-muted">Three steps to a memory vault built from your ChatGPT history.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Step 1 — Request export */}
          <div className="rounded-2xl border border-um-border p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-extrabold text-[#7c3aed]" style={{ background: "linear-gradient(135deg,#ede9fe,#dbeafe)" }}>1</span>
              <span className="font-bold text-sm">Request your export</span>
            </div>
            <p className="text-xs text-um-text-secondary leading-relaxed mb-4">
              Open ChatGPT and go to <span className="text-um-text font-medium">Settings → Data Controls → Export data</span>.
              You must be <span className="text-um-text font-medium">signed in to ChatGPT</span>. ChatGPT then emails you a
              download link — this can take from a few minutes up to <span className="text-um-text font-medium">a couple of days</span>.
            </p>
            <button
              onClick={openExport}
              className="w-full text-xs font-bold px-4 py-2.5 rounded-lg bg-um-primary/10 text-um-primary border border-um-primary/20 hover:bg-um-primary/20 transition-all"
            >
              Open ChatGPT export page →
            </button>
          </div>

          {/* Step 2 — Mint consent */}
          <div className="rounded-2xl border border-um-border p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-extrabold text-[#7c3aed]" style={{ background: "linear-gradient(135deg,#ede9fe,#dbeafe)" }}>2</span>
              <span className="font-bold text-sm">Mint your Consent NFT</span>
            </div>
            <p className="text-xs text-um-text-secondary leading-relaxed mb-4">
              We mint a <span className="text-um-text font-medium">Consent NFT on NEAR</span> — a smart-contract permission
              slip that defines exactly what an agent may access. It&apos;s your <span className="text-um-text font-medium">on-chain proof
              of consent</span>, and you can revoke it anytime.
            </p>
            <button
              onClick={handleMint}
              disabled={minting}
              className="w-full text-xs font-bold px-4 py-2.5 rounded-lg text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {minting ? "Minting on NEAR…" : "💎 Mint Consent NFT"}
            </button>
          </div>

          {/* Step 3 — Upload */}
          <div className="rounded-2xl border border-um-border p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-extrabold text-[#7c3aed]" style={{ background: "linear-gradient(135deg,#ede9fe,#dbeafe)" }}>3</span>
              <span className="font-bold text-sm">Upload &amp; enrich</span>
            </div>
            <p className="text-xs text-um-text-secondary leading-relaxed mb-4">
              When your export email arrives, upload <span className="text-um-text font-medium">conversations.json</span> or the
              whole <span className="text-um-text font-medium">.zip</span>. Our agent classifies, embeds and enriches every
              conversation into your private vault.
            </p>
            <div className="flex items-center justify-between gap-2">
              <a
                href="/mock/chatgpt-export.json"
                download
                className="text-[11px] font-medium text-um-muted hover:text-um-primary underline underline-offset-2"
              >
                Need a sample? Download a mock export
              </a>
              <UploadConnector platform="chatgpt" accept=".json,.zip" onIngested={(n) => setImported(n)} />
            </div>
            {imported !== null && (
              <div className="mt-3 text-[11px] font-bold text-emerald-400">
                ✓ {imported} {imported === 1 ? "memory" : "memories"} enriched into your vault
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── All platforms ───────────────────────────────────────────────── */}
      <div className="mb-5 blur-reveal">
        <h2 className="font-bold text-xl mb-1">All platforms</h2>
        <p className="text-sm text-um-muted">More connectors are landing soon. ChatGPT is live today.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONNECTORS.map((c, i) => {
          const live = LIVE_CONNECTORS.has(c.platform);
          return (
            <div
              key={c.platform}
              className="glass-card p-5 flex items-center justify-between blur-reveal"
              style={{ transitionDelay: `${i * 0.03}s`, opacity: live ? 1 : 0.6 }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-um-text">{c.label}</span>
                  {live ? (
                    <span className="text-[10px] font-bold text-[#7c3aed] px-2 py-0.5 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10">LIVE</span>
                  ) : (
                    <span className="text-[10px] font-bold text-um-muted px-2 py-0.5 rounded-full border border-um-border">COMING SOON</span>
                  )}
                </div>
                <div className="text-xs text-um-muted">
                  {live ? "Upload your export to import" : "Connector in development"}
                </div>
              </div>
              {live ? (
                <button
                  onClick={focusFlow}
                  className="text-xs font-bold px-4 py-2 rounded-lg bg-um-primary/10 text-um-primary border border-um-primary/20 hover:bg-um-primary/20 transition-all"
                >
                  Connect
                </button>
              ) : (
                <button
                  disabled
                  className="text-xs font-bold px-4 py-2 rounded-lg bg-transparent text-um-muted border border-um-border cursor-not-allowed"
                >
                  Soon
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
