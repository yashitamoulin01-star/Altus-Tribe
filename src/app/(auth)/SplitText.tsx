"use client";

import { useEffect, useRef } from "react";

// Reveals a heading one word at a time — slow, confident, once. The motion says
// "arriving," not "loading." Honors reduced-motion by rendering instantly.
export default function SplitText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      words.forEach((w) => (w.style.opacity = "1"));
      return;
    }
    words.forEach((word, i) => {
      word.animate(
        [
          { opacity: 0, transform: "translateY(0.5em)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 620,
          delay: 90 * i,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        },
      );
    });
  }, [text]);

  return (
    <span ref={ref} className={className}>
      {text.split(" ").map((word, i) => (
        <span
          key={`${word}-${i}`}
          data-word
          style={{ display: "inline-block", opacity: 0, whiteSpace: "pre" }}
        >
          {word}
          {i < text.split(" ").length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
