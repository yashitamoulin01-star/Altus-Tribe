import { getRoster } from "@/lib/admin";
import BroadcastComposer from "./BroadcastComposer";

export const metadata = { title: "Broadcasts — Altus Tribe Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBroadcastsPage() {
  const roster = await getRoster();

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Broadcasts</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Reach the Tribe.
      </h1>
      <p className="mt-2 max-w-[56ch] text-[15px] text-ink-secondary">
        Send an in-app notification to everyone, a role, or one member. It lands in
        their notification center — Altus doesn&apos;t send push or email.
      </p>

      <div className="mt-8">
        <BroadcastComposer roster={roster} />
      </div>
    </main>
  );
}
