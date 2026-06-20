// app/lib/auth-api.ts
// Thin client for the FastAPI /auth/* endpoints. Mirrors the {ok, status, data}
// shape used by lib/api.ts so callers handle results uniformly.

const API_URL = process.env.NEXT_PUBLIC_MCP_URL || "http://localhost:8000";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResult<T> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

async function request<T>(path: string, init: RequestInit): Promise<AuthResult<T>> {
  try {
    const r = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
      ...init,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return { ok: false, status: r.status, data: data as T, error: (data as { detail?: string }).detail || "Request failed" };
    }
    return { ok: true, status: r.status, data: data as T };
  } catch {
    return { ok: false, status: 0, data: {} as T, error: "Could not reach the server" };
  }
}

export function registerUser(email: string, password: string) {
  return request<AuthUser & { token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function loginUser(email: string, password: string) {
  return request<AuthUser & { token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe(token: string) {
  return request<AuthUser>("/auth/me", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}
