import type { ReactNode } from 'react';
import AuthBackground from './AuthBackground';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#f8f9f8]">
      {/* Full-page animated background — MagicRings + CursorGrid.
          Pinned to the viewport (absolute inset-0) so it stays put while the
          form scrolls. */}
      <AuthBackground />
      {/* Auth content sits above the background. The content wrapper owns the
          scroll (overflow-y-auto) so a tall card (short laptop viewports) can
          scroll instead of being clipped; min-h-full + items-center keeps it
          centered when it fits. */}
      <div className="absolute inset-0 z-20 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
