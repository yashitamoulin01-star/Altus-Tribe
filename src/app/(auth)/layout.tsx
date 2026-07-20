import type { ReactNode } from 'react';
import AuthBackground from './AuthBackground';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#f8f9f8]">
      {/* Full-page animated background — MagicRings + CursorGrid */}
      <AuthBackground />
      {/* Auth content sits above the background */}
      <div className="relative z-20 flex h-screen items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}
