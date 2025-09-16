/**
 * Debug Overlay Detector
 * Identifies what's blocking interaction after events click
 */

class DebugOverlay {
  constructor() {
    this.init();
  }

  init() {
    // Monitor all click events
    document.addEventListener('click', (e) => {
      console.log('[DEBUG] Click on:', e.target, 'at', e.clientX, e.clientY);
      this.checkBlockingElements(e);
    }, true);

    // Add debug command
    window.debugOverlays = () => this.auditPage();
    
    // Auto-audit after any modal/overlay action
    const observer = new MutationObserver(() => {
      // Debounce
      clearTimeout(this.auditTimeout);
      this.auditTimeout = setTimeout(() => {
        this.auditPage();
      }, 500);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    console.log('[DEBUG] Overlay debugger active. Use window.debugOverlays() to audit.');
  }

  checkBlockingElements(event) {
    const point = { x: event.clientX, y: event.clientY };
    const elements = document.elementsFromPoint(point.x, point.y);
    
    const blocking = elements.filter(el => {
      const styles = window.getComputedStyle(el);
      return (
        styles.position === 'fixed' || 
        styles.position === 'absolute'
      ) && styles.pointerEvents !== 'none';
    });
    
    if (blocking.length > 0) {
      console.log('[DEBUG] Potentially blocking elements at click point:', blocking);
    }
  }

  auditPage() {
    console.group('[DEBUG] Page Audit');
    
    // Find all fixed/absolute positioned elements
    const allElements = document.querySelectorAll('*');
    const positioned = [];
    const overlays = [];
    const highZIndex = [];
    
    allElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      
      // Check positioning
      if (styles.position === 'fixed' || styles.position === 'absolute') {
        positioned.push({
          element: el,
          position: styles.position,
          zIndex: styles.zIndex,
          pointerEvents: styles.pointerEvents,
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity
        });
        
        // Check if it covers viewport
        const rect = el.getBoundingClientRect();
        const coversViewport = rect.width >= window.innerWidth * 0.8 && 
                               rect.height >= window.innerHeight * 0.8;
        
        if (coversViewport) {
          overlays.push(el);
        }
      }
      
      // Check z-index
      const zIndex = parseInt(styles.zIndex);
      if (zIndex > 900) {
        highZIndex.push({
          element: el,
          zIndex: zIndex,
          className: el.className,
          id: el.id
        });
      }
    });
    
    console.log('[DEBUG] Fixed/Absolute elements:', positioned);
    console.log('[DEBUG] Full viewport overlays:', overlays);
    console.log('[DEBUG] High z-index elements:', highZIndex);
    
    // Check for invisible blockers
    const invisibleBlockers = positioned.filter(item => {
      const el = item.element;
      const rect = el.getBoundingClientRect();
      const isInvisible = item.opacity === '0' || 
                          item.visibility === 'hidden' || 
                          item.display === 'none';
      const hasPointerEvents = item.pointerEvents !== 'none';
      const coversArea = rect.width > 0 && rect.height > 0;
      
      return isInvisible && hasPointerEvents && coversArea;
    });
    
    if (invisibleBlockers.length > 0) {
      console.warn('[DEBUG] INVISIBLE BLOCKERS FOUND:', invisibleBlockers);
      invisibleBlockers.forEach(item => {
        console.log('  - Element:', item.element);
        console.log('    Classes:', item.element.className);
        console.log('    ID:', item.element.id);
        console.log('    Opacity:', item.opacity);
        console.log('    Pointer Events:', item.pointerEvents);
      });
    }
    
    // Check for stuck animations
    const animating = Array.from(allElements).filter(el => {
      const styles = window.getComputedStyle(el);
      return styles.animation !== 'none' || styles.transition !== 'none';
    });
    
    console.log('[DEBUG] Currently animating elements:', animating);
    
    // Check specific problem classes
    const problemClasses = [
      '.hero-feature-modal',
      '.hero-feature-modal-backdrop',
      '.feature-showcase',
      '.overlay-panel',
      '.overlay-scrim',
      '.micro-ftue',
      '.showcase-backdrop'
    ];
    
    problemClasses.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.warn(`[DEBUG] Found ${selector}:`, elements);
        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          console.log(`  - Display: ${styles.display}, Opacity: ${styles.opacity}, Pointer-events: ${styles.pointerEvents}`);
        });
      }
    });
    
    console.groupEnd();
    
    return {
      positioned,
      overlays,
      highZIndex,
      invisibleBlockers,
      animating
    };
  }

  // Force cleanup method
  forceCleanup() {
    console.log('[DEBUG] Forcing cleanup of all overlays...');
    
    // Remove all high z-index fixed elements
    const elements = document.querySelectorAll('*');
    let removed = 0;
    
    elements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const zIndex = parseInt(styles.zIndex);
      
      if ((styles.position === 'fixed' || styles.position === 'absolute') && zIndex > 900) {
        // Skip essential UI elements
        if (!el.classList.contains('smart-network-btn') && 
            !el.classList.contains('command-center-btn')) {
          console.log('[DEBUG] Removing:', el.className || el.tagName);
          el.remove();
          removed++;
        }
      }
    });
    
    console.log(`[DEBUG] Removed ${removed} overlay elements`);
  }
}

// Initialize debug overlay
const debugOverlay = new DebugOverlay();
window.debugOverlay = debugOverlay;

// Add keyboard shortcut for debugging
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + D
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
    debugOverlay.auditPage();
  }
  // Ctrl/Cmd + Shift + C for cleanup
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
    debugOverlay.forceCleanup();
  }
});

export default debugOverlay;