import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthShell from "../AuthShell";
import ResetForm from "./ResetForm";

export const metadata = { title: "Set a New Password — Altus Tribe" };

// Reached via the emailed reset link. The Supabase recovery session is
// established by the /auth/callback handler before landing here.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; token_hash?: string; type?: string; error?: string }>;
}) {
  const params = await searchParams;

  // Forward any code or token_hash passed directly to /reset-password
  if (params.code || params.token_hash) {
    const query = new URLSearchParams();
    query.set("next", "/reset-password");
    if (params.code) query.set("code", params.code);
    if (params.token_hash) query.set("token_hash", params.token_hash);
    if (params.type) query.set("type", params.type);
    redirect(`/auth/callback?${query.toString()}`);
  }

  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && !params.error) {
      redirect("/login?error=" + encodeURIComponent("Session expired or missing. Please request a new password reset link."));
    }
  }

  return (
    <AuthShell
      kicker="Reset password"
      title="Choose a new password."
      subtitle="Pick something you'll remember — you'll use it to sign in next time."
    >
      {params.error ? (
        <div className="space-y-4">
          <p className="text-[14px] text-red">{params.error}</p>
          <a href="/forgot-password" className="inline-block text-[13px] font-medium text-[#111111] underline">
            Request a new password reset link
          </a>
        </div>
      ) : (
        <ResetForm />
      )}
    </AuthShell>
  );
}

