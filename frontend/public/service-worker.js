// Service Worker pour SOLIFIN
// Gestion avancée du cache et stratégies de mise en cache

// Nom et version du cache - Incrémenter la version pour forcer une mise à jour
const CACHE_NAME = 'solifin-cache-v2';

// Délai avant de notifier l'utilisateur d'une mise à jour (en millisecondes)
const UPDATE_NOTIFICATION_DELAY = 5 * 60 * 1000; // 5 minutes

// Ressources à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/assets/logo.png'
];

// Ressources à mettre en cache avec une stratégie spécifique
const CACHE_STRATEGIES = {
  // Cache uniquement (pas de réseau)
  cacheOnly: [
    /\.(woff|woff2|ttf|eot)$/,  // Polices
    /\/assets\/icons\//         // Icônes
  ],
  
  // Cache d'abord, puis réseau (avec mise à jour du cache)
  cacheFirstUpdate: [
    /\.(js|css)$/,              // Fichiers JS et CSS
    /\/assets\/images\//        // Images statiques
  ],
  
  // Réseau d'abord, puis cache en cas d'échec
  networkFirst: [
    /\/api\//,                  // Appels API
    /\.(jpg|jpeg|png|gif|webp)$/  // Images dynamiques
  ],
  
  // Stratégie de course (le plus rapide gagne)
  staleWhileRevalidate: [
    /\/assets\/fonts\//,        // Polices
    /\/assets\/styles\//        // Styles
  ]
};

// Durée de vie du cache en secondes
const CACHE_TTL = {
  short: 60 * 60,               // 1 heure
  medium: 24 * 60 * 60,         // 1 jour
  long: 7 * 24 * 60 * 60,       // 1 semaine
  veryLong: 30 * 24 * 60 * 60   // 30 jours
};

// Variable pour stocker le moment de la dernière mise à jour
let lastUpdateTime = 0;

// Installation du Service Worker
self.addEventListener('install', (event) => {
  // Vérifier si une mise à jour a été effectuée récemment
  const now = Date.now();
  const timeSinceLastUpdate = now - lastUpdateTime;
  
  // Si une mise à jour a été effectuée récemment, ne pas activer immédiatement
  if (timeSinceLastUpdate < UPDATE_NOTIFICATION_DELAY) {
    // Ne pas appeler skipWaiting() pour retarder l'activation
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(STATIC_ASSETS);
        })
    );
  } else {
    // Mise à jour normale
    lastUpdateTime = now;
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(STATIC_ASSETS);
        })
        .then(() => self.skipWaiting())
    );
  }
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non GET
  if (event.request.method !== 'GET') return;
  
  // Ignorer les requêtes de développement
  if (event.request.url.includes('/sockjs-node/') || 
      event.request.url.includes('hot-update.js')) return;
  
  // Déterminer la stratégie de cache à utiliser
  const strategy = getStrategyForUrl(event.request.url);
  
  switch (strategy) {
    case 'cacheOnly':
      event.respondWith(cacheOnly(event.request));
      break;
    case 'cacheFirstUpdate':
      event.respondWith(cacheFirstUpdate(event.request));
      break;
    case 'networkFirst':
      event.respondWith(networkFirst(event.request));
      break;
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(event.request));
      break;
    default:
      // Stratégie par défaut: network first
      event.respondWith(networkFirst(event.request));
  }
});

// Déterminer la stratégie de cache en fonction de l'URL
function getStrategyForUrl(url) {
  // Vérifier chaque stratégie
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return strategy;
      }
    }
  }
  
  // Stratégie par défaut
  return 'networkFirst';
}

// Stratégie: Cache uniquement
async function cacheOnly(request) {
  return caches.match(request);
}

// Stratégie: Cache d'abord, puis réseau (avec mise à jour du cache)
async function cacheFirstUpdate(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Vérifier si le cache est périmé
    const cachedDate = new Date(cachedResponse.headers.get('date'));
    const now = new Date();
    const cacheAge = (now - cachedDate) / 1000; // en secondes
    
    // Si le cache n'est pas périmé, le retourner
    if (cacheAge < CACHE_TTL.medium) {
      return cachedResponse;
    }
  }
  
  // Sinon, récupérer depuis le réseau et mettre à jour le cache
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // En cas d'erreur réseau, retourner le cache même périmé
    return cachedResponse || new Response('Ressource non disponible', {
      status: 408,
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

// Stratégie: Réseau d'abord, puis cache en cas d'échec
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Mettre en cache uniquement les réponses réussies
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Ressource non disponible', {
      status: 408,
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

// Stratégie: Stale While Revalidate (retourner le cache pendant que le réseau se met à jour)
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        caches.open(CACHE_NAME)
          .then(cache => cache.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => {
      // Si la requête réseau échoue, ne rien faire
    });
  
  // Retourner le cache immédiatement s'il existe
  return cachedResponse || fetchPromise;
}

// Nettoyage périodique du cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          return Promise.all(
            keys.map((request) => {
              return cache.match(request).then((response) => {
                if (!response) return;
                
                const cachedDate = new Date(response.headers.get('date'));
                const now = new Date();
                const cacheAge = (now - cachedDate) / 1000; // en secondes
                
                // Déterminer la durée de vie en fonction du type de ressource
                let ttl = CACHE_TTL.medium; // Par défaut: 1 jour
                
                if (request.url.match(/\.(woff|woff2|ttf|eot)$/)) {
                  ttl = CACHE_TTL.veryLong; // Polices: 30 jours
                } else if (request.url.match(/\.(js|css)$/)) {
                  ttl = CACHE_TTL.medium; // JS/CSS: 1 jour
                } else if (request.url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                  ttl = CACHE_TTL.long; // Images: 7 jours
                } else if (request.url.includes('/api/')) {
                  ttl = CACHE_TTL.short; // API: 1 heure
                }
                
                // Supprimer si périmé
                if (cacheAge > ttl) {
                  return cache.delete(request);
                }
              });
            })
          );
        });
      })
    );
  }
});
