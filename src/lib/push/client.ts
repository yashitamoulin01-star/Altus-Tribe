// Client-side Web Push opt-in (P5 tail, Sprint 1 Module 5). Registers the service
// worker in public/sw.js, subscribes the browser's PushManager against our VAPID
// public key, and hands the subscription to the server (registerPush) so the
// push-fanout Edge Function can reach this device. All functions are browser-only
// and degrade to a clear state when unsupported or unconfigured.

import { registerPush, unregisterPush } from "@/app/(app)/notifications/actions";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushState =
  | "unsupported" // browser can't do Web Push (e.g. iOS < 16.4, or no SW/PushManager)
  | "unconfigured" // no NEXT_PUBLIC_VAPID_PUBLIC_KEY set (push not wired for this env)
  | "denied" // user blocked notifications at the browser level
  | "off" // supported + permitted, but not subscribed on this device
  | "on"; // subscribed on this device

// VAPID keys are base64url; PushManager wants a Uint8Array.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Non-mutating read of where this device currently stands.
export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";
  if (!VAPID_PUBLIC_KEY) return "unconfigured";
  if (Notification.permission === "denied") return "denied";
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    return sub ? "on" : "off";
  } catch {
    return "off";
  }
}

// Opt this device in. Requests permission, subscribes, and persists to the DB.
export async function enablePush(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";
  if (!VAPID_PUBLIC_KEY) return "unconfigured";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast: TS types applicationServerKey as BufferSource<ArrayBuffer>, but a
      // Uint8Array over ArrayBufferLike is what the runtime accepts.
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    }));

  const json = sub.toJSON();
  const keys = json.keys ?? {};
  if (!json.endpoint || !keys.p256dh || !keys.auth) return "off";

  const { ok } = await registerPush({
    endpoint: json.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });
  return ok ? "on" : "off";
}

// Opt this device out. Unsubscribes locally and removes the stored row.
export async function disablePush(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await unregisterPush(sub.endpoint);
      await sub.unsubscribe();
    }
  } catch {
    /* best-effort; the row is also pruned server-side on a 404/410 push */
  }
  return "off";
}
