// Altus Tribe — service worker for Web Push delivery (P5 tail, Sprint 1 Module 5).
// Registered on demand from src/lib/push/client.ts when a member opts in. Its only
// jobs are to render an incoming push and to focus/open the right page on click.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// A push arrives as a JSON body: { title, body, link, tag }. Fall back gracefully
// if the payload is missing or not JSON so a malformed push never throws.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Altus Tribe", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Altus Tribe";
  const options = {
    body: payload.body || "",
    tag: payload.tag || undefined, // collapses duplicates for the same thread
    icon: "/logo-light.png",
    badge: "/logo-light.png",
    data: { link: payload.link || "/notifications" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clicking the notification focuses an existing tab (navigating it to the deep
// link) or opens a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(link).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    }),
  );
});
