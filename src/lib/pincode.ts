"use client";

// Pincode → city/state/country lookup (spec §K). An enhancement, never a source
// of truth: on failure it returns null and the member fills the fields manually.
// Uses the free India Post API (no key). Results are cached per-pin for the session.
export interface PincodeResult {
  city: string;
  state: string;
  country: string;
}

const cache = new Map<string, PincodeResult | null>();

export async function lookupPincode(pin: string): Promise<PincodeResult | null> {
  const code = pin.trim();
  if (!/^\d{6}$/.test(code)) return null; // India PIN is 6 digits
  if (cache.has(code)) return cache.get(code) ?? null;

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
      // Never let a slow lookup hang the form.
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error("lookup failed");
    const data = (await res.json()) as {
      Status: string;
      PostOffice?: { District?: string; State?: string; Country?: string }[];
    }[];
    const office = data?.[0]?.Status === "Success" ? data[0].PostOffice?.[0] : undefined;
    const result: PincodeResult | null = office
      ? {
          city: office.District ?? "",
          state: office.State ?? "",
          country: office.Country ?? "India",
        }
      : null;
    cache.set(code, result);
    return result;
  } catch {
    cache.set(code, null);
    return null;
  }
}
