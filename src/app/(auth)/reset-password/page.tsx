import AuthShell from "../AuthShell";
import ResetForm from "./ResetForm";

// Reached via the emailed reset link. The Supabase recovery session is
// established by the /auth/callback handler before landing here.
export default function ResetPasswordPage() {
  return (
    <AuthShell
      kicker="Reset password"
      title="Choose a new password."
      subtitle="Pick something you'll remember — you'll use it to sign in next time."
    >
      <ResetForm />
    </AuthShell>
  );
}
