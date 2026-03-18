const CACHE_NAME = 'isla-portal-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalación: Pre-cachear archivos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Estrategia: Stale-While-Revalidate para imágenes y assets
self.addEventListener('fetch', (event) => {
  const isImage = /\.(png|jpg|jpeg|svg|webp|gif|ico)$/.test(event.request.url);
  
  if (isImage || event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
          
          // Devuelve el caché si existe, sino espera a la red
          return cachedResponse || fetchPromise;
        });
      })
    );
  } else {
    // Para lo demás, red primero
    event.respondWith(fetch(event.request));
  }
});
