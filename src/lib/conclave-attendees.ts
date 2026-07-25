import "server-only";
import { createClient } from "@/lib/supabase/server";

// Conclave attendee directory (admin-only). Rows are loaded via an out-of-repo
// seed (PII). Graceful when unmigrated → empty.

export interface ConclaveAttendee {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  business: string | null;
  conclave: string | null;
}

export async function getConclaveAttendees(): Promise<ConclaveAttendee[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("conclave_attendees")
    .select("id, full_name, email, phone, business, conclave")
    .order("full_name", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as string,
    fullName: (r.full_name as string) ?? "",
    email: (r.email as string) ?? null,
    phone: (r.phone as string) ?? null,
    business: (r.business as string) ?? null,
    conclave: (r.conclave as string) ?? null,
  }));
}
