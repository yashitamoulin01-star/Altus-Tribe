"use client";

import { useEffect, useRef } from "react";
import { recordProfileView } from "../actions";

// Fires a single profile-view record on mount (a viewer, not the owner). The
// action self-guards for signed-out/self/offline, so this is safe to render for
// anyone. Renders nothing.
export default function ViewPing({ ownerId }: { ownerId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void recordProfileView(ownerId);
  }, [ownerId]);
  return null;
}
