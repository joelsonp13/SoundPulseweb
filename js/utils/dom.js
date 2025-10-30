/* ====================================
   DOM UTILITIES - Helpers para manipulação do DOM
   ==================================== */

/**
 * Cria elemento com classes e atributos
 */
export function createElement(tag, classes = [], attributes = {}) {
    const element = document.createElement(tag);
    
    if (classes.length > 0) {
        element.classList.add(...classes);
    }
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else {
            element[key] = value;
        }
    });
    
    return element;
}

/**
 * Query selector simplificado
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Query selector all simplificado
 */
export function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

/**
 * Adiciona event listener com opção de remover
 */
export function on(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
}

/**
 * Remove todos os filhos de um elemento
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Mostra elemento
 */
export function show(element) {
    element.classList.remove('hidden');
    element.style.display = '';
}

/**
 * Esconde elemento
 */
export function hide(element) {
    element.classList.add('hidden');
}

/**
 * Toggle visibilidade
 */
export function toggle(element) {
    element.classList.toggle('hidden');
}

/**
 * Debounce function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
export function throttle(func, limit = 100) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Anima scroll suave
 */
export function smoothScroll(element, to, duration = 300) {
    const start = element.scrollTop;
    const change = to - start;
    const startTime = performance.now();
    
    function animateScroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeInOutQuad(progress);
        
        element.scrollTop = start + change * easeProgress;
        
        if (progress < 1) {
            requestAnimationFrame(animateScroll);
        }
    }
    
    requestAnimationFrame(animateScroll);
}

/**
 * Easing function
 */
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Cria ícone SVG
 */
export function createIcon(pathData, size = 24) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('fill', 'currentColor');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    
    svg.appendChild(path);
    return svg;
}

/**
 * Mostra toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = $('#toastContainer');
    if (!container) return;
    
    const toast = createElement('div', ['toast', type]);
    
    const iconMap = {
        success: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
        error: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
        warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
        info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'
    };
    
    const icon = createIcon(iconMap[type] || iconMap.info, 20);
    const textElement = createElement('div', ['toast-message'], { textContent: message });
    
    toast.appendChild(createElement('div', ['toast-icon']).appendChild(icon).parentElement);
    toast.appendChild(textElement);
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Loading state
 */
export function showLoading(element) {
    const spinner = createElement('div', ['spinner']);
    const loading = createElement('div', ['loading']);
    loading.appendChild(spinner);
    clearElement(element);
    element.appendChild(loading);
}

/**
 * Skeleton loading
 */
export function createSkeleton(type = 'card') {
    const skeleton = createElement('div', ['skeleton', `skeleton-${type}`]);
    return skeleton;
}

/**
 * Format image URL with fallback
 */
export function getImageUrl(url, fallback = 'assets/images/covers/placeholder.svg') {
    return url || fallback;
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copiado para a área de transferência', 'success');
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        showToast('Erro ao copiar', 'error');
        return false;
    }
}

/**
 * Share content
 */
export async function share(data) {
    if (navigator.share) {
        try {
            await navigator.share(data);
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error sharing:', err);
            }
            return false;
        }
    } else {
        // Fallback: copy link
        if (data.url) {
            return await copyToClipboard(data.url);
        }
        return false;
    }
}

/**
 * Detect click outside element
 */
export function onClickOutside(element, callback) {
    const handler = (event) => {
        if (!element.contains(event.target)) {
            callback(event);
        }
    };
    
    document.addEventListener('click', handler);
    
    return () => document.removeEventListener('click', handler);
}

/**
 * Lazy load images
 */
export function lazyLoadImages(selector = 'img[data-src]') {
    const images = $$(selector);
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback: load all images
        images.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

export default {
    createElement,
    $,
    $$,
    on,
    clearElement,
    show,
    hide,
    toggle,
    debounce,
    throttle,
    smoothScroll,
    createIcon,
    showToast,
    showLoading,
    createSkeleton,
    getImageUrl,
    copyToClipboard,
    share,
    onClickOutside,
    lazyLoadImages
};

