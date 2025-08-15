// map-hooks.js — Wire pin buttons to open map view
export function wireMapPins(container = document) {
  container.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action="open-map"]');
    if (!a) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const { lat, lng, venue } = a.dataset;
    
    // Try to get coordinates from data attributes
    if (lat && lng) {
      // Navigate to map with coordinates
      location.hash = `#map?lat=${lat}&lng=${lng}`;
      return;
    }
    
    // Fallback: if no coordinates but venue name exists, 
    // navigate to map and let it handle venue search
    if (venue) {
      location.hash = `#map?venue=${encodeURIComponent(venue)}`;
      return;
    }
    
    // No coordinates or venue, just go to map
    location.hash = '#map';
  });
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => wireMapPins());

// Also export for dynamic content
export default { wireMapPins };