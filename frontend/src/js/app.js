/**
 * PROFESSIONAL INTELLIGENCE PLATFORM - MAIN APP
 * Entry point for the revolutionary networking platform
 */

// ⚡ OPTIMIZED MODULE LOADING - Dynamic imports with graceful degradation
// Core modules loaded statically for better performance
let Store, router, api, nav, eventSystem, Events, motion, viewTX;

// Import enhanced modules
import './deep-links.js?v=b023';
import './ui.js?v=b023';
import './errors.js?v=b023';
import './api/events.js?v=b023';
import './api/calendar.js?v=b023';
import './api/invites.js?v=b023';
import './pwa-detector.js?v=b023';
let bindPressFeedback, createFPSWatchdog, mountInstallFTUE;

// Controller registry for dynamic loading
const CONTROLLER_MODULES = {
  home: () => import('./controllers/HomeController.js?v=b023').then(m => m.HomeController),
  people: () => import('./controllers/PeopleController.js?v=b023').then(m => m.PeopleController),
  opportunities: () => import('./controllers/OpportunitiesController.js?v=b023').then(m => m.OpportunitiesController),
  events: () => import('./controllers/EventController.js?v=b023').then(m => m.EventController),
  me: () => import('./controllers/MeController.js?v=b023').then(m => m.MeController),
  invite: () => import('./controllers/InviteController.js?v=b023').then(m => m.InviteController),
  calendar: () => import('./controllers/CalendarController.js?v=b023').then(m => m.CalendarController),
  fomo: () => import('./controllers/FomoController.js?v=b023').then(m => m.FomoController),
  'account-link': () => import('./controllers/AccountLinkController.js?v=b023').then(m => m.AccountLinkController),
  'calendar-sync': () => import('./controllers/CalendarSyncController.js?v=b023').then(m => m.CalendarSyncController),
  'invite-panel': () => import('./controllers/InvitePanelController.js?v=b023').then(m => m.InvitePanelController)
};

// Module loading utilities
const ModuleLoader = {
  cache: new Map(),
  loadedModules: new Set(),
  failedModules: new Set(),
  
  async loadCoreModule(modulePath, exportName) {
    const cacheKey = `${modulePath}#${exportName || 'default'}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const module = await import(modulePath);
      const result = exportName ? module[exportName] : module.default || module;
      
      this.cache.set(cacheKey, result);
      this.loadedModules.add(modulePath);
      console.log(`✅ Module loaded: ${modulePath}`);
      
      return result;
    } catch (error) {
      console.warn(`⚠️ Failed to load module ${modulePath}:`, error);
      this.failedModules.add(modulePath);
      return null;
    }
  },
  
  async loadController(controllerName) {
    if (!CONTROLLER_MODULES[controllerName]) {
      console.warn(`⚠️ Unknown controller: ${controllerName}`);
      return null;
    }
    
    const cacheKey = `controller_${controllerName}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const ControllerClass = await CONTROLLER_MODULES[controllerName]();
      this.cache.set(cacheKey, ControllerClass);
      console.log(`✅ Controller loaded: ${controllerName}`);
      return ControllerClass;
    } catch (error) {
      console.warn(`⚠️ Failed to load controller ${controllerName}:`, error);
      this.failedModules.add(`controller_${controllerName}`);
      return null;
    }
  },
  
  getStats() {
    return {
      loaded: this.loadedModules.size,
      failed: this.failedModules.size,
      cached: this.cache.size,
      loadedModules: Array.from(this.loadedModules),
      failedModules: Array.from(this.failedModules)
    };
  }
};

