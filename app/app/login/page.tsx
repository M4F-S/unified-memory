"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in → no reason to show the form.
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.ok) router.replace("/dashboard");
    else setError(res.error || "Login failed");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <div className="glass-card w-full max-w-md p-8 rounded-2xl">
        <h1 className="text-2xl font-bold gradient-text mb-1">Welcome back</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Sign in to access your memory vault.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="px-4 py-2.5 rounded-xl text-sm outline-none transition-colors focus:border-[#7c3aed]"
              style={{ background: "var(--surface-solid)", border: "1px solid var(--border-nav)", color: "var(--text-primary)" }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-4 py-2.5 rounded-xl text-sm outline-none transition-colors focus:border-[#7c3aed]"
              style={{ background: "var(--surface-solid)", border: "1px solid var(--border-nav)", color: "var(--text-primary)" }}
            />
          </label>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ color: "#fca5a5", background: "rgba(220,38,38,0.1)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 mt-1 disabled:opacity-60">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "var(--text-secondary)" }}>
          No account?{" "}
          <Link href="/register" className="font-medium hover:underline" style={{ color: "#7c3aed" }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
