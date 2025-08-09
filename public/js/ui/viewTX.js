/**
 * VIEW TRANSITIONS MODULE
 * Enhanced Native View Transitions API with comprehensive fallbacks
 */

export const ViewTX = {
  supported: typeof document.startViewTransition === 'function',
  run(fn){ return this.supported ? document.startViewTransition(fn) : fn(); },
  swap(el, html){ this.run(()=> el.innerHTML = html); }
};

// Enhanced ViewTX with performance optimizations and better error handling
class ViewTransitions {
  constructor() {
    this.supported = ViewTX.supported;
    this.currentTransition = null;
    this.queue = [];
    this.defaultDuration = 300;
    this.debugMode = false;
    this.transitionCount = 0;
    this.performance = {
      totalTransitions: 0,
      failedTransitions: 0,
      averageDuration: 0
    };
  }

  /**
   * Initialize view transitions with performance monitoring
   */
  init(options = {}) {
    this.debugMode = options.debug || false;
    
    if (this.supported) {
      this.setupViewTransitionStyles();
      this.setupPerformanceMonitoring();
    }
    
    console.log(`✅ View transitions ${this.supported ? 'enabled' : 'fallback mode'}`);
  }

  /**
   * Basic transition with enhanced error handling
   */
  run(fn) {
    if (!this.supported) {
      try {
        return fn();
      } catch (error) {
        console.error('Fallback transition failed:', error);
        return null;
      }
    }

    this.performance.totalTransitions++;
    const startTime = performance.now();

    try {
      const transition = document.startViewTransition(() => {
        try {
          return fn();
        } catch (error) {
          console.error('View transition callback failed:', error);
          throw error;
        }
      });

      if (this.debugMode) {
        transition.finished.then(() => {
          const duration = performance.now() - startTime;
          console.log(`🎬 Transition completed in ${duration.toFixed(2)}ms`);
        });
      }

      return transition;
    } catch (error) {
      this.performance.failedTransitions++;
      console.warn('View transition failed, using fallback:', error);
      return fn();
    }
  }

  /**
   * Route transition with smart preloading and caching
   */
  async routeTransition(fromRoute, toRoute, updateDOM, options = {}) {
    if (!this.supported) {
      updateDOM();
      return;
    }

    // Prevent concurrent transitions
    if (this.currentTransition) {
      await this.currentTransition.finished.catch(() => {});
    }

    this.setRouteTransitionNames(fromRoute, toRoute, options);

    try {
      this.currentTransition = document.startViewTransition(() => {
        updateDOM();
        document.documentElement.setAttribute('data-route', toRoute);
        document.documentElement.setAttribute('data-from-route', fromRoute);
        
        // Update page metadata for better transitions
        this.updatePageMetadata(toRoute);
      });

      await this.currentTransition.finished;
      this.clearTransitionNames();
      this.currentTransition = null;
      
    } catch (error) {
      console.warn('Route transition failed:', error);
      this.currentTransition = null;
      updateDOM();
      document.documentElement.setAttribute('data-route', toRoute);
    }
  }

