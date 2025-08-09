/**
 * PROFESSIONAL INTELLIGENCE PLATFORM - MAIN APP
 * Entry point for the revolutionary networking platform
 */

import { Store } from './store.js';
import router, { mountRouter } from './router.js';
import { api } from './services/api.js';
import { nav } from './services/nav.js';
import eventSystem, { Events } from './events.js';
import { motion } from './ui/motion.js';
import { viewTX } from './ui/viewTX.js';
import { bindPressFeedback } from './ui/press.js';
import { createFPSWatchdog } from './ui/fpsWatchdog.js';
import './ui/templates.js'; // Ensure templates are available globally

// Import controllers
import { HomeController } from './controllers/HomeController.js';
import { PeopleController } from './controllers/PeopleController.js';
import { OpportunitiesController } from './controllers/OpportunitiesController.js';
import { EventController } from './controllers/EventController.js';
import { MeController } from './controllers/MeController.js';
import { InviteController } from './controllers/InviteController.js';
import { CalendarController } from './controllers/CalendarController.js';

class ProfessionalIntelligenceApp {
  constructor() {
    this.initialized = false;
    this.controllers = new Map();
    this.currentController = null;
    this.signalField = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) return;

    try {
      console.log('🚀 Initializing Professional Intelligence Platform...');
      
      // Initialize core systems
      await this.initializeCoreModules();
      
      // Set up routing
      this.setupRouting();
      
      // Initialize UI components
      this.initializeUI();
      
      // Set up global event listeners
      this.setupGlobalEvents();
      
      // Initialize store
      Store.init();
      
      // Use lightweight router for simplicity
      this.simpleRouter = mountRouter();
      
      // Initialize navigation
      nav.init();
      
      // Check if user needs onboarding
      if (!Store.getters.isOnboarded()) {
        this.simpleRouter.navigate('home'); // Start at home for now
      }
      
      this.initialized = true;
      console.log('✅ Professional Intelligence Platform initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Initialize core modules
   */
  async initializeCoreModules() {
    // Test API connection
    try {
      await api.health();
      console.log('✅ API connection established');
    } catch (error) {
      console.warn('⚠️ API connection failed, continuing offline');
    }

    // Event system is auto-initialized
    console.log('✅ Event system ready');

    // Initialize motion system
    motion.setupIntersectionObservers();
    console.log('✅ Motion system initialized');
  }

  /**
   * Set up application routing
   */
  setupRouting() {
    // Define controller map with imported classes
    const controllerMap = {
      home: HomeController,
      people: PeopleController,
      opportunities: OpportunitiesController,
      events: EventController,
      me: MeController,
      invite: InviteController,
      calendar: CalendarController
    };

    // Initialize controllers based on data-route attributes
    document.querySelectorAll('[data-route]').forEach(async (section) => {
      const routeName = section.dataset.route;
      if (controllerMap[routeName]) {
        try {
          const ControllerClass = controllerMap[routeName];
          const controller = new ControllerClass(section);
          await controller.init();
          this.controllers.set(routeName, controller);
          console.log(`✅ ${routeName} controller loaded`);
        } catch (error) {
          console.error(`❌ Failed to load ${routeName} controller:`, error);
        }
      }
    });

    // Define routes
    router.routes({
      '/': () => router.navigate('/home'),
      '/home': () => this.loadController('home'),
      '/people': () => this.loadController('people'),
      '/opportunities': () => this.loadController('opportunities'),
      '/events': () => this.loadController('events'),
      '/events/:id': () => this.loadController('events'),
      '/me': () => this.loadController('me'),
      '/invite': () => this.loadController('invite'),
      '/calendar': () => this.loadController('calendar')
    });

    // Set up navigation hooks
    router.beforeEach(async (to, from) => {
      // Update page title
      this.updatePageTitle(to.route);
      
      // Update navigation state
      nav.setActiveRoute(to.route);
      
      // Show loading if needed
      if (to.route !== '/home') {
        store.actions.showLoading();
      }
      
      return true;
    });

    router.afterEach(async (to) => {
      // Hide loading
      store.actions.hideLoading();
      
      // Initialize view animations
      const viewName = to.route.split('/')[1] || 'home';
      motion.initializeView(viewName);
      
      // Track navigation
      this.trackNavigation(to);
    });

    // Handle route not found
    router.notFound((path) => {
      console.warn('Route not found:', path);
      router.navigate('/home');
    });
  }

  /**
   * Initialize UI components
   */
  initializeUI() {
    // Initialize view transition system
    viewTX.init();
    
    // Initialize press feedback system
    bindPressFeedback();
    
    // Initialize performance monitoring
    createFPSWatchdog({ minFps: 45, sampleMs: 1000 });
    
    // Set up topbar interactions
    this.setupTopbar();
    
    // Set up tabbar interactions  
    this.setupTabbar();
    
    // Initialize signal field canvas
    this.initializeSignalField();
    
    // Set up quick actions
    this.setupQuickActions();
    
    // Set up theme handling
    this.setupThemeHandling();
  }

  /**
   * Set up global event listeners
   */
  setupGlobalEvents() {
    // Handle app state changes
    Store.subscribe('ui.modal', (modal) => {
      if (modal) {
        this.showModal(modal);
      } else {
        this.hideModal();
      }
    });

    Store.subscribe('ui.notification', (notification) => {
      if (notification) {
        this.showNotification(notification);
      }
    });

    Store.subscribe('ui.error', (error) => {
      if (error) {
        this.showError(error);
      }
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      Store.actions.showNotification('🟢 Back online');
      this.syncData();
    });

    window.addEventListener('offline', () => {
      Store.actions.showNotification('🔴 Working offline');
    });

    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleAppResume();
      } else {
        this.handleAppPause();
      }
    });

