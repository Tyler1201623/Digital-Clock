// Service Worker for Chronos Hub
const CACHE_NAME = 'chronos-hub-v1';
const DYNAMIC_CACHE = 'chronos-hub-dynamic-v1';
const APP_SHELL = [
    '/',
    '/index.html',
    '/style.css',
    '/main.js',
    '/manifest.json',
    '/sw-register.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
    'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js',
    'https://cdn.jsdelivr.net/npm/vanilla-tilt@1.7.2/dist/vanilla-tilt.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=Rajdhani:wght@300;400;500;600&display=swap',
    '/images/icon-192x192.png',
    '/images/icon-512x512.png',
    '/images/maskable_icon.png',
    'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3',
    'https://assets.mixkit.co/sfx/preview/mixkit-clock-tick-1059.mp3',
    'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3',
    'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3'
];

// Install event - Cache the app shell
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    
    // Skip waiting to ensure the new service worker activates immediately
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(APP_SHELL);
            })
            .catch(error => {
                console.error('[Service Worker] Cache failure:', error);
            })
    );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    
    // Take control immediately
    self.clients.claim();
    
    event.waitUntil(
        // Clean up old caches
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE) {
                        console.log('[Service Worker] Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event - Serve from cache, fallback to network with cache
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip certain URLs (analytics, etc.)
    const url = new URL(event.request.url);
    if (url.origin === 'https://analytics.google.com' || 
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/socket.io/')) {
        return;
    }
    
    // Network-first strategy for API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache a clone of the response
                    const clonedResponse = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => {
                            cache.put(event.request, clonedResponse);
                        });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // Cache-first strategy for everything else
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // If there's a match in the cache, return it
                    return cachedResponse;
                }
                
                // If no match, go to network
                return fetch(event.request)
                    .then(networkResponse => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Clone the response
                        const responseToCache = networkResponse.clone();
                        
                        // Add to dynamic cache
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                            
                        return networkResponse;
                    })
                    .catch(error => {
                        console.log('[Service Worker] Fetch failed:', error);
                        
                        // Fallback for HTML pages - return offline page
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('[Service Worker] Background Sync', event.tag);
    
    if (event.tag === 'sync-alarms') {
        event.waitUntil(syncAlarms());
    } else if (event.tag === 'sync-events') {
        event.waitUntil(syncEvents());
    } else if (event.tag === 'sync-settings') {
        event.waitUntil(syncSettings());
    }
});

// Push notifications
self.addEventListener('push', event => {
    console.log('[Service Worker] Push received', event);
    
    let data = { title: 'Chronos Hub', body: 'Something happened!' };
    
    // Try to parse the data if available
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            console.error('[Service Worker] Failed to parse push data', e);
        }
    }
    
    const options = {
        body: data.body,
        icon: '/images/icon-192x192.png',
        badge: '/images/badge.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            url: data.url || '/'
        },
        actions: [
            {
                action: 'view',
                title: 'View'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification click:', event.notification.tag);
    
    event.notification.close();
    
    if (event.action === 'view') {
        // Open the app and navigate to specific page
        const urlToOpen = event.notification.data.url || '/';
        
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then(windowClients => {
                    // Check if there is already a window/tab open with the target URL
                    for (let i = 0; i < windowClients.length; i++) {
                        const client = windowClients[i];
                        // If so, focus on it
                        if (client.url === urlToOpen && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // If not, open a new window/tab
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

// Implement background sync functions
async function syncAlarms() {
    try {
        const db = await openDatabase();
        const pendingAlarms = await db.transaction('pendingAlarms')
            .objectStore('pendingAlarms')
            .getAll();
        
        if (pendingAlarms.length === 0) return;
        
        // Process each pending alarm
        for (const alarm of pendingAlarms) {
            try {
                // Send to server
                const response = await fetch('/api/alarms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(alarm)
                });
                
                if (response.ok) {
                    // Remove from pending store
                    await db.transaction('pendingAlarms', 'readwrite')
                        .objectStore('pendingAlarms')
                        .delete(alarm.id);
                }
            } catch (error) {
                console.error('[Service Worker] Failed to sync alarm:', error);
            }
        }
    } catch (error) {
        console.error('[Service Worker] Error in syncAlarms:', error);
    }
}

async function syncEvents() {
    // Similar to syncAlarms but for events
    console.log('[Service Worker] Syncing events...');
    // Implementation similar to syncAlarms
}

async function syncSettings() {
    // Similar to syncAlarms but for settings
    console.log('[Service Worker] Syncing settings...');
    // Implementation similar to syncAlarms
}

// Helper function to open IndexedDB
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('chronosHub', 1);
        
        request.onerror = () => {
            reject(request.error);
        };
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create stores for pending items
            if (!db.objectStoreNames.contains('pendingAlarms')) {
                db.createObjectStore('pendingAlarms', { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains('pendingEvents')) {
                db.createObjectStore('pendingEvents', { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains('pendingSettings')) {
                db.createObjectStore('pendingSettings', { keyPath: 'id' });
            }
        };
    });
} 