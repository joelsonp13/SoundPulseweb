/* ====================================
   PERFORMANCE METRICS - Web Vitals & Custom Metrics
   ==================================== */

/**
 * Core Web Vitals
 */
export class PerformanceMetrics {
    constructor() {
        this.metrics = {
            FCP: null,  // First Contentful Paint
            LCP: null,  // Largest Contentful Paint
            FID: null,  // First Input Delay
            CLS: null,  // Cumulative Layout Shift
            TTFB: null  // Time to First Byte
        };
        
        this.customMetrics = {};
        
        this.init();
    }
    
    init() {
        if (!('PerformanceObserver' in window)) {
            console.warn('PerformanceObserver not supported');
            return;
        }
        
        this.observeLCP();
        this.observeFID();
        this.observeCLS();
        this.measureFCP();
        this.measureTTFB();
    }
    
    /**
     * LCP - Largest Contentful Paint
     */
    observeLCP() {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
            this.reportMetric('LCP', this.metrics.LCP);
        });
        
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
    }
    
    /**
     * FID - First Input Delay
     */
    observeFID() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.metrics.FID = entry.processingStart - entry.startTime;
                this.reportMetric('FID', this.metrics.FID);
            }
        });
        
        observer.observe({ type: 'first-input', buffered: true });
    }
    
    /**
     * CLS - Cumulative Layout Shift
     */
    observeCLS() {
        let clsValue = 0;
        
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            
            this.metrics.CLS = clsValue;
            this.reportMetric('CLS', this.metrics.CLS);
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
    }
    
    /**
     * FCP - First Contentful Paint
     */
    measureFCP() {
        const navTiming = performance.getEntriesByType('navigation')[0];
        const paintTiming = performance.getEntriesByType('paint');
        
        const fcpEntry = paintTiming.find(entry => entry.name === 'first-contentful-paint');
        
        if (fcpEntry) {
            this.metrics.FCP = fcpEntry.startTime;
            this.reportMetric('FCP', this.metrics.FCP);
        }
    }
    
    /**
     * TTFB - Time to First Byte
     */
    measureTTFB() {
        const navTiming = performance.getEntriesByType('navigation')[0];
        
        if (navTiming) {
            this.metrics.TTFB = navTiming.responseStart - navTiming.requestStart;
            this.reportMetric('TTFB', this.metrics.TTFB);
        }
    }
    
    /**
     * Custom Metrics
     */
    markStart(name) {
        performance.mark(`${name}-start`);
    }
    
    markEnd(name) {
        performance.mark(`${name}-end`);
        
        try {
            performance.measure(name, `${name}-start`, `${name}-end`);
            const measure = performance.getEntriesByName(name)[0];
            this.customMetrics[name] = measure.duration;
            this.reportMetric(name, measure.duration);
        } catch (e) {
            console.error(`Error measuring ${name}:`, e);
        }
    }
    
    /**
     * Report metric (console + analytics)
     */
    reportMetric(name, value) {
        const rating = this.getRating(name, value);
        
        console.log(`📊 ${name}: ${value.toFixed(2)}ms (${rating})`);
        
        // Enviar para analytics (Google Analytics, etc)
        if (window.gtag) {
            window.gtag('event', 'performance_metric', {
                metric_name: name,
                metric_value: value,
                metric_rating: rating
            });
        }
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('performancemetric', {
            detail: { name, value, rating }
        }));
    }
    
    /**
     * Get rating (good/needs-improvement/poor)
     */
    getRating(name, value) {
        const thresholds = {
            FCP: [1800, 3000],   // Good < 1.8s, Poor > 3s
            LCP: [2500, 4000],   // Good < 2.5s, Poor > 4s
            FID: [100, 300],     // Good < 100ms, Poor > 300ms
            CLS: [0.1, 0.25],    // Good < 0.1, Poor > 0.25
            TTFB: [800, 1800]    // Good < 800ms, Poor > 1.8s
        };
        
        const threshold = thresholds[name];
        
        if (!threshold) return 'unknown';
        
        if (value < threshold[0]) return 'good';
        if (value < threshold[1]) return 'needs-improvement';
        return 'poor';
    }
    
    /**
     * Get all metrics
     */
    getAllMetrics() {
        return {
            ...this.metrics,
            ...this.customMetrics
        };
    }
    
    /**
     * Get performance score (0-100)
     */
    getScore() {
        const weights = {
            FCP: 0.15,
            LCP: 0.25,
            FID: 0.25,
            CLS: 0.25,
            TTFB: 0.10
        };
        
        let score = 0;
        
        for (const [metric, weight] of Object.entries(weights)) {
            const value = this.metrics[metric];
            if (value === null) continue;
            
            const rating = this.getRating(metric, value);
            
            if (rating === 'good') score += weight * 100;
            else if (rating === 'needs-improvement') score += weight * 50;
            // 'poor' = 0 points
        }
        
        return Math.round(score);
    }
}

// Singleton instance
const metrics = new PerformanceMetrics();

export default metrics;

/**
 * Helper functions for common measurements
 */
export function measureTrackLoad() {
    metrics.markStart('track-load');
}

export function trackLoadComplete() {
    metrics.markEnd('track-load');
}

export function measureSearchTime() {
    metrics.markStart('search');
}

export function searchComplete() {
    metrics.markEnd('search');
}

export function measureRouteChange() {
    metrics.markStart('route-change');
}

export function routeChangeComplete() {
    metrics.markEnd('route-change');
}

