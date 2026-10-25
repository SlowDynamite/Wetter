// Service Worker: legt die App-Dateien zwischen, damit die Oberfläche schnell und auch offline startet.
// Wetterdaten (api.brightsky.dev) werden nie zwischengespeichert, sondern immer live geladen.
const CACHE = "wetter-v3";
const FILES = ["./", "index.html", "manifest.webmanifest", "suncalc.js", "icon-192.png", "icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return; // API-Aufrufe unverändert durchlassen

  // App-Dateien: aus dem Cache antworten, im Hintergrund aktualisieren
  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req, { ignoreSearch: true }).then(cached => {
        const fresh = fetch(req).then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fresh;
      })
    )
  );
});
