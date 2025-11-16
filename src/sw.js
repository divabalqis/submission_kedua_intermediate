/// <reference no-default-lib="true"/>
import { precacheAndRoute } from 'workbox-precaching';

// =============================
// 1. CUSTOM ASSETS (MANUAL CACHE)
// =============================
const CUSTOM_ASSETS = [
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
// 2. Workbox Precache + Custom
// =============================
precacheAndRoute([
  ...self.__WB_MANIFEST,  // inject dari vite/workbox
  ...CUSTOM_ASSETS        // manual asset
]);

console.log('Service Worker: Workbox + Manual Cache aktif');

const CACHE_NAME = 'mystory-cache-v2';
const OFFLINE_PAGE = '/offline.html';

// =============================
// 3. Install — Cache Custom
// =============================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CUSTOM_ASSETS))
  );
  self.skipWaiting();
});

// =============================
// 4. Activate
// =============================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// =============================
// 5. Fetch Handler
// =============================
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // === Cache API Dicoding ===
  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // === Navigation (offline fallback) ===
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then(r => r || caches.match(OFFLINE_PAGE))
      )
    );
    return;
  }

  // === Asset caching (cache-first) ===
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
          if (req.destination === 'image') {
            return new Response('', { status: 404 });
          }
          return null;
        });
    })
  );
});

// =============================
// 6. Push Notification
// =============================
self.addEventListener('push', (event) => {
  console.log('Push received');

  const data = event.data?.json() || {};
  const title = data.title || 'Cerita Baru!';

  const options = {
    body: data?.options?.body || data?.body || 'Ada cerita baru',
    icon: data?.icon || '/icons/icon-192.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// =============================
// 7. Notification Click
// =============================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windows) => {
      if (windows.length > 0) return windows[0].focus();
      return clients.openWindow('/');
    })
  );
});
