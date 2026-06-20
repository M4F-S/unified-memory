"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  BrainIcon, TrophyIcon, MailIcon, GitHubIcon, ChatGPTIcon, ClaudeIcon,
  MusicIcon, ChatIcon, CameraIcon, TwitterIcon, BriefcaseIcon, DocumentIcon,
  HashIcon, GamepadIcon, PlaneIcon, UsersIcon, PlayIcon, HeartIcon, FistIcon,
  RunIcon, ClockIcon, BookIcon, GearIcon, HeartFilledIcon, LockIcon, LinkIcon,
  BoltIcon, RobotIcon, DnaIcon, SatelliteIcon, CircleIcon, RedCircleIcon
} from "@/components/Icons";

const platforms = [
  { icon: <MailIcon size={14} />, name: "Gmail" },
  { icon: <GitHubIcon size={14} />, name: "GitHub" },
  { icon: <ChatGPTIcon size={14} />, name: "ChatGPT" },
  { icon: <ClaudeIcon size={14} />, name: "Claude" },
  { icon: <MusicIcon size={14} />, name: "Spotify" },
  { icon: <ChatIcon size={14} />, name: "WhatsApp" },
  { icon: <CameraIcon size={14} />, name: "Instagram" },
  { icon: <TwitterIcon size={14} />, name: "Twitter/X" },
  { icon: <BriefcaseIcon size={14} />, name: "LinkedIn" },
  { icon: <DocumentIcon size={14} />, name: "Notion" },
  { icon: <HashIcon size={14} />, name: "Slack" },
  { icon: <GamepadIcon size={14} />, name: "Discord" },
  { icon: <PlaneIcon size={14} />, name: "Telegram" },
  { icon: <UsersIcon size={14} />, name: "Facebook" },
  { icon: <MusicIcon size={14} />, name: "TikTok" },
  { icon: <PlayIcon size={14} />, name: "YouTube" },
  { icon: <HeartIcon size={14} />, name: "Apple Health" },
  { icon: <FistIcon size={14} />, name: "Reddit" },
  { icon: <RunIcon size={14} />, name: "Google Fit" },
  { icon: <MailIcon size={14} />, name: "Apple Mail" },
];

