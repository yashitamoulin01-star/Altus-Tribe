import AppShell from "@/components/AppShell";
import { getPublicSettings } from "@/lib/settings";
import { MANAN_WHATSAPP_NUMBER, MANAN_WHATSAPP_PREFILL } from "@/lib/settings-meta";
import { getMyProfileSummary } from "@/lib/dashboard";
import { getUnreadCount } from "@/lib/notifications";
import { getAdminContext } from "@/lib/admin";
import { initials } from "./home/widgets/_shared";

// Shell for the authenticated "worlds" (Tribe · Sacred Space · Campus · You).
// Passes the REAL signed-in participant's identity + unread count to the shell
// (no hardcoded names). Manan Vasa WhatsApp is config-driven with a verified
// fallback (never a placeholder number).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [settings, me, unread, admin] = await Promise.all([
    getPublicSettings(),
    getMyProfileSummary(),
    getUnreadCount(),
    getAdminContext(),
  ]);

  const whatsappNumber = settings.manan_whatsapp_number || MANAN_WHATSAPP_NUMBER;
  const whatsappPrefill = settings.manan_whatsapp_prefill || MANAN_WHATSAPP_PREFILL;
  const userName = me.fullName || me.businessName || "Participant";

  return (
    <AppShell
      whatsappNumber={whatsappNumber}
      whatsappPrefill={whatsappPrefill}
      userName={userName}
      userInitials={initials(userName) || "·"}
      userPhoto={me.photoUrl}
      completion={me.completion}
      profileSlug={me.slug}
      requiredComplete={me.requiredComplete}
      unread={unread}
      isAdmin={admin.isAdmin}
    >
      {children}
    </AppShell>
  );
}
