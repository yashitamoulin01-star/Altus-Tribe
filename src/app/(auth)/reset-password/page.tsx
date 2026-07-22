import AuthShell from "../AuthShell";
import ResetForm from "./ResetForm";

export const metadata = { title: "Set a New Password — Altus Tribe" };

// Reached from /forgot-password after a reset code is emailed. Clerk keeps the
// in-progress sign-in attempt on the client; ResetForm collects the code + new
// password and completes it. No server session handling needed.
export default function ResetPasswordPage() {
  return (
    <AuthShell
      kicker="Reset password"
      title="Choose a new password."
      subtitle="Enter the code we emailed you and pick a new password."
    >
      <ResetForm />
    </AuthShell>
  );
}
