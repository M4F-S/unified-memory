// app/components/ProtectedRoute.tsx
// Client guard: redirects unauthenticated visitors to /login. Used by the thin
// dashboard/consent layouts so the existing page.tsx files stay untouched.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(124,58,237,0.25)", borderTopColor: "#7c3aed" }}
          />
          <span className="text-sm">{loading ? "Checking your session…" : "Redirecting to login…"}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
