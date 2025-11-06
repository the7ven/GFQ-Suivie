// Nom du cache (incrémentez cette version chaque fois que vous modifiez les fichiers statiques)
const CACHE_NAME = 'gfq-cache-v1';

// Liste des fichiers essentiels à mettre en cache pour le fonctionnement hors ligne
const urlsToCache = [
    '/',
    'index.html',
    'styles.css',
    'main.js',
    // Ajoutez ici d'autres ressources critiques comme les icônes, images si vous en avez
    // Note: Les polices Google (Poppins) ne sont pas incluses car cela nécessite une stratégie différente
];

// Événement d'installation : Mettre en cache toutes les ressources essentielles
self.addEventListener('install', (event) => {
    // Force l'activation du nouveau SW immédiatement
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Fichiers essentiels mis en cache.');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Service Worker: Échec de la mise en cache initiale.', error);
            })
    );
});

// Événement d'activation : Nettoyer les anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Supprime les anciens caches qui ne correspondent pas au nom actuel
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Événement 'fetch' : Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes spécifiques (ex: requêtes d'extensions ou API)
    if (event.request.url.startsWith('chrome-extension://')) {
        return;
    }
    
    // Stratégie "Cache First, puis Network"
    // Le Service Worker essaie d'abord de trouver la ressource dans le cache.
    // Si elle est là, il la sert immédiatement (rapide, fonctionne hors ligne).
    // Sinon, il va chercher sur le réseau.
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - retourner la réponse du cache
                if (response) {
                    return response;
                }
                
                // Pas dans le cache - faire une requête réseau
                return fetch(event.request).then(
                    (response) => {
                        // Vérifier si nous avons reçu une réponse valide
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Si c'est un GET, nous pouvons mettre la nouvelle réponse en cache (facultatif mais bonne pratique)
                        if (event.request.method === 'GET') {
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        
                        return response;
                    }
                );
            })
            .catch(() => {
                // En cas d'échec total (hors ligne et ressource non dans le cache)
                // Optionnel : retourner une page 'offline.html' si vous l'aviez
                // Pour cette application, nous laissons le navigateur afficher son message d'erreur
            })
    );
});