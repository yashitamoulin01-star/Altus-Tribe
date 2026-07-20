"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { getOrCreateDirectConversation } from "@/app/(app)/messages/actions";

// "Message" on a member feature (#108). Resolves-or-creates a 1:1 conversation
// and opens it. In offline/sample mode the action returns no id, so we fall back
// to the Messages world rather than dead-ending.
export default function MessageMemberButton({
  profileId,
}: {
  profileId: string | undefined;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      if (!profileId) {
        router.push("/messages");
        return;
      }
      const res = await getOrCreateDirectConversation(profileId);
      router.push(res.id ? `/messages/${res.id}` : "/messages");
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-block rounded border border-hairline px-7 py-3.5 text-[16px] font-medium text-ink transition-colors duration-150 hover:border-ink-muted disabled:opacity-50"
    >
      {pending ? "Opening…" : "Message"}
    </button>
  );
}
