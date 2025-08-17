/**
 * Interactive Map Discovery System
 * ===============================
 * Custom markers, clustering, venue information, and seamless list/map toggle
 */

class MapDiscovery {
  constructor() {
    this.map = null;
    this.markers = [];
    this.infoWindow = null;
    this.venues = [];
    this.events = [];
    this.currentView = 'map'; // 'map' or 'list'
    this.selectedVenue = null;
    this.userLocation = null;
    this.clusterer = null;
    this.container = null;
  }

  async initialize(container, events = []) {
    this.container = container;
    this.events = events;
    this.venues = this.groupEventsByVenue(events);
    
    await this.render();
    await this.getUserLocation();
    await this.initializeMap();
    this.bindEvents();
    
    return this;
  }

  groupEventsByVenue(events) {
    const venueMap = new Map();
    
    events.forEach(event => {
      if (!event.lat || !event.lng || !event.venue) return;
      
      const venueKey = `${event.venue}-${event.lat}-${event.lng}`;
      
      if (!venueMap.has(venueKey)) {
        venueMap.set(venueKey, {
          id: venueKey,
          name: event.venue,
          lat: event.lat,
          lng: event.lng,
          events: [],
          address: event.address || '',
          type: this.inferVenueType(event.venue)
        });
      }
      
      venueMap.get(venueKey).events.push(event);
    });
    
    return Array.from(venueMap.values());
  }

  inferVenueType(venueName) {
    const name = venueName.toLowerCase();
    if (name.includes('hotel') || name.includes('resort')) return 'hotel';
    if (name.includes('bar') || name.includes('pub') || name.includes('lounge')) return 'bar';
    if (name.includes('club') || name.includes('nightclub')) return 'club';
    if (name.includes('restaurant') || name.includes('cafe')) return 'restaurant';
    if (name.includes('center') || name.includes('centre') || name.includes('hall')) return 'venue';
    return 'venue';
  }

  async render() {
    this.container.innerHTML = `
      <div class="map-discovery">
        <header class="map-header">
          <h2 class="map-title">Discover Venues</h2>
          <div class="map-controls">
            <div class="map-toggle">
              <button class="map-toggle-option active" data-view="map">
                <svg class="view-toggle-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                </svg>
                Map
              </button>
              <button class="map-toggle-option" data-view="list">
                <svg class="view-toggle-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                </svg>
                List
              </button>
            </div>
          </div>
        </header>
        
        <div class="map-container">
          <div class="map-loading">
            <div class="map-loading-content">
              <div class="map-loading-spinner"></div>
              <div class="map-loading-text">Loading map...</div>
            </div>
          </div>
          <div id="interactive-map" class="interactive-map" style="display: none;"></div>
        </div>
        
        <div class="map-legend" style="display: none;">
          <div class="legend-item">
            <div class="legend-marker venue"></div>
            <span>Event Venue</span>
          </div>
          <div class="legend-item">
            <div class="legend-marker selected"></div>
            <span>Selected Venue</span>
          </div>
        </div>
      </div>
    `;
  }

  async initializeMap() {
    try {
      // Wait for Google Maps API to be available
      await this.waitForGoogleMaps();
      
      const mapContainer = this.container.querySelector('#interactive-map');
      const loadingContainer = this.container.querySelector('.map-loading');
      const legend = this.container.querySelector('.map-legend');
      
      // Default center (Cologne, Germany - where Gamescom takes place)
      const defaultCenter = { lat: 50.9375, lng: 6.9603 };
      
      this.map = new google.maps.Map(mapContainer, {
        zoom: 13,
        center: defaultCenter,
        styles: this.getMapStyles(),
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative'
      });

      // Create info window
      this.infoWindow = new google.maps.InfoWindow({
        content: '',
        disableAutoPan: false
      });

      // Add markers for venues
      this.createVenueMarkers();
      
      // Initialize marker clustering
      this.initializeMarkerClustering();
      
      // Show map and hide loading
      mapContainer.style.display = 'block';
      loadingContainer.style.display = 'none';
      legend.style.display = 'block';
      
      // Center map to show all venues
      this.fitMapToVenues();
      
    } catch (error) {
      console.error('Failed to initialize map:', error);
      this.showMapError();
    }
  }

