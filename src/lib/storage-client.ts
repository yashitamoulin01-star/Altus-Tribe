"use client";

import { createClient } from "@/lib/supabase/client";

// Object paths are prefixed with the owner's profile id so storage RLS can key
// off the first path segment (see supabase/migrations/*_storage.sql).
export type UploadResult =
  | { ok: true; path: string; publicUrl: string | null }
  | { ok: false; error: string };

const safeExt = (name: string) => {
  const ext = name.split(".").pop() ?? "";
  return /^[a-z0-9]{1,5}$/i.test(ext) ? ext.toLowerCase() : "bin";
};

// Uploads a file into `bucket` under `<profileId>/<random>.<ext>`. Returns the
// storage path plus a public URL (only meaningful for public buckets).
export async function uploadFile(
  bucket: string,
  profileId: string,
  file: File,
): Promise<UploadResult> {
  const supabase = createClient();
  if (!supabase) return { ok: false, error: "not-configured" };

  const path = `${profileId}/${crypto.randomUUID()}.${safeExt(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { ok: true, path, publicUrl: data?.publicUrl ?? null };
}
