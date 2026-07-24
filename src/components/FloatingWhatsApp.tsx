"use client";

// Persistent Manan Vasa WhatsApp action (member screens). Config-driven: the
// number comes from app_settings (manan_whatsapp_number) with a verified fallback
// passed from the server. Positioned bottom-right, ABOVE the mobile bottom nav so
// it never covers navigation, composers or CTAs. Hidden when no number configured.
export default function FloatingWhatsApp({
  number,
  prefill,
}: {
  number: string | null;
  prefill?: string;
}) {
  const digits = (number ?? "").replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;

  const href = `https://wa.me/${digits}${prefill ? `?text=${encodeURIComponent(prefill)}` : ""}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Manan Vasa on WhatsApp"
      title="Chat with Manan Vasa"
      className="group fixed right-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-30 flex h-12 w-12 items-center justify-center rounded-full bg-red text-white shadow-lg transition-transform hover:scale-105 lg:bottom-5"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.16L2 22l4.95-1.3A9.9 9.9 0 1 0 12.04 2Zm0 18.05a8.15 8.15 0 0 1-4.15-1.14l-.3-.18-2.94.77.78-2.86-.2-.3a8.16 8.16 0 1 1 7.01 3.95Zm4.5-6.1c-.25-.12-1.46-.72-1.68-.8-.23-.08-.4-.12-.56.13-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06a6.68 6.68 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62 1.53.66 2.13.72 2.9.6.46-.06 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
      </svg>
    </a>
  );
}
