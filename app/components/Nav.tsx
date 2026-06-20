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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("um-theme");
    const effective = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(effective);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(effective);
    document.body.classList.add("theme-ready");
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isDemoPage = pathname === "/demo";

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b animate-nav-slide"
        style={{ background: "var(--surface-nav)", backdropFilter: "blur(20px)", borderColor: "var(--border-nav)" }}
      >
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg gradient-text" onClick={() => setMobileOpen(false)}>
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

        {/* Desktop nav */}
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
          {/* Live Demo button - hide on demo page */}
          {!isDemoPage && (
            <Link href="/demo" className="hidden md:inline-flex btn-primary text-sm px-5 py-2.5">
              Live Demo
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-1.5"
            style={{ background: "var(--toggle-bg)", border: "1px solid var(--toggle-border)" }}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <span className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[5px] bg-white" : "bg-um-text"}`} />
            <span className={`block h-0.5 rounded-full transition-all duration-300 ${mobileOpen ? "w-0 opacity-0" : "w-5 opacity-100 bg-um-text"}`} />
            <span className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[5px] bg-white" : "bg-um-text"}`} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[49] bg-black/60 backdrop-blur-sm animate-fade-in md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Menu panel */}
          <div
            className="fixed top-16 right-0 bottom-0 z-[49] w-[280px] border-l p-6 flex flex-col gap-2 animate-slide-in-right md:hidden"
            style={{
              background: "var(--surface-nav)",
              borderColor: "var(--border-nav)",
              backdropFilter: "blur(20px)",
            }}
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? "text-[#7c3aed]"
                    : "text-um-text-secondary hover:text-[#7c3aed]"
                }`}
                style={{
                  background: pathname === l.href ? "rgba(124,58,237,0.08)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-nav)" }}>
              <Link
                href="/demo"
                onClick={() => setMobileOpen(false)}
                className="btn-primary text-sm px-5 py-2.5 w-full text-center block"
              >
                Live Demo
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
