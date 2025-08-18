/**
 * API Integration Module
 * Connects all frontend components to backend services
 */

class APIIntegration {
  constructor() {
    this.baseURL = 'https://conference-party-app.web.app/api';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch with caching and error handling
   */
  async fetchWithCache(url, options = {}) {
    const cacheKey = `${url}${JSON.stringify(options)}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('[API] Using cached data for:', url);
        return cached.data;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful responses
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('[API] Fetch error:', error);
      
      // Return cached data if available, even if expired
      if (this.cache.has(cacheKey)) {
        console.log('[API] Using expired cache due to error');
        return this.cache.get(cacheKey).data;
      }
      
      throw error;
    }
  }

  /**
   * Get parties/events for a specific date
   */
  async getParties(date = null) {
    const conference = 'gamescom2025';
    const url = date 
      ? `${this.baseURL}/parties?conference=${conference}&date=${date}`
      : `${this.baseURL}/parties?conference=${conference}`;
    
    try {
      const data = await this.fetchWithCache(url);
      console.log('[API] Parties fetched:', data.events?.length || 0, 'events');
      
      // If no events from API, use fallback data
      if (!data.events || data.events.length === 0) {
        console.log('[API] No events from API, using fallback data');
        return this.getFallbackEvents();
      }
      
      return data.events || [];
    } catch (error) {
      console.error('[API] Failed to fetch parties:', error);
      return this.getFallbackEvents();
    }
  }
  
  /**
   * Get fallback events for testing
   */
  getFallbackEvents() {
    // Enhanced with proper Cologne coordinates
    return [
      {
        id: 'gamescom-opening-night',
        title: 'Gamescom Opening Night Live',
        venue: 'Koelnmesse - Hall 11',
        date: '2025-08-19',
        time: '20:00',
        start: '2025-08-19T20:00:00',
        end: '2025-08-19T22:00:00',
        description: 'The official opening ceremony with world premieres and announcements',
        lat: 50.9473,
        lng: 6.9838,
        coordinates: { lat: 50.9473, lng: 6.9838 },
        address: 'Messeplatz 1, 50679 Köln',
        price: 'Free with ticket'
      },
      {
        id: 'xbox-party',
        title: 'Xbox @ Gamescom Party',
        venue: 'Lanxess Arena',
        date: '2025-08-20',
        time: '19:00',
        start: '2025-08-20T19:00:00',
        end: '2025-08-20T23:00:00',
        description: 'Exclusive Xbox showcase and networking event',
        lat: 50.9385,
        lng: 6.9830,
        coordinates: { lat: 50.9385, lng: 6.9830 },
        address: 'Willy-Brandt-Platz 3, 50679 Köln',
        price: 'Invite only'
      },
      {
        id: 'playstation-showcase',
        title: 'PlayStation Showcase',
        venue: 'Musical Dome',
        date: '2025-08-21',
        time: '18:00',
        start: '2025-08-21T18:00:00',
        end: '2025-08-21T21:00:00',
        description: 'PlayStation exclusive titles preview and developer meetup',
        lat: 50.9513,
        lng: 6.9778,
        coordinates: { lat: 50.9513, lng: 6.9778 },
        address: 'Goldgasse 1, 50668 Köln',
        price: '€45'
      },
      {
        id: 'indie-megabooth',
        title: 'Indie MEGABOOTH Party',
        venue: 'Die Halle Tor 2',
        date: '2025-08-22',
        time: '20:00',
        start: '2025-08-22T20:00:00',
        end: '2025-08-23T02:00:00',
        description: 'Celebrate indie gaming with developers from around the world',
        lat: 50.9488,
        lng: 6.9320,
        coordinates: { lat: 50.9488, lng: 6.9320 },
        address: 'Tor 2, Girlitzweg 30, 50829 Köln',
        price: 'Free'
      },
      {
        id: 'devcom-mixer',
        title: 'Devcom Developer Mixer',
        venue: 'Hyatt Regency Cologne',
        date: '2025-08-23',
        time: '17:00',
        start: '2025-08-23T17:00:00',
        end: '2025-08-23T20:00:00',
        description: 'Professional networking for game developers',
        lat: 50.9414,
        lng: 6.9726,
        coordinates: { lat: 50.9414, lng: 6.9726 },
        address: 'Kennedy-Ufer 2A, 50679 Köln',
        price: 'DevCom badge required'
      },
      {
        id: 'unity-meetup',
        title: 'Unity Developer Meetup',
        venue: 'Stadtgarten',
        date: '2025-08-18',
        time: '18:00',
        start: '2025-08-18T18:00:00',
        end: '2025-08-18T21:00:00',
        description: 'Connect with Unity developers and share experiences',
        lat: 50.9229,
        lng: 6.9302,
        coordinates: { lat: 50.9229, lng: 6.9302 },
        address: 'Venloer Str. 40, 50672 Köln',
        price: 'Free'
      },
      {
        id: 'nintendo-direct-viewing',
        title: 'Nintendo Direct Viewing Party',
        venue: 'Cinedom',
        date: '2025-08-20',
        time: '15:00',
        start: '2025-08-20T15:00:00',
        end: '2025-08-20T17:00:00',
        description: 'Watch Nintendo Direct together on the big screen',
        lat: 50.9466,
        lng: 6.9449,
        coordinates: { lat: 50.9466, lng: 6.9449 },
        address: 'Im Mediapark 1, 50670 Köln',
        price: '€10'
      },
      {
        id: 'esports-finals',
        title: 'Gamescom Esports Finals',
        venue: 'Koelnmesse - Hall 8',
        date: '2025-08-24',
        time: '14:00',
        start: '2025-08-24T14:00:00',
        end: '2025-08-24T20:00:00',
        description: 'The grand finals of multiple esports tournaments',
        lat: 50.9468,
        lng: 6.9827,
        coordinates: { lat: 50.9468, lng: 6.9827 },
        address: 'Messeplatz 1, 50679 Köln',
        price: 'Day ticket required'
      }
    ];
  }

  /**
   * Get hotspots data for map
   */
  async getHotspots() {
    try {
      const data = await this.fetchWithCache(`${this.baseURL}/hotspots?conference=gamescom2025`);
      console.log('[API] Hotspots fetched:', data.data?.length || 0, 'venues');
      
      // If no hotspots, return fallback venues
      if (!data.data || data.data.length === 0) {
        return this.getFallbackHotspots();
      }
      
      return data.data || [];
    } catch (error) {
      console.error('[API] Failed to fetch hotspots:', error);
      return this.getFallbackHotspots();
    }
  }
  
  /**
   * Get fallback hotspots for testing
   */
  getFallbackHotspots() {
    return [
      {
        id: 'koelnmesse',
        name: 'Koelnmesse',
        coordinates: { lat: 50.9473, lng: 6.9838 },
        crowdLevel: 85,
        type: 'venue'
      },
      {
        id: 'lanxess-arena',
        name: 'Lanxess Arena',
        coordinates: { lat: 50.9385, lng: 6.9830 },
        crowdLevel: 70,
        type: 'venue'
      },
      {
        id: 'hyatt-regency',
        name: 'Hyatt Regency Cologne',
        coordinates: { lat: 50.9414, lng: 6.9726 },
        crowdLevel: 60,
        type: 'hotel'
      }
    ];
  }

  /**
   * Get party days (available dates with events)
   */
  async getPartyDays(conference = 'gamescom2025') {
    try {
      const data = await this.fetchWithCache(`${this.baseURL}/party-days?conference=${conference}`);
      console.log('[API] Party days fetched:', data.length, 'days');
      return data || [];
    } catch (error) {
      console.error('[API] Failed to fetch party days:', error);
      // Return default days as fallback
      return [
        { date: "2025-08-20", label: "Wed" },
        { date: "2025-08-21", label: "Thu" },
        { date: "2025-08-22", label: "Fri" },
        { date: "2025-08-23", label: "Sat" },
        { date: "2025-08-24", label: "Sun" }
      ];
    }
  }

  /**
   * Generate ICS file for calendar event
   */
  async generateICS(eventId) {
    try {
      const response = await fetch(`${this.baseURL}/m2m/events/${eventId}/ics`);
      
      if (!response.ok) {
        throw new Error(`Failed to generate ICS: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${eventId}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('[API] ICS downloaded for event:', eventId);
      return true;
    } catch (error) {
      console.error('[API] Failed to generate ICS:', error);
      
      // Fallback: Generate client-side ICS
      return this.generateClientSideICS(eventId);
    }
  }

