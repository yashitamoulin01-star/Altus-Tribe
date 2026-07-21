import Link from "next/link";
import AuthShell from "../AuthShell";
import SignupForm from "./SignupForm";
import ConclaveCountdown from "../ConclaveCountdown";
import OAuthButtons from "../OAuthButtons";

export default function SignupPage() {
  return (
    <AuthShell
      kicker="Request access"
      title="Join the circle."
      subtitle="Altus Tribe is invitation-only — for alumni of Manan Vasa's programs."
      showClose
      footer={
        <span>
          Already a member?{" "}
          <Link href="/login" className="text-red hover:text-red-hover">
            Sign in
          </Link>
        </span>
      }
    >
      <ConclaveCountdown />
      <OAuthButtons />
      <SignupForm />
    </AuthShell>
  );
}
