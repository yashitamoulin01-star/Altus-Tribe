"use client";

import { useEffect } from "react";

// Root error boundary — replaces the entire layout (incl. <html>/<body>) when the
// root itself fails. Kept self-contained with inline styles since global CSS may
// not be available at this level.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf9f7",
          color: "#1a1a1a",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}>
          Something went badly wrong.
        </h1>
        <p style={{ marginTop: 16, maxWidth: "42ch", color: "#555", lineHeight: 1.4 }}>
          The application hit an unexpected error. Please reload the page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 28,
            border: "none",
            borderRadius: 8,
            background: "#c8102e",
            color: "#fff",
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
        {error.digest && (
          <p style={{ marginTop: 24, fontFamily: "monospace", fontSize: 11, color: "#999" }}>
            Ref: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
