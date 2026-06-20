"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

export default function Home() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".blur-reveal").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="relative">
      {/* Aurora background */}
      <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: "linear-gradient(135deg, #0d0a1a 0%, #140f2d 40%, #0a1020 100%)" }}>
        <div className="absolute rounded-full blur-[80px] opacity-[0.22] animate-orb-float" style={{ width: 700, height: 700, background: "radial-gradient(circle, #c4b5fd, transparent 70%)", top: -200, left: -150, animationDuration: "20s" }} />
        <div className="absolute rounded-full blur-[80px] opacity-[0.22] animate-orb-float" style={{ width: 500, height: 500, background: "radial-gradient(circle, #bae6fd, transparent 70%)", top: "10%", right: -100, animationDuration: "25s", animationDelay: "-5s" }} />
        <div className="absolute rounded-full blur-[80px] opacity-[0.22] animate-orb-float" style={{ width: 600, height: 600, background: "radial-gradient(circle, #f5d0fe, transparent 70%)", bottom: -100, left: "20%", animationDuration: "22s", animationDelay: "-8s" }} />
        <div className="absolute rounded-full blur-[80px] opacity-[0.22] animate-orb-float" style={{ width: 400, height: 400, background: "radial-gradient(circle, #a5f3fc, transparent 70%)", bottom: "15%", right: "10%", animationDuration: "28s", animationDelay: "-12s" }} />
      </div>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-um-primary border border-um-border mb-4"
             style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.08))" }}>
          AI Agents Berlin Hackathon 2026
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-um-primary mb-7"
             style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-um-primary animate-pulse" />
          Now in Beta - 20+ Platforms Connected
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
          Your entire digital life.<br />
          <span className="gradient-text">One unified memory.</span>
        </h1>
        <p className="text-um-text-secondary text-lg md:text-xl max-w-2xl leading-relaxed mb-11">
          UnifiedMemory collects your data from every platform - Gmail, GitHub, ChatGPT, Spotify, Instagram and 15+ more - and gives your AI agents secure, consent-controlled access via a single MCP endpoint.
        </p>
        <div className="flex gap-3.5 flex-wrap justify-center">
          <Link href="/onboard" className="btn-primary">Start Building Memory</Link>
          <Link href="/demo" className="px-7 py-3.5 rounded-xl font-semibold text-um-text border border-um-border bg-um-surface hover:bg-um-surface-solid transition-all">
            See Live Demo &rarr;
          </Link>
        </div>

        {/* Memory Graph Card */}
        <div className="w-full max-w-2xl mt-16 animate-fade-up" style={{ animationDelay: "0.6s" }}>
          <div className="glass-card p-7">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-sm text-um-text">Your Memory Graph</span>
              <span className="text-xs font-semibold text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-400/20" style={{ background: "rgba(16,185,129,0.1)" }}>
                Live Syncing
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5 mb-6">
              {[
                { name: "Gmail", count: 847 },
                { name: "GitHub", count: 312 },
                { name: "ChatGPT", count: 203 },
                { name: "Spotify", count: 1240 },
                { name: "Slack", count: 560 },
                { name: "Notion", count: 94 },
                { name: "Twitter", count: 2310 },
                { name: "LinkedIn", count: 180 },
                { name: "Health", count: 365 },
                { name: "YouTube", count: 4200 },
              ].map((n, i) => (
                <div key={n.name} className="flex items-center gap-1.5 text-sm font-medium text-um-text px-3.5 py-2 rounded-lg border border-um-border animate-node-appear"
                     style={{ background: "rgba(255,255,255,0.06)", animationDelay: `${i * 0.08}s` }}>
                  {n.name} <strong className="text-um-primary">{n.count.toLocaleString()}</strong>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { label: "Episodic", pct: 82, color: "from-violet-500 to-fuchsia-400", count: "3.2k" },
                { label: "Semantic", pct: 65, color: "from-blue-500 to-cyan-400", count: "1.8k" },
                { label: "Social", pct: 54, color: "from-emerald-500 to-teal-400", count: "1.2k" },
                { label: "Preferential", pct: 40, color: "from-orange-500 to-amber-400", count: "0.9k" },
              ].map((b, i) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-xs text-um-muted w-16 text-right">{b.label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(160,130,230,0.12)" }}>
                    <div className={`h-full rounded-full bg-gradient-to-r ${b.color} animate-bar-grow`} style={{ width: `${b.pct}%`, animationDelay: `${i * 0.2}s` }} />
                  </div>
                  <span className="text-xs font-semibold text-um-primary w-8">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <span className="block text-center text-um-primary text-xs font-bold tracking-widest uppercase mb-3">How It Works</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-center mb-4">Five steps to <span className="gradient-text">total memory</span></h2>
          <p className="text-center text-um-text-secondary max-w-xl mx-auto mb-14">Connect once. Synthesize everything. Give your agents exactly the context they need - with you in control.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { n: "1", title: "Connect Platforms", desc: "Authorize via OAuth or upload your GDPR data export. We support 20+ platforms and automatically file DSAR requests on your behalf." },
              { n: "2", title: "Synthesize Memory", desc: "GPT-4o classifies every data point into 5 memory types, generates embeddings, and stores them in a searchable vector graph." },
              { n: "3", title: "Mint Consent NFT", desc: "Define exactly what your agent can access: platforms, memory types, query budget, and expiry. Minted on NEAR blockchain - immutable proof." },
              { n: "4", title: "Agent Queries MCP", desc: "Any AI agent - ChatGPT, Claude, or your own - queries your memory via our MCP endpoint. Each query costs 0.001 USDC via Circle x402." },
              { n: "5", title: "Revoke Anytime", desc: "Burn the Consent NFT on NEAR. All agent access stops instantly. The revocation is permanently logged on-chain. You stay in control." },
            ].map((s) => (
              <div key={s.n} className="glass-card p-7 blur-reveal">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-um-primary mb-4"
                     style={{ background: "linear-gradient(135deg, #ede9fe, #dbeafe)" }}>{s.n}</div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-um-text-secondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Memory Types */}
      <section className="py-0 px-6 pb-24 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="block text-um-primary text-xs font-bold tracking-widest uppercase mb-3">Memory Architecture</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Five layers of <span className="gradient-text">human memory</span></h2>
          <p className="text-um-text-secondary mb-10">Every piece of data from every platform is classified into one of five scientifically-grounded memory types.</p>
          <div className="flex flex-wrap gap-2.5 justify-center">
            {[
              { text: "Episodic - What happened & when", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
              { text: "Semantic - Facts, skills, expertise", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
              { text: "Procedural - How you do things", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
              { text: "Social - Relationships & people", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
              { text: "Preferential - Tastes & values", cls: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
            ].map((p) => (
              <span key={p.text} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border ${p.cls}`}>{p.text}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { n: "20+", l: "Platform Connectors" },
            { n: "5", l: "Memory Types" },
            { n: "0.001", l: "USDC per Query" },
            { n: "NEAR", l: "Consent On-Chain" },
            { n: "MCP", l: "Agent Protocol" },
          ].map((s) => (
            <div key={s.l} className="glass-card p-8 text-center blur-reveal">
              <div className="text-4xl font-extrabold gradient-text mb-2">{s.n}</div>
              <div className="text-sm text-um-text-secondary font-medium">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <span className="block text-center text-um-primary text-xs font-bold tracking-widest uppercase mb-3">Key Features</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-center mb-4"><span className="gradient-text">Built different</span> by design</h2>
          <p className="text-center text-um-text-secondary max-w-xl mx-auto mb-14">Every architectural decision is made to keep you in control and your agents well-informed.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "LOCK", title: "GDPR-Legal by Design", desc: "All data collected via official OAuth APIs or GDPR Article 20 Data Subject Access Requests. You have the legal right to your own data." },
              { icon: "LINK", title: "On-Chain Consent", desc: "Consent NFTs on NEAR blockchain give you cryptographic proof of what agents can access. Revocation is instant and permanent." },
              { icon: "BOLT", title: "x402 Micropayments", desc: "Agents pay 0.001 USDC per memory query via Circle's x402 protocol. The first AI memory system with native micropayment economics." },
              { icon: "BOT", title: "Agent-Agnostic MCP", desc: "One MCP endpoint works with ChatGPT, Claude, Gemini, or any custom agent. Your memory travels with you regardless of which AI you use." },
              { icon: "DNA", title: "Merkle Provenance", desc: "Every memory is tamper-evident - traced to its source via a cryptographic Merkle-DAG. Agents know exactly where each memory came from." },
              { icon: "SAT", title: "EAS Attestations", desc: "Every agent query is logged as an Ethereum Attestation Service record on Base Sepolia. Permanent, public proof of every memory access event." },
            ].map((f) => (
              <div key={f.title} className="glass-card p-7 blur-reveal">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold text-um-primary mb-4" style={{ background: "linear-gradient(135deg, #ede9fe, #dbeafe)" }}>{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-um-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consent NFT Demo */}
      <section className="px-6 pb-24 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="block text-um-primary text-xs font-bold tracking-widest uppercase mb-3">Live Demo</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Revoke in <span className="gradient-text">real time</span></h2>
          <p className="text-um-text-secondary mb-10">Watch consent enforcement happen on-chain. This is what makes UnifiedMemory categorically different from every other memory platform.</p>
          <div className="glass-card p-6 max-w-md mx-auto text-left blur-reveal">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-glow" />
              <span className="font-bold text-sm text-um-text">Consent NFT #001 - NEAR Testnet</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-um-muted">Agent</span><span className="font-semibold text-um-primary">demo-agent.testnet</span></div>
              <div className="flex justify-between"><span className="text-um-muted">Platforms</span><span className="font-semibold">Gmail, GitHub, Spotify</span></div>
              <div className="flex justify-between"><span className="text-um-muted">Memory Types</span><span className="font-semibold">Episodic, Semantic</span></div>
              <div className="flex justify-between"><span className="text-um-muted">Max Queries</span><span className="font-semibold">100 (used: 3)</span></div>
              <div className="flex justify-between"><span className="text-um-muted">Budget</span><span className="font-semibold">$1.00 USDC (spent: $0.003)</span></div>
              <div className="flex justify-between"><span className="text-um-muted">Status</span><span className="font-semibold text-emerald-400">Active</span></div>
            </div>
            <Link href="/demo" className="btn-danger w-full text-center block mt-5">Revoke Consent (Burn NFT on NEAR)</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto glass-card p-12 md:p-16 text-center" style={{ borderRadius: 32 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-um-primary border border-um-border mb-5"
               style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.08))" }}>
            Built at AI Agents Berlin Hackathon 2026
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Give your agents<br /><span className="gradient-text">real memory</span></h2>
          <p className="text-um-text-secondary mb-9">Join the waitlist for early access to UnifiedMemory - the first platform that gives AI agents a complete, consent-controlled view of your digital life.</p>
          <div className="flex gap-2.5 max-w-md mx-auto">
            <input type="email" placeholder="you@example.com" className="flex-1 px-5 py-3 rounded-xl border border-um-border bg-um-surface text-um-text outline-none focus:border-um-primary transition-colors" />
            <button className="btn-primary whitespace-nowrap">Get Early Access</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-9 border-t border-um-border flex flex-col md:flex-row items-center justify-between gap-3"
              style={{ background: "rgba(13,10,26,0.56)" }}>
        <span className="font-bold text-lg gradient-text">UnifiedMemory</span>
        <span className="text-xs text-um-muted">AI Agents Berlin Hackathon 2026 - Built at 42Berlin</span>
        <span className="text-xs text-um-muted">GDPR Compliant - NEAR - Circle - Cloudflare MCP</span>
      </footer>
    </div>
  );
}
