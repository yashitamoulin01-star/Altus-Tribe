import { NextResponse, type NextRequest } from "next/server";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";

// Clerk → Supabase user sync. Clerk posts user.created / user.updated /
// user.deleted here; we verify the Svix signature and upsert the matching
// profiles row (keyed by clerk_id) using the service-role key (bypasses RLS).
// Requires: CLERK_WEBHOOK_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

interface ClerkUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  primary_email_address_id: string | null;
  email_addresses: { id: string; email_address: string }[];
  unsafe_metadata?: { full_name?: string };
}
type ClerkEvent =
  | { type: "user.created" | "user.updated"; data: ClerkUser }
  | { type: "user.deleted"; data: { id: string } };

function slugify(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "member";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !url || !serviceKey) {
    return NextResponse.json({ error: "not-configured" }, { status: 500 });
  }

  const payload = await req.text();
  let evt: ClerkEvent;
  try {
    evt = new Webhook(secret).verify(payload, {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    }) as ClerkEvent;
  } catch {
    return NextResponse.json({ error: "invalid-signature" }, { status: 400 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const u = evt.data;
    const email =
      u.email_addresses.find((e) => e.id === u.primary_email_address_id)?.email_address ??
      u.email_addresses[0]?.email_address ??
      null;
    const fullName =
      [u.first_name, u.last_name].filter(Boolean).join(" ") ||
      u.unsafe_metadata?.full_name ||
      "Member";

    if (evt.type === "user.created") {
      await admin.from("profiles").upsert(
        {
          clerk_id: u.id,
          slug: slugify(fullName),
          full_name: fullName,
          personal_email: email,
          status: "pending",
          role: "member",
        },
        { onConflict: "clerk_id" },
      );
    } else {
      await admin
        .from("profiles")
        .update({ full_name: fullName, personal_email: email })
        .eq("clerk_id", u.id);
    }
  } else if (evt.type === "user.deleted") {
    await admin.from("profiles").delete().eq("clerk_id", evt.data.id);
  }

  return NextResponse.json({ ok: true });
}