// Load core modules with error recovery
async function loadCoreModules() {
  const modules = [
    ['./store.js?v=b023', 'Store'],
    ['./router.js?v=b023', 'default'],
    ['./services/api.js?v=b023', 'api'],
    ['./services/nav.js?v=b023', 'nav'],
    ['./events.js?v=b023', 'default'],
    ['./events.js?v=b023', 'Events'],
    ['./ui/motion.js?v=b023', 'motion'],
    ['./ui/viewTX.js?v=b023', 'viewTX'],
    ['./ui/press.js?v=b023', 'bindPressFeedback'],
    ['./ui/fpsWatchdog.js?v=b023', 'createFPSWatchdog'],
    ['./pwa/installFTUE.js?v=b023', 'mountInstallFTUE']
  ];
  
  const results = await Promise.allSettled(
    modules.map(([path, exportName]) => 
      ModuleLoader.loadCoreModule(path, exportName)
    )
  );
  
  // Assign loaded modules
  [Store, router, api, nav, eventSystem, Events, motion, viewTX, 
   bindPressFeedback, createFPSWatchdog, mountInstallFTUE] = results.map(r => 
    r.status === 'fulfilled' ? r.value : null
  );
  
  // Load self-initializing modules
  try {
    await import('./ui/templates.js?v=b023');
    await import('./pwa/installBonus.js?v=b023');
  } catch (error) {
    console.warn('⚠️ Self-initializing modules failed:', error);
  }
  
  return ModuleLoader.getStats();
}

class ProfessionalIntelligenceApp {
  constructor() {
    this.initialized = false;
    this.controllers = new Map();
    this.currentController = null;
    this.signalField = null;
    
    // 🛡️ Memory leak prevention
    this.timers = new Set();
    this.eventListeners = new Map();
    this.stats = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) return;

