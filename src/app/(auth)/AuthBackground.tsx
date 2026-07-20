'use client';

import CursorGrid from '@/components/CursorGrid';
import MagicRings from '@/components/MagicRings';

/**
 * Full-page animated background for all auth screens.
 * Layer 1 (bottom): MagicRings — slow, branded red rings, very subtle opacity.
 * Layer 2 (top):    CursorGrid — cursor-reactive grid that follows mouse.
 * Both are pointer-events-none so they never interfere with the form.
 */
export default function AuthBackground() {
  return (
    <>
      {/* MagicRings — atmospheric depth */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <MagicRings
          color="#b3122b"
          colorTwo="#5f5f5f"
          ringCount={5}
          speed={0.5}
          attenuation={9}
          lineThickness={2.5}
          baseRadius={0.28}
          radiusStep={0.12}
          scaleRate={0.08}
          opacity={1}
          noiseAmount={0.04}
          ringGap={1.4}
          fadeIn={0.8}
          fadeOut={0.55}
          followMouse={false}
          parallax={0}
          clickBurst={false}
        />
      </div>

      {/* CursorGrid — cursor-reactive overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <CursorGrid
          cellSize={60}
          color="#b3122b"
          radius={130}
          falloff="smooth"
          holdTime={350}
          fadeDuration={900}
          lineWidth={1}
          maxOpacity={0.6}
          fillOpacity={0.08}
          gridOpacity={0.08}
          cellRadius={2}
          clickPulse={true}
          pulseSpeed={550}
        />
      </div>
    </>
  );
}
