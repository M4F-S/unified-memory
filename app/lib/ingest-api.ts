// app/lib/ingest-api.ts
// Client for the file-upload ingestion endpoint. Sends multipart/form-data with
// the JWT so uploads land in the logged-in user's vault (namespace = user id).

const API_URL = process.env.NEXT_PUBLIC_MCP_URL || "http://localhost:8000";

export interface IngestResult {
  platform: string;
  ingested: number;
  namespace: string;
}

export interface UploadResponse {
  ok: boolean;
  status: number;
  data: Partial<IngestResult>;
  error?: string;
}

export async function uploadExport(platform: string, file: File, token: string): Promise<UploadResponse> {
  const form = new FormData();
  form.append("platform", platform);
  form.append("file", file);
  try {
    const r = await fetch(`${API_URL}/ingest/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // no Content-Type: browser sets the boundary
      body: form,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return { ok: false, status: r.status, data, error: data.error || data.detail || "Upload failed" };
    }
    return { ok: true, status: r.status, data: data as IngestResult };
  } catch {
    return { ok: false, status: 0, data: {}, error: "Could not reach the server" };
  }
}