  /**
   * Modal transition with backdrop handling
   */
  async showModal(modal, content, options = {}) {
    const backdrop = modal.querySelector('.modal-backdrop') || modal;
    
    return this.run(() => {
      modal.style.viewTransitionName = options.name || 'modal';
      backdrop.style.viewTransitionName = 'modal-backdrop';
      
      if (content) {
        const contentContainer = modal.querySelector('.modal-content');
        if (contentContainer) {
          contentContainer.innerHTML = content;
        }
      }
      
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      
      // Focus management
      const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }
    });
  }

  /**
   * Hide modal with proper cleanup
   */
  async hideModal(modal, options = {}) {
    return this.run(() => {
      modal.style.viewTransitionName = options.name || 'modal';
      const backdrop = modal.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.style.viewTransitionName = 'modal-backdrop';
      }
      
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      
      // Return focus to trigger element if available
      if (options.returnFocus && options.returnFocus.focus) {
        setTimeout(() => options.returnFocus.focus(), 50);
      }
    });
  }

  /**
   * Enhanced card interaction with gesture support
   */
  async cardInteraction(card, action, options = {}) {
    if (!this.supported) {
      action();
      return;
    }

    const transitionName = options.name || `card-${Date.now()}`;
    card.style.viewTransitionName = transitionName;

    // Add interaction state
    card.classList.add('transitioning');

    try {
      const transition = document.startViewTransition(() => {
        action();
        
        // Apply transform if specified
        if (options.transform) {
          card.style.transform = options.transform;
        }
        
        if (options.opacity !== undefined) {
          card.style.opacity = options.opacity;
        }
      });

      await transition.finished;
    } catch (error) {
      console.warn('Card transition failed:', error);
      action();
    } finally {
      card.style.viewTransitionName = '';
      card.classList.remove('transitioning');
      
      // Cleanup temporary styles
      if (options.cleanup !== false) {
        setTimeout(() => {
          card.style.transform = '';
          card.style.opacity = '';
        }, 50);
      }
    }
  }

  /**
   * Optimized list update with item tracking
   */
  async updateList(container, updateFn, options = {}) {
    if (!this.supported) {
      updateFn();
      return;
    }

    // Assign stable transition names to existing items
    const items = container.querySelectorAll('[data-id]');
    const existingIds = new Set();
    
    items.forEach(item => {
      const id = item.dataset.id;
      if (id && !existingIds.has(id)) {
        item.style.viewTransitionName = `list-item-${id}`;
        existingIds.add(id);
      }
    });

    try {
      const transition = document.startViewTransition(() => {
        updateFn();
        
        // Assign names to new items
        if (options.assignNewNames !== false) {
          const newItems = container.querySelectorAll('[data-id]:not([style*="view-transition-name"])');
          newItems.forEach(item => {
            const id = item.dataset.id;
            if (id && !existingIds.has(id)) {
              item.style.viewTransitionName = `list-item-${id}`;
            }
          });
        }
      });

      await transition.finished;
    } finally {
      this.clearTransitionNames(container);
    }
  }

  /**
   * Enhanced profile transition with hero animation
   */
  async showProfile(profileCard, profileView, options = {}) {
    if (!this.supported) {
      this.fallbackProfileTransition(profileCard, profileView);
      return;
    }

    // Set up hero element transition
    profileCard.style.viewTransitionName = 'profile-hero';
    
    const avatar = profileCard.querySelector('.avatar, .profile-image');
    if (avatar) {
      avatar.style.viewTransitionName = 'profile-avatar';
    }
    
    const name = profileCard.querySelector('.name, .profile-name');
    if (name) {
      name.style.viewTransitionName = 'profile-name';
    }

    try {
      const transition = document.startViewTransition(() => {
        profileCard.style.display = 'none';
        profileView.hidden = false;
        
        // Match elements in profile view
        const viewAvatar = profileView.querySelector('.avatar, .profile-image');
        if (viewAvatar) {
          viewAvatar.style.viewTransitionName = 'profile-avatar';
        }
        
        const viewName = profileView.querySelector('.name, .profile-name');
        if (viewName) {
          viewName.style.viewTransitionName = 'profile-name';
        }
      });

      await transition.finished;
    } catch (error) {
      console.warn('Profile transition failed:', error);
      this.fallbackProfileTransition(profileCard, profileView);
    } finally {
      this.clearTransitionNames();
    }
  }

  /**
   * Smart transition name assignment with conflict resolution
   */
  setRouteTransitionNames(fromRoute, toRoute, options = {}) {
    const elements = [
      { selector: 'main', name: 'main-content' },
      { selector: '#page-title', name: 'page-title' },
      { selector: '.tabbar', name: 'tabbar' },
      { selector: '.nav-header', name: 'nav-header' },
      { selector: `[data-route="${toRoute}"]`, name: `route-${toRoute}` }
    ];

    elements.forEach(({ selector, name }) => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.viewTransitionName = name;
      }
    });

    // Custom elements from options
    if (options.elements) {
      options.elements.forEach(({ element, name }) => {
        if (element) {
          element.style.viewTransitionName = name;
        }
      });
    }
  }

  /**
   * Improved transition name cleanup
   */
  clearTransitionNames(container = document) {
    const elements = container.querySelectorAll('[style*="view-transition-name"]');
    elements.forEach(el => {
      el.style.viewTransitionName = '';
    });
  }

  /**
   * Enhanced CSS setup with better performance
   */
  setupViewTransitionStyles() {
    if (!this.supported) return;

    const style = document.createElement('style');
    style.id = 'view-transition-styles';
    style.textContent = `
      /* Performance optimizations */
      ::view-transition-group(*) {
        animation-fill-mode: both;
      }

      /* Root transition with hardware acceleration */
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation-duration: var(--transition-duration, 300ms);
        animation-timing-function: var(--ease-out, cubic-bezier(0.2, 0, 0, 1));
        will-change: transform, opacity;
      }

      /* Route transitions with direction support */
      [data-from-route] ::view-transition-old(main-content) {
        animation: slide-out-left 300ms var(--ease-out, ease-out) forwards;
      }
      
      [data-from-route] ::view-transition-new(main-content) {
        animation: slide-in-right 300ms var(--ease-out, ease-out) forwards;
      }

      /* Modal transitions with backdrop */
      ::view-transition-old(modal-backdrop) {
        animation: backdrop-out 200ms ease-out forwards;
      }
      
      ::view-transition-new(modal-backdrop) {
        animation: backdrop-in 300ms ease-out forwards;
      }

      ::view-transition-old(modal) {
        animation: modal-scale-out 250ms var(--ease-out, ease-out) forwards;
      }

      ::view-transition-new(modal) {
        animation: modal-scale-in 300ms var(--ease-spring, cubic-bezier(0.175, 0.885, 0.32, 1.275)) forwards;
      }

      /* Profile hero transitions */
      ::view-transition-old(profile-hero) {
        animation: profile-card-exit 350ms ease-out forwards;
      }

      ::view-transition-new(profile-hero) {
        animation: profile-view-enter 400ms var(--ease-spring, ease-out) forwards;
      }

      /* List item transitions with stagger support */
      ::view-transition-old(list-item) {
        animation: item-exit 200ms ease-out forwards;
      }

      ::view-transition-new(list-item) {
        animation: item-enter 250ms var(--ease-spring, ease-out) forwards;
      }

      /* Card interaction transitions */
      ::view-transition-old(card) {
        animation: card-transform-out 200ms ease-out forwards;
      }

      ::view-transition-new(card) {
        animation: card-transform-in 250ms ease-out forwards;
      }

      /* Keyframe animations */
      @keyframes slide-out-left {
        to { 
          transform: translateX(-100%) translateZ(0); 
          opacity: 0; 
        }
      }

      @keyframes slide-in-right {
        from { 
          transform: translateX(100%) translateZ(0); 
          opacity: 0; 
        }
        to { 
          transform: translateX(0) translateZ(0); 
          opacity: 1; 
        }
      }

      @keyframes backdrop-out {
        to { opacity: 0; }
      }

      @keyframes backdrop-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes modal-scale-out {
        to { 
          transform: scale(0.9) translateZ(0); 
          opacity: 0; 
        }
      }

      @keyframes modal-scale-in {
        from { 
          transform: scale(0.9) translateZ(0); 
          opacity: 0; 
        }
        to { 
          transform: scale(1) translateZ(0); 
          opacity: 1; 
        }
      }

      @keyframes profile-card-exit {
        to { 
          transform: scale(1.05) translateZ(0); 
          opacity: 0; 
        }
      }

      @keyframes profile-view-enter {
        from { 
          transform: scale(0.95) translateZ(0); 
          opacity: 0; 
        }
        to { 
          transform: scale(1) translateZ(0); 
          opacity: 1; 
        }
      }

      @keyframes item-exit {
        to { 
          transform: scale(0.8) translateY(-10px) translateZ(0); 
          opacity: 0; 
        }
      }

      @keyframes item-enter {
        from { 
          transform: scale(0.9) translateY(10px) translateZ(0); 
          opacity: 0; 
        }
        to { 
          transform: scale(1) translateY(0) translateZ(0); 
          opacity: 1; 
        }
      }

      @keyframes card-transform-out {
        to { 
          transform: scale(0.95) translateZ(0); 
          opacity: 0.8; 
        }
      }

      @keyframes card-transform-in {
        from { 
          transform: scale(1.05) translateZ(0); 
          opacity: 0.8; 
        }
        to { 
          transform: scale(1) translateZ(0); 
          opacity: 1; 
        }
      }

      /* Accessibility */
      @media (prefers-reduced-motion: reduce) {
        ::view-transition-old(*),
        ::view-transition-new(*) {
          animation-duration: 0.01ms !important;
          animation-delay: 0s !important;
        }
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        ::view-transition-old(modal-backdrop),
        ::view-transition-new(modal-backdrop) {
          background-color: rgba(0, 0, 0, 0.8);
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Performance monitoring setup
   */
  setupPerformanceMonitoring() {
    if (!this.debugMode) return;

    // Monitor transition performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name.includes('view-transition')) {
          console.log(`🎬 Transition: ${entry.name}, Duration: ${entry.duration}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });
  }

  /**
   * Update page metadata for better transitions
   */
  updatePageMetadata(toRoute) {
    // Update document title if needed
    const routeTitles = {
      home: 'Home',
      events: 'Events',
      people: 'Network',
      opportunities: 'Opportunities',
      me: 'Profile'
    };

    const title = routeTitles[toRoute];
    if (title) {
      document.title = `${title} - Conference Connect`;
    }

    // Update meta theme-color for mobile
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      const routeColors = {
        home: '#6366f1',
        events: '#f59e0b',
        people: '#10b981',
        opportunities: '#ef4444',
        me: '#8b5cf6'
      };
      
      const color = routeColors[toRoute] || '#6366f1';
      themeColor.setAttribute('content', color);
    }
  }

  /**
   * Enhanced fallback transitions
   */
  fallbackProfileTransition(profileCard, profileView) {
    profileCard.style.transition = 'all 300ms ease-out';
    profileCard.style.opacity = '0';
    profileCard.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
      profileCard.style.display = 'none';
      profileView.hidden = false;
      profileView.style.transition = 'all 300ms ease-out';
      profileView.style.opacity = '0';
      profileView.style.transform = 'scale(0.95)';
      
      requestAnimationFrame(() => {
        profileView.style.opacity = '1';
        profileView.style.transform = 'scale(1)';
      });
      
      setTimeout(() => {
        profileView.style.transition = '';
        profileView.style.opacity = '';
        profileView.style.transform = '';
      }, 350);
    }, 150);
  }

  /**
   * Professional swipe transition with momentum
   */
  async swipeCard(card, direction, onComplete, options = {}) {
    const distance = options.distance || (direction === 'right' ? '120%' : '-120%');
    const rotation = options.rotation || (direction === 'right' ? '15deg' : '-15deg');
    
    await this.cardInteraction(card, () => {
      card.style.transform = `translateX(${distance}) rotate(${rotation})`;
      card.style.opacity = '0';
    }, { 
      name: `swipe-${direction}`,
      cleanup: false
    });
    
    if (onComplete) onComplete();
  }

  /**
   * Navigation with smart preloading
   */
  async navigateWithTransition(fromRoute, toRoute, navigationFn, options = {}) {
    // Add transitioning state
    document.documentElement.setAttribute('data-transitioning', 'true');
    
    try {
      await this.routeTransition(fromRoute, toRoute, navigationFn, options);
    } finally {
      document.documentElement.removeAttribute('data-transitioning');
    }
  }

  /**
   * Get comprehensive performance stats
   */
  getPerformanceStats() {
    return {
      ...this.performance,
      supported: this.supported,
      successRate: this.performance.totalTransitions > 0 
        ? ((this.performance.totalTransitions - this.performance.failedTransitions) / this.performance.totalTransitions * 100).toFixed(1) + '%'
        : '0%',
      browserInfo: {
        userAgent: navigator.userAgent,
        supportsViewTransitions: this.supported,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
      }
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Remove injected styles
    const styles = document.getElementById('view-transition-styles');
    if (styles) {
      styles.remove();
    }
    
    // Clear any active transitions
    this.clearTransitionNames();
    
    // Reset state
    this.currentTransition = null;
    this.queue = [];
    
    console.log('🗑️ ViewTX destroyed');
  }
}

// Create singleton instance
export const viewTX = new ViewTransitions();

// Export class for testing
export default ViewTransitions;

// Auto-initialize and attach to window
if (typeof window !== 'undefined') {
  window.ViewTX = ViewTX;
  window.viewTX = viewTX;
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => viewTX.init());
  } else {
    viewTX.init();
  }
}