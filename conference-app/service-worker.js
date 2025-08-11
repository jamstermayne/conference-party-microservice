const CACHE_NAME = "velocity-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/assets/css/reset.css",
  "/assets/css/variables.css",
  "/assets/css/layout.css",
  "/assets/css/components.css",
  "/assets/css/animations.css",
  "/assets/css/accessibility.css",
  "/assets/js/app.js",
  "/assets/js/ftue.js",
  "/assets/js/parties.js",
  "/assets/js/invites.js",
  "/assets/js/calendar.js",
  "/assets/js/profile.js",
  "/assets/js/settings.js",
  "/assets/js/persistence.js",
  "/assets/js/ui.js",
  "/assets/js/api.js",
  "/data/parties.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});