/**
 * Pin to Map Handler
 * Handles clicks on pin buttons to navigate to map and focus on party
 */

export function wirePinToMapButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.pin-to-map');
    if (!btn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Extract data from button
    const id = btn.dataset.id;
    const day = btn.dataset.day;
    const lat = btn.dataset.lat;
    const lon = btn.dataset.lon;
    
    // Build query parameters
    const q = new URLSearchParams();
    if (id) q.set('focus', id);
    if (lat && lon) {
      q.set('lat', lat);
      q.set('lon', lon);
    }
    
    // Build complete URL with day and query params
    let mapUrl = '#/map';
    if (day) {
      mapUrl += `/${day}`;
    }
    mapUrl += `?${q.toString()}`;
    
    // Navigate to map with parameters
    location.hash = mapUrl;
    
    // Dispatch event for any listeners
    window.dispatchEvent(new CustomEvent('pin:navigate', {
      detail: { id, day, lat, lon }
    }));
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wirePinToMapButtons);
} else {
  wirePinToMapButtons();
}

// Export for manual initialization if needed
export default wirePinToMapButtons;