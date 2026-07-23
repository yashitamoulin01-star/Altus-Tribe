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

// Max 20 MB per file (spec §1). Note: this is the client-side guard; the true
// server-side cap is the Supabase bucket `file_size_limit` (see docs — set to
// 20971520). MIME allow-lists per upload context.
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
const DOC_TYPES = [...IMAGE_TYPES, "application/pdf"];

// Uploads a file into `bucket` under `<profileId>/<random>.<ext>`. Validates size
// and MIME type first. `allow` = "image" (photos/logos) or "doc" (brochures: img+pdf).
export async function uploadFile(
  bucket: string,
  profileId: string,
  file: File,
  opts?: { allow?: "image" | "doc" },
): Promise<UploadResult> {
  const supabase = createClient();
  if (!supabase) return { ok: false, error: "not-configured" };

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `That file is ${(file.size / 1_048_576).toFixed(1)} MB. The maximum is 20 MB.`,
    };
  }
  const allowed = opts?.allow === "image" ? IMAGE_TYPES : DOC_TYPES;
  if (file.type && !allowed.includes(file.type)) {
    return {
      ok: false,
      error:
        opts?.allow === "image"
          ? "Please upload an image (JPG, PNG, WebP, or GIF)."
          : "Please upload a PDF or an image.",
    };
  }

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
