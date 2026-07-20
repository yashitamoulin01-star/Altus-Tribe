"use client";

import { useEffect, useState } from "react";

// A single calm fade-up. Used to cascade the screen in — subtitle, then form,
// then footer — so the page assembles itself rather than snapping in. One motion,
// not per-element jitter. Reduced-motion renders it settled immediately.
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const matches = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    
    const animId = requestAnimationFrame(() => {
      setReduceMotion(matches);
    });

    const timeoutId = setTimeout(() => setShown(true), matches ? 0 : delay);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timeoutId);
    };
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: reduceMotion
          ? undefined
          : shown
            ? "translateY(0)"
            : "translateY(10px)",
        transition: "opacity 620ms cubic-bezier(0.22,1,0.36,1), transform 620ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {children}
    </div>
  );
}
