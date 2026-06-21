// app/lib/auth-context.tsx
// AuthProvider + useAuth: holds the JWT (localStorage) and the current user,
// re-validating the token via /auth/me on mount so auth state survives reloads.

"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { AuthUser, registerUser, loginUser, getMe } from "./auth-api";

const TOKEN_KEY = "um-auth-token";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate any stored token once on mount.
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!stored) {
      setLoading(false);
      return;
    }
    getMe(stored).then((res) => {
      if (res.ok && res.data) {
        setUser(res.data || null);
        setToken(stored);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
      setLoading(false);
    });
  }, []);

  const persist = useCallback((nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await loginUser(email, password);
      if (res.ok && res.data) {
        persist(res.data.token, { id: res.data.id, email: res.data.email });
        return { ok: true };
      }
      return { ok: false, error: res.error };
    },
    [persist],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const res = await registerUser(email, password);
      if (res.ok && res.data) {
        persist(res.data.token, { id: res.data.id, email: res.data.email });
        return { ok: true };
      }
      return { ok: false, error: res.error };
    },
    [persist],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
