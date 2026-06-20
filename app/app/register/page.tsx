"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");
    setSubmitting(true);
    const res = await register(email, password);
    setSubmitting(false);
    if (res.ok) router.replace("/dashboard");
    else setError(res.error || "Registration failed");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <div className="glass-card w-full max-w-md p-8 rounded-2xl">
        <h1 className="text-2xl font-bold gradient-text mb-1">Create your account</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Your vault stays yours — gated by consent and on-chain.
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="px-4 py-2.5 rounded-xl text-sm outline-none transition-colors focus:border-[#7c3aed]"
              style={{ background: "var(--surface-solid)", border: "1px solid var(--border-nav)", color: "var(--text-primary)" }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Confirm password</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium hover:underline" style={{ color: "#7c3aed" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
