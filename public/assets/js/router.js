/**
 * 🧭 PROFESSIONAL INTELLIGENCE PLATFORM - ROUTER
 * Sophisticated routing system with history management and lazy loading
 */

export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = 'parties';
    this.isNavigating = false;
    this.history = [];
    
    this.setupRoutes();
  }

  /**
   * Setup application routes
   */
  setupRoutes() {
    this.routes.set('parties', {
      title: 'Tonight\'s Parties',
      subtitle: 'Discover exclusive gaming industry networking opportunities',
      component: () => import('./parties.js').then(m => m.PartiesPage),
      requiresAuth: false
    });

    this.routes.set('invites', {
      title: 'Exclusive Invitations',
      subtitle: 'VIP access to premium industry events',
      component: () => import('./invites.js').then(m => m.InvitesPage),
      requiresAuth: false
    });

    this.routes.set('calendar', {
      title: 'Calendar Integration',
      subtitle: 'Sync your professional schedule seamlessly',
      component: () => import('./calendar.js').then(m => m.CalendarPage),
      requiresAuth: false
    });

    this.routes.set('profile', {
      title: 'Your Profile',
      subtitle: 'Manage your professional presence',
      component: () => import('./profile.js').then(m => m.ProfilePage),
      requiresAuth: false
    });

    this.routes.set('settings', {
      title: 'Platform Settings',
      subtitle: 'Customize your professional experience',
      component: () => import('./settings.js').then(m => m.SettingsPage),
      requiresAuth: false
    });
  }

  /**
   * Initialize router
   */
  initialize() {
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      const route = this.getRouteFromURL();
      this.navigate(route, false);
    });

    // Navigate to initial route
    const initialRoute = this.getRouteFromURL() || 'parties';
    this.navigate(initialRoute, false);

    console.log('🧭 Router initialized');
  }

  /**
   * Navigate to a route
   */
  async navigate(routeName, addToHistory = true) {
    if (this.isNavigating) return;
    if (!this.routes.has(routeName)) {
      console.error(`❌ Route not found: ${routeName}`);
      return;
    }

    this.isNavigating = true;
    const route = this.routes.get(routeName);

    try {
      // Update URL if needed
      if (addToHistory) {
        const url = routeName === 'parties' ? '/' : `/#/${routeName}`;
        history.pushState({ route: routeName }, route.title, url);
        this.history.push(routeName);
      }

      // Update navigation state
      this.updateNavigationState(routeName);

      // Update page title and header
      this.updatePageHeader(route);

      // Show loading state
      this.showRouteLoading();

      // Load and render component
      const ComponentClass = await route.component();
      const component = new ComponentClass();
      await this.renderComponent(component);

      // Update current route
      this.currentRoute = routeName;

      console.log(`📍 Navigated to: ${routeName}`);

    } catch (error) {
      console.error(`❌ Navigation failed for route: ${routeName}`, error);
      this.showRouteError(error);
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * Get route from current URL
   */
  getRouteFromURL() {
    const hash = window.location.hash.slice(2); // Remove #/
    return hash || 'parties';
  }

  /**
   * Update navigation visual state
   */
  updateNavigationState(activeRoute) {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      const route = item.dataset.route;
      
      if (route === activeRoute) {
        item.classList.add('active');
        
        // Add subtle glow effect
        item.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.3)';
        setTimeout(() => {
          item.style.boxShadow = '';
        }, 500);
        
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Update page header content
   */
  updatePageHeader(route) {
    // This would be implemented if we had a header element
    document.title = `${route.title} - Professional Intelligence Platform`;
  }

  /**
   * Show loading state for route
   */
  showRouteLoading() {
    const appContent = document.getElementById('app-content');
    if (appContent) {
      appContent.style.opacity = '0.5';
      appContent.style.pointerEvents = 'none';
    }
  }

  /**
   * Show route error
   */
  showRouteError(error) {
    const appContent = document.getElementById('app-content');
    if (appContent) {
      appContent.innerHTML = `
        <div class="glass-card text-center">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
          <h2 style="margin-bottom: 1rem;">Something went wrong</h2>
          <p style="color: var(--text-secondary); margin-bottom: 2rem;">Failed to load this page. Please try again.</p>
          <button class="btn-primary" onclick="location.reload()">Reload Page</button>
        </div>
      `;
      appContent.style.opacity = '1';
      appContent.style.pointerEvents = 'auto';
    }
  }

  /**
   * Render component in main content area
   */
  async renderComponent(component) {
    const appContent = document.getElementById('app-content');
    if (!appContent) return;

    try {
      // Get component HTML
      const html = await component.render();
      
      // Fade out current content
      appContent.style.opacity = '0';
      
      // Wait for fade
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Update content
      appContent.innerHTML = html;
      
      // Initialize component
      if (component.initialize) {
        await component.initialize();
      }
      
      // Fade in new content
      appContent.style.opacity = '1';
      appContent.style.pointerEvents = 'auto';
      
      // Add animation
      appContent.style.animation = 'fadeIn 0.3s ease-out';
      setTimeout(() => {
        appContent.style.animation = '';
      }, 300);
      
    } catch (error) {
      console.error('❌ Component render failed:', error);
      this.showRouteError(error);
    }
  }

  /**
   * Go back in history
   */
  back() {
    if (this.history.length > 1) {
      this.history.pop(); // Remove current
      const previousRoute = this.history[this.history.length - 1];
      this.navigate(previousRoute, false);
    } else {
      this.navigate('parties', false);
    }
  }

  /**
   * Refresh current route
   */
  async refresh() {
    const currentRoute = this.currentRoute;
    await this.navigate(currentRoute, false);
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Check if route exists
   */
  hasRoute(routeName) {
    return this.routes.has(routeName);
  }

  /**
   * Get route info
   */
  getRoute(routeName) {
    return this.routes.get(routeName);
  }
}