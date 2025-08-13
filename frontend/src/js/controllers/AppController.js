/**
 * APP CONTROLLER
 * Main orchestrator for all controllers in the Professional Intelligence Platform
 */

import { BaseController } from './BaseController.js?v=b023';
import { EventController } from './EventController.js?v=b023';
import { SearchController } from './SearchController.js?v=b023';
import { NetworkingController } from './NetworkingController.js?v=b023';
import { Store } from '../store.js?v=b023';
import { api } from '../services/api.js?v=b023';
import router from '../router.js?v=b023';

export class AppController extends BaseController {
  constructor() {
    super(document.body, { name: 'app' });
    
    this.controllers = new Map();
    this.activeController = null;
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async onInit() {
    console.log('🚀 Initializing App Controller...');
    
    // Initialize store
    Store.init();
    
    // Test API connection
    await this.testAPIConnection();
    
    // Register controllers
    this.registerControllers();
    
    // Setup routing
    this.setupRouting();
    
    // Setup global event handlers
    this.setupGlobalHandlers();
    
    // Initialize service worker
    this.initializeServiceWorker();
    
    // Check for onboarding
    this.checkOnboarding();
    
    this.initialized = true;
    console.log('✅ App Controller initialized');
  }

  /**
   * Test API connection
   */
  async testAPIConnection() {
    try {
      await api.health();
      console.log('✅ API connection established');
      Store.patch('app.online', true);
    } catch (error) {
      console.warn('⚠️ API offline, using cached data');
      Store.patch('app.online', false);
    }
  }

  /**
   * Register all controllers
   */
  registerControllers() {
    // Find controller mount points
    const mountPoints = {
      events: document.querySelector('[data-controller="events"]'),
      search: document.querySelector('[data-controller="search"]'),
      networking: document.querySelector('[data-controller="networking"]')
    };
    
    // Create controller instances
    if (mountPoints.events) {
      this.controllers.set('events', new EventController(mountPoints.events));
    }
    
    if (mountPoints.search) {
      this.controllers.set('search', new SearchController(mountPoints.search));
    }
    
    if (mountPoints.networking) {
      this.controllers.set('networking', new NetworkingController(mountPoints.networking));
    }
    
    // Register lazy-loaded controllers
    this.registerLazyController('home', () => import('./HomeController.js?v=b023'));
    this.registerLazyController('people', () => import('./PeopleController.js?v=b023'));
    this.registerLazyController('opportunities', () => import('./OpportunitiesController.js?v=b023'));
    this.registerLazyController('profile', () => import('./ProfileController.js?v=b023'));
  }

  /**
   * Register lazy-loaded controller
   */
  registerLazyController(name, loader) {
    this.controllers.set(name, {
      lazy: true,
      loader,
      instance: null
    });
  }

  /**
   * Get or load controller
   */
  async getController(name) {
    const controller = this.controllers.get(name);
    
    if (!controller) {
      console.warn(`Controller ${name} not found`);
      return null;
    }
    
    // Handle lazy loading
    if (controller.lazy && !controller.instance) {
      try {
        const module = await controller.loader();
        const ControllerClass = module.default || module[name + 'Controller'];
        const element = document.querySelector(`[data-controller="${name}"]`);
        controller.instance = new ControllerClass(element);
        await controller.instance.init();
      } catch (error) {
        console.error(`Failed to load ${name} controller:`, error);
        return null;
      }
    }
    
    return controller.lazy ? controller.instance : controller;
  }

  /**
   * Setup routing
   */
  setupRouting() {
    // Define routes
    router.routes({
      '/': () => this.activateController('home'),
      '/home': () => this.activateController('home'),
      '/events': () => this.activateController('events'),
      '/events/:id': (params) => this.showEventDetail(params.id),
      '/people': () => this.activateController('people'),
      '/opportunities': () => this.activateController('opportunities'),
      '/profile': () => this.activateController('profile'),
      '/search': () => this.activateController('search')
    });
    
    // Navigation guards
    router.beforeEach(async (to, from) => {
      // Show loading state
      this.showLoading();
      
      // Check authentication if needed
      if (to.route.startsWith('/profile') && !this.isAuthenticated()) {
        this.emit('auth:required');
        return false;
      }
      
      return true;
    });
    
    router.afterEach((to) => {
      // Hide loading state
      this.hideLoading();
      
      // Update navigation UI
      this.updateNavigation(to.route);
      
      // Track page view
      this.trackPageView(to);
    });
    
    // Handle not found
    router.notFound((path) => {
      console.warn('Route not found:', path);
      router.navigate('/home');
    });
    
    // Initialize router
    router.init();
  }

  /**
   * Activate controller for route
   */
  async activateController(name) {
    // Deactivate current controller
    if (this.activeController) {
      if (typeof this.activeController.onLeave === 'function') {
        this.activeController.onLeave();
      }
    }
    
    // Get and activate new controller
    const controller = await this.getController(name);
    
    if (controller) {
      if (!controller.initialized) {
        await controller.init();
      }
      
      if (typeof controller.onEnter === 'function') {
        controller.onEnter();
      }
      
      this.activeController = controller;
      
      // Show/hide controller elements
      this.toggleControllerVisibility(name);
    }
  }

  /**
   * Toggle controller visibility
   */
  toggleControllerVisibility(activeName) {
    document.querySelectorAll('[data-controller]').forEach(el => {
      const controllerName = el.dataset.controller;
      el.hidden = controllerName !== activeName;
    });
  }

  /**
   * Show event detail
   */
  async showEventDetail(eventId) {
    const eventController = await this.getController('events');
    if (eventController) {
      const event = Store.get('events.list')?.find(e => e.id === eventId);
      if (event) {
        eventController.showEventDetails(event);
      } else {
        // Try to load from API
        try {
          const response = await api.getEvent(eventId);
          if (response.event) {
            eventController.showEventDetails(response.event);
          }
        } catch (error) {
          this.notify('Event not found', 'error');
          router.navigate('/events');
        }
      }
    }
  }

  /**
   * Setup global event handlers
   */
  setupGlobalHandlers() {
    // Online/offline status
    window.addEventListener('online', () => {
      Store.patch('app.online', true);
      this.notify('Back online', 'success');
      this.syncData();
    });
    
    window.addEventListener('offline', () => {
      Store.patch('app.online', false);
      this.notify('Working offline', 'info');
    });
    
    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.handleAppResume();
      }
    });
    
    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      Store.patch('app.installPrompt', e);
      this.showInstallPrompt();
    });
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.openGlobalSearch();
      }
      
      // Cmd/Ctrl + I for invites
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        this.openInviteModal();
      }
    });
    
    // Handle global actions
    this.on('navigate', ({ route }) => {
      router.navigate(route);
    });
    
    this.on('modal:open', (config) => {
      this.openModal(config);
    });
    
    this.on('modal:close', () => {
      this.closeModal();
    });
  }

  /**
   * Initialize service worker
   */
  async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js?v=b023');
        console.log('✅ Service Worker registered');
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.notify('New version available! Refresh to update.', 'info');
            }
          });
        });
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Check onboarding status
   */
  checkOnboarding() {
    const onboarded = Store.get('profile.onboarded');
    
    if (!onboarded) {
      // Check for invite code
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('invite');
      
      if (inviteCode) {
        this.emit('onboarding:start', { inviteCode });
      } else {
        // Show limited access mode
        this.showLimitedAccess();
      }
    }
  }

  /**
   * Show limited access mode
   */
  showLimitedAccess() {
    Store.patch('app.limitedAccess', true);
    this.notify('Limited access mode. Get an invite to unlock all features.', 'warning');
  }

  /**
   * Show install prompt
   */
  showInstallPrompt() {
    const prompt = Store.get('app.installPrompt');
    if (!prompt) return;
    
    // Show custom install UI
    this.emit('modal:open', {
      type: 'install',
      data: {
        prompt,
        onInstall: async () => {
          prompt.prompt();
          const { outcome } = await prompt.userChoice;
          
          if (outcome === 'accepted') {
            this.notify('App installed! 🎉', 'success');
            Store.patch('app.installed', true);
          }
        }
      }
    });
  }

  /**
   * Open global search
   */
  async openGlobalSearch() {
    const searchController = await this.getController('search');
    if (searchController) {
      router.navigate('/search');
      setTimeout(() => {
        searchController.focusSearchInput();
      }, 100);
    }
  }

  /**
   * Open invite modal
   */
  async openInviteModal() {
    const networkingController = await this.getController('networking');
    if (networkingController) {
      networkingController.actionOpenInvite();
    }
  }

  /**
   * Open modal
   */
  openModal(config) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = this.renderModal(config);
    
    document.body.appendChild(modal);
    
    // Setup close handlers
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });
    
    // Animate in
    requestAnimationFrame(() => {
      modal.classList.add('modal-active');
    });
  }

  /**
   * Render modal content
   */
  renderModal(config) {
    const { type, data } = config;
    
    switch (type) {
      case 'invite':
        return this.renderInviteModal(data);
      case 'event-details':
        return this.renderEventModal(data);
      case 'install':
        return this.renderInstallModal(data);
      default:
        return '<div class="modal-content">Modal content</div>';
    }
  }

  /**
   * Render invite modal
   */
  renderInviteModal(data) {
    return `
      <div class="modal-content modal-invite">
        <button class="modal-close" data-action="modal:close">✕</button>
        <h2>Send Exclusive Invite</h2>
        <p>You have ${data.remaining} invites remaining</p>
        
        <div class="invite-code">
          <label>Your invite code:</label>
          <code>${data.myCode}</code>
          <button data-action="copy" data-text="${data.myCode}">Copy</button>
        </div>
        
        <div class="invite-actions">
          <button data-action="share:link">Share Link</button>
          <button data-action="share:qr">Show QR Code</button>
        </div>
      </div>
    `;
  }

  /**
   * Render event modal
   */
  renderEventModal(event) {
    return `
      <div class="modal-content modal-event">
        <button class="modal-close" data-action="modal:close">✕</button>
        <h2>${event.title}</h2>
        <p class="event-meta">
          ${this.formatDate(event.date)} • ${event.venue || 'TBA'}
        </p>
        <div class="event-description">
          ${event.description || 'No description available'}
        </div>
        <div class="event-host">
          Hosted by: ${event.host || 'Unknown'}
        </div>
        <div class="modal-actions">
          <button data-action="event:save" data-id="${event.id}">Save Event</button>
          <button data-action="event:calendar" data-id="${event.id}">Add to Calendar</button>
          <button data-action="event:share" data-id="${event.id}">Share</button>
        </div>
      </div>
    `;
  }

  /**
   * Render install modal
   */
  renderInstallModal(data) {
    return `
      <div class="modal-content modal-install">
        <button class="modal-close" data-action="modal:close">✕</button>
        <h2>Install Professional Intelligence</h2>
        <p>Add to your home screen for the best experience</p>
        <ul class="install-benefits">
          <li>Work offline</li>
          <li>Faster performance</li>
          <li>Push notifications</li>
        </ul>
        <div class="modal-actions">
          <button data-action="install:now">Install Now</button>
          <button data-action="install:later">Maybe Later</button>
        </div>
      </div>
    `;
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.classList.remove('modal-active');
      setTimeout(() => modal.remove(), 300);
    }
  }

  /**
   * Update navigation UI
   */
  updateNavigation(route) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('href');
      const isActive = href && (href === route || href === `#${route}`);
      item.classList.toggle('active', isActive);
    });
    
    // Update page title
    const titles = {
      '/home': 'Home',
      '/events': 'Events',
      '/people': 'People',
      '/opportunities': 'Opportunities',
      '/profile': 'Profile',
      '/search': 'Search'
    };
    
    const title = titles[route] || 'Professional Intelligence';
    document.title = `${title} - ProNet`;
    
    const pageTitle = document.querySelector('#page-title');
    if (pageTitle) {
      pageTitle.textContent = title;
    }
  }

  /**
   * Track page view
   */
  trackPageView(to) {
    // Analytics tracking
    if (window.gtag) {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: to.path
      });
    }
    
    // Internal tracking
    const views = Store.get('analytics.pageViews') || [];
    views.push({
      path: to.path,
      timestamp: Date.now(),
      params: to.params
    });
    
    // Keep last 100 views
    if (views.length > 100) {
      views.shift();
    }
    
    Store.patch('analytics.pageViews', views);
  }

  /**
   * Handle app resume
   */
  handleAppResume() {
    // Sync data when app resumes
    this.syncData();
    
    // Resume any paused features
    this.controllers.forEach(controller => {
      if (controller.onResume) {
        controller.onResume();
      }
    });
  }

  /**
   * Sync data with server
   */
  async syncData() {
    if (!Store.get('app.online')) return;
    
    try {
      const lastSync = Store.get('app.lastSync') || 0;
      const syncData = await api.syncData(lastSync);
      
      if (syncData?.updates) {
        Object.entries(syncData.updates).forEach(([key, value]) => {
          Store.patch(key, value);
        });
        
        Store.patch('app.lastSync', Date.now());
        console.log('✅ Data synchronized');
      }
    } catch (error) {
      console.warn('Sync failed:', error);
    }
  }

  /**
   * Check authentication
   */
  isAuthenticated() {
    return Store.get('profile.id') && Store.get('profile.onboarded');
  }

  /**
   * Cleanup on destroy
   */
  onDestroy() {
    // Destroy all controllers
    this.controllers.forEach(controller => {
      if (controller.destroy) {
        controller.destroy();
      }
    });
    
    this.controllers.clear();
    this.activeController = null;
  }
}

// Create and export singleton
const appController = new AppController();
export default appController;