export default function Home() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting)
            setTimeout(() => e.target.classList.add("visible"), i * 80);
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".blur-reveal").forEach((el) => observerRef.current?.observe(el));

    // Immediate reveal for above-the-fold elements (prevents FOIC)
    requestAnimationFrame(() => {
      document.querySelectorAll(".blur-reveal").forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setTimeout(() => el.classList.add("visible"), i * 80);
        }
      });
    });

    // Glow card mousemove
    const cards = document.querySelectorAll(".glow-card, .feature-card");
    const handler = (e: Event) => {
      const ev = e as MouseEvent;
      const card = ev.currentTarget as HTMLElement;
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let angle = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;
      card.style.setProperty("--angle", angle + "deg");
      card.style.setProperty("--mx", ((ev.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      card.style.setProperty("--my", ((ev.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    };
    cards.forEach((c) => c.addEventListener("mousemove", handler));

    return () => {
      observerRef.current?.disconnect();
      cards.forEach((c) => c.removeEventListener("mousemove", handler));
    };
  }, []);

  return (
    <div className="relative">
      {/* Aurora background */}
      <div
        className="fixed inset-0 -z-10 overflow-hidden"
        style={{ background: "var(--aurora-base)", transform: "translateZ(0)" }}
      >
        <div
          className="absolute rounded-full blur-[60px] sm:blur-[80px] animate-orb-float"
          style={{
            width: "clamp(300px, 50vw, 700px)",
            height: "clamp(300px, 50vw, 700px)",
            background: "radial-gradient(circle, #c4b5fd, transparent 70%)",
            top: "-10%",
            left: "-10%",
            animationDuration: "20s",
            opacity: "var(--orb-opacity)",
          }}
        />
        <div
          className="absolute rounded-full blur-[60px] sm:blur-[80px] animate-orb-float"
          style={{
            width: "clamp(250px, 40vw, 500px)",
            height: "clamp(250px, 40vw, 500px)",
            background: "radial-gradient(circle, #bae6fd, transparent 70%)",
            top: "10%",
            right: "-10%",
            animationDuration: "25s",
            animationDelay: "-5s",
            opacity: "var(--orb-opacity)",
          }}
        />
        <div
          className="absolute rounded-full blur-[60px] sm:blur-[80px] animate-orb-float"
          style={{
            width: "clamp(280px, 45vw, 600px)",
            height: "clamp(280px, 45vw, 600px)",
            background: "radial-gradient(circle, #f5d0fe, transparent 70%)",
            bottom: "-5%",
            left: "15%",
            animationDuration: "22s",
            animationDelay: "-8s",
            opacity: "var(--orb-opacity)",
          }}
        />
        <div
          className="absolute rounded-full blur-[60px] sm:blur-[80px] animate-orb-float"
          style={{
            width: "clamp(200px, 30vw, 400px)",
            height: "clamp(200px, 30vw, 400px)",
            background: "radial-gradient(circle, #a5f3fc, transparent 70%)",
            bottom: "10%",
            right: "5%",
            animationDuration: "28s",
            animationDelay: "-12s",
            opacity: "var(--orb-opacity)",
          }}
        />
        <div
          className="absolute rounded-full blur-[60px] sm:blur-[80px] animate-orb-float"
          style={{
            width: "clamp(180px, 25vw, 350px)",
            height: "clamp(180px, 25vw, 350px)",
            background: "radial-gradient(circle, #ddd6fe, transparent 70%)",
            top: "45%",
            left: "30%",
            animationDuration: "16s",
            animationDelay: "-3s",
            opacity: "var(--orb-opacity)",
          }}
        />
      </div>

      {/* SVG Strands — 6 animated paths, desktop only */}
      <svg
        className="fixed inset-0 -z-[5] pointer-events-none"
        viewBox="0 0 1900 1000"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: "var(--strand-opacity)", transform: "translateZ(0)" }}
      >
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0" />
            <stop offset="40%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
            <stop offset="50%" stopColor="#f0abfc" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="strand-path s1" d="M-50,200 Q300,80 600,300 Q900,520 1300,250 Q1600,100 1900,350" />
        <path className="strand-path s2" d="M-50,500 Q250,350 550,550 Q850,750 1150,480 Q1450,210 1900,600" />
        <path className="strand-path s3" d="M-50,750 Q400,600 700,800 Q1000,1000 1300,700 Q1600,400 1900,800" />
        <path className="strand-path s4" d="M-50,120 Q400,300 700,150 Q1000,0 1300,200 Q1600,400 1900,150" />
        <path className="strand-path s5" d="M-50,650 Q300,450 600,680 Q900,910 1200,620 Q1500,330 1900,700" />
        <path className="strand-path s6" d="M-50,350 Q350,500 650,320 Q950,140 1250,400 Q1550,660 1900,420" />
      </svg>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 animate-fade-up"
          style={{
            color: "#7c3aed",
            background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.08))",
            border: "1px solid rgba(124,58,237,0.2)",
            animationDelay: "0.05s",
          }}
        >
          <TrophyIcon size={14} className="inline-block align-text-bottom" /> AI Agents Berlin Hackathon 2026 · 42Berlin
        </div>
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-7 animate-fade-up"
          style={{
            color: "#7c3aed",
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.2)",
            animationDelay: "0.1s",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-badge-pulse" />
          Now in Beta · 20+ Platforms Connected
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          Your entire digital life.
          <br />
          <span className="gradient-text">One unified memory.</span>
        </h1>
        <p
          className="text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-11 animate-fade-up px-2 sm:px-0"
          style={{ color: "var(--text-secondary)", animationDelay: "0.35s" }}
        >
          UnifiedMemory collects your data from every platform — Gmail, GitHub, ChatGPT, Spotify, Instagram and 15+ more — and gives your AI agents secure, consent-controlled access via a single MCP endpoint.
        </p>
        <div className="flex gap-3.5 flex-wrap justify-center animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <Link href="/onboard" className="btn-primary">
            Start Building Memory
          </Link>
        </div>

        <div className="scroll-indicator animate-fade-up animate-scroll-bounce" style={{ animationDelay: "1.2s" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Scroll to explore</span>
          <div className="w-1 h-1 rounded-full mt-1.5" style={{ background: "var(--text-muted)" }} />
        </div>

        {/* Memory Graph Card */}
        <div className="w-full max-w-2xl mt-16 animate-fade-up" style={{ animationDelay: "0.6s" }}>
          <div className="glass-card p-7">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                <BrainIcon size={16} className="inline-block align-text-bottom" /> Your Memory Graph
              </span>
              <span
                className="text-xs font-semibold text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-400/20 animate-badge-pulse"
                style={{ background: "rgba(16,185,129,0.1)" }}
              >
                <CircleIcon size={8} className="inline-block align-text-bottom text-emerald-400" /> Live Syncing
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
                <div
                  key={n.name}
                  className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg border animate-node-appear"
                  style={{
                    color: "var(--text-primary)",
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    animationDelay: `${i * 0.08}s`,
                  }}
                >
                  {n.name} <strong className="text-[#7c3aed]">{n.count.toLocaleString()}</strong>
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
                  <span className="text-xs w-16 text-right" style={{ color: "var(--text-secondary)" }}>
                    {b.label}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(160,130,230,0.12)" }}>
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${b.color} animate-bar-grow`}
                      style={{ width: `${b.pct}%`, animationDelay: `${i * 0.2}s` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#7c3aed] w-8">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Logo Loop */}
      <section className="pb-12 sm:pb-20">
        <p className="text-center text-xs font-medium tracking-widest uppercase mb-5" style={{ color: "var(--text-muted)" }}>
          Connecting your entire digital universe
        </p>
        <div className="overflow-hidden" style={{ mask: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
          <div className="logo-loop-inner">
            {[...platforms, ...platforms].map((p, i) => (
              <div key={`${p.name}-${i}`} className="platform-pill">
                <span>{p.icon}</span>
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <span className="block text-center text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#7c3aed" }}>
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-center mb-4">
            Five steps to <span className="gradient-text">total memory</span>
          </h2>
          <p className="text-center max-w-xl mx-auto mb-14" style={{ color: "var(--text-secondary)" }}>
            Connect once. Synthesize everything. Give your agents exactly the context they need — with you in control.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { n: "1", title: "Connect Platforms", desc: "Authorize via OAuth or upload your GDPR data export. We support 20+ platforms and automatically file DSAR requests on your behalf." },
              { n: "2", title: "Synthesize Memory", desc: "GPT-4o classifies every data point into 5 memory types, generates embeddings, and stores them in a searchable vector graph." },
              { n: "3", title: "Mint Consent NFT", desc: "Define exactly what your agent can access: platforms, memory types, query budget, and expiry. Minted on NEAR blockchain — immutable proof." },
              { n: "4", title: "Agent Queries MCP", desc: "Any AI agent — ChatGPT, Claude, or your own — queries your memory via our MCP endpoint. Each query costs 0.001 USDC via Circle x402." },
              { n: "5", title: "Revoke Anytime", desc: "Burn the Consent NFT on NEAR. All agent access stops instantly. The revocation is permanently logged on-chain. You stay in control." },
            ].map((s) => (
              <div key={s.n} className="glow-card p-7 blur-reveal">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-[#7c3aed] mb-4"
                  style={{ background: "linear-gradient(135deg, #ede9fe, #dbeafe)" }}
                >
                  {s.n}
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Memory Types */}
      <section className="py-0 px-4 sm:px-6 pb-16 sm:pb-24 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="block text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#7c3aed" }}>
            Memory Architecture
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
            Five layers of <span className="gradient-text">human memory</span>
          </h2>
          <p className="mb-10" style={{ color: "var(--text-secondary)" }}>
            Every piece of data from every platform is classified into one of five scientifically-grounded memory types inspired by cognitive science.
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border bg-violet-500/10 text-violet-400 border-violet-500/20">
              <ClockIcon size={14} /> Episodic — What happened & when
            </span>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border bg-blue-500/10 text-blue-400 border-blue-500/20">
              <BookIcon size={14} /> Semantic — Facts, skills, expertise
            </span>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <GearIcon size={14} /> Procedural — How you do things
            </span>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border bg-red-500/10 text-red-400 border-red-500/20">
              <UsersIcon size={14} /> Social — Relationships & people
            </span>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border bg-orange-500/10 text-orange-400 border-orange-500/20">
              <HeartFilledIcon size={14} /> Preferential — Tastes & values
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
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
              <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto">
          <span className="block text-center text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#7c3aed" }}>
            Key Features
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-center mb-4">
            <span className="gradient-text">Built different</span> by design
          </h2>
          <p className="text-center max-w-xl mx-auto mb-14" style={{ color: "var(--text-secondary)" }}>
            Every architectural decision is made to keep you in control and your agents well-informed.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <LockIcon size={22} />, title: "GDPR-Legal by Design", desc: "All data collected via official OAuth APIs or GDPR Article 20 Data Subject Access Requests. You have the legal right to your own data." },
              { icon: <LinkIcon size={22} />, title: "On-Chain Consent", desc: "Consent NFTs on NEAR blockchain give you cryptographic proof of what agents can access. Revocation is instant and permanent." },
              { icon: <BoltIcon size={22} />, title: "x402 Micropayments", desc: "Agents pay 0.001 USDC per memory query via Circle's x402 protocol. The first AI memory system with native micropayment economics." },
              { icon: <RobotIcon size={22} />, title: "Agent-Agnostic MCP", desc: "One MCP endpoint works with ChatGPT, Claude, Gemini, or any custom agent. Your memory travels with you regardless of which AI you use." },
              { icon: <DnaIcon size={22} />, title: "Merkle Provenance", desc: "Every memory is tamper-evident — traced to its source via a cryptographic Merkle-DAG. Agents know exactly where each memory came from." },
              { icon: <SatelliteIcon size={22} />, title: "EAS Attestations", desc: "Every agent query is logged as an Ethereum Attestation Service record on Base Sepolia. Permanent, public proof of every memory access event." },
            ].map((f) => (
              <div key={f.title} className="feature-card blur-reveal">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: "linear-gradient(135deg, #ede9fe, #dbeafe)" }}
                >
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consent NFT Demo */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="block text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#7c3aed" }}>
            Consent Control Demo
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
            Revoke in <span className="gradient-text">real time</span>
          </h2>
          <p className="mb-10" style={{ color: "var(--text-secondary)" }}>
            Watch consent enforcement happen on-chain. This is what makes UnifiedMemory categorically different from every other memory platform.
          </p>
          <div className="glass-card p-6 max-w-md mx-auto text-left blur-reveal">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-nft-pulse" />
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                Consent NFT #001 · NEAR Testnet
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Agent</span>
                <span className="font-semibold text-[#7c3aed]">demo-agent.testnet</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Platforms</span>
                <span className="font-semibold">Gmail, GitHub, Spotify</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Memory Types</span>
                <span className="font-semibold">Episodic, Semantic</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Max Queries</span>
                <span className="font-semibold">100 (used: 3)</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Budget</span>
                <span className="font-semibold">$1.00 USDC (spent: $0.003)</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Status</span>
                <span className="font-semibold text-emerald-400"><CircleIcon size={8} className="inline-block align-text-bottom text-emerald-400" /> Active</span>
              </div>
            </div>
            <Link href="/demo" className="btn-danger w-full text-center block mt-5">
              <RedCircleIcon size={10} className="inline-block align-text-bottom text-red-500" /> Revoke Consent (Burn NFT on NEAR)
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
        <div
          className="max-w-2xl mx-auto glass-card p-12 md:p-16 text-center"
          style={{ borderRadius: 32, position: "relative", overflow: "hidden" }}
        >
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.1), rgba(6,182,212,0.08))",
            }}
          />
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{
              color: "#7c3aed",
              background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.08))",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            <TrophyIcon size={14} className="inline-block align-text-bottom" /> Built at AI Agents Berlin Hackathon 2026
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
            Give your agents
            <br />
            <span className="gradient-text">real memory</span>
          </h2>
          <p className="mb-9" style={{ color: "var(--text-secondary)" }}>
            Join the waitlist for early access to UnifiedMemory — the first platform that gives AI agents a complete, consent-controlled view of your digital life.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto px-4 sm:px-0">
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 px-5 py-3 rounded-xl border outline-none transition-colors"
              style={{
                borderColor: "var(--border-strong)",
                background: "var(--input-bg)",
                color: "var(--text-primary)",
              }}
            />
            <button className="btn-primary whitespace-nowrap">Get Early Access</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-4 sm:px-6 md:px-12 py-6 sm:py-9 border-t flex flex-col md:flex-row items-center justify-between gap-3"
        style={{ background: "var(--footer-bg)", backdropFilter: "blur(12px)", borderColor: "var(--border-nav)" }}
      >
        <span className="font-bold text-lg gradient-text"><BrainIcon size={18} className="inline-block align-text-bottom" /> UnifiedMemory</span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          AI Agents Berlin Hackathon 2026 · Built at 42Berlin
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          GDPR Compliant · NEAR · Circle · Cloudflare MCP
        </span>
      </footer>
    </div>
  );
}
