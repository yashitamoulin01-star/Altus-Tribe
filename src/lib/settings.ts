import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// App-settings data layer. Reads are graceful: if the table isn't migrated yet
// (or Supabase is unconfigured), every getter returns an empty map so member and
// admin surfaces render with their fallbacks instead of crashing.

export type Settings = Record<string, string>;

const schemaMissing = (e: { code?: string } | null) =>
  e?.code === "PGRST205" || e?.code === "42P01";

// Public (member-readable) settings — ONE query, cached per request so several
// member surfaces can call it without an N+1. RLS also restricts this to public
// rows for non-admins; the is_public filter keeps it cheap and explicit.
export const getPublicSettings = cache(async (): Promise<Settings> => {
  const supabase = await createClient();
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .eq("is_public", true);
  if (error || !data) {
    if (error && !schemaMissing(error)) return {};
    return {};
  }
  const out: Settings = {};
  for (const r of data) {
    const v = r.value as string | null;
    if (v) out[r.key as string] = v;
  }
  return out;
});

// All settings (admin editor). Includes empty values so every canonical key
// renders an input.
export async function getAllSettings(): Promise<Settings> {
  const supabase = await createClient();
  if (!supabase) return {};
  const { data, error } = await supabase.from("app_settings").select("key, value");
  if (error || !data) return {};
  const out: Settings = {};
  for (const r of data) out[r.key as string] = (r.value as string) ?? "";
  return out;
}
