const CACHE_NAME = 'nutricontrol-shell-v1';
const APP_SHELL = [
    './',
    './index.html',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key.startsWith('nutricontrol-shell-') && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if(request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

    event.respondWith((async () => {
        try {
            const response = await fetch(request);
            if(response.ok) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, response.clone());
            }
            return response;
        } catch(error) {
            const cachedResponse = await caches.match(request);
            if(cachedResponse) return cachedResponse;
            if(request.mode === 'navigate') {
                const appURL = new URL('./index.html', self.registration.scope);
                const cachedApp = await caches.match(appURL.href);
                if(cachedApp) return cachedApp;
            }
            throw error;
        }
    })());
});
