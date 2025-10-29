/* ====================================
   SPA ROUTER - Single Page Application Router
   ==================================== */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.history = [];
        this.historyIndex = -1;
        
        // Bind methods
        this.navigate = this.navigate.bind(this);
        this.handlePopState = this.handlePopState.bind(this);
        
        // Listen to browser navigation
        window.addEventListener('popstate', this.handlePopState);
        
        // Intercept all anchor clicks
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a[href^="#/"]');
            if (anchor) {
                e.preventDefault();
                const href = anchor.getAttribute('href');
                this.navigate(href.substring(1)); // Remove #
            }
        });
    }
    
    /**
     * Register a route
     */
    register(path, handler) {
        this.routes.set(path, handler);
        return this;
    }
    
    /**
     * Navigate to a route
     */
    navigate(path, pushState = true) {
        // Normalize path
        if (path.startsWith('#')) {
            path = path.substring(1);
        }
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        // Parse path and params
        const { route, params } = this.matchRoute(path);
        
        if (!route) {
            console.warn(`Route not found: ${path}`);
            this.navigate('/home');
            return;
        }
        
        // Update history
        if (pushState) {
            this.historyIndex++;
            this.history = this.history.slice(0, this.historyIndex);
            this.history.push(path);
            window.history.pushState({ path }, '', `#${path}`);
        }
        
        // Update current route
        const previousRoute = this.currentRoute;
        this.currentRoute = { path, route, params };
        
        // Update active nav links
        this.updateActiveLinks(path);
        
        // Call route handler
        try {
            route.handler(params, previousRoute);
        } catch (error) {
            console.error(`Error navigating to ${path}:`, error);
        }
        
        // Scroll to top
        const viewContainer = document.getElementById('viewContainer');
        if (viewContainer) {
            viewContainer.scrollTop = 0;
        }
        
        // Emit event
        window.dispatchEvent(new CustomEvent('routechange', {
            detail: { path, params, previousRoute }
        }));
    }
    
    /**
     * Match a path to a registered route
     */
    matchRoute(path) {
        // Try exact match first
        if (this.routes.has(path)) {
            return {
                route: { path, handler: this.routes.get(path) },
                params: {}
            };
        }
        
        // Try pattern matching
        for (const [routePath, handler] of this.routes.entries()) {
            const params = this.matchPattern(routePath, path);
            if (params !== null) {
                return {
                    route: { path: routePath, handler },
                    params
                };
            }
        }
        
        return { route: null, params: {} };
    }
    
    /**
     * Match a route pattern
     */
    matchPattern(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        
        if (patternParts.length !== pathParts.length) {
            return null;
        }
        
        const params = {};
        
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];
            
            if (patternPart.startsWith(':')) {
                // Dynamic parameter
                const paramName = patternPart.substring(1);
                params[paramName] = decodeURIComponent(pathPart);
            } else if (patternPart !== pathPart) {
                // No match
                return null;
            }
        }
        
        return params;
    }
    
    /**
     * Update active navigation links
     */
    updateActiveLinks(path) {
        // Get base path (first segment)
        const basePath = '/' + path.split('/')[1];
        
        // Update all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath) {
                const linkBasePath = '/' + linkPath.replace('#/', '').split('/')[0];
                if (linkBasePath === basePath) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });
    }
    
    /**
     * Handle browser back/forward
     */
    handlePopState(event) {
        const path = event.state?.path || window.location.hash.substring(1) || '/home';
        this.navigate(path, false);
    }
    
    /**
     * Go back in history
     */
    back() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const path = this.history[this.historyIndex];
            window.history.back();
            // Navigation will be handled by popstate
        }
    }
    
    /**
     * Go forward in history
     */
    forward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const path = this.history[this.historyIndex];
            window.history.forward();
            // Navigation will be handled by popstate
        }
    }
    
    /**
     * Check if can go back
     */
    canGoBack() {
        return this.historyIndex > 0;
    }
    
    /**
     * Check if can go forward
     */
    canGoForward() {
        return this.historyIndex < this.history.length - 1;
    }
    
    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
    
    /**
     * Start router
     */
    start() {
        // Get initial path from URL hash
        const initialPath = window.location.hash.substring(1) || '/home';
        this.navigate(initialPath, false);
    }
}

// Create singleton instance
const router = new Router();

// Export
export default router;
export { router };