  /**
   * Client-side ICS generation fallback
   */
  generateClientSideICS(eventData) {
    const event = typeof eventData === 'string' 
      ? { id: eventData, title: 'Event', date: new Date() }
      : eventData;

    const startDate = new Date(event.date || Date.now());
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Conference Party App//EN
BEGIN:VEVENT
UID:${event.id}@conference-party-app.web.app
DTSTAMP:${this.formatICSDate(new Date())}
DTSTART:${this.formatICSDate(startDate)}
DTEND:${this.formatICSDate(endDate)}
SUMMARY:${event.title || 'Conference Event'}
LOCATION:${event.venue || 'TBD'}
DESCRIPTION:${event.description || 'Conference party event'}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  }

  formatICSDate(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /**
   * Save event to user's personal schedule
   */
  async saveEvent(eventId, userId = 'anonymous') {
    try {
      const response = await fetch(`${this.baseURL}/sync`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          action: 'save',
          eventId,
          timestamp: Date.now()
        })
      });

      const data = await response.json();
      console.log('[API] Event saved:', eventId);
      
      // Update local storage
      const saved = JSON.parse(localStorage.getItem('saved_events') || '[]');
      if (!saved.includes(eventId)) {
        saved.push(eventId);
        localStorage.setItem('saved_events', JSON.stringify(saved));
      }
      
