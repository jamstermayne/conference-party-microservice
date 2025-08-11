/**
 * 🚀 PROFESSIONAL INTELLIGENCE PLATFORM - MAIN APPLICATION
 * Modular navigation system with sophisticated interactions and premium animations
 * Built for the ultimate professional networking experience
 */

class ProfessionalIntelligencePlatform {
  constructor() {
    this.currentRoute = 'events';
    this.isInitialized = false;
    this.navigationItems = new Map();
    this.eventData = new Map();
    this.userProfile = this.loadUserProfile();
    
    // Bind methods
    this.handleNavigation = this.handleNavigation.bind(this);
    this.handleMobileMenu = this.handleMobileMenu.bind(this);
    this.handleRouteChange = this.handleRouteChange.bind(this);
    
    console.log('🎨 Professional Intelligence Platform initializing...');
    this.initialize();
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Setup navigation system
      this.setupNavigation();
      
      // Setup mobile interactions
      this.setupMobileMenu();
      
      // Load initial data
      await this.loadInitialData();
      
      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      // Setup premium animations
      this.setupAnimations();
      
      // Mark as initialized
      this.isInitialized = true;
      
      // Show welcome notification
      this.showNotification('Welcome to the Professional Intelligence Platform', 'success');
      
      console.log('✅ Professional Intelligence Platform initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize platform:', error);
      this.showNotification('Failed to initialize platform', 'error');
    }
  }

  /**
   * Setup sophisticated navigation system
   */
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      const route = href ? href.replace('#', '') : 'events';
      
      this.navigationItems.set(route, {
        element: item,
        title: item.querySelector('span')?.textContent || route,
        icon: item.querySelector('.nav-icon'),
        badge: item.querySelector('.nav-badge')
      });
      
      // Add premium click animation
      item.addEventListener('click', this.handleNavigation);
      
      // Add premium hover effects
      item.addEventListener('mouseenter', this.handleNavHover);
      item.addEventListener('mouseleave', this.handleNavLeave);
    });

    // Handle browser back/forward
    window.addEventListener('popstate', this.handleRouteChange);
  }

  /**
   * Handle navigation with premium animations
   */
  async handleNavigation(event) {
    event.preventDefault();
    
    const target = event.currentTarget;
    const href = target.getAttribute('href');
    const route = href ? href.replace('#', '') : 'events';
    
    // Add click animation
    target.style.transform = 'scale(0.95)';
    setTimeout(() => {
      target.style.transform = '';
    }, 150);
    
    // Navigate to route
    await this.navigateToRoute(route);
  }

  /**
   * Navigate to specific route with sophisticated transitions
   */
  async navigateToRoute(route) {
    if (this.currentRoute === route) return;
    
    const previousRoute = this.currentRoute;
    this.currentRoute = route;
    
    // Update URL
    history.pushState({ route }, '', `#${route}`);
    
    // Update navigation states
    this.updateNavigationState(route);
    
    // Update page content with animation
    await this.updatePageContent(route, previousRoute);
    
    // Close mobile menu if open
    this.closeMobileMenu();
    
    console.log(`📍 Navigated to: ${route}`);
  }

  /**
   * Update navigation visual state
   */
  updateNavigationState(activeRoute) {
    this.navigationItems.forEach((nav, route) => {
      if (route === activeRoute) {
        nav.element.classList.add('active');
        
        // Premium glow effect
        nav.element.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.3)';
        setTimeout(() => {
          nav.element.style.boxShadow = '';
        }, 500);
        
      } else {
        nav.element.classList.remove('active');
      }
    });
  }

  /**
   * Update page content with sophisticated animations
   */
  async updatePageContent(route, previousRoute) {
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const contentBody = document.getElementById('content-body');
    
    // Fade out current content
    if (contentBody) {
      contentBody.style.opacity = '0';
      contentBody.style.transform = 'translateY(20px)';
    }
    
    // Wait for animation
    await this.delay(200);
    
    // Update content based on route
    const routeData = this.getRouteData(route);
    
    if (pageTitle) {
      pageTitle.textContent = routeData.title;
      pageTitle.style.background = routeData.titleGradient || '';
      pageTitle.style.webkitBackgroundClip = routeData.titleGradient ? 'text' : '';
      pageTitle.style.webkitTextFillColor = routeData.titleGradient ? 'transparent' : '';
    }
    
    if (pageSubtitle) {
      pageSubtitle.textContent = routeData.subtitle;
    }
    
    // Show/hide sections
    this.updateSectionVisibility(route);
    
    // Load route-specific content
    await this.loadRouteContent(route);
    
    // Fade in new content
    if (contentBody) {
      contentBody.style.opacity = '1';
      contentBody.style.transform = 'translateY(0)';
    }
  }

  /**
   * Get route-specific data
   */
  getRouteData(route) {
    const routeConfig = {
      events: {
        title: 'Tonight\'s Best Events',
        subtitle: 'Discover exclusive gaming industry networking opportunities',
        titleGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      invites: {
        title: 'Exclusive Invitations',
        subtitle: 'VIP access to premium industry events',
        titleGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      calendar: {
        title: 'Calendar Integration',
        subtitle: 'Sync your professional schedule seamlessly',
        titleGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      },
      people: {
        title: 'Professional Network',
        subtitle: 'Connect with industry leaders and innovators',
        titleGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
      },
      profile: {
        title: 'Your Profile',
        subtitle: 'Manage your professional presence',
        titleGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
      },
      settings: {
        title: 'Platform Settings',
        subtitle: 'Customize your professional experience',
        titleGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
      }
    };
    
    return routeConfig[route] || routeConfig.events;
  }

  /**
   * Update section visibility
   */
  updateSectionVisibility(activeRoute) {
    const sections = document.querySelectorAll('.page-section');
    
    sections.forEach(section => {
      const sectionRoute = section.id.replace('-section', '');
      
      if (sectionRoute === activeRoute) {
        section.classList.remove('hidden');
        section.classList.add('active');
        section.style.animation = 'fadeIn 0.4s ease-out';
      } else {
        section.classList.add('hidden');
        section.classList.remove('active');
      }
    });
  }

  /**
   * Load route-specific content
   */
  async loadRouteContent(route) {
    switch (route) {
      case 'events':
        await this.loadEventsContent();
        break;
      case 'invites':
        await this.loadInvitesContent();
        break;
      case 'calendar':
        await this.loadCalendarContent();
        break;
      case 'people':
        await this.loadPeopleContent();
        break;
      case 'profile':
        await this.loadProfileContent();
        break;
      case 'settings':
        await this.loadSettingsContent();
        break;
      default:
        console.warn(`Unknown route: ${route}`);
    }
  }

  /**
   * Load events content with premium cards
   */
  async loadEventsContent() {
    const eventsGrid = document.getElementById('events-grid');
    if (!eventsGrid) return;
    
    // Show loading state
    eventsGrid.innerHTML = this.createLoadingCards(6);
    
    try {
      // Simulate API call
      await this.delay(800);
      
      // Load mock event data
      const events = await this.fetchEvents();
      
      // Render event cards with staggered animation
      eventsGrid.innerHTML = '';
      events.forEach((event, index) => {
        setTimeout(() => {
          const card = this.createEventCard(event);
          eventsGrid.appendChild(card);
        }, index * 100);
      });
      
      // Update badge count
      this.updateBadge('events', events.length);
      
    } catch (error) {
      console.error('Failed to load events:', error);
      eventsGrid.innerHTML = this.createErrorState('Failed to load events');
    }
  }

  /**
   * Create premium event card
   */
  createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card animate-fade-in';
    card.style.cursor = 'pointer';
    
    card.innerHTML = `
      <div class="event-card-header">
        <h3 class="event-card-title">${event.title}</h3>
        <div class="event-card-badge">${event.type}</div>
      </div>
      <div class="event-card-meta">
        <span>🕒 ${event.time}</span>
        <span>📍 ${event.venue}</span>
        <span>👥 ${event.capacity} capacity</span>
      </div>
      <p class="event-card-description">${event.description}</p>
      <div class="event-card-actions">
        <button class="btn-premium btn-sm" onclick="app.handleEventRSVP('${event.id}')">
          RSVP
        </button>
        <button class="btn-glass btn-sm" onclick="app.handleEventSave('${event.id}')">
          ${event.saved ? 'Saved' : 'Save'}
        </button>
        <button class="btn-ghost btn-sm" onclick="app.handleEventShare('${event.id}')">
          Share
        </button>
      </div>
    `;
    
    // Add premium hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px) scale(1.02)';
      card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 40px rgba(102, 126, 234, 0.2)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
    
    return card;
  }

  /**
   * Create loading cards
   */
  createLoadingCards(count) {
    let cards = '';
    for (let i = 0; i < count; i++) {
      cards += `
        <div class="event-card loading-skeleton" style="height: 280px;">
          <div style="height: 100%; opacity: 0.3;"></div>
        </div>
      `;
    }
    return cards;
  }

  /**
   * Setup mobile menu interactions
   */
  setupMobileMenu() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileToggle) {
      mobileToggle.addEventListener('click', this.handleMobileMenu);
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(event.target) && event.target !== mobileToggle) {
          this.closeMobileMenu();
        }
      }
    });
  }

  /**
   * Handle mobile menu toggle
   */
  handleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('mobile-menu-toggle');
    
    if (sidebar) {
      const isOpen = sidebar.classList.contains('open');
      
      if (isOpen) {
        this.closeMobileMenu();
      } else {
        this.openMobileMenu();
      }
      
      // Update ARIA attributes
      if (toggle) {
        toggle.setAttribute('aria-expanded', (!isOpen).toString());
      }
    }
  }

  /**
   * Open mobile menu with animation
   */
  openMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.add('open');
      sidebar.style.animation = 'slideIn 0.3s ease-out';
    }
  }

  /**
   * Close mobile menu with animation
   */
  closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      
      if (event.key === 'Escape') {
        this.closeMobileMenu();
      } else if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            this.navigateToRoute('events');
            break;
          case '2':
            event.preventDefault();
            this.navigateToRoute('invites');
            break;
          case '3':
            event.preventDefault();
            this.navigateToRoute('calendar');
            break;
          case '4':
            event.preventDefault();
            this.navigateToRoute('people');
            break;
          case '5':
            event.preventDefault();
            this.navigateToRoute('profile');
            break;
          case '6':
            event.preventDefault();
            this.navigateToRoute('settings');
            break;
        }
      }
    });
  }

  /**
   * Setup premium animations
   */
  setupAnimations() {
    // Add intersection observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, { threshold: 0.1 });

    // Observe all cards
    document.querySelectorAll('.glass-card, .event-card').forEach(card => {
      observer.observe(card);
    });
  }

  /**
   * Event handlers for premium interactions
   */
  async handleEventRSVP(eventId) {
    this.showNotification('RSVP confirmed! Check your calendar for updates.', 'success');
    
    // Premium button animation
    const button = event.target;
    button.style.transform = 'scale(0.95)';
    button.textContent = '✓ RSVP\'d';
    button.classList.add('btn-glass');
    button.classList.remove('btn-premium');
    
    setTimeout(() => {
      button.style.transform = '';
    }, 150);
  }

  async handleEventSave(eventId) {
    this.showNotification('Event saved to your list', 'success');
    
    const button = event.target;
    button.textContent = button.textContent === 'Saved' ? 'Save' : 'Saved';
  }

  async handleEventShare(eventId) {
    if (navigator.share) {
      await navigator.share({
        title: 'Professional Event',
        text: 'Check out this amazing networking event!',
        url: window.location.href
      });
    } else {
      this.showNotification('Event link copied to clipboard!', 'success');
    }
  }

  /**
   * Load user profile data
   */
  loadUserProfile() {
    const stored = localStorage.getItem('professional_profile');
    return stored ? JSON.parse(stored) : {
      name: '',
      title: '',
      company: '',
      preferences: {}
    };
  }

  /**
   * Mock data fetchers
   */
  async fetchEvents() {
    // Simulate API delay
    await this.delay(500);
    
    return [
      {
        id: '1',
        title: 'Xbox Gaming Showcase',
        type: 'Premium',
        time: 'Tonight, 8:00 PM',
        venue: 'Koelnmesse Hall 7',
        capacity: '500',
        description: 'Exclusive networking with Xbox leadership team and top developers.',
        saved: false
      },
      {
        id: '2',
        title: 'Indie Developer Mixer',
        type: 'Community',
        time: 'Tonight, 9:30 PM',
        venue: 'Flora Venue',
        capacity: '200',
        description: 'Connect with innovative indie developers and publishers.',
        saved: true
      },
      {
        id: '3',
        title: 'VIP Publisher Summit',
        type: 'Exclusive',
        time: 'Tomorrow, 7:00 PM',
        venue: 'Hotel Excellence',
        capacity: '100',
        description: 'High-level discussions with major gaming publishers.',
        saved: false
      }
    ];
  }

  /**
   * Update navigation badge counts
   */
  updateBadge(route, count) {
    const nav = this.navigationItems.get(route);
    if (nav && nav.badge) {
      nav.badge.textContent = count.toString();
      
      // Premium pulse animation
      nav.badge.style.animation = 'pulse 0.5s ease-in-out';
      setTimeout(() => {
        nav.badge.style.animation = '';
      }, 500);
    }
  }

  /**
   * Show premium notification
   */
  showNotification(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-title">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} Notification</div>
      <div class="notification-message">${message}</div>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle route changes from browser navigation
   */
  handleRouteChange(event) {
    const route = event.state?.route || location.hash.replace('#', '') || 'events';
    this.navigateToRoute(route);
  }

  /**
   * Load other route content (stubs for now)
   */
  async loadInvitesContent() {
    console.log('Loading invites content...');
    this.updateBadge('invites', 3);
  }

  async loadCalendarContent() {
    console.log('Loading calendar content...');
  }

  async loadPeopleContent() {
    console.log('Loading network content...');
    this.updateBadge('people', 24);
  }

  async loadProfileContent() {
    console.log('Loading profile content...');
  }

  async loadSettingsContent() {
    console.log('Loading settings content...');
  }

  /**
   * Create error state UI
   */
  createErrorState(message) {
    return `
      <div class="glass-card text-center" style="grid-column: 1 / -1;">
        <div class="text-6xl opacity-50 mb-4">⚠️</div>
        <h3 class="text-title mb-2">Something went wrong</h3>
        <p class="text-body opacity-75 mb-4">${message}</p>
        <button class="btn-premium" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

// Initialize the application when DOM is ready
let app;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app = new ProfessionalIntelligencePlatform();
  });
} else {
  app = new ProfessionalIntelligencePlatform();
}

// Make app globally available for event handlers
window.app = app;

console.log('🚀 Professional Intelligence Platform script loaded');