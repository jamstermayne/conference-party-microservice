/**
 * Card Height Equalization System
 * Ensures all cards in a grid have equal height for visual consistency
 * Works with .vgrid containers and .vcard elements
 */

export function equalizeCards(selector = '.vgrid') {
  const grids = document.querySelectorAll(selector);
  grids.forEach(g => {
    const cards = [...g.querySelectorAll('.vcard')];
    if (!cards.length) return;
    
    // Reset any existing height
    cards.forEach(c => c.style.removeProperty('--card-h'));
    
    // Calculate max height
    const max = Math.max(...cards.map(c => c.getBoundingClientRect().height));
    
    // Apply uniform height
    cards.forEach(c => c.style.setProperty('--card-h', `${Math.ceil(max)}px`));
  });
}

// RAF-based scheduling to batch updates
let raf;
const ro = new ResizeObserver(() => scheduleEqualize());

export function scheduleEqualize() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => equalizeCards());
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Observe all grids for size changes
  document.querySelectorAll('.vgrid').forEach(el => ro.observe(el));
  
  // Initial equalization
  scheduleEqualize();
});

// Export for manual triggering after dynamic content loads
export function observeGrid(gridElement) {
  if (gridElement && !gridElement.dataset.equalized) {
    ro.observe(gridElement);
    gridElement.dataset.equalized = 'true';
    scheduleEqualize();
  }
}

// Utility to equalize after content updates
export function equalizeAfterUpdate(callback) {
  const result = callback();
  scheduleEqualize();
  return result;
}

// Handle dynamic content additions
const mutationObserver = new MutationObserver((mutations) => {
  const hasNewGrids = mutations.some(m => 
    [...m.addedNodes].some(n => 
      n.nodeType === 1 && (n.matches?.('.vgrid') || n.querySelector?.('.vgrid'))
    )
  );
  
  if (hasNewGrids) {
    // Find and observe new grids
    document.querySelectorAll('.vgrid:not([data-equalized])').forEach(el => {
      observeGrid(el);
    });
  }
});

// Start observing once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Export default for convenience
export default {
  equalize: equalizeCards,
  schedule: scheduleEqualize,
  observe: observeGrid,
  afterUpdate: equalizeAfterUpdate
};