import { createClient } from "@/lib/supabase/server";
import InviteManager from "./InviteManager";

export const metadata = { title: "Invites — Altus Tribe Admin" };
export const dynamic = "force-dynamic";

export default async function AdminInvitesPage() {
  const supabase = await createClient();
  let invites: { email: string; note: string | null; createdAt: string }[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("invited_emails")
      .select("email, note, created_at")
      .order("created_at", { ascending: false });
    invites = (data ?? []).map((r) => ({
      email: r.email as string,
      note: (r.note as string) ?? null,
      createdAt: r.created_at as string,
    }));
  }

  return (
    <main className="mx-auto w-full max-w-[900px] px-6 py-8 sm:px-10">
      <p className="kicker mb-3">Invites</p>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">Invitation allowlist.</h1>
      <p className="mt-2 max-w-[58ch] text-[15px] text-ink-secondary">
        Altus Tribe is invitation-only. Only emails added here can register — everyone else is
        turned away at signup. (Final admin approval after onboarding is still required.)
      </p>
      <div className="mt-8">
        <InviteManager initial={invites} />
      </div>
    </main>
  );
}
