// Fichier: service-worker.js

// Nom du cache (INCÉMENTÉ À v2 pour forcer la mise à jour du cache)
const CACHE_NAME = 'gfq-cache-v2'; 

// Liste des fichiers essentiels à mettre en cache pour le fonctionnement hors ligne
const urlsToCache = [
    '/',
    'index.html',
    'styles.css',
    'main.js',
    'data-management.js', // <--- AJOUT DU NOUVEAU FICHIER
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
                    // Supprimer les caches qui ne correspondent pas au CACHE_NAME actuel (nettoyage)
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Événement de récupération (fetch) : Stratégie Cache-First pour les ressources statiques
self.addEventListener('fetch', (event) => {
    // Ne pas intercepter les requêtes non-GET ou externes
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Réponse trouvée dans le cache
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
                // Pour cette application, nous laissons le navigateur afficher son message d'erreur
            })
    );
});