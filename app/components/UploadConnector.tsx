// app/components/UploadConnector.tsx
// Connect button for the upload-based connectors (ChatGPT / Claude / Telegram).
// Picks a JSON export, uploads it to /ingest/upload with the user's JWT, and
// shows the number of memories ingested into their vault.

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { uploadExport } from "@/lib/ingest-api";

type Status = "idle" | "uploading" | "done" | "error";

export default function UploadConnector({ platform, accept = ".json" }: { platform: string; accept?: string }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [count, setCount] = useState<number>(0);

  function onConnectClick() {
    if (!user || !token) {
      router.push("/login");
      return;
    }
    inputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file || !token) return;

    setStatus("uploading");
    setMessage("Importing…");
    const res = await uploadExport(platform, file, token);
    if (res.ok) {
      const n = res.data.ingested ?? 0;
      setCount(n);
      setStatus("done");
      setMessage(`Imported ${n} ${n === 1 ? "memory" : "memories"}`);
    } else {
      setStatus("error");
      setMessage(res.error || "Upload failed");
    }
  }

  const base = "text-xs font-bold px-4 py-2 rounded-lg transition-all";
  const tone =
    status === "done"
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      : status === "error"
        ? "bg-red-500/10 text-red-400 border border-red-500/20"
        : "bg-um-primary/10 text-um-primary border border-um-primary/20 hover:bg-um-primary/20";

  const label =
    status === "uploading" ? "Importing…" : status === "done" ? "Re-import" : status === "error" ? "Retry" : "Connect";

  return (
    <div className="flex flex-col items-end gap-1">
      <input ref={inputRef} type="file" accept={accept} onChange={onFileChange} className="hidden" />
      <button onClick={onConnectClick} disabled={status === "uploading"} className={`${base} ${tone} disabled:opacity-60`}>
        {label}
      </button>
      {message && (
        <span
          className="text-[10px] font-medium"
          style={{ color: status === "error" ? "#fca5a5" : status === "done" ? "#34d399" : "var(--text-muted)" }}
        >
          {status === "done" && count >= 0 ? `✓ ${message}` : message}
        </span>
      )}
    </div>
  );
}
