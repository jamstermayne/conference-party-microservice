// Accessibility Enhancement Module
import Events from './foundation/events.js';

class AccessibilityManager {
  constructor() {
    this.init();
  }

  init() {
    this.enhanceKeyboardNavigation();
    this.enhanceScreenReader();
    this.enhanceColorContrast();
    this.bindEvents();
  }

  enhanceKeyboardNavigation() {
    // Add keyboard navigation to interactive elements
    document.addEventListener('keydown', (e) => {
      // Escape key handling
      if (e.key === 'Escape') {
        this.handleEscape();
      }

      // Tab trapping for modals
      if (e.key === 'Tab') {
        this.handleTabTrapping(e);
      }
    });

    // Add visible focus indicators
    this.addFocusIndicators();
  }

  enhanceScreenReader() {
    // Add ARIA live region for dynamic updates
    this.createLiveRegion();
    
    // Listen for events that should be announced
    Events.on('route:change', (data) => {
      this.announce(`Navigated to ${data.route} page`);
    });

    Events.on('toast:shown', (data) => {
      this.announce(data.message, data.type === 'error' ? 'assertive' : 'polite');
    });

    Events.on('action:completed', (data) => {
      this.announce(`${data.action} completed`);
    });
  }

  enhanceColorContrast() {
    // Check for high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      document.documentElement.classList.add('high-contrast');
    }

    // Listen for contrast preference changes
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    });
  }

  bindEvents() {
    // Enhance form validation announcements
    Events.on('form:error', (data) => {
      this.announceFormError(data.field, data.message);
    });

    // Enhance loading state announcements
    Events.on('loading:start', (data) => {
      this.announce(`Loading ${data.context || 'content'}...`);
    });

    Events.on('loading:end', (data) => {
      this.announce(`${data.context || 'Content'} loaded`);
    });
  }

  createLiveRegion() {
    if (document.querySelector('#aria-live-status')) return;

    const liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-status';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }

  announce(message, priority = 'polite') {
    const liveRegion = document.querySelector('#aria-live-status');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  handleEscape() {
    // Close modals, overlays, etc.
    const activeModal = document.querySelector('.modal:not(.hidden)');
    if (activeModal) {
      Events.emit('modal:close');
      return;
    }

    const mobileNav = document.querySelector('#sidenav.open');
    if (mobileNav) {
      Events.emit('nav:close');
      return;
    }

    const activeToast = document.querySelector('.toast');
    if (activeToast) {
      const toastId = activeToast.dataset.toastId;
      if (toastId) Events.emit('toast:hide', { id: toastId });
    }
  }

  handleTabTrapping(e) {
    const activeModal = document.querySelector('.modal:not(.hidden)');
    if (!activeModal) return;

    const focusableElements = activeModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  addFocusIndicators() {
    // Add high-visibility focus indicators for keyboard users
    const style = document.createElement('style');
    style.textContent = `
      .js-focus-visible :focus:not(.focus-visible) {
        outline: none;
      }
      
      .js-focus-visible .focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 2px;
      }
      
      @media (prefers-contrast: high) {
        .js-focus-visible .focus-visible {
          outline: 3px solid currentColor;
          outline-offset: 3px;
        }
      }
    `;
    document.head.appendChild(style);

    // Add focus-visible polyfill behavior
    document.documentElement.classList.add('js-focus-visible');
    
    document.addEventListener('keydown', () => {
      document.documentElement.classList.add('js-focus-visible');
    });
    
    document.addEventListener('mousedown', () => {
      document.documentElement.classList.remove('js-focus-visible');
    });
  }

  announceFormError(field, message) {
    const fieldElement = document.querySelector(`[name="${field}"], #${field}`);
    if (fieldElement) {
      fieldElement.setAttribute('aria-invalid', 'true');
      fieldElement.setAttribute('aria-describedby', `${field}-error`);
      
      // Create or update error message
      let errorElement = document.querySelector(`#${field}-error`);
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = `${field}-error`;
        errorElement.className = 'error-message sr-only';
        fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
      }
      
      errorElement.textContent = message;
      this.announce(`Error in ${field}: ${message}`, 'assertive');
    }
  }

  // Skip link functionality
  addSkipLink() {
    if (document.querySelector('.skip-link')) return;

    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--accent-primary);
      color: white;
      padding: 8px;
      border-radius: 4px;
      text-decoration: none;
      z-index: 1000;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
}

// Initialize accessibility manager
const a11yManager = new AccessibilityManager();

export default a11yManager;