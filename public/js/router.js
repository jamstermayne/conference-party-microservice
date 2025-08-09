/**
 * ROUTER MODULE
 * Single Page Application routing with history API
 * Handles navigation between views in the Professional Intelligence Platform
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.currentController = null;
    this.beforeHooks = [];
    this.afterHooks = [];
    this.notFoundHandler = null;
    this.baseUrl = '';
    this.initialized = false;
  }

  /**
   * Initialize the router
   */
  init() {
    if (this.initialized) return;
    
    // Set up popstate listener for browser navigation
    window.addEventListener('popstate', (e) => {
      const path = this.getCurrentPath();
      this.navigate(path, { skipPush: true, state: e.state });
    });

    // Set up hashchange listener for hash-based routing
    window.addEventListener('hashchange', (e) => {
      const path = this.getCurrentPath();
      this.navigate(path, { skipPush: true });
    });

    // Intercept link clicks for SPA navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      
      const href = link.getAttribute('href');
      
      // Skip external links and anchors
      if (href.startsWith('http') || href.startsWith('#') || link.hasAttribute('data-external')) {
        return;
      }
      
      // Handle internal navigation
      e.preventDefault();
      this.navigate(href);
    });

    this.initialized = true;
    
    // Navigate to current path on init
    const initialPath = this.getCurrentPath();
    this.navigate(initialPath, { skipPush: true });
  }

  /**
   * Register a route
   */
  route(path, controller, options = {}) {
    const routeConfig = {
      path,
      controller,
      pattern: this.pathToRegex(path),
      params: this.extractParamNames(path),
      ...options
    };
    
    this.routes.set(path, routeConfig);
    return this;
  }

  /**
   * Register multiple routes
   */
  routes(routesConfig) {
    Object.entries(routesConfig).forEach(([path, config]) => {
      if (typeof config === 'function') {
        this.route(path, config);
      } else {
        this.route(path, config.controller, config);
      }
    });
    return this;
  }

  /**
   * Navigate to a path
   */
  async navigate(path, options = {}) {
    const { skipPush = false, state = {} } = options;
    
    // Clean path
    path = this.cleanPath(path);
    
    // Find matching route
    const matchedRoute = this.findRoute(path);
    
    if (!matchedRoute) {
      this.handleNotFound(path);
      return false;
    }
    
    const { route, params } = matchedRoute;
    
    // Create route context
    const context = {
      path,
      params,
      query: this.parseQueryString(window.location.search),
      state,
      route: route.path
    };
    
    // Run before hooks
    for (const hook of this.beforeHooks) {
      const shouldContinue = await hook(context, this.currentRoute);
      if (shouldContinue === false) return false;
    }
    
    // Clean up current controller
    if (this.currentController && typeof this.currentController.destroy === 'function') {
      await this.currentController.destroy();
    }
    
    // Update browser history
    if (!skipPush) {
      if (path.startsWith('/') && !path.startsWith('/#/')) {
        // Convert to hash-based routing for consistency
        const hashPath = path === '/' ? '#/' : `#${path}`;
        window.location.hash = hashPath;
      } else {
        history.pushState(state, '', path);
      }
    }
    
    // Initialize new controller
    try {
      let ControllerClass = route.controller;
      
      // Handle dynamic imports
      if (typeof ControllerClass === 'string') {
        const module = await import(ControllerClass);
        ControllerClass = module.default || module[route.controllerName || 'default'];
      }
      
      // Create controller instance
      if (typeof ControllerClass === 'function') {
        // Check if it's a class or function
        if (ControllerClass.prototype && ControllerClass.prototype.constructor) {
          this.currentController = new ControllerClass(context);
        } else {
          // It's a function, call it
          this.currentController = await ControllerClass(context);
        }
      }
      
      // Initialize controller if it has init method
      if (this.currentController && typeof this.currentController.init === 'function') {
        await this.currentController.init();
      }
      
      // Update current route
      this.currentRoute = context;
      
      // Run after hooks
      for (const hook of this.afterHooks) {
        await hook(context);
      }
      
      // Emit navigation event
      this.emit('navigate', context);
      
      return true;
    } catch (error) {
      console.error('Router navigation error:', error);
      this.handleError(error, context);
      return false;
    }
  }

  /**
   * Go back in history
   */
  back() {
    history.back();
  }

  /**
   * Go forward in history
   */
  forward() {
    history.forward();
  }

  /**
   * Replace current route
   */
  replace(path, state = {}) {
    history.replaceState(state, '', path);
    this.navigate(path, { skipPush: true, state });
  }

  /**
   * Reload current route
   */
  reload() {
    if (this.currentRoute) {
      this.navigate(this.currentRoute.path, { skipPush: true });
    }
  }

  /**
   * Register before navigation hook
   */
  beforeEach(hook) {
    this.beforeHooks.push(hook);
    return this;
  }

  /**
   * Register after navigation hook
   */
  afterEach(hook) {
    this.afterHooks.push(hook);
    return this;
  }

  /**
   * Set not found handler
   */
  notFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }

  /**
   * Get current path
   */
  getCurrentPath() {
    // Support both hash-based and pathname-based routing
    const hash = window.location.hash;
    if (hash.startsWith('#/')) {
      return hash.replace('#', '') + window.location.search;
    }
    return window.location.pathname + window.location.search;
  }

  /**
   * Get route parameters
   */
  getParams() {
    return this.currentRoute?.params || {};
  }

  /**
   * Get query parameters
   */
  getQuery() {
    return this.currentRoute?.query || {};
  }

  /**
   * Update query parameters
   */
  updateQuery(updates, options = {}) {
    const current = this.parseQueryString(window.location.search);
    const updated = { ...current, ...updates };
    
    // Remove null/undefined values
    Object.keys(updated).forEach(key => {
      if (updated[key] === null || updated[key] === undefined) {
        delete updated[key];
      }
    });
    
    const queryString = this.buildQueryString(updated);
    const newPath = window.location.pathname + (queryString ? `?${queryString}` : '');
    
    if (options.replace) {
      this.replace(newPath);
    } else {
      this.navigate(newPath);
    }
  }

  /**
   * Find matching route
   */
  findRoute(path) {
    const cleanPath = this.cleanPath(path);
    
    for (const [, route] of this.routes) {
      const match = cleanPath.match(route.pattern);
      if (match) {
        const params = {};
        route.params.forEach((param, index) => {
          params[param] = match[index + 1];
        });
        return { route, params };
      }
    }
    
    return null;
  }

  /**
   * Convert path pattern to regex
   */
  pathToRegex(path) {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '([^/]+)')
      .replace(/\*/g, '(.*)');
    return new RegExp(`^${pattern}$`);
  }

  /**
   * Extract parameter names from path
   */
  extractParamNames(path) {
    const matches = path.match(/:(\w+)/g);
    return matches ? matches.map(m => m.slice(1)) : [];
  }

  /**
   * Clean path
   */
  cleanPath(path) {
    // Remove query string and hash
    path = path.split('?')[0].split('#')[0];
    
    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Remove trailing slash except for root
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    return path;
  }

  /**
   * Parse query string
   */
  parseQueryString(queryString) {
    const params = {};
    const searchParams = new URLSearchParams(queryString);
    
    for (const [key, value] of searchParams) {
      params[key] = value;
    }
    
    return params;
  }

  /**
   * Build query string
   */
  buildQueryString(params) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.set(key, value);
      }
    });
    
    return searchParams.toString();
  }

  /**
   * Handle not found
   */
  handleNotFound(path) {
    if (this.notFoundHandler) {
      this.notFoundHandler(path);
    } else {
      console.warn(`Route not found: ${path}`);
      this.emit('notfound', { path });
    }
  }

  /**
   * Handle error
   */
  handleError(error, context) {
    console.error('Router error:', error);
    this.emit('error', { error, context });
  }

  /**
   * Emit event
   */
  emit(event, data) {
    window.dispatchEvent(new CustomEvent(`router:${event}`, { detail: data }));
  }

  /**
   * Create link helper
   */
  link(path, params = {}, query = {}) {
    // Replace path params
    let finalPath = path;
    Object.entries(params).forEach(([key, value]) => {
      finalPath = finalPath.replace(`:${key}`, value);
    });
    
    // Add query string
    const queryString = this.buildQueryString(query);
    if (queryString) {
      finalPath += `?${queryString}`;
    }
    
    return finalPath;
  }

  /**
   * Check if path is active
   */
  isActive(path, exact = false) {
    const currentPath = this.cleanPath(this.getCurrentPath());
    const checkPath = this.cleanPath(path);
    
    if (exact) {
      return currentPath === checkPath;
    }
    
    return currentPath.startsWith(checkPath);
  }
}

