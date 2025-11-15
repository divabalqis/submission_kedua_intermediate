/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'mystory-cache-v3';
const OFFLINE_PAGE = '/offline.html';

// Hanya cache file yang pasti ada di public / root
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/styles/styles.css',
];

// Install SW
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(
          PRECACHE_ASSETS.map(path => new Request(path, { cache: 'reload' }))
        ).catch(err => console.warn('Some assets failed to cache', err));
      })
  );
  self.skipWaiting();
});

// Activate SW
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1️⃣ API caching → data terakhir tetap tampil saat offline
  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 2️⃣ Navigation fallback → offline.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(OFFLINE_PAGE))
    );
    return;
  }

  // 3️⃣ Cache-first untuk script, style, image → tampilan tetap muncul
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(res => {
        const clone = res.clone();
        if (
          req.destination === 'script' ||
          req.destination === 'style' ||
          req.destination === 'image'
        ) {
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return res;
      }).catch(() => {
        if (req.destination === 'image') return new Response('', { status: 404 });
        return null;
      });
    })
  );
});

// Push notification
self.addEventListener('push', (event) => {
  console.log("Push event received");
  const data = event.data?.json() || {};
  const title = data.title || 'Cerita Baru!';
  const options = { 
    body: data.body || 'Ada cerita baru', 
    icon: '/icons/icon-192.png' 
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientsArr => {
      if (clientsArr.length > 0) return clientsArr[0].focus();
      return clients.openWindow('/');
    })
  );
});
