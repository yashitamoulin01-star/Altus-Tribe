"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { askManan } from "./actions";

// Opens (or creates) the member's private support thread with Manan & team.
// Falls back to the Messages world when offline / unauthenticated.
export default function AskManan() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await askManan();
          router.push(r.id ? `/messages/${r.id}` : "/messages");
        })
      }
      className="mt-6 inline-block rounded bg-red px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover disabled:opacity-60"
    >
      {pending ? "Opening…" : "Ask Manan / Team →"}
    </button>
  );
}
