import AppNav from "@/components/AppNav";

// Shell for the authenticated "worlds" (Tribe · Sacred Space · Campus · You).
// Route groups don't affect URLs, so /home, /explore, /account etc. are unchanged.
// The nav is fixed; padding here keeps content clear of the top bar (desktop)
// and the bottom nav (mobile, incl. the safe-area inset).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col lg:pt-14">
      <div className="flex flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>
      <AppNav />
    </div>
  );
}
