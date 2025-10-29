/* ====================================
   SERVICE WORKER - SoundPulse Web
   Cache offline, carregamento instantâneo
   ==================================== */

const CACHE_VERSION = 'v1.0.4-fixed'; // 🔧 Bug fix: Console limpo + YouTube silenciado + Cache corrigido
const CACHE_NAME = `soundpulse-${CACHE_VERSION}`;

// Assets estáticos críticos para cache imediato
// Removido '/' para evitar conflito com index.html
const STATIC_ASSETS = [
    '/index.html',
    '/css/bundle.css'
];

// Expiração de cache por tipo de recurso
const CACHE_EXPIRATION = {
    images: 7 * 24 * 60 * 60 * 1000,      // 7 dias
    api: 1 * 60 * 60 * 1000,              // 1 hora
    static: 30 * 24 * 60 * 60 * 1000,     // 30 dias
    dynamic: 24 * 60 * 60 * 1000          // 24 horas
};

// ============================================
// INSTALL - Cachear assets críticos
// ============================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                console.log('[SW] Caching static assets');
                
                // Cachear cada asset individualmente para ignorar erros
                const cachePromises = STATIC_ASSETS.map(async url => {
                    try {
                        const response = await fetch(url, {
                            cache: 'no-cache',
                            credentials: 'same-origin'
                        });
                        if (response.ok) {
                            await cache.put(url, response);
                            console.log(`[SW] ✓ Cached: ${url}`);
                        } else {
                            console.warn(`[SW] ⚠ Skipped (${response.status}): ${url}`);
                        }
                    } catch (err) {
                        // Erro esperado - apenas log informativo
                        console.log(`[SW] ℹ️ Asset not cached: ${url}`);
                    }
                });
                
                await Promise.allSettled(cachePromises);
                console.log('[SW] Installation complete (errors ignored)');
            })
            .then(() => {
                return self.skipWaiting(); // Ativar imediatamente
            })
    );
});

// ============================================
// ACTIVATE - Limpar caches antigos
// ============================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name.startsWith('soundpulse-') && name !== CACHE_NAME)
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activation complete');
                return self.clients.claim(); // Controlar todas as páginas imediatamente
            })
    );
});

// ============================================
// FETCH - Estratégias de cache
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorar requests não-HTTP
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Ignorar requests para YouTube/Google (CORS issues + adblockers)
    if (url.hostname.includes('youtube.com') || 
        url.hostname.includes('ytimg.com') ||
        url.hostname.includes('googlevideo.com') ||
        url.hostname.includes('googleapis.com') ||
        url.pathname.includes('youtubei')) {
        return;
    }
    
    // Estratégia baseada no tipo de recurso
    if (url.pathname.startsWith('/api/')) {
        // API: Network First com fallback para cache
        event.respondWith(networkFirstStrategy(request));
    } else if (url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
        // Imagens: Cache First (performance)
        event.respondWith(cacheFirstStrategy(request, CACHE_EXPIRATION.images));
    } else if (url.pathname.match(/\.(js|css)$/)) {
        // Assets estáticos: Stale While Revalidate
        event.respondWith(staleWhileRevalidateStrategy(request));
    } else {
        // HTML e outros: Network First
        event.respondWith(networkFirstStrategy(request));
    }
});

// ============================================
// ESTRATÉGIAS DE CACHE
// ============================================

/**
 * Network First - Tenta rede primeiro, fallback para cache
 * Ideal para: API, HTML
 */
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Se sucesso, atualizar cache (clone ANTES de retornar)
        if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, responseToCache);
        }
        
        return networkResponse;
    } catch (error) {
        // Falhou na rede, tentar cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Serving from cache (offline):', request.url);
            return cachedResponse;
        }
        
        // Sem cache também, retornar página offline
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
        
        // Erro final
        return new Response('Offline and no cache available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Cache First - Cache primeiro, fallback para rede
 * Ideal para: Imagens, fontes
 */
async function cacheFirstStrategy(request, maxAge) {
    const cachedResponse = await caches.match(request);
    
    // Verificar se cache ainda é válido
    if (cachedResponse) {
        const cachedDate = new Date(cachedResponse.headers.get('date'));
        const now = new Date();
        
        if (now - cachedDate < maxAge) {
            return cachedResponse;
        }
    }
    
    // Cache expirado ou não existe, buscar na rede
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.ok) {
            // Clone ANTES de retornar
            const responseToCache = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, responseToCache);
        }
        
        return networkResponse;
    } catch (error) {
        // Erro na rede, retornar cache mesmo se expirado
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Stale While Revalidate - Retorna cache e atualiza em background
 * Ideal para: JS, CSS
 */
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    // Atualizar cache em background
    const fetchPromise = fetch(request)
        .then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
                // Clone ANTES de usar a response
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseToCache);
                });
            }
            return networkResponse;
        })
        .catch(err => {
            console.log('[SW] Background fetch failed:', err);
            return null;
        });
    
    // Retornar cache imediatamente se disponível
    return cachedResponse || fetchPromise;
}

// ============================================
// LIMPEZA DE CACHE AUTOMÁTICA
// ============================================
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data.action === 'clearCache') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(name => caches.delete(name))
                );
            })
        );
    }
});

// ============================================
// BACKGROUND SYNC (futuro)
// ============================================
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-favorites') {
        event.waitUntil(syncFavorites());
    }
});

async function syncFavorites() {
    // TODO: Sincronizar favoritos quando voltar online
    console.log('[SW] Syncing favorites...');
}

