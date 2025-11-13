/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'mystory-cache-v2';
const OFFLINE_PAGE = '/offline.html';
const PRECACHE_ASSETS = [
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

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then(r => r || caches.match(OFFLINE_PAGE)))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
      return res;
    }).catch(() => req.destination === 'image' ? new Response('', { status: 404 }) : null))
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Cerita Baru!';
  const options = { body: data.body || 'Ada cerita baru', icon: '/icons/icon-192.png' };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientsArr => {
      if (clientsArr.length > 0) return clientsArr[0].focus();
      return clients.openWindow('/');
    })
  );
});
