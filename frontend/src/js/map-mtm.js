/**
 * Map MTM Integration
 * Adds MTM event markers to the existing map view
 */

export class MtmMapSource {
  constructor() {
    this.db = null;
    this.unsubscribe = null;
    this.events = [];
    this.enabled = localStorage.getItem('mtm-map-enabled') !== 'false';
    this.markers = [];
    this.onEventsChange = null;
  }

  /**
   * Initialize and start listening to MTM events
   */
  async init(userId) {
    if (!userId) return;
    
    try {
      // Get Firestore instance from Firebase compat SDK
      if (!window.firebase?.firestore) {
        console.warn('Firestore not available');
        return;
      }
      
      this.db = firebase.firestore();
      
      // Set up real-time listener for MTM events with location data
      const mtmEventsRef = this.db.collection(`users/${userId}/mtmEvents`);
      const q = mtmEventsRef
        .where('cancelled', '!=', true)
        .where('lat', '!=', null);
      
      this.unsubscribe = q.onSnapshot((snapshot) => {
        this.events = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Only include events with valid coordinates
          if (data.lat && data.lon) {
            const event = {
              id: doc.id,
              source: 'mtm',
              title: data.title,
              description: data.description,
              location: data.location,
              start: data.start?.toDate ? data.start.toDate() : new Date(data.start),
              end: data.end?.toDate ? data.end.toDate() : new Date(data.end),
              lat: data.lat,
              lon: data.lon,
              tz: data.tz
            };
            
            this.events.push(event);
          }
        });
        
        // Sort by start time
        this.events.sort((a, b) => a.start - b.start);
        
        // Notify listeners
        if (this.onEventsChange) {
          this.onEventsChange(this.enabled ? this.events : []);
        }
      });
    } catch (error) {
      console.error('Failed to initialize MTM map source:', error);
    }
  }

  /**
   * Toggle MTM markers visibility
   */
  toggle(enabled) {
    this.enabled = enabled;
    localStorage.setItem('mtm-map-enabled', enabled ? 'true' : 'false');
    
    // Update marker visibility
    this.markers.forEach(marker => {
      if (marker.map) {
        marker.map = enabled ? marker.mapInstance : null;
      }
    });
    
    // Notify with events or empty array based on enabled state
    if (this.onEventsChange) {
      this.onEventsChange(this.enabled ? this.events : []);
    }
  }

  /**
   * Get events for a specific date
   */
  getEventsForDate(date) {
    if (!this.enabled) return [];
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.events.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart >= startOfDay && eventStart <= endOfDay;
    });
  }

  /**
   * Add MTM markers to the map
   * @param {google.maps.Map} map - The Google Maps instance
   * @param {Date} selectedDate - The selected day to show events for
   * @returns {Array} Array of created markers
   */
  addMarkersToMap(map, selectedDate) {
    // Clear existing markers
    this.clearMarkers();
    
    if (!this.enabled || !map) return [];
    
    // Get events for the selected date
    const eventsToShow = selectedDate ? this.getEventsForDate(selectedDate) : this.events;
    
    // Create info window for sharing between markers
    const infoWindow = new google.maps.InfoWindow();
    
    eventsToShow.forEach(event => {
      // Create custom marker content for MTM events
      const markerContent = document.createElement('div');
      markerContent.style.cssText = `
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, #ff6b6b, #ff8e53);
        border: 3px solid #ffffff;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
        position: relative;
      `;
      markerContent.title = `MTM: ${event.title}`;
      
      // Add MTM badge
      const badge = document.createElement('div');
      badge.style.cssText = `
        position: absolute;
        top: -4px;
        right: -4px;
        width: 12px;
        height: 12px;
        background: #ff6b6b;
        border: 1px solid #fff;
        border-radius: 50%;
        font-size: 8px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      `;
      badge.textContent = 'M';
      markerContent.appendChild(badge);
      
      // Add hover effect
      markerContent.addEventListener('mouseenter', () => {
        markerContent.style.transform = 'scale(1.2)';
        markerContent.style.zIndex = '100';
      });
      markerContent.addEventListener('mouseleave', () => {
        markerContent.style.transform = 'scale(1)';
        markerContent.style.zIndex = 'auto';
      });
      
      // Create AdvancedMarkerElement
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: event.lat, lng: event.lon },
        map: this.enabled ? map : null,
        content: markerContent,
        title: event.title
      });
      
      // Store reference to map for toggling
      marker.mapInstance = map;
      marker.mtmEvent = event;
      
      // Add click listener for info window
      marker.addListener('click', () => {
        const timeStr = new Date(event.start).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        });
        
        infoWindow.setContent(`
          <div style="font-family: system-ui; max-width: 280px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="background: linear-gradient(135deg, #ff6b6b, #ff8e53); 
                           color: white; padding: 2px 6px; border-radius: 4px; 
                           font-size: 11px; font-weight: 600;">MTM</span>
              <h3 style="margin: 0; color: #1a1a1a; font-size: 16px;">${event.title || 'Meeting'}</h3>
            </div>
            <p style="margin: 4px 0; color: #666; font-size: 14px;">
              📍 ${event.location || 'Location TBA'}<br>
              🕐 ${timeStr}<br>
              ${event.description ? `📝 ${event.description}` : ''}
            </p>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lon}" 
                 target="_blank" rel="noopener"
                 style="color: #4285f4; text-decoration: none; font-size: 13px;">
                Get directions →
              </a>
            </div>
          </div>
        `);
        infoWindow.open({
          anchor: marker,
          map: map
        });
      });
      
      this.markers.push(marker);
    });
    
    return this.markers;
  }

  /**
   * Clear all MTM markers from the map
   */
  clearMarkers() {
    this.markers.forEach(marker => {
      marker.map = null;
    });
    this.markers = [];
  }

  /**
   * Clean up listener
   */
  destroy() {
    this.clearMarkers();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

/**
 * Create map toggle UI for MTM events
 */
export function createMtmMapToggle() {
  const toggle = document.createElement('label');
  toggle.className = 'map-control';
  toggle.innerHTML = `
    <input type="checkbox" id="mtm-map-toggle" ${localStorage.getItem('mtm-map-enabled') !== 'false' ? 'checked' : ''}>
    <span style="color: #ff6b6b;">MTM Events</span>
  `;
  
  return toggle;
}