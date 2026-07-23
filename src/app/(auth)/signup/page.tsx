import Link from "next/link";
import { redirect as goTo } from "next/navigation";
import { getUser } from "@/lib/auth";
import AuthShell from "../AuthShell";
import SignupForm from "./SignupForm";
import ConclaveCountdown from "../ConclaveCountdown";
import OAuthButtons from "../OAuthButtons";

export const metadata = { title: "Request Access — Altus Tribe" };

export default async function SignupPage() {
  // Already signed in? Don't show signup — go into the app.
  if (await getUser()) goTo("/home");
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
