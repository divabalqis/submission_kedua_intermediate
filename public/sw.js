// =============================
// 1. CUSTOM ASSETS (MANUAL CACHE)
// =============================
const CUSTOM_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',

  // CSS
  '/styles/styles.css',

  // Scripts
  '/scripts/index.js',
  '/scripts/routes/routes.js',
  '/scripts/pages/home/home-page.js',
  '/scripts/pages/add-story/add-story-page.js',
  '/scripts/pages/login/login-page.js',
  '/scripts/pages/register/register-page.js',
  '/scripts/pages/favorite/favorite-page.js',

  // Icons
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const CACHE_NAME = 'mystory-cache-v3';
const OFFLINE_PAGE = '/offline.html';

console.log('Service Worker manual aktif tanpa Workbox');

// =============================
// 2. INSTALL — Cache all assets
// =============================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching assets...');
      return cache.addAll(CUSTOM_ASSETS);
    })
  );
  self.skipWaiting();
});

// =============================
// 3. ACTIVATE — Bersihkan cache lama
// =============================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => (key !== CACHE_NAME ? caches.delete(key) : null))
      )
    )
  );
  self.clients.claim();
});

// =============================
// 4. FETCH HANDLER — Offline Ready
// =============================
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;

  // ====================================
  // API Dicoding → Network First
  // ====================================
  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(
      fetch(req)
        .then(res => res)
        .catch(() => caches.match(req))
    );
    return;
  }

  // ====================================
  // Navigasi Halaman → Offline fallback
  // ====================================
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          // Simpan halaman ke cache
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() =>
          caches.match(req).then(cached => cached || caches.match(OFFLINE_PAGE))
        )
    );
    return;
  }

  // ====================================
  // Asset (JS, CSS, Images) → Cache First
  // ====================================
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => {
          // fallback khusus gambar
          if (req.destination === 'image') {
            return new Response('', { status: 404 });
          }
        });
    })
  );
});

// =============================
// 5. PUSH NOTIFICATIONS
// =============================
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'Notifikasi Baru';

  const options = {
    body: data.body || 'Ada informasi baru.',
    icon: data.icon || '/icons/icon-192.png',
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// =============================
// 6. NOTIFICATION CLICK
// =============================
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(win => {
      if (win.length > 0) return win[0].focus();
      return clients.openWindow('/');
    })
  );
});
