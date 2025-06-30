// ✅ Updated service-worker.js (v2) for Link Manager Pro
const CACHE_NAME = 'link-manager-pro-cache-v2';

const urlsToCache = [
  '/',
  '/My-Link.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/folder-icon.png', // optional, if added
  '/icons/link-icon.png',   // optional, if added
  // '/tips/onboarding.html', // optional onboarding file
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
});

// Fetch handler with fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
