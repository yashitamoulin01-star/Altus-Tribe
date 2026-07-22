import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser as getSessionUser } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

export const metadata = { title: "Under review — Altus Tribe" };

// Holding page for members whose signup is awaiting admin approval
// (invitation-only gate). Active members are bounced to their home; signed-out
// visitors go to login.
export default async function PendingPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && profile.status !== "pending") redirect("/home");

  const firstName = (profile?.full_name ?? "").split(" ")[0];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col items-center justify-center px-6 text-center">
      <p className="kicker mb-4">Awaiting approval</p>
      <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink md:text-4xl">
        {firstName ? `Thanks, ${firstName}.` : "Thanks."} You&apos;re in the queue.
      </h1>
      <p className="mt-5 text-[16px] leading-relaxed text-ink-secondary">
        Altus Tribe is invitation-only. Our team is reviewing your request — you&apos;ll
        get an email the moment you&apos;re approved, then you can build your feature and
        enter the Tribe.
      </p>
      <div className="mt-8">
        <SignOutButton className="rounded border border-hairline px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted" />
      </div>
    </main>
  );
}