    try {
      console.log('🚀 Initializing Professional Intelligence Platform...');
      
      // Initialize core systems (with graceful degradation)
      try {
        await this.initializeCoreModules();
      } catch (error) {
        console.warn('⚠️ Core modules initialization had errors, continuing with available modules');
      }
      
      // Set up routing and navigation (essential, but handle failures)
      try {
        this.setupRouting();
      } catch (error) {
        console.error('❌ Routing setup failed:', error);
      }
      
      try {
        this.setupNavigation();
      } catch (error) {
        console.warn('⚠️ Navigation setup failed, app may have limited functionality:', error);
      }
      
      // Initialize UI components and FTUE (non-critical)
      try {
        this.initializeUI();
      } catch (error) {
        console.warn('⚠️ UI initialization had errors, continuing with basic functionality:', error);
      }
      
      try {
        this.initializeFTUE();
      } catch (error) {
        console.warn('⚠️ FTUE initialization failed:', error);
      }
      
      // Set up global event listeners (important but non-critical)
      try {
        this.setupGlobalEvents();
      } catch (error) {
        console.warn('⚠️ Global events setup failed:', error);
      }
      
      // Initialize store (critical for app functionality)
      try {
        if (Store && typeof Store.init === 'function') {
          Store.init();
        } else {
          throw new Error('Store not available');
        }
      } catch (error) {
        console.error('❌ Store initialization failed:', error);
        // Create a minimal fallback store
        window.Store = { 
          get: () => null, 
          patch: () => {}, 
          subscribe: () => {}, 
          actions: {} 
        };
      }
      
      // Default to "Tonight's Best Parties" for instant value
      try {
        const currentRoute = window.location.hash.slice(1) || '/events';
        this.navigate(currentRoute);
      } catch (error) {
        console.warn('⚠️ Initial navigation failed:', error);
      }
      
      this.initialized = true;
      console.log('✅ Professional Intelligence Platform initialized (with graceful degradation)');
      
      // Add ARIA live region for status updates
      this.announcer = document.getElementById('invite-live') || this.createAnnouncer();
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * ⚡ OPTIMIZED: Initialize core modules with enhanced error recovery
   */
  async initializeCoreModules() {
    const moduleStats = ModuleLoader.getStats();
    console.log(`🔧 Module loading stats:`, moduleStats);
    
    // Initialize modules that successfully loaded
    const initTasks = [];
    
    // API connection with retry logic
    if (api) {
      initTasks.push(
        this.withRetry(() => api.health(), 3, 1000)
          .then(() => console.log('✅ API connection established'))
          .catch(error => console.warn('⚠️ API connection failed after retries, continuing offline'))
      );
    }

    // Event system initialization
    if (eventSystem) {
      initTasks.push(
        Promise.resolve()
          .then(() => {
            console.log('✅ Event system ready');
            // Auto-assign Events if available
            if (!Events && eventSystem.Events) {
              Events = eventSystem.Events;
            }
          })
          .catch(error => console.warn('⚠️ Event system initialization failed:', error))
      );
    }

    // Motion system initialization
    if (motion && typeof motion.setupIntersectionObservers === 'function') {
      initTasks.push(
        Promise.resolve()
          .then(() => {
            motion.setupIntersectionObservers();
            console.log('✅ Motion system initialized');
          })
          .catch(error => console.warn('⚠️ Motion system initialization failed:', error))
      );
    }
    
    // PWA install system initialization
    if (typeof mountInstallFTUE === 'function') {
      initTasks.push(
        Promise.resolve()
          .then(() => {
            mountInstallFTUE();
            console.log('✅ PWA install system initialized');
          })
          .catch(error => console.warn('⚠️ PWA install system initialization failed:', error))
      );
    }
    
    // Initialize all modules in parallel with individual error isolation
    const results = await Promise.allSettled(initTasks);
    const failedCount = results.filter(r => r.status === 'rejected').length;
    
    if (failedCount > 0) {
      console.warn(`⚠️ ${failedCount}/${initTasks.length} module initializations failed`);
    } else {
      console.log(`✅ All ${initTasks.length} core modules initialized successfully`);
    }
    
    return {
      total: initTasks.length,
      failed: failedCount,
      moduleStats
    };
  }
  
  /**
   * Utility function for retrying operations
   */
  async withRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Set up navigation system
   */
  setupNavigation() {
    // Wire up bottom navigation tabs
    const navTabs = document.querySelectorAll('.nav-tab[data-route]');
    navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const route = tab.dataset.route;
        this.navigate(route);
        this.updateActiveTab(route);
      });
    });

    // Wire up sidebar navigation (desktop)
    const sidebarItems = document.querySelectorAll('.sidebar-item[data-route]');
    sidebarItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.dataset.route;
        this.navigate(route);
        this.updateActiveSidebar(route);
      });
    });

    // Handle hash changes
    window.addEventListener('hashchange', () => {
      const route = window.location.hash.slice(2) || 'events'; // Remove #/
      this.navigate(route);
    });
  }

  /**
   * Initialize FTUE (First Time User Experience)
   */
  initializeFTUE() {
    // PWA install FTUE already initialized in initializeCoreModules()
    // Removed duplicate call

    // Set up account sheet triggers
    this.setupAccountSheet();

    // Set up calendar sync card
    this.setupCalendarSync();

    // Listen for FTUE trigger events from controllers
    Events.on('ftue:show-install', () => {
      const installCard = document.getElementById('install-ftue');
      if (installCard) {
        installCard.hidden = false;
        this.announce('Install ready.');
      }
    });

    Events.on('ftue:show-account', () => {
      this.showAccountSheet();
    });

    Events.on('ftue:show-calendar', () => {
      this.showCalendarCard();
    });
  }

  /**
   * Set up account setup sheet
   */
  setupAccountSheet() {
    const accountSheet = document.getElementById('account-sheet');
    const authButtons = accountSheet?.querySelectorAll('[data-auth]');
    
    authButtons?.forEach(button => {
      button.addEventListener('click', (e) => {
        const authProvider = e.target.dataset.auth;
        this.handleAuth(authProvider);
      });
    });
  }

  /**
   * Set up calendar sync card
   */
  setupCalendarSync() {
    const calCard = document.getElementById('cal-card');
    const calButtons = calCard?.querySelectorAll('[data-cal]');
    
    calButtons?.forEach(button => {
      button.addEventListener('click', (e) => {
        const calProvider = e.target.dataset.cal;
        this.handleCalendarSync(calProvider);
      });
    });
  }

  /**
   * Navigate to a route
   */
  navigate(route) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.style.display = 'none';
    });

    // Load the appropriate controller/content
    this.loadRoute(route);
    
    // Update navigation states
    this.updateActiveTab(route);
    this.updateActiveSidebar(route);
  }

  /**
   * Load route content
   */
  loadRoute(route) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Map routes to their content
    switch (route) {
      case 'events':
        this.loadEvents();
        break;
      case 'invites':
        this.loadInvites();
        break;
      case 'home':
        this.loadHome();
        break;
      case 'people':
        this.loadPeople();
        break;
      case 'opportunities':
        this.loadOpportunities();
        break;
      case 'me':
        this.loadProfile();
        break;
      default:
        this.loadEvents(); // Default to events
    }
  }

  /**
   * Load events screen (Tonight's Best Parties)
   */
  loadEvents() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Use the updated EventController template with "Tonight's Best Parties"
    const eventsController = this.controllers.get('events') || new EventController();
    if (!this.controllers.has('events')) {
      this.controllers.set('events', eventsController);
    }

    // Trigger controller to render
    eventsController.mount(mainContent);
  }

  /**
   * Load invites screen (Trophy Case)
   */
  loadInvites() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <section id="route-invites" class="screen">
        <header class="inv-head">
          <div>
            <h1 class="h1">Your Network</h1>
            <p class="muted">Professionals you've brought in.</p>
          </div>
          <span id="inv-pill" class="pill-gold">10 Left</span>
        </header>

        <div class="inv-stats">
          <div class="stat">
            <span class="val" id="inv-left">10</span>
            <span class="lab">Left</span>
          </div>
          <div class="stat">
            <span class="val" id="inv-red">0</span>
            <span class="lab">Redeemed</span>
          </div>
          <div class="stat">
            <span class="val" id="inv-tot">10</span>
            <span class="lab">Total Granted</span>
          </div>
        </div>

        <div class="inv-actions">
          <button class="btn btn-primary" data-action="invite">Send Invite</button>
          <button class="btn" data-action="copy">Copy Link</button>
          <button class="btn" data-action="qr">QR Code</button>
        </div>

        <h2 class="eyebrow">Recently Invited</h2>
        <ul id="inv-list" class="trophy-list" aria-live="polite"></ul>

        <!-- Bonus celebration -->
        <div id="bonus-banner" class="bonus hidden">
          <div class="confetti"></div>
          <p><b>+5 invites</b> unlocked — beautiful growth.</p>
        </div>
      </section>
    `;

    // Load sample trophy data
    this.loadTrophyData();
  }

  /**
   * Load other routes (placeholder)
   */
  loadHome() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    mainContent.innerHTML = '<div class="screen"><h1 class="h1">Professional Dashboard</h1><p class="sub">Coming soon...</p></div>';
  }

  loadPeople() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    mainContent.innerHTML = '<div class="screen"><h1 class="h1">Professional Network</h1><p class="sub">Coming soon...</p></div>';
  }

  loadOpportunities() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    mainContent.innerHTML = '<div class="screen"><h1 class="h1">Career Opportunities</h1><p class="sub">Coming soon...</p></div>';
  }

  loadProfile() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    mainContent.innerHTML = '<div class="screen"><h1 class="h1">Your Profile</h1><p class="sub">Coming soon...</p></div>';
  }

  /**
   * Load trophy data for invites
   */
  loadTrophyData() {
    const invList = document.getElementById('inv-list');
    const template = document.getElementById('tpl-invite-row');
    if (!invList || !template) return;

    // Sample data
    const trophies = [
      { name: 'Alex Chen', company: 'Epic Games', role: 'Producer', status: 'ok' },
      { name: 'Sarah Kim', company: 'Unity', role: 'Senior Dev', status: 'ok' },
      { name: 'Marcus Johnson', company: 'Riot Games', role: 'Art Director', status: 'wait' }
    ];

    trophies.forEach(trophy => {
      const clone = template.content.cloneNode(true);
      clone.querySelector('.name').textContent = trophy.name;
      clone.querySelector('.meta').textContent = `${trophy.company} • ${trophy.role}`;
      clone.querySelector('.badge').className = `badge ${trophy.status}`;
      clone.querySelector('.badge').textContent = trophy.status === 'ok' ? 'Redeemed' : 'Pending';
      invList.appendChild(clone);
    });
  }

  /**
   * Update active navigation tab
   */
  updateActiveTab(route) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.route === route);
    });
  }

  /**
   * Update active sidebar item
   */
  updateActiveSidebar(route) {
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === route);
    });
  }

  /**
   * Show account setup sheet
   */
  showAccountSheet() {
    const sheet = document.getElementById('account-sheet');
    if (sheet) {
      sheet.classList.add('show');
      sheet.hidden = false;
    }
  }

  /**
   * Show calendar sync card
   */
  showCalendarCard() {
    const card = document.getElementById('cal-card');
    if (card) {
      card.hidden = false;
    }
  }

  /**
   * Handle authentication
   */
  handleAuth(provider) {
    console.log(`Auth with ${provider}`);
    this.announce(`Connecting with ${provider}...`);
    
    // Hide sheet after auth
    setTimeout(() => {
      const sheet = document.getElementById('account-sheet');
      if (sheet) {
        sheet.classList.remove('show');
        sheet.hidden = true;
      }
      this.announce('Account connected.');
    }, 1500);
  }

  /**
   * Handle calendar sync
   */
  handleCalendarSync(provider) {
    console.log(`Calendar sync with ${provider}`);
    const status = document.getElementById('cal-status');
    const card = document.getElementById('cal-card');
    const success = document.getElementById('cal-success');
    
    if (status) {
      status.hidden = false;
    }
    
    setTimeout(() => {
      if (card) card.hidden = true;
      if (success) success.hidden = false;
      if (status) status.hidden = true;
      this.announce('Calendar synced — meetings will auto-match.');
    }, 2000);
  }

  /**
   * Create ARIA announcer if it doesn't exist
   */
  createAnnouncer() {
    const announcer = document.createElement('div');
    announcer.id = 'announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
    return announcer;
  }

  /**
   * Announce message to screen readers
   */
  announce(message) {
    if (this.announcer) {
      this.announcer.textContent = message;
    }
  }

  /**
   * ⚡ OPTIMIZED: Set up application routing with dynamic controller loading
   */
  async setupRouting() {
    if (!router) {
      console.warn('⚠️ Router not available, skipping routing setup');
      return;
    }

    // Pre-load critical controllers in background
    this.preloadCriticalControllers();

    // Initialize controllers dynamically based on data-route attributes
    const routeElements = document.querySelectorAll('[data-route]');
    const controllerPromises = Array.from(routeElements).map(async (section) => {
      const routeName = section.dataset.route;
      
      try {
        const ControllerClass = await ModuleLoader.loadController(routeName);
        if (ControllerClass) {
          const controller = new ControllerClass(section);
          
          // Initialize with error isolation
          await this.withRetry(() => controller.init?.(), 2, 500)
            .catch(error => console.warn(`⚠️ Controller ${routeName} init failed:`, error));
          
          this.controllers.set(routeName, controller);
          console.log(`✅ ${routeName} controller loaded`);
          return { routeName, success: true };
        }
      } catch (error) {
        console.error(`❌ Failed to load ${routeName} controller:`, error);
        return { routeName, success: false, error };
      }
    });

    // Wait for controller loading with timeout
    const controllerResults = await Promise.allSettled(controllerPromises);
    const loadedControllers = controllerResults
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => r.value.routeName);
    
    console.log(`🎯 Loaded controllers: ${loadedControllers.join(', ')}`);

    // Define routes with graceful fallbacks
    const routes = {
      '/': () => router.navigate('/home'),
      '/home': () => this.loadControllerSafe('home'),
      '/people': () => this.loadControllerSafe('people'),
      '/opportunities': () => this.loadControllerSafe('opportunities'),
      '/events': () => this.loadControllerSafe('events'),
      '/events/:id': () => this.loadControllerSafe('events'),
      '/me': () => this.loadControllerSafe('me'),
      '/invite': () => this.loadControllerSafe('invite'),
      '/calendar': () => this.loadControllerSafe('calendar')
    };
    
    try {
      router.routes(routes);
    } catch (error) {
      console.error('❌ Failed to setup routes:', error);
      return;
    }

    // Set up navigation hooks with error handling
    if (typeof router.beforeEach === 'function') {
      router.beforeEach(async (to, from) => {
        try {
          this.updatePageTitle(to.route);
          
          if (nav && typeof nav.setActiveRoute === 'function') {
            nav.setActiveRoute(to.route);
          }
          
          if (Store && Store.actions && to.route !== '/home') {
            Store.actions.showLoading?.();
          }
          
          return true;
        } catch (error) {
          console.warn('⚠️ Navigation hook error:', error);
          return true; // Continue navigation
        }
      });
    }

    if (typeof router.afterEach === 'function') {
      router.afterEach(async (to) => {
        try {
          if (Store && Store.actions) {
            Store.actions.hideLoading?.();
          }
          
          if (motion && typeof motion.initializeView === 'function') {
            const viewName = to.route.split('/')[1] || 'home';
            motion.initializeView(viewName);
          }
          
          this.trackNavigation(to);
        } catch (error) {
          console.warn('⚠️ After navigation hook error:', error);
        }
      });
    }

    // Handle route not found with error recovery
    if (typeof router.notFound === 'function') {
      router.notFound((path) => {
        console.warn('Route not found:', path);
        try {
          router.navigate('/home');
        } catch (error) {
          console.error('❌ Failed to navigate to fallback route:', error);
          // Last resort: manual navigation
          // Safe route to home
          const current = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
          if (current !== 'home') window.location.hash = '#/home';
        }
      });
    }
  }
  
  /**
   * Pre-load critical controllers in background
   */
  async preloadCriticalControllers() {
    const criticalControllers = ['events', 'home', 'people'];
    
    // Load in background without blocking
    setTimeout(() => {
      criticalControllers.forEach(controllerName => {
        ModuleLoader.loadController(controllerName)
          .catch(error => console.log(`Background preload failed for ${controllerName}:`, error));
      });
    }, 100);
  }
  
  /**
   * Load controller with enhanced error handling
   */
  async loadControllerSafe(controllerName) {
    try {
      return await this.loadController(controllerName);
    } catch (error) {
      console.error(`❌ Failed to load controller ${controllerName}:`, error);
      
      // Fallback to basic content
      this.loadFallbackContent(controllerName);
    }
  }
  
  /**
   * Load fallback content when controller fails
   */
  loadFallbackContent(controllerName) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    const fallbackContent = {
      home: '<div class="screen"><h1 class="h1">Professional Dashboard</h1><p class="sub">Loading...</p></div>',
      people: '<div class="screen"><h1 class="h1">Professional Network</h1><p class="sub">Loading...</p></div>',
      opportunities: '<div class="screen"><h1 class="h1">Career Opportunities</h1><p class="sub">Loading...</p></div>',
      events: '<div class="screen"><h1 class="h1">Events</h1><p class="sub">Loading events...</p></div>',
      me: '<div class="screen"><h1 class="h1">Your Profile</h1><p class="sub">Loading...</p></div>'
    };
    
    mainContent.innerHTML = fallbackContent[controllerName] || 
      '<div class="screen"><h1 class="h1">Content Unavailable</h1><p class="sub">Please try again later.</p></div>';
  }

  /**
   * Initialize UI components
   */
  initializeUI() {
    // Initialize view transition system
    try {
      if (viewTX && typeof viewTX.init === 'function') {
        viewTX.init();
        console.log('✅ View transition system initialized');
      } else {
        throw new Error('View transition system not available');
      }
    } catch (error) {
      console.warn('⚠️ View transition system initialization failed:', error);
    }
    
    // Initialize press feedback system
    try {
      if (typeof bindPressFeedback === 'function') {
        bindPressFeedback();
        console.log('✅ Press feedback system initialized');
      } else {
        throw new Error('Press feedback system not available');
      }
    } catch (error) {
      console.warn('⚠️ Press feedback system initialization failed:', error);
    }
    
    // Initialize performance monitoring
    try {
      if (typeof createFPSWatchdog === 'function') {
        createFPSWatchdog({ minFps: 45, sampleMs: 1000 });
        console.log('✅ Performance monitoring initialized');
      } else {
        throw new Error('Performance monitoring not available');
      }
    } catch (error) {
      console.warn('⚠️ Performance monitoring initialization failed:', error);
    }
    
    // Set up UI interactions (gracefully handle failures)
    try {
      this.setupTopbar();
    } catch (error) {
      console.warn('⚠️ Topbar setup failed:', error);
    }
    
    try {
      this.setupTabbar();
    } catch (error) {
      console.warn('⚠️ Tabbar setup failed:', error);
    }
    
    try {
      this.initializeSignalField();
    } catch (error) {
      console.warn('⚠️ Signal field initialization failed:', error);
    }
    
    try {
      this.setupQuickActions();
    } catch (error) {
      console.warn('⚠️ Quick actions setup failed:', error);
    }
    
    try {
      this.setupThemeHandling();
    } catch (error) {
      console.warn('⚠️ Theme handling setup failed:', error);
    }
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
    import('./ui/canvasField.js?v=b023').then(({ canvasField }) => {
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
   * ⚡ OPTIMIZED: Load and initialize controller with enhanced caching
   */
  async loadController(controllerName) {
    try {
      // Check if controller is already loaded and cached
      let controller = this.controllers.get(controllerName);
      
      if (!controller) {
        console.log(`🔄 Loading controller ${controllerName}...`);
        
        // Attempt to load controller dynamically
        const ControllerClass = await ModuleLoader.loadController(controllerName);
        if (!ControllerClass) {
          throw new Error(`Controller class not found for ${controllerName}`);
        }
        
        // Find the section element for this controller
        const section = document.querySelector(`[data-route="${controllerName}"]`);
        controller = new ControllerClass(section);
        
        // Initialize with retry logic
        await this.withRetry(() => controller.init?.(), 2, 500);
        
        // Cache the controller
        this.controllers.set(controllerName, controller);
        console.log(`✅ Controller ${controllerName} loaded and cached`);
      }

      // Cleanup previous controller with error handling
      if (this.currentController && this.currentController !== controller) {
        try {
          if (typeof this.currentController.destroy === 'function') {
            await this.currentController.destroy();
          }
        } catch (cleanupError) {
          console.warn(`⚠️ Previous controller cleanup failed:`, cleanupError);
        }
      }

      // Activate current controller
      if (typeof controller.activate === 'function') {
        await controller.activate();
      } else if (typeof controller.mount === 'function') {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          controller.mount(mainContent);
        }
      }

      this.currentController = controller;
      console.log(`✅ Controller ${controllerName} activated`);
      
      return controller;
      
    } catch (error) {
      console.error(`❌ Failed to load controller ${controllerName}:`, error);
      
      // Enhanced fallback logic
      if (controllerName !== 'events') {
        console.log(`🔄 Falling back to events controller...`);
        try {
          if (router && typeof router.navigate === 'function') {
            router.navigate('/events');
          } else {
            // Safe route to events
            const current = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
            if (current !== 'events') window.location.hash = '#/events';
          }
        } catch (fallbackError) {
          console.error('❌ Fallback navigation failed:', fallbackError);
          this.loadFallbackContent(controllerName);
        }
      } else {
        // Last resort for events controller failure
        this.loadFallbackContent('events');
      }
      
      throw error;
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
      import('./services/proximity.js?v=b023').then(({ proximity }) => {
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

// ⚡ OPTIMIZED: Initialize app with performance monitoring
const app = new ProfessionalIntelligenceApp();

// Enhanced initialization with error recovery
async function initializeApp() {
  try {
    await app.init();
  } catch (error) {
    console.error('❌ Critical initialization failure:', error);
    
    // Attempt recovery after delay
    setTimeout(() => {
      console.log('🔄 Attempting app recovery...');
      app.init().catch(recoveryError => {
        console.error('❌ Recovery failed:', recoveryError);
        app.handleInitializationError(recoveryError);
      });
    }, 2000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for debugging with enhanced utilities
window.app = app;
Object.defineProperty(window, 'router', {
  get: () => router,
  enumerable: true
});
Object.defineProperty(window, 'store', {
  get: () => window.Store,
  enumerable: true
});

// Debug utilities
window.debug = {
  moduleStats: () => ModuleLoader.getStats(),
  cacheStats: () => window.CacheManager?.getStats() || 'Cache not available',
  appStats: () => window.app.stats || 'Stats not available',
  reloadModule: (modulePath) => {
    ModuleLoader.cache.delete(modulePath);
    return ModuleLoader.loadCoreModule(modulePath);
  },
  testPerformance: () => {
    if (typeof window.testPerformance === 'function') {
      return window.testPerformance();
    }
    return 'Performance test not available';
  }
};

console.log('🔧 Debug utilities available: window.debug');

// Sidebar/mobilenav
const sidenav = document.getElementById('sidenav');
const overlay = document.getElementById('overlay');
document.getElementById('menu')?.addEventListener('click', ()=>{ sidenav.classList.add('open'); overlay.hidden=false; });
overlay?.addEventListener('click', ()=>{ sidenav.classList.remove('open'); overlay.hidden=true; });

document.querySelectorAll('.nav-item').forEach(b=>{
  b.addEventListener('click', ()=>{ location.hash = '#/' + b.dataset.route; sidenav.classList.remove('open'); overlay.hidden=true; });
});

// Import enhanced router
import('/js/router-enhanced.js?v=b023').then(module => {
  console.log('Enhanced router loaded');
}).catch(err => {
  console.warn('Enhanced router failed, using fallback', err);
  // Fallback to basic routing
  window.addEventListener('hashchange', syncNavFromRoute);
  syncNavFromRoute();
});

// Valid routes set
const VALID_APP_ROUTES = new Set(['parties','hotspots','calendar','invites','opportunities','me','settings']);

function getCurrentRoute() {
  const hash = (location.hash || '').replace(/^#\/?/, '');
  const route = hash.split('?')[0].toLowerCase();
  if (VALID_APP_ROUTES.has(route)) return route;
  return 'parties';
}

async function syncNavFromRoute(){
  const r = getCurrentRoute();
  document.querySelectorAll('.nav-item').forEach(b=> b.classList.toggle('active', b.dataset.route===r));
  const t = document.getElementById('page-title'); if (t) t.textContent = r.replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  
  // Handle route sections
  document.querySelectorAll('[data-route]').forEach(section => {
    if (section.tagName === 'SECTION') {
      section.hidden = section.dataset.route !== r;
    }
  });
  
  // Mount hotspots when route is active
  if (r === 'hotspots') {
    const module = await import('/js/hotspots-controller.js?v=b023');
    if (module.mountHotspots) {
      module.mountHotspots();
    }
  }
}

// Accessibility announcement function
window.announce = function(message) {
  const liveRegion = document.getElementById('sr-live') || document.getElementById('aria-live-status');
  if (liveRegion) {
    liveRegion.textContent = '';
    setTimeout(() => { liveRegion.textContent = message; }, 100);
  }
};

export default app;