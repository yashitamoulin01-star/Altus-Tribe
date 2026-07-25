"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createResource, deleteResource } from "../actions";
import { uploadFile } from "@/lib/storage-client";
import type { AdminResource } from "@/lib/admin-content";

const field =
  "w-full rounded-lg border border-hairline bg-surface-sunk px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none";

const KINDS = [
  { value: "video", label: "Video" },
  { value: "brochure", label: "Playbook / Brochure" },
  { value: "inspiration", label: "Inspiration" },
  { value: "highlight", label: "Event Highlight (photo)" },
];

export default function ResourceManager({
  items,
  userId,
}: {
  items: AdminResource[];
  userId: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [filePath, setFilePath] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();

  const pickFile = async (file: File | undefined) => {
    if (!file || !userId) return;
    setErr("");
    setBusy(true);
    try {
      const r = await uploadFile("resources", userId, file);
      if (!r.ok) setErr(r.error);
      else setFilePath(r.path);
    } finally {
      setBusy(false);
    }
  };

  const submit = () =>
    start(async () => {
      setErr("");
      const r = await createResource({ kind, title, description, externalUrl, filePath });
      if (!r.ok) {
        setErr(r.error ?? "Couldn't add.");
        return;
      }
      setTitle("");
      setDescription("");
      setExternalUrl("");
      setFilePath("");
      router.refresh();
    });

  const remove = (id: string) =>
    start(async () => {
      await deleteResource(id);
      router.refresh();
    });

  return (
    <div>
      <div className="rounded-xl border border-hairline bg-surface p-5">
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <select className={field} value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <input className={field} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <input className={`${field} mt-3`} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className={`${field} mt-3`} placeholder="Link (YouTube / URL)" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
        <div className="mt-3 flex items-center gap-3">
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
          <button type="button" disabled={busy || !userId} onClick={() => fileRef.current?.click()} className="rounded-lg border border-hairline px-3.5 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted disabled:opacity-50">
            {busy ? "Uploading…" : filePath ? "Replace file" : "Upload file"}
          </button>
          {filePath && <span className="truncate font-mono text-[11px] text-ink">✓ {filePath}</span>}
        </div>
        {err && <p className="mt-2 text-[13px] text-red">{err}</p>}
        <div className="mt-3">
          <button type="button" disabled={pending || !title.trim()} onClick={submit} className="rounded-lg bg-red px-4 py-2 text-[14px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-50">
            {pending ? "Adding…" : "Add to Campus"}
          </button>
          <p className="mt-2 text-[12px] text-ink-muted">Adding notifies every active member.</p>
        </div>
      </div>

      <ul className="mt-5 divide-y divide-hairline">
        {items.length === 0 && <li className="py-4 text-[14px] text-ink-muted">No resources yet.</li>}
        {items.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[15px] font-medium text-ink">
                {r.title}
                <span className="rounded bg-surface-sunk px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">{r.kind}</span>
              </p>
              {r.description && <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-muted">{r.description}</p>}
            </div>
            <button type="button" disabled={pending} onClick={() => remove(r.id)} className="shrink-0 text-[13px] text-ink-muted transition-colors hover:text-red disabled:opacity-50">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
