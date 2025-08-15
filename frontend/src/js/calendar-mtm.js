/**
 * Calendar MTM Integration
 * Fetches and displays MTM events from Firestore
 */

export class MtmCalendarSource {
  constructor() {
    this.db = null;
    this.unsubscribe = null;
    this.events = [];
    this.enabled = localStorage.getItem('mtm-calendar-enabled') !== 'false';
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
      
      // Set up real-time listener for MTM events
      const mtmEventsRef = this.db.collection(`users/${userId}/mtmEvents`);
      const q = mtmEventsRef.where('cancelled', '!=', true);
      
      this.unsubscribe = q.onSnapshot((snapshot) => {
        this.events = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Convert Firestore timestamps to JS dates
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
        });
        
        // Sort by start time
        this.events.sort((a, b) => a.start - b.start);
        
        // Notify listeners
        if (this.onEventsChange) {
          this.onEventsChange(this.enabled ? this.events : []);
        }
      });
    } catch (error) {
      console.error('Failed to initialize MTM calendar source:', error);
    }
  }

  /**
   * Toggle MTM events visibility
   */
  toggle(enabled) {
    this.enabled = enabled;
    localStorage.setItem('mtm-calendar-enabled', enabled ? 'true' : 'false');
    
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
   * Clean up listener
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

/**
 * Create calendar toggle UI
 */
export function createMtmToggle() {
  const toggle = document.createElement('label');
  toggle.className = 'calendar-source-toggle';
  toggle.innerHTML = `
    <input type="checkbox" id="mtm-calendar-toggle" ${localStorage.getItem('mtm-calendar-enabled') !== 'false' ? 'checked' : ''}>
    <span>MeetToMatch</span>
  `;
  
  return toggle;
}