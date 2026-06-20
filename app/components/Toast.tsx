// app/components/Toast.tsx
// Minimal toast system: ToastProvider + useToast(). Renders stacked toasts in
// the bottom-right corner with auto-dismiss. Variants: success | error | info |
// loading. A loading toast can be updated in place by returning its id and
// calling toast.update(id, {...}) — used for the "Minting…" → "Minted" flow.

"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

type Variant = "success" | "error" | "info" | "loading";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: Variant;
  duration: number | null; // ms; null = sticky (caller dismisses)
}

interface ToastInput {
  title: string;
  description?: string;
  variant?: Variant;
  duration?: number | null;
}

interface ToastApi {
  toast: (t: ToastInput) => number;
  update: (id: number, t: Partial<ToastInput>) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

let nextId = 1;

const STYLES: Record<Variant, { border: string; bg: string; accent: string; icon: ReactNode }> = {
  success: {
    border: "rgba(16,185,129,0.35)", bg: "rgba(16,185,129,0.08)", accent: "#34d399",
    icon: <span style={{ color: "#34d399" }}>✓</span>,
  },
  error: {
    border: "rgba(239,68,68,0.35)", bg: "rgba(239,68,68,0.08)", accent: "#f87171",
    icon: <span style={{ color: "#f87171" }}>✕</span>,
  },
  info: {
    border: "rgba(124,58,237,0.35)", bg: "rgba(124,58,237,0.08)", accent: "#a78bfa",
    icon: <span style={{ color: "#a78bfa" }}>i</span>,
  },
  loading: {
    border: "rgba(124,58,237,0.35)", bg: "rgba(124,58,237,0.08)", accent: "#a78bfa",
    icon: (
      <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "info", duration }: ToastInput) => {
      const id = nextId++;
      const resolved = duration === undefined ? (variant === "loading" ? null : 5000) : duration;
      setToasts((prev) => [...prev, { id, title, description, variant, duration: resolved }]);
      if (resolved !== null) setTimeout(() => dismiss(id), resolved);
      return id;
    },
    [dismiss],
  );

  const update = useCallback(
    (id: number, patch: Partial<ToastInput>) => {
      setToasts((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const next: Toast = {
            ...t,
            ...patch,
            variant: patch.variant ?? t.variant,
            duration: patch.duration === undefined ? t.duration : patch.duration,
          };
          // If the variant changed away from loading and no explicit duration was
          // given, give the updated toast a default lifetime so it auto-dismisses.
          if (patch.variant && patch.variant !== "loading" && patch.duration === undefined) {
            next.duration = 5000;
            setTimeout(() => dismiss(id), 5000);
          }
          return next;
        }),
      );
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, update, dismiss }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[340px] max-w-[calc(100vw-2.5rem)]">
        {toasts.map((t) => {
          const s = STYLES[t.variant];
          return (
            <div
              key={t.id}
              className="glass-card p-4 flex items-start gap-3 animate-fade-up"
              style={{ borderColor: s.border, background: s.bg, backdropFilter: "blur(16px)" }}
              role="status"
            >
              <div
                className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ border: `1px solid ${s.accent}`, color: s.accent }}
              >
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {t.title}
                </div>
                {t.description && (
                  <div className="text-xs mt-0.5 leading-snug break-words" style={{ color: "var(--text-secondary)" }}>
                    {t.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-um-muted hover:text-um-text shrink-0 text-sm leading-none"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}