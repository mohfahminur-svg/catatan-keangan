/* ==========================================================================
   SERVICE WORKER — Toko Rahma
   Cache sederhana supaya aplikasi tetap bisa dibuka meski koneksi lambat/putus,
   dan supaya browser mengenali aplikasi ini sebagai PWA yang bisa di-install.
   ========================================================================== */

const CACHE_NAME = 'toko-rahma-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192-v2.png',
  './icon-512-v2.png'
];

// Saat install: simpan file inti aplikasi ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch(() => {
          // abaikan file yang belum tentu ada (misal index.html vs app.html)
        }))
      );
    })
  );
  self.skipWaiting();
});

// Saat activate: bersihkan cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Strategi: network-first untuk halaman utama (data selalu terbaru),
// fallback ke cache saat offline. File statis lain: cache-first.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isNavigation = req.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => cached);
    })
  );
});
