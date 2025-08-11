/**
 * NAVIGATION SERVICE
 * Professional Intelligence Platform navigation management and state
 */

export function open(ev){
  const lat = ev.lat, lon = ev.lon, name = encodeURIComponent(ev.venue || ev.title || 'Destination');
  // Try Uber deep link
  const uber = `uber://?action=setPickup&dropoff[latitude]=${lat}&dropoff[longitude]=${lon}&dropoff[nickname]=${name}`;
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  const t = setTimeout(()=> window.open(maps, '_blank'), 600);
  window.location.href = uber; // if app exists, it will intercept and cancel timeout
  // Note: On web, this is best-effort. Backend could generate universal links if needed.
}

// Legacy class-based navigation service for backward compatibility
class NavigationService {
  constructor() {
    this.currentRoute = 'home';
    this.history = [];
    this.listeners = [];
    this.tabBar = null;
    this.initialized = false;
  }

  /**
   * Initialize navigation system
   */
  init() {
    if (this.initialized) return;

    this.tabBar = document.querySelector('.tabbar');
    this.setupEventListeners();
    this.updateActiveTab();
    this.initialized = true;
    
    console.log('✅ Navigation service initialized');
  }

  /**
   * Setup navigation event listeners
   */
  setupEventListeners() {
    // Handle tab bar clicks
    if (this.tabBar) {
      this.tabBar.addEventListener('click', (e) => {
        const tabLink = e.target.closest('.tablink');
        if (tabLink) {
          e.preventDefault();
          const href = tabLink.getAttribute('href');
          if (href) {
            this.navigate(href);
          }
        }
      });
    }

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      const route = this.getCurrentRoute();
      this.setCurrentRoute(route);
      this.updateActiveTab();
      this.notifyRouteChange(route);
    });

    // Handle hash changes
    window.addEventListener('hashchange', (e) => {
      const route = this.getCurrentRoute();
      this.setCurrentRoute(route);
      this.updateActiveTab();
    });
  }

  /**
   * Navigate to a route
   */
  navigate(path, options = {}) {
    const { replace = false, state = null } = options;
    
    // Normalize path
    const normalizedPath = path.startsWith('#') ? path : `#${path}`;
    
    // Update history
    if (replace) {
      window.history.replaceState(state, '', normalizedPath);
    } else {
      window.history.pushState(state, '', normalizedPath);
    }
    
    // Update internal state
    const route = this.getCurrentRoute();
    this.addToHistory(route);
    this.setCurrentRoute(route);
    this.updateActiveTab();
    
    // Notify listeners
    this.notifyRouteChange(route, { path: normalizedPath, state });
  }

  /**
   * Get current route from URL
   */
  getCurrentRoute() {
    const hash = window.location.hash.replace('#/', '') || 'home';
    return hash.split('?')[0]; // Remove query parameters
  }

  /**
   * Set current route
   */
  setCurrentRoute(route) {
    const previousRoute = this.currentRoute;
    this.currentRoute = route;
    
    // Update document title
    this.updatePageTitle(route);
    
    return { previous: previousRoute, current: route };
  }

  /**
   * Update page title based on route
   */
  updatePageTitle(route) {
    const titles = {
      home: 'ProNet - Professional Intelligence',
      people: 'People - ProNet',
      opportunities: 'Opportunities - ProNet',
      events: 'Events - ProNet',
      me: 'Profile - ProNet'
    };

    const title = titles[route] || 'ProNet - Professional Intelligence';
    document.title = title;
    
    // Update topbar title if present
    const topbarTitle = document.getElementById('page-title');
    if (topbarTitle) {
      const displayTitles = {
        home: 'Now',
        people: 'People',
        opportunities: 'Opportunities',
        events: 'Events',
        me: 'Profile'
      };
      topbarTitle.textContent = displayTitles[route] || 'ProNet';
    }
  }

  /**
   * Update active tab in navigation
   */
  updateActiveTab() {
    if (!this.tabBar) return;

    const tabLinks = this.tabBar.querySelectorAll('.tablink');
    tabLinks.forEach(link => {
      const href = link.getAttribute('href');
      const route = href ? href.replace('#/', '') || 'home' : '';
      const isActive = route === this.currentRoute;
      
      link.classList.toggle('is-active', isActive);
      
      // Update aria-selected for accessibility
      link.setAttribute('aria-selected', isActive);
    });
  }

  /**
   * Add route to navigation history
   */
  addToHistory(route) {
    // Avoid duplicate consecutive entries
    if (this.history[this.history.length - 1] !== route) {
      this.history.push(route);
      
      // Limit history size
      if (this.history.length > 50) {
        this.history.shift();
      }
    }
  }

  /**
   * Go back in navigation history
   */
  goBack() {
    if (this.canGoBack()) {
      window.history.back();
    } else {
      // Fallback to home if no history
      this.navigate('#/home');
    }
  }

  /**
   * Go forward in navigation history
   */
  goForward() {
    if (this.canGoForward()) {
      window.history.forward();
    }
  }

  /**
   * Check if can go back
   */
  canGoBack() {
    return window.history.length > 1;
  }

  /**
   * Check if can go forward
   */
  canGoForward() {
    // This is tricky to determine accurately, but we can try
    return false; // Conservative approach
  }

  /**
   * Get navigation breadcrumbs
   */
  getBreadcrumbs() {
    const routeNames = {
      home: 'Dashboard',
      people: 'Professional Network',
      opportunities: 'Career Opportunities',
      events: 'Gaming Events',
      me: 'My Profile'
    };

    return this.history.slice(-3).map(route => ({
      route,
      name: routeNames[route] || route,
      path: `#/${route}`
    }));
  }

  /**
   * Subscribe to route changes
   */
  onRouteChange(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify route change listeners
   */
  notifyRouteChange(route, details = {}) {
    this.listeners.forEach(callback => {
      try {
        callback(route, details);
      } catch (error) {
        console.error('Navigation listener error:', error);
      }
    });

    // Emit custom event for other systems
    window.dispatchEvent(new CustomEvent('router:navigate', {
      detail: { route, ...details }
    }));
  }

  /**
   * Prefetch route data (for performance)
   */
  async prefetch(route) {
    try {
      // Import controller module
      const controllerPath = `../controllers/${route}.js`;
      await import(controllerPath);
      
      console.log(`✅ Prefetched ${route} controller`);
    } catch (error) {
      console.warn(`Failed to prefetch ${route}:`, error);
    }
  }

  /**
   * Set up route guards/middleware
   */
  addRouteGuard(route, guard) {
    // Implementation for route protection
    this.routeGuards = this.routeGuards || {};
    this.routeGuards[route] = guard;
  }

  /**
   * Check route guards before navigation
   */
  async checkRouteGuards(route) {
    const guard = this.routeGuards?.[route];
    if (guard && typeof guard === 'function') {
      return await guard();
    }
    return true; // Allow navigation
  }

  /**
   * Generate deep link for sharing
   */
  generateDeepLink(route, params = {}) {
    const baseUrl = window.location.origin;
    const path = route === 'home' ? '/' : `/${route}`;
    
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    return `${baseUrl}#${path}${queryString}`;
  }

  /**
   * Handle deep link navigation
   */
  handleDeepLink(url) {
    try {
      const urlObj = new URL(url);
      const hash = urlObj.hash;
      
      if (hash) {
        window.location.hash = hash;
      }
    } catch (error) {
      console.error('Invalid deep link:', error);
    }
  }

  /**
   * Get current route parameters
   */
  getRouteParams() {
    const hash = window.location.hash;
    const queryString = hash.includes('?') ? hash.split('?')[1] : '';
    return new URLSearchParams(queryString);
  }

  /**
   * Update route parameters without navigation
   */
  updateParams(params, options = {}) {
    const { merge = true } = options;
    const currentParams = this.getRouteParams();
    
    let newParams;
    if (merge) {
      newParams = new URLSearchParams(currentParams);
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
    } else {
      newParams = new URLSearchParams(params);
    }
    
    const route = this.getCurrentRoute();
    const queryString = newParams.toString();
    const newHash = queryString ? `#/${route}?${queryString}` : `#/${route}`;
    
    window.history.replaceState(null, '', newHash);
  }

  /**
   * Reset navigation state
   */
  reset() {
    this.currentRoute = 'home';
    this.history = [];
    this.navigate('#/home', { replace: true });
  }

  /**
   * Destroy navigation service
   */
  destroy() {
    this.listeners = [];
    this.routeGuards = {};
    this.initialized = false;
  }
}

// Create singleton instance
export const nav = new NavigationService();

// Export class for testing
export default NavigationService;