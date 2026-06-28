const CACHE = 'pictozen-v2';
const BASE_PATH = '/Nonogram/';

const ASSETS = [
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap'
];

// Installation
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => {
        console.log('📦 Cache ouvert');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('❌ Erreur cache:', err))
  );
});

// Activation
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys.filter(k => k !== CACHE).map(k => caches.delete(k))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Récupération des ressources
self.addEventListener('fetch', e => {
  // Ignorer les requêtes non-GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        if (cached) {
          // Mise à jour en arrière-plan (stale-while-revalidate)
          fetch(e.request)
            .then(res => {
              if (res && res.status === 200) {
                caches.open(CACHE).then(cache => cache.put(e.request, res));
              }
            })
            .catch(() => {});
          return cached;
        }

        return fetch(e.request)
          .then(res => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE).then(cache => cache.put(e.request, clone));
            }
            return res;
          })
          .catch(() => {
            // Fallback pour les pages offline
            if (e.request.mode === 'navigate') {
              return caches.match(BASE_PATH + 'index.html');
            }
          });
      })
  );
});
