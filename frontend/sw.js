const CACHE_NAME = 'smart-solutions-v2.0.0';
const urlsToCache = [
    '/',
    '/dashboard',
    '/styles/premium-theme.css',
    '/styles/premium-ui.css',
    '/styles/dashboard.css',
    '/scripts/dashboard.js',
    '/assets/triple-a-logo.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    
    // Skip caching for unsupported schemes (chrome-extension, chrome, etc.)
    const url = new URL(event.request.url);
    if (url.protocol === 'chrome-extension:' || url.protocol === 'chrome:' || url.protocol === 'moz-extension:') {
        return; // Let browser handle these requests
    }
    
    // Skip caching for non-HTTP(S) requests
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        try {
                            cache.put(event.request, responseToCache);
                        } catch (error) {
                            console.warn('Failed to cache request:', event.request.url, error);
                        }
                    });
                    return response;
                });
            })
    );
});

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
        })
    );
});


