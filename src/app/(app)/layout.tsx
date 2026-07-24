import AppNav from "@/components/AppNav";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { getPublicSettings } from "@/lib/settings";
import { MANAN_WHATSAPP_NUMBER, MANAN_WHATSAPP_PREFILL } from "@/lib/settings-meta";

// Shell for the authenticated "worlds" (Tribe · Sacred Space · Campus · You).
// Route groups don't affect URLs, so /home, /explore, /account etc. are unchanged.
// The nav is fixed; padding here keeps content clear of the top bar (desktop)
// and the bottom nav (mobile, incl. the safe-area inset). A persistent Manan Vasa
// WhatsApp action floats bottom-right (config-driven, above the mobile nav).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  const whatsappNumber = settings.manan_whatsapp_number || MANAN_WHATSAPP_NUMBER;
  const whatsappPrefill = settings.manan_whatsapp_prefill || MANAN_WHATSAPP_PREFILL;

  return (
    <div className="flex min-h-full flex-col lg:pt-14">
      <div className="flex flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>
      <AppNav />
      <FloatingWhatsApp number={whatsappNumber} prefill={whatsappPrefill} />
    </div>
  );
}
