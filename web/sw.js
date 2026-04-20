// SnapScan service worker — cache-first shell, network-first for OFF API.
const VERSION = "snapscan-v4";
const SHELL = [
  "./",
  "./index.html",
  "./privacy.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./js/i18n.js",
  "./js/states.js",
  "./js/categories.js",
  "./js/data-items.js",
  "./js/off.js",
  "./js/scanner.js",
  "./js/consent.js",
  "./js/app.js",
  "./icons/icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Network-first for OFF API (fresh data); fall back to cache
  if (url.hostname.includes("openfoodfacts.org") || url.hostname.includes("ipapi.co")) {
    e.respondWith(
      fetch(e.request).then((r) => {
        const copy = r.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for shell
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ||
      fetch(e.request).then((r) => {
        if (e.request.method === "GET" && r.status === 200 && url.origin === location.origin) {
          const copy = r.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return r;
      }).catch(() => cached)
    )
  );
});