  async waitForGoogleMaps() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps) {
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkGoogleMaps, 100);
        } else {
          reject(new Error('Google Maps API failed to load'));
        }
      };
      
      checkGoogleMaps();
    });
  }

  createVenueMarkers() {
    this.venues.forEach((venue, index) => {
      const marker = new google.maps.Marker({
        position: { lat: venue.lat, lng: venue.lng },
        map: this.map,
        title: venue.name,
        icon: this.createCustomMarkerIcon(venue, index),
        animation: google.maps.Animation.DROP
      });

      // Add click event to show info window
      marker.addListener('click', () => {
        this.selectVenue(venue);
        this.showVenueInfo(venue, marker);
      });

      this.markers.push({
        marker,
        venue,
        element: null
      });
    });
  }

  createCustomMarkerIcon(venue, index) {
    const eventCount = venue.events.length;
    const isSelected = this.selectedVenue?.id === venue.id;
    
    // Create custom marker using SVG
    const svg = `
      <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${isSelected ? '#10b981' : '#6b7bff'};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${isSelected ? '#059669' : '#6366f1'};stop-opacity:1" />
          </linearGradient>
          <filter id="shadow-${index}">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.4"/>
          </filter>
        </defs>
        <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24c0-8.8-7.2-16-16-16z" 
              fill="url(#gradient-${index})" filter="url(#shadow-${index})"/>
        <circle cx="16" cy="16" r="8" fill="white" fill-opacity="0.9"/>
        <text x="16" y="20" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="10" font-weight="bold" fill="${isSelected ? '#059669' : '#6366f1'}">
          ${eventCount}
        </text>
      </svg>
    `;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(32, 40),
      anchor: new google.maps.Point(16, 40)
    };
  }

  initializeMarkerClustering() {
    // Simple clustering implementation
    // In a real application, you might use @googlemaps/markerclustererplus
    this.clusterer = {
      markers: this.markers.map(m => m.marker)
    };
  }

  selectVenue(venue) {
    this.selectedVenue = venue;
    
    // Update marker icons
    this.markers.forEach((markerData, index) => {
      markerData.marker.setIcon(this.createCustomMarkerIcon(markerData.venue, index));
    });
    
    // Update list view selection
    this.updateListSelection();
  }

  showVenueInfo(venue, marker) {
    const content = this.createInfoWindowContent(venue);
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
    
    // Add event listeners after content is set
    setTimeout(() => {
      this.bindInfoWindowEvents(venue);
    }, 100);
  }

  createInfoWindowContent(venue) {
    const eventsText = venue.events.length === 1 ? 'event' : 'events';
    const distance = this.userLocation ? this.calculateDistance(venue, this.userLocation) : null;
    
    return `
      <div class="map-info-window">
        <div class="info-window-header">
          <h3 class="info-window-title">${venue.name}</h3>
          <div class="info-window-venue">
            📍 ${venue.events.length} ${eventsText}
            ${distance ? ` • ${distance}` : ''}
          </div>
        </div>
        <div class="info-window-body">
          <div class="info-window-meta">
            ${venue.events.slice(0, 2).map(event => `
              <span class="info-window-pill ${event.price ? 'price' : ''}">${event.price || 'Event'}</span>
            `).join('')}
            ${venue.events.length > 2 ? `<span class="info-window-pill">+${venue.events.length - 2} more</span>` : ''}
          </div>
          ${venue.events[0]?.description ? `
            <div class="info-window-description">${venue.events[0].description}</div>
          ` : ''}
          <div class="info-window-actions">
            <button class="info-window-action info-window-action--primary" data-action="view-events">
              View Events
            </button>
            <a class="info-window-action info-window-action--secondary" 
               href="https://maps.google.com/maps?q=${venue.lat},${venue.lng}" 
               target="_blank" rel="noopener">
              Directions
            </a>
          </div>
        </div>
      </div>
    `;
  }

  bindInfoWindowEvents(venue) {
    const viewEventsBtn = this.container.querySelector('[data-action="view-events"]');
    if (viewEventsBtn) {
      viewEventsBtn.addEventListener('click', () => {
        this.showVenueEvents(venue);
      });
    }
  }

  showVenueEvents(venue) {
    // Dispatch custom event that parent component can listen to
    this.container.dispatchEvent(new CustomEvent('venue-selected', {
      detail: { venue, events: venue.events },
      bubbles: true
    }));
  }

  getMapStyles() {
    // Dark theme map styles
    return [
      {
        "elementType": "geometry",
        "stylers": [{"color": "#242a30"}]
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [{"color": "#242a30"}]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#9ca5b3"}]
      },
      {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#d59563"}]
      },
      {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#d59563"}]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{"color": "#263c3f"}]
      },
      {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#6b9a76"}]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{"color": "#38414e"}]
      },
      {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{"color": "#212a37"}]
      },
      {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#9ca5b3"}]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{"color": "#746855"}]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{"color": "#1f2835"}]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#f3d19c"}]
      },
      {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [{"color": "#2f3948"}]
      },
      {
        "featureType": "transit.station",
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#d59563"}]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{"color": "#17263c"}]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#515c6d"}]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [{"color": "#17263c"}]
      }
    ];
  }

  fitMapToVenues() {
    if (this.venues.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    this.venues.forEach(venue => {
      bounds.extend({ lat: venue.lat, lng: venue.lng });
    });
    
    this.map.fitBounds(bounds);
    
    // Don't zoom in too much for single venue
    if (this.venues.length === 1) {
      setTimeout(() => {
        if (this.map.getZoom() > 15) {
          this.map.setZoom(15);
        }
      }, 100);
    }
  }

  async getUserLocation() {
    if (!navigator.geolocation) return;
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false
        });
      });
      
      this.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
    } catch (error) {
      console.log('Could not get user location:', error);
    }
  }

  calculateDistance(venue, userLocation) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(venue.lat - userLocation.lat);
    const dLon = this.deg2rad(venue.lng - userLocation.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(userLocation.lat)) * Math.cos(this.deg2rad(venue.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  switchToListView() {
    this.currentView = 'list';
    this.updateViewToggle();
    
    const mapContainer = this.container.querySelector('.map-container');
    mapContainer.innerHTML = this.createListView();
    this.bindListEvents();
  }

  switchToMapView() {
    this.currentView = 'map';
    this.updateViewToggle();
    
    const mapContainer = this.container.querySelector('.map-container');
    mapContainer.innerHTML = `
      <div id="interactive-map" class="interactive-map"></div>
    `;
    
    // Reinitialize map
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  updateViewToggle() {
    const toggleOptions = this.container.querySelectorAll('.map-toggle-option');
    toggleOptions.forEach(option => {
      option.classList.toggle('active', option.dataset.view === this.currentView);
    });
  }

  createListView() {
    const sortedVenues = this.sortVenuesByDistance();
    
    return `
      <div class="map-list-view">
        <div class="map-list-header">
          <span class="map-list-count">${this.venues.length} venues found</span>
          <div class="map-list-sort">
            <label for="venue-sort">Sort by:</label>
            <select id="venue-sort">
              <option value="distance">Distance</option>
              <option value="events">Most Events</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
        <div class="venue-list">
          ${sortedVenues.map((venue, index) => this.createVenueListItem(venue, index)).join('')}
        </div>
      </div>
    `;
  }

  createVenueListItem(venue, index) {
    const eventsText = venue.events.length === 1 ? 'event' : 'events';
    const distance = this.userLocation ? this.calculateDistance(venue, this.userLocation) : null;
    const isSelected = this.selectedVenue?.id === venue.id;
    
    return `
      <div class="venue-item ${isSelected ? 'selected' : ''}" data-venue-id="${venue.id}">
        <div class="venue-marker-mini">${venue.events.length}</div>
        <div class="venue-content">
          <h3 class="venue-name">${venue.name}</h3>
          <div class="venue-events-count">${venue.events.length} ${eventsText}</div>
          ${distance ? `<span class="venue-distance">${distance} away</span>` : ''}
        </div>
        <div class="venue-actions">
          <button class="venue-action" data-action="view-events">View Events</button>
          <a class="venue-action" href="https://maps.google.com/maps?q=${venue.lat},${venue.lng}" target="_blank" rel="noopener">
            Directions
          </a>
        </div>
      </div>
    `;
  }

  sortVenuesByDistance() {
    return [...this.venues].sort((a, b) => {
      if (!this.userLocation) {
        // Sort by number of events if no location
        return b.events.length - a.events.length;
      }
      
      const distanceA = this.calculateDistanceNumeric(a, this.userLocation);
      const distanceB = this.calculateDistanceNumeric(b, this.userLocation);
      return distanceA - distanceB;
    });
  }

  calculateDistanceNumeric(venue, userLocation) {
    const R = 6371;
    const dLat = this.deg2rad(venue.lat - userLocation.lat);
    const dLon = this.deg2rad(venue.lng - userLocation.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(userLocation.lat)) * Math.cos(this.deg2rad(venue.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  updateListSelection() {
    if (this.currentView !== 'list') return;
    
    const venueItems = this.container.querySelectorAll('.venue-item');
    venueItems.forEach(item => {
      const isSelected = item.dataset.venueId === this.selectedVenue?.id;
      item.classList.toggle('selected', isSelected);
    });
  }

  bindEvents() {
    // View toggle
    this.container.querySelectorAll('.map-toggle-option').forEach(option => {
      option.addEventListener('click', () => {
        const view = option.dataset.view;
        if (view === 'list') {
          this.switchToListView();
        } else {
          this.switchToMapView();
        }
      });
    });
  }

  bindListEvents() {
    // Venue item clicks
    this.container.querySelectorAll('.venue-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.venue-action')) return; // Don't trigger for action buttons
        
        const venueId = item.dataset.venueId;
        const venue = this.venues.find(v => v.id === venueId);
        if (venue) {
          this.selectVenue(venue);
        }
      });
    });

    // Action buttons
    this.container.querySelectorAll('[data-action="view-events"]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const venueItem = button.closest('.venue-item');
        const venueId = venueItem.dataset.venueId;
        const venue = this.venues.find(v => v.id === venueId);
        if (venue) {
          this.showVenueEvents(venue);
        }
      });
    });

    // Sort dropdown
    const sortSelect = this.container.querySelector('#venue-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortVenueList(e.target.value);
      });
    }
  }

  sortVenueList(sortBy) {
    let sortedVenues;
    
    switch (sortBy) {
      case 'events':
        sortedVenues = [...this.venues].sort((a, b) => b.events.length - a.events.length);
        break;
      case 'name':
        sortedVenues = [...this.venues].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'distance':
      default:
        sortedVenues = this.sortVenuesByDistance();
        break;
    }
    
    const venueList = this.container.querySelector('.venue-list');
    venueList.innerHTML = sortedVenues.map((venue, index) => 
      this.createVenueListItem(venue, index)
    ).join('');
    
    this.bindListEvents();
  }

  showMapError() {
    const mapContainer = this.container.querySelector('.map-container');
    mapContainer.innerHTML = `
      <div class="map-loading">
        <div class="map-loading-content">
          <div style="color: #ef4444; font-size: 1.5rem; margin-bottom: 1rem;">⚠️</div>
          <div class="map-loading-text">Failed to load map</div>
          <button style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-accent); color: white; border: none; border-radius: 4px; cursor: pointer;" 
                  onclick="location.reload()">
            Retry
          </button>
        </div>
      </div>
    `;
  }

  // Public API
  updateEvents(events) {
    this.events = events;
    this.venues = this.groupEventsByVenue(events);
    
    if (this.currentView === 'map' && this.map) {
      // Clear existing markers
      this.markers.forEach(markerData => {
        markerData.marker.setMap(null);
      });
      this.markers = [];
      
      // Create new markers
      this.createVenueMarkers();
      this.fitMapToVenues();
    } else if (this.currentView === 'list') {
      this.switchToListView();
    }
  }

  getSelectedVenue() {
    return this.selectedVenue;
  }

  centerOnVenue(venueId) {
    const venue = this.venues.find(v => v.id === venueId);
    if (!venue || !this.map) return;
    
    this.map.setCenter({ lat: venue.lat, lng: venue.lng });
    this.map.setZoom(16);
    this.selectVenue(venue);
  }
}

// Export for use
export { MapDiscovery };