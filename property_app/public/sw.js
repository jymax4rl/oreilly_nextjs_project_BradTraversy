/* Minimal service worker — satisfies Chromium installability.
   Keep fetch handler present; network-first for navigations. */
const CACHE = "isisel-shell-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error("offline");
      }
    })(),
  );
});

async function setIconBadge(count) {
  try {
    if (count > 0 && self.navigator?.setAppBadge) {
      await self.navigator.setAppBadge(count);
    } else if (self.navigator?.clearAppBadge) {
      await self.navigator.clearAppBadge();
    }
  } catch {
    /* Badging API is optional (desktop Chrome, older iOS). */
  }
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text?.() || "" };
  }
  const title = data.title || "Isisel";
  const options = {
    body: data.body || "You have a new reservation.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || "isisel-reservation",
    renotify: true,
    data: { url: data.url || "/host" },
  };
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, options);
      const notes = await self.registration.getNotifications();
      const fromPayload = Number(data.badge);
      const count =
        Number.isFinite(fromPayload) && fromPayload > 0
          ? fromPayload
          : Math.max(1, notes.length);
      await setIconBadge(count);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/host";
  event.waitUntil(
    (async () => {
      const notes = await self.registration.getNotifications();
      await Promise.all(notes.map((n) => n.close()));
      await setIconBadge(0);
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of all) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            await client.navigate(url);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(url);
      }
    })(),
  );
});
