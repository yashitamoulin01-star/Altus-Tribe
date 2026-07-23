// Country-code phone handling (spec §3/U8). Numbers are stored as E.164 in the
// existing cell_no / alt_no / whatsapp_link columns — no schema change, no
// duplicate phone system. Legacy bare 10-digit values are treated as +91.

export interface Country {
  code: string; // ISO-ish label
  dial: string; // e.g. "91"
  name: string;
  len?: number; // expected national length (validation); omitted = 6–14 allowed
}

// Curated list — India first (default), then common Altus geographies.
export const COUNTRIES: Country[] = [
  { code: "IN", dial: "91", name: "India", len: 10 },
  { code: "US", dial: "1", name: "United States", len: 10 },
  { code: "GB", dial: "44", name: "United Kingdom" },
  { code: "AE", dial: "971", name: "UAE" },
  { code: "SG", dial: "65", name: "Singapore" },
  { code: "AU", dial: "61", name: "Australia" },
  { code: "CA", dial: "1", name: "Canada", len: 10 },
  { code: "SA", dial: "966", name: "Saudi Arabia" },
  { code: "MY", dial: "60", name: "Malaysia" },
  { code: "ZA", dial: "27", name: "South Africa" },
  { code: "DE", dial: "49", name: "Germany" },
  { code: "FR", dial: "33", name: "France" },
  { code: "NP", dial: "977", name: "Nepal" },
  { code: "LK", dial: "94", name: "Sri Lanka" },
  { code: "BD", dial: "880", name: "Bangladesh" },
];

const DIALS = [...new Set(COUNTRIES.map((c) => c.dial))].sort((a, b) => b.length - a.length);

// Split a stored value into { dial, national }. Legacy bare number → +91.
export function parsePhone(stored: string): { dial: string; national: string } {
  const v = (stored || "").trim();
  if (!v) return { dial: "91", national: "" };
  if (v.startsWith("+")) {
    const digits = v.slice(1).replace(/\D/g, "");
    const dial = DIALS.find((d) => digits.startsWith(d)) ?? "91";
    return { dial, national: digits.slice(dial.length) };
  }
  return { dial: "91", national: v.replace(/\D/g, "") };
}

export function composePhone(dial: string, national: string): string {
  const n = (national || "").replace(/\D/g, "");
  return n ? `+${dial}${n}` : "";
}

// Valid if the national length matches the country (when known) or is 6–14 digits.
export function isValidPhone(stored: string): boolean {
  const { dial, national } = parsePhone(stored);
  if (!national) return false;
  const country = COUNTRIES.find((c) => c.dial === dial);
  if (country?.len) return national.length === country.len;
  return national.length >= 6 && national.length <= 14;
}

// Digits-only E.164 (no +) for wa.me links.
export function toWaNumber(stored: string): string {
  const { dial, national } = parsePhone(stored);
  return national ? `${dial}${national}` : "";
}
