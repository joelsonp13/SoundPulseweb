/* ====================================
   PERFORMANCE UTILITIES - Lazy Loading & Optimization
   ==================================== */

/**
 * 🚀 LAZY LOADING COM INTERSECTION OBSERVER
 * Carrega imagens apenas quando ficam visíveis na tela
 */
export function enableLazyLoading() {
    if (!('IntersectionObserver' in window)) {
        // Fallback para navegadores antigos
        return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src || img.src;
                
                if (src && src !== img.src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                    img.classList.add('loaded');
                }
                
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '200px', // 🚀 EXTREMO: Carregar 200px antes (experiência instantânea)
        threshold: 0.01
    });

    // Observar todas as imagens com loading="lazy"
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        imageObserver.observe(img);
    });
}

/**
 * 🚀 PRELOAD DE IMAGENS PRIORITÁRIAS
 * Pré-carrega imagens importantes para exibição instantânea
 */
export function preloadPriorityImages(imageUrls) {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) return;

    imageUrls.slice(0, 6).forEach(url => {
        if (!url || url.includes('placeholder')) return;
        
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
    });
}

// debounce e throttle movidos para dom.js para evitar duplicação

/**
 * 🚀 LIMPAR CACHE ANTIGO
 * Remove cache expirado para liberar memória
 */
export function cleanupCache(cacheMap, duration) {
    if (!(cacheMap instanceof Map)) return;
    
    const now = Date.now();
    for (const [key, value] of cacheMap.entries()) {
        if (value.timestamp && now - value.timestamp > duration) {
            cacheMap.delete(key);
        }
    }
}

/**
 * 🚀 REQUEST ANIMATION FRAME HELPER
 * Otimiza animações e updates visuais
 */
export function rafThrottle(callback) {
    let requestId = null;
    
    return function(...args) {
        if (requestId === null) {
            requestId = requestAnimationFrame(() => {
                requestId = null;
                callback.apply(this, args);
            });
        }
    };
}

/**
 * 🚀 PARALLEL REQUESTS COM LIMIT
 * Carrega múltiplos recursos em paralelo com limite de concorrência
 */
export async function parallelRequests(requests, limit = 4) {
    const results = [];
    const executing = [];
    
    for (const [index, request] of requests.entries()) {
        const promise = Promise.resolve().then(() => request());
        results[index] = promise;
        
        if (limit <= requests.length) {
            const executing_promise = promise.then(() => {
                executing.splice(executing.indexOf(executing_promise), 1);
            });
            executing.push(executing_promise);
            
            if (executing.length >= limit) {
                await Promise.race(executing);
            }
        }
    }
    
    return Promise.all(results);
}

export default {
    enableLazyLoading,
    preloadPriorityImages,
    cleanupCache,
    rafThrottle,
    parallelRequests
};

