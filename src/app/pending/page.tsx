import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";

export const metadata = { title: "Under review — Altus Tribe" };

// Holding page for members whose signup is awaiting admin approval
// (invitation-only gate). Active members are bounced to their home; signed-out
// visitors go to login.
export default async function PendingPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const user = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, full_name, review_state, review_note")
    .eq("id", user.id)
    .maybeSingle();

  // Approved members (active/hidden) go home; only pending & inactive stay here.
  const status = profile?.status;
  if (profile && status !== "pending" && status !== "inactive") redirect("/home");

  const firstName = (profile?.full_name ?? "").split(" ")[0];
  const rejected = status === "inactive";
  const changesRequested =
    !rejected && profile?.review_state === "changes_requested" && Boolean(profile?.review_note);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col items-center justify-center px-6 text-center">
      <p className="kicker mb-4">{rejected ? "Access unavailable" : changesRequested ? "Action needed" : "Awaiting approval"}</p>
      <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink md:text-4xl">
        {rejected
          ? "Your access isn't active."
          : changesRequested
            ? firstName
              ? `${firstName}, a quick update needed.`
              : "A quick update needed."
            : `${firstName ? `Thanks, ${firstName}.` : "Thanks."} You're in the queue.`}
      </h1>
      {rejected ? (
        <p className="mt-5 text-[16px] leading-relaxed text-ink-secondary">
          Your Altus Tribe membership isn&apos;t currently active. If you believe this is a
          mistake, please reach out to the team.
        </p>
      ) : changesRequested ? (
        <>
          <p className="mt-5 text-[16px] leading-relaxed text-ink-secondary">
            Our team reviewed your request and asked for a few changes before approving:
          </p>
          <p className="mt-4 w-full rounded border border-hairline-bright bg-surface-sunk px-4 py-3 text-left text-[15px] leading-relaxed text-ink">
            {profile?.review_note}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-secondary">
            Update your profile, and we&apos;ll take another look.
          </p>
        </>
      ) : (
        <p className="mt-5 text-[16px] leading-relaxed text-ink-secondary">
          Altus Tribe is invitation-only. Our team is reviewing your request — we&apos;ll
          notify you the moment you&apos;re approved, then you can enter the Tribe.
        </p>
      )}
      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="rounded border border-hairline px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink-muted"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