    // Handle PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      Store.patch('ui.installPrompt', e);
    });

    // Global action handler
    document.addEventListener('click', (e) => {
      const actionElement = e.target.closest('[data-action]');
      if (actionElement) {
        e.preventDefault();
        this.handleAction(actionElement.dataset.action, actionElement);
      }
    });
  }

  /**
   * Set up topbar
   */
  setupTopbar() {
    const primaryCta = document.getElementById('primary-cta');
    if (primaryCta) {
      primaryCta.addEventListener('click', () => {
        this.handlePrimaryCTA();
      });
    }
  }

  /**
   * Set up tabbar navigation
   */
  setupTabbar() {
    const tablinks = document.querySelectorAll('.tablink');
    tablinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
          const route = href.replace('#', '');
          router.navigate(route);
        }
      });
    });
  }

  /**
   * Initialize signal field canvas
   */
  initializeSignalField() {
    const canvas = document.getElementById('signal-field');
    if (!canvas) return;

    // Import and initialize canvas field
    import('./ui/canvasField.js').then(({ canvasField }) => {
      this.signalField = canvasField;
      this.signalField.init(canvas);
      console.log('✅ Signal field initialized');
    }).catch(error => {
      console.warn('⚠️ Failed to initialize signal field:', error);
    });
  }

  /**
   * Set up quick actions
   */
  setupQuickActions() {
    // Action handlers will be set up via event delegation
    // in the global event listener above
  }

  /**
   * Set up theme handling
   */
  setupThemeHandling() {
    // Apply stored theme
    const theme = Store.get('ui.theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (Store.get('ui.theme') === 'auto') {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    });
  }

  /**
   * Load and initialize controller
   */
  async loadController(controllerName) {
    try {
      // Get existing controller or load new one
      let controller = this.controllers.get(controllerName);
      
      if (!controller) {
        console.warn(`Controller ${controllerName} not found in cache, loading...`);
        return;
      }

      // Cleanup previous controller
      if (this.currentController && this.currentController !== controller) {
        if (typeof this.currentController.destroy === 'function') {
          this.currentController.destroy();
        }
      }

      // Initialize new controller
      if (typeof controller.init === 'function') {
        await controller.init();
      }

      this.currentController = controller;
      console.log(`✅ Controller ${controllerName} initialized`);
      
    } catch (error) {
      console.error(`❌ Failed to load controller ${controllerName}:`, error);
      // Fallback to home
      if (controllerName !== 'home') {
        router.navigate('/home');
      }
    }
  }

  /**
   * Handle global actions
   */
  async handleAction(action, element) {
    const [module, method] = action.split('.');
    
    switch (module) {
      case 'invite':
        await this.handleInviteAction(method, element);
        break;
      case 'event':
        await this.handleEventAction(method, element);
        break;
      case 'presence':
        await this.handlePresenceAction(method, element);
        break;
      case 'opportunity':
        await this.handleOpportunityAction(method, element);
        break;
      case 'profile':
        await this.handleProfileAction(method, element);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  /**
   * Handle invite actions
   */
  async handleInviteAction(method, element) {
    switch (method) {
      case 'open':
        Store.actions.openModal({
          type: 'invite',
          data: {
            code: Store.get('invites.myCode'),
            remaining: Store.get('invites.left')
          }
        });
        break;
      case 'send':
        // Handle invite sending
        break;
    }
  }

  /**
   * Handle event actions
   */
  async handleEventAction(method, element) {
    switch (method) {
      case 'create':
        router.navigate('/events/create');
        break;
      case 'join':
        const eventId = element.dataset.eventId;
        if (eventId) {
          await api.swipeEvent(eventId, 'right');
          Store.actions.showNotification('Event saved! 🎉');
        }
        break;
    }
  }

  /**
   * Handle presence actions
   */
  async handlePresenceAction(method, element) {
    switch (method) {
      case 'edit':
        Store.actions.openModal({
          type: 'presence',
          data: Store.get('proximity')
        });
        break;
    }
  }

  /**
   * Handle primary CTA based on current route
   */
  handlePrimaryCTA() {
    const currentRoute = router.currentRoute?.route || '/home';
    
    switch (currentRoute) {
      case '/home':
        this.handleAction('invite.open');
        break;
      case '/people':
        router.navigate('/opportunities');
        break;
      case '/opportunities':
        this.handleAction('opportunity.create');
        break;
      case '/events':
        this.handleAction('event.create');
        break;
      case '/me':
        Store.actions.openModal({ type: 'settings' });
        break;
    }
  }

  /**
   * Update page title based on route
   */
  updatePageTitle(route) {
    const titleElement = document.getElementById('page-title');
    const primaryCta = document.getElementById('primary-cta');
    
    const routeConfig = {
      '/home': { title: 'Now', cta: 'Invite' },
      '/people': { title: 'People', cta: 'Next' },
      '/opportunities': { title: 'Opportunities', cta: 'Create' },
      '/events': { title: 'Events', cta: 'Add' },
      '/me': { title: 'Profile', cta: 'Settings' }
    };
    
    const config = routeConfig[route] || { title: 'PI', cta: 'Action' };
    
    if (titleElement) {
      titleElement.textContent = config.title;
      motion.animate(titleElement, {
        opacity: [0.5, 1],
        transform: ['translateY(5px)', 'translateY(0)']
      }, { duration: 300 });
    }
    
    if (primaryCta) {
      primaryCta.textContent = config.cta;
    }
  }

  /**
   * Show modal
   */
  showModal(modal) {
    // Modal implementation will be handled by individual controllers
    // This is a placeholder for global modal coordination
    Events.emit('modal:show', modal);
  }

  /**
   * Hide modal
   */
  hideModal() {
    Events.emit('modal:hide');
  }

  /**
   * Show notification
   */
  showNotification(notification) {
    // Create notification element
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = typeof notification === 'string' ? notification : notification.message;
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-brand-primary);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      z-index: var(--z-notification);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notif);
    
    // Animate in
    setTimeout(() => {
      notif.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
      notif.style.transform = 'translateX(100%)';
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }

  /**
   * Show error
   */
  showError(error) {
    this.showNotification(`❌ ${error}`);
  }

  /**
   * Handle app resume
   */
  handleAppResume() {
    // Sync data when app comes back to focus
    this.syncData();
    
    // Resume proximity if enabled
    const proximity = Store.get('proximity.enabled');
    if (proximity) {
      import('./services/proximity.js').then(({ proximity }) => {
        proximity.startTracking();
      });
    }
  }

  /**
   * Handle app pause
   */
  handleAppPause() {
    // Pause non-critical background tasks
    if (this.signalField) {
      this.signalField.pause();
    }
  }

  /**
   * Sync data with server
   */
  async syncData() {
    try {
      const lastSync = Store.get('cache.lastSync') || 0;
      const syncData = await api.syncData(lastSync);
      
      if (syncData && syncData.updates) {
        // Apply updates to store
        Object.entries(syncData.updates).forEach(([key, value]) => {
          Store.patch(key, value);
        });
        
        Store.patch('cache.lastSync', Date.now());
        console.log('✅ Data synchronized');
      }
    } catch (error) {
      console.warn('⚠️ Sync failed:', error);
    }
  }

  /**
   * Track navigation for analytics
   */
  trackNavigation(to) {
    // Simple analytics tracking
    if (window.gtag) {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: to.path
      });
    }
    
    // Track in store for internal analytics
    const history = Store.get('analytics.navigation') || [];
    history.push({
      path: to.path,
      timestamp: Date.now(),
      params: to.params
    });
    
    // Keep only last 50 navigation events
    if (history.length > 50) {
      history.shift();
    }
    
    Store.patch('analytics.navigation', history);
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError(error) {
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        padding: 2rem;
        text-align: center;
        background: var(--color-neutral-900);
        color: white;
      ">
        <h1>⚠️ Initialization Error</h1>
        <p>The Professional Intelligence Platform failed to start.</p>
        <button onclick="window.location.reload()" style="
          padding: 12px 24px;
          background: var(--color-brand-primary);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 1rem;
        ">Retry</button>
        <details style="margin-top: 2rem; max-width: 500px;">
          <summary>Technical Details</summary>
          <pre style="text-align: left; overflow: auto; margin-top: 1rem;">
${error.stack || error.message}
          </pre>
        </details>
      </div>
    `;
  }

  /**
   * Cleanup on app destroy
   */
  destroy() {
    if (this.signalField) {
      this.signalField.destroy();
    }
    
    motion.cleanup();
    router.disconnectWebSocket?.();
    this.initialized = false;
  }
}

// Initialize app when DOM is ready
const app = new ProfessionalIntelligenceApp();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export for debugging
window.app = app;
window.router = router;
window.store = Store;

export default app;