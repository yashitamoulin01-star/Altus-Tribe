// Opens a WhatsApp chat with Manan Vasa & team directly. WhatsApp is where the
// Tribe actually talks, so "Ask Manan Vasa" hands off to it with a prefilled
// greeting rather than the in-app support thread.
const WHATSAPP_NUMBER = "918097010410"; // +91 80970 10410 (E.164, no symbols)
const PREFILL = "Hi Manan Vasa, this is a message from the Altus Tribe portal. ";

export default function AskManan() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PREFILL)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 inline-flex items-center gap-2 rounded bg-red px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-red-hover"
    >
      Ask Manan Vasa / Team on WhatsApp →
    </a>
  );
}
