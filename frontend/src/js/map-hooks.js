/**
 * Map Hooks
 * Consolidated event handlers for map-related interactions
 */

// Handle pin-to-map clicks
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.pin-to-map');
  if (!btn) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const id = btn.dataset.id;
  const day = btn.dataset.day;
  const lat = btn.dataset.lat;
  const lon = btn.dataset.lon;

  // Build query parameters for focus
  const q = new URLSearchParams();
  if (id) q.set('focus', id);
  if (lat && lon) { 
    q.set('lat', lat); 
    q.set('lon', lon); 
  }

  // Navigate to map with day and focus params
  location.hash = `#/map/${day || ''}?${q.toString()}`;
});

// Handle map link clicks (any element with data-map-focus)
document.addEventListener('click', (e) => {
  const mapLink = e.target.closest('[data-map-focus]');
  if (!mapLink) return;
  
  e.preventDefault();
  
  const focusId = mapLink.dataset.mapFocus;
  const day = mapLink.dataset.mapDay;
  const lat = mapLink.dataset.mapLat;
  const lon = mapLink.dataset.mapLon;
  
  const q = new URLSearchParams();
  if (focusId) q.set('focus', focusId);
  if (lat && lon) {
    q.set('lat', lat);
    q.set('lon', lon);
  }
  
  location.hash = `#/map/${day || ''}?${q.toString()}`;
});

// Listen for map focus requests from other components
window.addEventListener('map:focus', (e) => {
  const { id, day, lat, lon } = e.detail || {};
  
  const q = new URLSearchParams();
  if (id) q.set('focus', id);
  if (lat && lon) {
    q.set('lat', lat);
    q.set('lon', lon);
  }
  
  location.hash = `#/map/${day || ''}?${q.toString()}`;
});

// Export utility function for programmatic navigation
export function navigateToMap(party) {
  const q = new URLSearchParams();
  
  if (party.id) q.set('focus', party.id);
  if (party.lat && party.lon) {
    q.set('lat', party.lat);
    q.set('lon', party.lon);
  }
  
  const day = party.start ? party.start.slice(0, 10) : '';
  location.hash = `#/map/${day}?${q.toString()}`;
}

// Dispatch ready event
window.dispatchEvent(new Event('map-hooks:ready'));