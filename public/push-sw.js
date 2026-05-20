// ── Aggressive cache purge on activate ──
// This runs inside the Workbox SW. On every activation, nuke ALL runtime
// caches (html-cache, assets-cache, etc.) so stale HTML is never served.
// The Workbox precache is handled separately by cleanupOutdatedCaches.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k.includes("html-cache") || k.includes("assets-cache"))
          .map((k) => caches.delete(k))
      );
    }).then(() => {
      // Force all open tabs to use this new SW immediately
      return self.clients.claim();
    }).then(() => {
      // Tell all controlled pages to reload so they get fresh HTML
      return self.clients.matchAll({ type: "window" }).then((windowClients) => {
        windowClients.forEach((client) => {
          client.postMessage({ type: "SW_UPDATED" });
        });
      });
    })
  );
});

// Push notification handler — loaded by the Workbox service worker via importScripts
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body || "",
      icon: data.icon || "/pwa-192x192.png",
      badge: data.badge || "/pwa-64x64.png",
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        { action: "open", title: "View Trip" },
        { action: "dismiss", title: "Dismiss" },
      ],
      // Per-event tag (e.g. "BR51-gate", "BR51-baggage") so distinct events for
      // the same flight each persist separately, while repeated updates of the
      // SAME event (gate 31 → 42) replace in place instead of stacking stale info.
      // Falls back to flightNumber, then a generic tag.
      tag: data.data?.tag || data.data?.flightNumber || "flight-alert",
      // Keep the alert from auto-dismissing where supported (Android/desktop).
      // iOS ignores this but already keeps notifications in Notification Center
      // and on the lock screen until the user clears them.
      requireInteraction: true,
      renotify: true,
    };
    event.waitUntil(self.registration.showNotification(data.title || "Continuum", options));
  } catch (e) {
    console.error("Push handler error:", e);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("gocontinuum.app") && "focus" in client) return client.focus();
      }
      return clients.openWindow("https://gocontinuum.app");
    })
  );
});