      return data;
    } catch (error) {
      console.error('[API] Failed to save event:', error);
      
      // Fallback to local storage only
      const saved = JSON.parse(localStorage.getItem('saved_events') || '[]');
      if (!saved.includes(eventId)) {
        saved.push(eventId);
        localStorage.setItem('saved_events', JSON.stringify(saved));
      }
      
      return { success: true, local: true };
    }
  }

  /**
   * Get user's saved events
   */
  async getSavedEvents(userId = 'anonymous') {
    try {
      const response = await fetch(`${this.baseURL}/sync?userId=${userId}`);
      const data = await response.json();
      console.log('[API] Saved events fetched:', data.events?.length || 0);
      
      // Sync with local storage
      if (data.events) {
        localStorage.setItem('saved_events', JSON.stringify(data.events));
      }
      
      return data.events || [];
    } catch (error) {
      console.error('[API] Failed to fetch saved events:', error);
      
      // Fallback to local storage
      return JSON.parse(localStorage.getItem('saved_events') || '[]');
    }
  }

  /**
   * Search parties with filters
   */
  async searchParties(query, filters = {}) {
    const params = new URLSearchParams({
      q: query,
      ...filters
    });

    try {
      const data = await this.fetchWithCache(`${this.baseURL}/parties/search?${params}`);
      console.log('[API] Search results:', data.results?.length || 0);
      return data.results || [];
    } catch (error) {
      console.error('[API] Search failed:', error);
      
      // Fallback to client-side search
      const allParties = await this.getParties();
      return this.clientSideSearch(allParties, query, filters);
    }
  }

  /**
   * Client-side search fallback
   */
  clientSideSearch(parties, query, filters) {
    let results = parties;
    
    // Text search
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(p => 
        p.title?.toLowerCase().includes(q) ||
        p.venue?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    
    // Apply filters
    if (filters.date) {
      results = results.filter(p => p.date === filters.date);
    }
    if (filters.venue) {
      results = results.filter(p => p.venue === filters.venue);
    }
    if (filters.type) {
      results = results.filter(p => p.type === filters.type);
    }
    
    return results;
  }

  /**
   * Get geocoded events for map
   */
  async getGeocodedEvents() {
    try {
      const parties = await this.getParties();
      const geocoded = parties.filter(p => p.coordinates?.lat && p.coordinates?.lng);
      console.log('[API] Geocoded events:', geocoded.length);
      return geocoded;
    } catch (error) {
      console.error('[API] Failed to get geocoded events:', error);
      return [];
    }
  }

  /**
   * Initialize Google Maps with events
   */
  async initializeMap(mapElement, events = null) {
    if (!window.google?.maps) {
      console.error('[API] Google Maps not loaded');
      return null;
    }

    const eventsToShow = events || await this.getGeocodedEvents();
    
    const map = new google.maps.Map(mapElement, {
      center: { lat: 50.9375, lng: 6.9603 }, // Cologne
      zoom: 12,
      styles: this.getMapStyles()
    });

    // Add markers for events
    eventsToShow.forEach(event => {
      if (event.coordinates?.lat && event.coordinates?.lng) {
        const marker = new google.maps.Marker({
          position: event.coordinates,
          map,
          title: event.title,
          icon: {
            url: 'data:image/svg+xml;base64,' + btoa(this.getMarkerSVG()),
            scaledSize: new google.maps.Size(30, 30)
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px;">${event.title}</h3>
              <p style="margin: 0; color: #666;">${event.venue}</p>
              <p style="margin: 4px 0 0 0; color: #888;">${event.date} • ${event.time}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      }
    });

    console.log('[API] Map initialized with', eventsToShow.length, 'events');
    return map;
  }

  getMarkerSVG() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#8b5cf6">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;
  }

  getMapStyles() {
    return [
      { elementType: 'geometry', stylers: [{ color: '#1e1e2e' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1e1e2e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#263c3f' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#38414e' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#212a37' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }]
      }
    ];
  }

  /**
   * Check API health
   */
  async checkHealth() {
    try {
      const data = await this.fetchWithCache(`${this.baseURL}/health`);
      console.log('[API] Health check:', data.status);
      return data;
    } catch (error) {
      console.error('[API] Health check failed:', error);
      return { status: 'error', error: error.message };
    }
  }
}

// Create singleton instance
window.apiIntegration = new APIIntegration();

// Export for module usage
export default APIIntegration;