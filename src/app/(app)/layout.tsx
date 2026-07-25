import AppShell from "@/components/AppShell";
import { getPublicSettings } from "@/lib/settings";
import { MANAN_WHATSAPP_NUMBER, MANAN_WHATSAPP_PREFILL } from "@/lib/settings-meta";

// Shell for the authenticated "worlds" (Tribe · Sacred Space · Campus · You).
// Features collapsible desktop left sidebar, responsive top header, mobile bottom nav.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  const whatsappNumber = settings.manan_whatsapp_number || MANAN_WHATSAPP_NUMBER;
  const whatsappPrefill = settings.manan_whatsapp_prefill || MANAN_WHATSAPP_PREFILL;

  return (
    <AppShell whatsappNumber={whatsappNumber} whatsappPrefill={whatsappPrefill}>
      {children}
    </AppShell>
  );
}
