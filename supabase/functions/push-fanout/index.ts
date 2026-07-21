// Altus Tribe — Web Push fan-out Edge Function (P5 tail, Sprint 1 Module 5).
//
// Invoked (fire-and-forget) by server actions after a notification row is
// created — e.g. sendMessage. For each recipient it: respects their
// notification_prefs, loads every device in push_subscriptions, and sends a
// signed Web Push. Dead endpoints (404/410) are pruned so the table self-heals.
//
// Runs on Supabase Edge Runtime (Deno). SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// are injected automatically; set the VAPID_* secrets yourself:
//
//   npx web-push generate-vapid-keys           # once, keep the pair
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... \
//     VAPID_SUBJECT=mailto:you@altustribe.com PUSH_FANOUT_SECRET=<random>
//   supabase functions deploy push-fanout
//
// The VAPID *public* key must also be exposed to the browser as
// NEXT_PUBLIC_VAPID_PUBLIC_KEY (see .env.local.example).

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

interface FanoutBody {
  recipientIds: string[];
  title: string;
  body?: string;
  link?: string;
  tag?: string;
  // Which notification_prefs flag gates delivery (default: "messages").
  prefKey?: "messages" | "announcements" | "mentions";
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@altustribe.com";
// Optional shared secret: when set, callers must send a matching x-push-secret
// header. Blocks a signed-in user from invoking the function to spam pushes.
const FANOUT_SECRET = Deno.env.get("PUSH_FANOUT_SECRET") ?? "";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (FANOUT_SECRET && req.headers.get("x-push-secret") !== FANOUT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    // Not configured yet — report cleanly so the caller's fire-and-forget is a no-op.
    return Response.json({ ok: false, reason: "vapid-unconfigured" }, { status: 200 });
  }

  let payload: FanoutBody;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const recipientIds = [...new Set(payload.recipientIds ?? [])].filter(Boolean);
  if (!recipientIds.length || !payload.title) {
    return Response.json({ ok: true, sent: 0 });
  }
  const prefKey = payload.prefKey ?? "messages";

  // Drop recipients who muted this category. (Missing prefs row = defaults on.)
  const { data: prefs } = await admin
    .from("notification_prefs")
    .select(`profile_id, ${prefKey}`)
    .in("profile_id", recipientIds);
  const muted = new Set(
    (prefs ?? [])
      .filter((p) => (p as Record<string, unknown>)[prefKey] === false)
      .map((p) => (p as { profile_id: string }).profile_id),
  );
  const targets = recipientIds.filter((id) => !muted.has(id));
  if (!targets.length) return Response.json({ ok: true, sent: 0 });

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("profile_id", targets);

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    link: payload.link ?? "/notifications",
    tag: payload.tag,
  });

  let sent = 0;
  const dead: string[] = [];
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          message,
        );
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id); // gone — prune it
      }
    }),
  );

  if (dead.length) await admin.from("push_subscriptions").delete().in("id", dead);

  return Response.json({ ok: true, sent, pruned: dead.length });
});
