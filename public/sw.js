const CACHE_VERSION = "v0.8.1";
const CACHE_NAME = `fitnote-cache-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `fitnote-data-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";
const ASSETS = [
  "/",
  "/builder",
  "/timers",
  "/archive",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  OFFLINE_URL,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(ASSETS);
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            return caches.delete(key);
          }
          return undefined;
        })
      )
    )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cachedResponse) => cachedResponse || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cachedResponse) => {
          const networkFetch = fetch(event.request)
            .then((response) => {
              cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => undefined);

          return cachedResponse || networkFetch;
        })
      )
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(fetch(event.request));
});
