// app/components/UploadConnector.tsx
// Connect button for the upload-based connectors (ChatGPT / Claude / Telegram).
// Picks a JSON or ZIP export, uploads it to /ingest/upload with the user's JWT,
// and fires a toast while the agent embeds + enriches the memories into the
// user's private vault (Pinecone namespace = user id).

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import { uploadExport } from "@/lib/ingest-api";

type Status = "idle" | "uploading" | "done" | "error";

export default function UploadConnector({
  platform,
  accept = ".json,.zip",
  onIngested,
}: {
  platform: string;
  accept?: string;
  onIngested?: (count: number) => void;
}) {
  const { user, token } = useAuth();
  const router = useRouter();
  const { toast, update } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [count, setCount] = useState<number>(0);

  function onConnectClick() {
    if (!user || !token) {
      toast({ title: "Sign in first", description: "Log in to import your export into your private vault.", variant: "info" });
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
    const toastId = toast({
      title: "Agent is processing your export",
      description: `${file.name} — classifying, embedding & enriching into your memory vault…`,
      variant: "loading",
    });

    const res = await uploadExport(platform, file, token);
    if (res.ok) {
      const n = res.data.ingested ?? 0;
      setCount(n);
      setStatus("done");
      setMessage(`Imported ${n} ${n === 1 ? "memory" : "memories"}`);
      update(toastId, {
        title: "Memories enriched 🎉",
        description: `${n} ${n === 1 ? "memory" : "memories"} embedded into your private vault.`,
        variant: "success",
      });
      onIngested?.(n);
    } else {
      setStatus("error");
      setMessage(res.error || "Upload failed");
      update(toastId, {
        title: "Import failed",
        description: res.error || "Upload failed. Please try again.",
        variant: "error",
      });
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
