// app/lib/auth-api.ts
// Thin client for the FastAPI /auth/* endpoints.

const API_URL = ""; // relative paths — same origin

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const r = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const body = await r.json().catch(() => ({}));
    if (!r.ok) {
      return { ok: false, status: r.status, error: body.detail || body.error || `HTTP ${r.status}` };
    }
    return { ok: true, status: r.status, data: body };
  } catch (e) {
    return { ok: false, status: 0, error: "Could not reach the server" };
  }
}

export type AuthUser = { id: string; email: string };

export async function registerUser(email: string, password: string) {
  return request<AuthUser & { token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginUser(email: string, password: string) {
  return request<AuthUser & { token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(token: string) {
  return request<AuthUser>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}