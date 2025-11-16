// =============================
// 0. KONFIGURASI
// =============================
const CACHE_NAME = "mystory-cache-v3";

// Semua file di /public
const STATIC_ASSETS = [
//   "/",
//   "/index.html",
//   "/offline.html",
//   "/manifest.json",
//   "/favicon.png",
//   // "/styles/styles.css",
//   "/icons/icon-192.png",
//   "/icons/icon-512.png",
// ];
    '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/styles/styles.css',
  '/scripts/index.js',
  '/scripts/routes/routes.js',
  '/scripts/pages/home/home-page.js',
  '/scripts/pages/add-story/add-story-page.js',
  '/scripts/pages/login/login-page.js',
  '/scripts/pages/register/register-page.js',
  '/scripts/pages/favorite/favorite-page.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// =============================
// 1. INSTALL — CACHE STATIC FILE
// =============================
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME ).then(cache => cache.addAll(STATIC_ASSETS))
  );
});


// =============================
// 2. ACTIVATE — HAPUS CACHE LAMA
// =============================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

// =============================
// 3. FETCH HANDLER
// =============================
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;

  // API Dicoding (network-first)
  if (url.origin === "https://story-api.dicoding.dev") {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // File /assets/* (Vite build)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;

        return fetch(req)
          .then(res => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
            return res;
          })
          .catch(() => null);
      })
    );
    return;
  }

  // Navigasi halaman SPA (fallback offline)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Asset selain /assets → cache-first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => null);
    })
  );
});

// =============================
// 4. PUSH NOTIFICATION
// =============================
self.addEventListener("push", (event) => {
  console.log("Push received!");

  const data = event.data?.json() || {};
  const title = data.title || "Cerita Baru!";

  const options = {
    body: data?.options?.body || data?.body || "Ada cerita baru",
    icon: data?.icon || "/icons/icon-192.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// =============================
// 5. NOTIFICATION CLICK
// =============================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windows) => {
      if (windows.length > 0) return windows[0].focus();
      return clients.openWindow("/");
    })
  );
});
