"use server";

import { headers } from "next/headers";
import { requestAccessService } from "@/lib/access/container";
import { GENERIC_REQUEST_RESPONSE, type RequestPayload } from "@/lib/access/types";

async function callerIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : h.get("x-real-ip") ?? "").trim() || "unknown";
}

// Anti-enumeration: ALWAYS returns the identical generic message. The service
// dispatches a magic link only on a real, eligible match. Rate limited inside
// the service (5/IP/hr, 3/email/day).
export async function requestAccess(email: string): Promise<{ message: string }> {
  const ip = await callerIp();
  try {
    const r = await requestAccessService().requestAccess(email, ip);
    return { message: r.message };
  } catch {
    // Never leak internal errors through this endpoint — respond generically.
    return { message: GENERIC_REQUEST_RESPONSE };
  }
}

// Step 4/5: submit the completed profile (reached via the magic link in the real
// flow). Resume bytes upload to private storage is deferred (checklist §C) — the
// mock records only the file name here.
export async function submitAccessProfile(input: {
  email: string;
  payload: RequestPayload;
  resumePath: string | null;
}): Promise<{ ok: true; requestId: string } | { ok: false; missing?: string[]; error?: string }> {
  const ip = await callerIp();
  try {
    const r = await requestAccessService().submitProfile({ ...input, ip });
    return r.ok ? { ok: true, requestId: r.requestId } : { ok: false, missing: r.missing };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
