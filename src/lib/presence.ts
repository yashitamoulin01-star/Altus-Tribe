"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Online-members presence (Tribe). Each signed-in client joins a shared Supabase
// Realtime presence channel and tracks its own profile id; every client then reads
// the channel's presence state to know who else is online. Degrades gracefully:
// when Supabase isn't configured (offline dev) the set is simply empty.
export function useOnlineMembers(currentUserId: string | null): Set<string> {
  const [online, setOnline] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase.channel("online-members", {
      config: { presence: { key: currentUserId } },
    });

    const sync = () => {
      const state = channel.presenceState();
      setOnline(new Set(Object.keys(state)));
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return online;
}
