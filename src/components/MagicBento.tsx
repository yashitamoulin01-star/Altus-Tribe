"use client";

import React, { useRef, useState } from "react";
import { motion } from "motion/react";

interface MagicBentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function MagicBentoGrid({ children, className = "" }: MagicBentoGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 ${className}`}>
      {children}
    </div>
  );
}

interface MagicBentoCardProps {
  children: React.ReactNode;
  className?: string;
  span?: string; // e.g. "col-span-1 md:col-span-2"
  accentBorder?: boolean;
  glowOnHover?: boolean;
}

export function MagicBentoCard({
  children,
  className = "",
  span = "col-span-1",
  accentBorder = false,
  glowOnHover = true,
}: MagicBentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !glowOnHover) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setCursor((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative overflow-hidden rounded-xl border bg-surface/90 p-5 backdrop-blur-md transition-all duration-300 ${
        accentBorder
          ? "border-red/40 hover:border-red/70 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
          : "border-hairline hover:border-hairline-bright hover:shadow-xl hover:shadow-black/40"
      } ${span} ${className}`}
    >
      {/* Interactive Cursor Spotlight Glow */}
      {glowOnHover && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity: cursor.opacity,
            background: `radial-gradient(400px circle at ${cursor.x}px ${cursor.y}px, rgba(239, 68, 68, 0.08), transparent 80%)`,
          }}
        />
      )}

      {/* Subtle Top Red Hairline for Accent */}
      {accentBorder && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red to-transparent opacity-80" />
      )}

      <div className="relative z-10 flex h-full flex-col justify-between">
        {children}
      </div>
    </motion.div>
  );
}

export function MagicBentoHeader({
  title,
  subtitle,
  kicker,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  kicker?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        {kicker && <p className="kicker mb-1">{kicker}</p>}
        <div className="flex items-center gap-2">
          {icon && <span className="text-red">{icon}</span>}
          <h3 className="text-base font-semibold tracking-tight text-ink">{title}</h3>
        </div>
        {subtitle && (
          <p className="mt-0.5 text-xs text-ink-secondary leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
