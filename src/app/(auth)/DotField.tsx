"use client";

import { useEffect, useRef } from "react";

// The signature: a calm field of nodes that drift and, as they near each other,
// form and dissolve faint connections — the Tribe as a living network. Kept
// almost invisible (low alpha) so it never competes with the form. Phone-first,
// battery-conscious, and fully disabled under prefers-reduced-motion.
export default function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    // Non-null locals so nested closures keep the narrowing.
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    type Node = { x: number; y: number; vx: number; vy: number; accent: boolean };
    let nodes: Node[] = [];
    let raf = 0;

    const LINK = 116; // px distance under which a connection is drawn

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(14, Math.min(40, Math.floor((width * height) / 20000)));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        accent: i % 11 === 0, // a rare red node
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // connections first (behind the dots)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK) {
            const strength = (1 - dist / LINK) * 0.5; // fades with distance
            ctx.strokeStyle = `rgba(120,120,118,${strength})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.accent ? 2.2 : 1.6, 0, Math.PI * 2);
        ctx.fillStyle = n.accent ? "rgba(179,18,43,0.7)" : "rgba(90,90,88,0.6)";
        ctx.fill();
      }
    }

    function step() {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    build();
    if (reduce) {
      draw(); // one calm static frame
    } else {
      raf = requestAnimationFrame(step);
    }

    const onResize = () => {
      cancelAnimationFrame(raf);
      build();
      if (reduce) draw();
      else raf = requestAnimationFrame(step);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.5, pointerEvents: "none" }}
    />
  );
}
