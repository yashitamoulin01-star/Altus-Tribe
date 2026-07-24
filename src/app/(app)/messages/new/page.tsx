import Link from "next/link";
import { getConnections } from "@/lib/connections";
import NewGroupForm from "./NewGroupForm";

export const metadata = { title: "New group — Altus Tribe" };

export default async function NewGroupPage() {
  const connections = await getConnections();

  return (
    <main className="mx-auto w-full max-w-[720px] px-6 pt-8 pb-28 sm:px-10 space-y-8">
      <header className="border-b border-hairline/80 pb-6">
        <Link
          href="/messages"
          className="mb-3 inline-block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted transition-colors hover:text-ink"
        >
          ← Messages
        </Link>
        <p className="kicker mb-2 text-red font-semibold">Tribe Group Chat</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Start a group
        </h1>
        <p className="mt-2 text-[14px] text-ink-secondary">
          Name the group and add fellow Tribe members you&apos;re connected with. You can
          add more people later.
        </p>
      </header>

      <NewGroupForm
        connections={connections.map((c) => ({
          id: c.id,
          fullName: c.fullName,
          photoUrl: c.photoUrl,
          roleTitle: c.roleTitle,
        }))}
      />
    </main>
  );
}
