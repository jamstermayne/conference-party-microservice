/**
 * Modal Failsafe System
 * Prevents stuck modals and ensures page remains interactive
 */

class ModalFailsafe {
  constructor() {
    this.init();
  }

  init() {
    console.log('[ModalFailsafe] Initializing failsafe system');
    
    // Run cleanup every 5 seconds
    setInterval(() => {
      this.checkAndCleanup();
    }, 5000);
    
    // Also cleanup on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkAndCleanup();
      }
    });
    
    // Cleanup on click if page seems blocked
    document.addEventListener('click', (e) => {
      // If clicking on body and nothing happens, force cleanup
      if (e.target === document.body) {
        console.log('[ModalFailsafe] Body click detected, checking for blocks');
        this.forceCleanup();
      }
    }, true);
  }

  checkAndCleanup() {
    // Check if there are any blocking modals
    const modals = document.querySelectorAll('.hero-feature-modal-simple, .hero-feature-modal, .hero-feature-modal-backdrop');
    
    if (modals.length > 0) {
      console.log('[ModalFailsafe] Found', modals.length, 'modals, checking age');
      
      modals.forEach(modal => {
        // Check if modal has been around for more than 30 seconds
        if (!modal.dataset.createTime) {
          modal.dataset.createTime = Date.now();
        } else {
          const age = Date.now() - parseInt(modal.dataset.createTime);
          if (age > 30000) {
            console.log('[ModalFailsafe] Removing old modal:', modal.className);
            modal.remove();
          }
        }
      });
    }
    
    // Ensure body is not blocked
    if (document.body.style.pointerEvents === 'none' || document.body.style.overflow === 'hidden') {
      console.log('[ModalFailsafe] Resetting body state');
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    }
  }

  forceCleanup() {
    console.log('[ModalFailsafe] Force cleanup triggered');
    
    // Remove all potential blocking elements
    const blockingSelectors = [
      '.hero-feature-modal-simple',
      '.hero-feature-modal',
      '.hero-feature-modal-backdrop',
      '.feature-showcase',
      '.showcase-backdrop',
      '.overlay-panel',
      '.overlay-scrim',
      '.micro-ftue'
    ];
    
    blockingSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        console.log('[ModalFailsafe] Removing:', el.className);
        el.remove();
      });
    });
    
    // Reset body state
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    
    // Remove any elements with high z-index that might be blocking
    document.querySelectorAll('*').forEach(el => {
      const styles = window.getComputedStyle(el);
      const zIndex = parseInt(styles.zIndex);
      
      if (zIndex > 9000 && el.style.position === 'fixed') {
        // Skip essential UI elements
        if (!el.classList.contains('smart-network-btn') && 
            !el.classList.contains('command-center-btn') &&
            !el.id?.includes('app')) {
          console.log('[ModalFailsafe] Removing high z-index element:', el.className || el.tagName);
          el.remove();
        }
      }
    });
  }
}

// Initialize failsafe
const modalFailsafe = new ModalFailsafe();
window.modalFailsafe = modalFailsafe;

// Add emergency cleanup on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    console.log('[ModalFailsafe] ESC pressed - forcing cleanup');
    modalFailsafe.forceCleanup();
  }
});

// Export for debugging
export default modalFailsafe;