// Create singleton instance
const router = new Router();

/**
 * Lightweight router implementation for simple hash-based routing
 * Alternative to the full Router class for simpler use cases
 */
export function mountRouter() {
  const routes = ['home', 'people', 'opportunities', 'events', 'me'];
  const pageTitle = document.getElementById('page-title');

  const show = (name) => {
    // Hide all route sections
    document.querySelectorAll('[data-route]').forEach(section => {
      section.hidden = section.dataset.route !== name;
    });
    
    // Update page title
    if (pageTitle) {
      const titles = {
        home: 'Now',
        people: 'People', 
        opportunities: 'Opportunities',
        events: 'Events',
        me: 'Profile'
      };
      pageTitle.textContent = titles[name] || name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Update tab navigation
    document.querySelectorAll('.tablink').forEach(link => {
      const href = link.getAttribute('href');
      const isActive = href && (href === `#/${name}` || (name === 'home' && href === '#/'));
      link.classList.toggle('is-active', isActive);
    });
  };

  const onRoute = () => {
    const hash = location.hash.replace('#/', '') || 'home';
    const [name] = hash.split('?');
    const validRoute = routes.includes(name) ? name : 'home';
    
    show(validRoute);
    
    // Dispatch route:enter event to the specific section
    const section = document.querySelector(`[data-route="${validRoute}"]`);
    if (section) {
      section.dispatchEvent(new CustomEvent('route:enter', {
        bubbles: true,
        detail: { name: validRoute, hash }
      }));
    }

    // Emit global navigation event
    window.dispatchEvent(new CustomEvent('router:navigate', {
      detail: { route: `/${validRoute}`, name: validRoute }
    }));
  };

  // Set up event listeners
  window.addEventListener('hashchange', onRoute);
  
  // Initialize on first load
  onRoute();
  
  console.log('✅ Lightweight router mounted');
  
  // Return utility functions
  return {
    navigate: (route) => {
      const cleanRoute = route.replace(/^#?\/?/, '');
      window.location.hash = `#/${cleanRoute || 'home'}`;
    },
    getCurrentRoute: () => {
      return location.hash.replace('#/', '') || 'home';
    },
    show
  };
}

// Export for ES modules
export default router;

// Also attach to window for global access
if (typeof window !== 'undefined') {
  window.router = router;
  window.mountRouter = mountRouter;
}