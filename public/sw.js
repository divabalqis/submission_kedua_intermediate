/* eslint-disable no-restricted-globals */

// =============================
// 0. KONFIGURASI
// =============================
const CACHE_NAME = "mystory-cache-v5";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",

  // Static file yang tidak berubah
  "/manifest.json",
  "/favicon.png",
  "/styles.css",

  // Ikon
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// =============================
// 1. INSTALL — CACHE STATIC FILE
// =============================
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        await cache.addAll(STATIC_ASSETS);
        console.log("📌 Semua asset berhasil dicache!");
      } catch (err) {
        console.error("❌ Gagal cache:", err);
      }
    })()
  );

  self.skipWaiting();
});


// =============================
// 2. ACTIVATE — HAPUS CACHE LAMA
// =============================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// =============================
// 3. FETCH HANDLER (OFFLINE READY)
// =============================
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;

  // =============================
  // A. API Dicoding → Network first
  // =============================
  if (url.origin === "https://story-api.dicoding.dev") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Simpan response API supaya offline tetap bisa baca data terakhir
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req)) // fallback ke data terakhir
    );
    return;
  }

  // =============================
  // B. Asset build /assets/* → Cache first
  // =============================
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req)
          .then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            return res;
          })
          .catch(() => null);
      })
    );
    return;
  }

  // =============================
  // C. Navigasi SPA → index.html fallback
  // =============================
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => res)
        .catch(() => {
          // jika offline → pakai index.html versi cache agar SPA tetap bekerja
          return caches.match("/index.html").then((html) => {
            return html || caches.match("/offline.html");
          });
        })
    );
    return;
  }

  // =============================
  // D. File lain → Cache first
  // =============================
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
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
  const data = event.data?.json() || {};
  const title = data.title || "Cerita Baru!";
  const options = {
    body: data.body || "Ada cerita baru!",
    icon: "/icons/icon-192.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// =============================
// 5. CLICK NOTIFICATION
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
