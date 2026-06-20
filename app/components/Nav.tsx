"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/onboard", label: "Onboard" },
  { href: "/consent", label: "Consent" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/demo", label: "Demo" },
];

export default function Nav() {
  const pathname = usePathname();
  const [, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("um-theme");
    const effective = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(effective);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(effective);
    document.body.classList.add("theme-ready");
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b animate-nav-slide"
      style={{ background: "var(--surface-nav)", backdropFilter: "blur(20px)", borderColor: "var(--border-nav)" }}
    >
      <Link href="/" className="flex items-center gap-2.5 font-bold text-lg gradient-text">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center animate-logo-pulse"
          style={{ background: "linear-gradient(135deg,#7c3aed,#60a5fa)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        UnifiedMemory
      </Link>
      <ul className="hidden md:flex gap-8 list-none">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`text-sm font-medium transition-colors hover:text-[#7c3aed] ${
                pathname === l.href ? "text-[#7c3aed]" : ""
              }`}
              style={{ color: pathname === l.href ? "#7c3aed" : "var(--text-secondary)" }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2.5">
        <Link href="/demo" className="btn-primary text-sm px-5 py-2.5">
          Live Demo
        </Link>
      </div>
    </nav>
  );
}
