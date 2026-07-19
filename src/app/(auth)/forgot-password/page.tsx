import Link from "next/link";
import AuthShell from "../AuthShell";
import ForgotForm from "./ForgotForm";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <AuthShell
      kicker="Reset password"
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a secure reset link."
      footer={
        <Link href="/login" className="text-red hover:text-red-hover">
          ← Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="rounded border border-hairline bg-surface-sunk px-4 py-3 text-[15px] text-ink-secondary">
          If that email is in the Tribe, a reset link is on its way.
        </p>
      ) : (
        <ForgotForm />
      )}
    </AuthShell>
  );
}
