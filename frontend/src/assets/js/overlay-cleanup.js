/**
 * Overlay Cleanup Utility
 * Prevents overlays and modals from blocking page interaction
 */

class OverlayCleanup {
  constructor() {
    this.overlaySelectors = [
      '.hero-feature-modal',
      '.overlay-panel',
      '.overlay-scrim',
      '.modal-backdrop',
      '.feature-modal',
      '[class*="backdrop"]',
      '[class*="overlay"]'
    ];
    
    this.init();
  }

  init() {
    // Clean up on page navigation
    window.addEventListener('hashchange', () => this.cleanupAll());
    window.addEventListener('popstate', () => this.cleanupAll());
    
    // Clean up on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.cleanupAll();
      }
    });
    
    // Detect clicks that should have worked but didn't
    document.addEventListener('click', (e) => {
      // If user clicks on something that should be interactive but nothing happens
      const target = e.target;
      const isInteractive = target.tagName === 'BUTTON' || 
                           target.tagName === 'A' || 
                           target.hasAttribute('onclick') ||
                           target.closest('button, a, [onclick]');
      
      if (isInteractive) {
        // Check if there's a modal blocking
        const modals = document.querySelectorAll('.hero-feature-modal, [class*="modal"], [class*="backdrop"]');
        modals.forEach(modal => {
          const rect = modal.getBoundingClientRect();
          const clickPoint = { x: e.clientX, y: e.clientY };
          
          // If click is outside modal content but inside modal backdrop
          const content = modal.querySelector('[class*="content"]');
          if (content) {
            const contentRect = content.getBoundingClientRect();
            const clickedOutsideContent = clickPoint.x < contentRect.left || 
                                         clickPoint.x > contentRect.right || 
                                         clickPoint.y < contentRect.top || 
                                         clickPoint.y > contentRect.bottom;
            
            if (clickedOutsideContent && this.isBlockingInteraction(modal)) {
              console.warn('Cleaning up blocking modal after failed click');
              this.safeRemove(modal);
            }
          }
        });
      }
    }, true); // Use capture phase
    
    // Periodic cleanup check (failsafe)
    setInterval(() => this.checkAndCleanup(), 5000);
    
    // Monitor for stuck overlays
    this.monitorOverlays();
  }

  cleanupAll() {
    this.overlaySelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // Only remove if it's blocking interaction
        if (this.isBlockingInteraction(el)) {
          this.safeRemove(el);
        }
      });
    });
    
    // Reset body scroll and pointer events
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
  }

  isBlockingInteraction(element) {
    if (!element) return false;
    
    const styles = window.getComputedStyle(element);
    const isVisible = styles.opacity !== '0' && styles.display !== 'none';
    const hasPointerEvents = styles.pointerEvents !== 'none';
    const isFixed = styles.position === 'fixed' || styles.position === 'absolute';
    const coversViewport = this.coversViewport(element);
    
    // Check if it's meant to be visible but animation might be stuck
    const hasActiveClass = element.classList.contains('active') || 
                          element.classList.contains('show') ||
                          element.classList.contains('open');
    
    // If it's been visible for too long without user interaction
    const isStuck = element.dataset.openTime && 
                   (Date.now() - parseInt(element.dataset.openTime)) > 10000;
    
    return isFixed && isVisible && hasPointerEvents && coversViewport && !hasActiveClass || isStuck;
  }

  coversViewport(element) {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check if element covers most of the viewport
    const coverageWidth = rect.width / viewportWidth;
    const coverageHeight = rect.height / viewportHeight;
    
    return coverageWidth > 0.8 && coverageHeight > 0.8;
  }

  safeRemove(element) {
    // Fade out first
    element.style.transition = 'opacity 200ms ease-out';
    element.style.opacity = '0';
    element.style.pointerEvents = 'none';
    
    setTimeout(() => {
      if (element && element.parentNode) {
        element.remove();
      }
    }, 200);
  }

  checkAndCleanup() {
    // Check for orphaned backdrops
    const backdrops = document.querySelectorAll('[class*="backdrop"], [class*="scrim"]');
    backdrops.forEach(backdrop => {
      // If backdrop exists but no modal content is visible
      const hasVisibleContent = backdrop.querySelector('[class*="content"], [class*="modal-body"]');
      if (!hasVisibleContent && this.isBlockingInteraction(backdrop)) {
        console.warn('Removing orphaned backdrop:', backdrop.className);
        this.safeRemove(backdrop);
      }
    });
    
    // Check for stuck animations
    const animatingElements = document.querySelectorAll('[style*="animation"]');
    animatingElements.forEach(el => {
      const animationDuration = window.getComputedStyle(el).animationDuration;
      if (animationDuration && el.dataset.animStart) {
        const elapsed = Date.now() - parseInt(el.dataset.animStart);
        const duration = parseFloat(animationDuration) * 1000;
        
        // If animation should be done but element is still there
        if (elapsed > duration * 2) {
          console.warn('Removing stuck animated element:', el.className);
          this.safeRemove(el);
        }
      }
    });
  }

  monitorOverlays() {
    // Add mutation observer to track new overlays
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Mark overlay open time
            if (this.overlaySelectors.some(sel => node.matches && node.matches(sel))) {
              node.dataset.openTime = Date.now();
            }
            
            // Track animation start time
            if (node.style && node.style.animation) {
              node.dataset.animStart = Date.now();
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize overlay cleanup
const overlayCleanup = new OverlayCleanup();

// Export for use in other modules
window.overlayCleanup = overlayCleanup;

export default overlayCleanup;