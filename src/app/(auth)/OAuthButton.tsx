"use client";

import { useFormStatus } from "react-dom";

// Compact social submit button. Uses the enclosing <form action={serverAction}>
// pending state to render a loading spinner, disable itself (prevents duplicate
// clicks while the OAuth redirect is being prepared) and announce aria-busy.
// Container follows the Altus light-card system; only the provider glyph keeps
// its brand identity.
export default function OAuthButton({
  label,
  ariaLabel,
  icon,
}: {
  label: string;
  ariaLabel: string;
  icon: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      aria-busy={pending}
      disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-1.5 rounded-[4px] border border-[#e1e3e4] bg-white text-[13px] font-medium text-[#111111] transition-all duration-150 hover:bg-[#fafafa] focus-visible:outline-none focus-visible:border-[#b7102a] focus-visible:ring-2 focus-visible:ring-[#b7102a]/30 active:scale-[0.97] disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? (
        <svg
          className="h-4 w-4 animate-spin text-[#9a9a9a]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : (
        icon
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}
