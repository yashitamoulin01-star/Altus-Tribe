"use client";

import { useEffect, useRef, useState } from "react";

// Cloudflare Turnstile bot-protection widget. Renders only when
// NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so the app works locally / before the
// key is provisioned. Emits the token via a hidden <input name="captchaToken">
// (picked up by form-action submits) and an optional onToken callback (for
// imperative calls like the magic-link button). Enable it in Supabase:
// Auth → Settings → Bot & Abuse Protection → Turnstile, with the matching secret.

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener("load", () => resolve());
    document.head.appendChild(s);
  });
}

export default function CaptchaField({
  onToken,
}: {
  onToken?: (token: string) => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let widgetId: string | undefined;
    let cancelled = false;
    const el = containerRef.current;

    loadScript().then(() => {
      if (cancelled || !window.turnstile || !el) return;
      widgetId = window.turnstile.render(el, {
        sitekey: siteKey,
        callback: (t) => {
          setToken(t);
          onToken?.(t);
        },
        "expired-callback": () => {
          setToken("");
          onToken?.("");
        },
        "error-callback": () => {
          setToken("");
          onToken?.("");
        },
      });
    });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
    // onToken is expected to be stable; re-rendering the widget on each change
    // would reset the challenge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <div ref={containerRef} />
      <input type="hidden" name="captchaToken" value={token} />
    </>
  );
}
