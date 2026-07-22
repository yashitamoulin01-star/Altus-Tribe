"use client";

import { useClerk } from "@clerk/nextjs";

// Clerk sign-out, styled by the caller (className preserved so existing button
// styling is unchanged). Clears the Clerk session and returns to /login.
export default function SignOutButton({
  className,
  children = "Sign out",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      className={className}
      onClick={() => signOut({ redirectUrl: "/login" })}
    >
      {children}
    </button>
  );
}
