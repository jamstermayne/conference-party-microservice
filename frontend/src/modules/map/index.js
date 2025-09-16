/**
 * Map Module
 *
 * SINGLE RESPONSIBILITY: Location services and navigation
 * - Interactive map display
 * - Venue location marking
 * - Navigation to venues
 * - Proximity detection
 * - Location-based filtering
 * - Hotspot visualization
 *
 * This module is completely isolated and communicates only through the Platform event bus
 */

import platform from '../core/platform.js';

class MapModule {
  constructor() {
    this.container = null;
    this.state = {
      center: { lat: 50.9423, lng: 6.9579 }, // Cologne, Germany
      zoom: 13,
      venues: [],
      selectedVenue: null,
      userLocation: null,
      hotspots: [],
      loading: false,
      error: null,
      view: 'map' // 'map', 'venues', 'hotspots'
    };

    // Bind methods
    this.mount = this.mount.bind(this);
    this.unmount = this.unmount.bind(this);
    this.loadVenues = this.loadVenues.bind(this);
    this.selectVenue = this.selectVenue.bind(this);
  }

  // ============= MODULE LIFECYCLE =============

  /**
   * Mount the module to a container
   */
  async mount(container) {
    this.container = container;
    console.log('[MapModule] Mounting...');

    // Register event listeners
    this.registerEventListeners();

    // Load venues and hotspots
    await this.loadVenues();
    await this.loadHotspots();

    // Render initial UI
    this.render();

    console.log('[MapModule] Mounted successfully');
  }

  /**
   * Unmount the module and clean up
   */
  async unmount() {
    console.log('[MapModule] Unmounting...');

    // Clean up event listeners
    this.unregisterEventListeners();

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }

    // Reset state
    this.state = {
      center: { lat: 50.9423, lng: 6.9579 },
      zoom: 13,
      venues: [],
      selectedVenue: null,
      userLocation: null,
      hotspots: [],
      loading: false,
      error: null,
      view: 'map'
    };

    console.log('[MapModule] Unmounted successfully');
  }

  /**
   * Get module state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set module state
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  // ============= MAP LOGIC =============

  /**
   * Load venues data
   */
  async loadVenues() {
    this.setState({ loading: true });

    try {
      // Mock venues data for Gamescom
      const mockVenues = [
        {
          id: 'koelnmesse',
          name: 'Koelnmesse',
          address: 'Messeplatz 1, 50679 Köln',
          coordinates: { lat: 50.9423, lng: 6.9579 },
          type: 'convention_center',
          capacity: 50000,
          events: ['Gamescom Opening', 'Indie Games Showcase']
        },
        {
          id: 'marriott',
          name: 'Marriott Hotel Cologne',
          address: 'Johannisstraße 76-80, 50668 Köln',
          coordinates: { lat: 50.9429, lng: 6.9543 },
          type: 'hotel',
          capacity: 300,
          events: ['Developer Networking Mixer']
        },
        {
          id: 'hyatt',
          name: 'Hyatt Regency Cologne',
          address: 'Kennedy-Ufer 2A, 50679 Köln',
          coordinates: { lat: 50.9401, lng: 6.9598 },
          type: 'hotel',
          capacity: 500,
          events: ['Publisher Meetup']
        },
        {
          id: 'rheinpark',
          name: 'Rheinpark',
          address: 'Rheinpark, 50679 Köln',
          coordinates: { lat: 50.9389, lng: 6.9647 },
          type: 'outdoor',
          capacity: 1000,
          events: ['Outdoor Gaming Festival']
        }
      ];

      this.setState({
        venues: mockVenues,
        loading: false
      });

      // Emit venues loaded event
      platform.emit('map:venues-loaded', {
        count: mockVenues.length,
        venues: mockVenues
      });

    } catch (error) {
      console.error('[MapModule] Failed to load venues:', error);
      this.setState({
        loading: false,
        error: error.message
      });
    }
  }

  /**
   * Load hotspots data
   */
  async loadHotspots() {
    try {
      // Mock hotspots data
      const mockHotspots = [
        {
          venueId: 'koelnmesse',
          crowdLevel: 85,
          lastUpdated: Date.now(),
          events: 3
        },
        {
          venueId: 'marriott',
          crowdLevel: 65,
          lastUpdated: Date.now(),
          events: 1
        },
        {
          venueId: 'hyatt',
          crowdLevel: 45,
          lastUpdated: Date.now(),
          events: 1
        },
        {
          venueId: 'rheinpark',
          crowdLevel: 30,
          lastUpdated: Date.now(),
          events: 1
        }
      ];

      this.setState({
        hotspots: mockHotspots
      });

      // Emit hotspots loaded event
      platform.emit('map:hotspots-loaded', {
        hotspots: mockHotspots
      });

    } catch (error) {
      console.error('[MapModule] Failed to load hotspots:', error);
    }
  }

  /**
   * Select venue
   */
  selectVenue(venueId) {
    const venue = this.state.venues.find(v => v.id === venueId);
    if (!venue) return;

    this.setState({ selectedVenue: venue });

    // Emit venue selection event
    platform.emit('map:venue-selected', {
      venueId: venue.id,
      venue: venue
    });

    // Emit location for other modules to filter by
    platform.emit('map:location-selected', {
      location: venue.address,
      coordinates: venue.coordinates
    });
  }

  /**
   * Navigate to venue
   */
  navigateToVenue(venueId) {
    const venue = this.state.venues.find(v => v.id === venueId);
    if (!venue) return;

    // Open Google Maps for navigation
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${venue.coordinates.lat},${venue.coordinates.lng}`;
    window.open(mapsUrl, '_blank');

    // Emit navigation event
    platform.emit('map:navigation-started', {
      venueId: venue.id,
      destination: venue.address
    });
  }

  /**
   * Get user location
   */
  async getUserLocation() {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          this.setState({ userLocation: location });
          resolve(location);
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // ============= UI RENDERING =============

  /**
   * Render the map UI
   */
  render() {
    if (!this.container) return;

    switch (this.state.view) {
      case 'map':
        this.renderMap();
        break;
      case 'venues':
        this.renderVenues();
        break;
      case 'hotspots':
        this.renderHotspots();
        break;
      default:
        this.renderMap();
    }
  }

  /**
   * Render map view
   */
  renderMap() {
    this.container.innerHTML = `
      <div class="map-module">
        <div class="map-nav">
          <button class="nav-btn active" id="nav-map">Map</button>
          <button class="nav-btn" id="nav-venues">Venues</button>
          <button class="nav-btn" id="nav-hotspots">Hotspots</button>
        </div>

        <div class="map-container">
          ${this.renderMapPlaceholder()}
          ${this.renderMapControls()}
        </div>

        ${this.state.selectedVenue ? this.renderSelectedVenue() : ''}
      </div>
    `;

    this.attachNavigationListeners();
    this.attachMapListeners();
  }

  /**
   * Render map placeholder (in real app, would be Google Maps)
   */
  renderMapPlaceholder() {
    const hotspotData = this.state.hotspots.reduce((acc, hotspot) => {
      const venue = this.state.venues.find(v => v.id === hotspot.venueId);
      if (venue) {
        acc[venue.id] = hotspot.crowdLevel;
      }
      return acc;
    }, {});

    return `
      <div class="map-placeholder">
        <div class="map-title">🗺️ Gamescom 2025 Venue Map</div>
        <div class="map-markers">
          ${this.state.venues.map(venue => `
            <div class="map-marker ${this.state.selectedVenue?.id === venue.id ? 'selected' : ''}"
                 data-venue-id="${venue.id}"
                 style="position: absolute; left: ${this.getMarkerPosition(venue).left}%; top: ${this.getMarkerPosition(venue).top}%;">
              <div class="marker-icon ${venue.type}">
                ${this.getVenueIcon(venue.type)}
              </div>
              <div class="marker-label">${venue.name}</div>
              ${hotspotData[venue.id] ? `
                <div class="crowd-indicator" style="opacity: ${hotspotData[venue.id] / 100}">
                  ${hotspotData[venue.id]}%
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        <div class="map-legend">
          <div class="legend-item">
            <span class="legend-icon">🏢</span> Convention Center
          </div>
          <div class="legend-item">
            <span class="legend-icon">🏨</span> Hotel
          </div>
          <div class="legend-item">
            <span class="legend-icon">🌳</span> Outdoor
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get marker position for venue
   */
  getMarkerPosition(venue) {
    // Mock positioning based on venue ID
    const positions = {
      koelnmesse: { left: 50, top: 40 },
      marriott: { left: 45, top: 35 },
      hyatt: { left: 55, top: 50 },
      rheinpark: { left: 60, top: 55 }
    };
    return positions[venue.id] || { left: 50, top: 50 };
  }

  /**
   * Get venue icon
   */
  getVenueIcon(type) {
    const icons = {
      convention_center: '🏢',
      hotel: '🏨',
      outdoor: '🌳'
    };
    return icons[type] || '📍';
  }

  /**
   * Render map controls
   */
  renderMapControls() {
    return `
      <div class="map-controls">
        <button id="get-location" class="control-btn">
          📍 My Location
        </button>
        <button id="refresh-hotspots" class="control-btn">
          🔄 Refresh Hotspots
        </button>
      </div>
    `;
  }

  /**
   * Render selected venue info
   */
  renderSelectedVenue() {
    const venue = this.state.selectedVenue;
    const hotspot = this.state.hotspots.find(h => h.venueId === venue.id);

    return `
      <div class="selected-venue">
        <div class="venue-header">
          <h3>${venue.name}</h3>
          <button id="close-venue" class="close-btn">×</button>
        </div>

        <div class="venue-details">
          <div class="venue-address">📍 ${venue.address}</div>
          <div class="venue-capacity">👥 Capacity: ${venue.capacity.toLocaleString()}</div>
          ${hotspot ? `
            <div class="venue-crowd">🔥 Crowd Level: ${hotspot.crowdLevel}%</div>
          ` : ''}
        </div>

        ${venue.events?.length ? `
          <div class="venue-events">
            <h4>Events at this venue:</h4>
            ${venue.events.map(event => `
              <div class="venue-event">${event}</div>
            `).join('')}
          </div>
        ` : ''}

        <div class="venue-actions">
          <button id="navigate-venue" class="action-btn primary">
            🧭 Navigate Here
          </button>
          <button id="filter-events" class="action-btn">
            🎯 Filter Events
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render venues list view
   */
  renderVenues() {
    this.container.innerHTML = `
      <div class="map-module">
        <div class="map-nav">
          <button class="nav-btn" id="nav-map">Map</button>
          <button class="nav-btn active" id="nav-venues">Venues</button>
          <button class="nav-btn" id="nav-hotspots">Hotspots</button>
        </div>

        <div class="venues-list">
          <h2>Venues (${this.state.venues.length})</h2>

          <div class="venues-grid">
            ${this.state.venues.map(venue => this.renderVenueCard(venue)).join('')}
          </div>
        </div>
      </div>
    `;

    this.attachNavigationListeners();
    this.attachVenueListeners();
  }

  /**
   * Render venue card
   */
  renderVenueCard(venue) {
    const hotspot = this.state.hotspots.find(h => h.venueId === venue.id);

    return `
      <div class="venue-card" data-venue-id="${venue.id}">
        <div class="venue-card-header">
          <div class="venue-icon">${this.getVenueIcon(venue.type)}</div>
          <div class="venue-info">
            <h3>${venue.name}</h3>
            <p>${venue.address}</p>
          </div>
          ${hotspot ? `
            <div class="crowd-badge">${hotspot.crowdLevel}%</div>
          ` : ''}
        </div>

        <div class="venue-stats">
          <div class="stat">
            <span class="stat-label">Capacity</span>
            <span class="stat-value">${venue.capacity.toLocaleString()}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Events</span>
            <span class="stat-value">${venue.events?.length || 0}</span>
          </div>
        </div>

        <div class="venue-card-actions">
          <button class="venue-action-btn select" data-venue-id="${venue.id}">
            View on Map
          </button>
          <button class="venue-action-btn navigate" data-venue-id="${venue.id}">
            Navigate
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render hotspots view
   */
  renderHotspots() {
    this.container.innerHTML = `
      <div class="map-module">
        <div class="map-nav">
          <button class="nav-btn" id="nav-map">Map</button>
          <button class="nav-btn" id="nav-venues">Venues</button>
          <button class="nav-btn active" id="nav-hotspots">Hotspots</button>
        </div>

        <div class="hotspots-view">
          <h2>Crowd Hotspots</h2>
          <p>Real-time venue popularity</p>

          <div class="hotspots-list">
            ${this.renderHotspotsList()}
          </div>
        </div>
      </div>
    `;

    this.attachNavigationListeners();
  }

  /**
   * Render hotspots list
   */
  renderHotspotsList() {
    const sortedHotspots = [...this.state.hotspots]
      .sort((a, b) => b.crowdLevel - a.crowdLevel);

    return sortedHotspots.map((hotspot, index) => {
      const venue = this.state.venues.find(v => v.id === hotspot.venueId);
      if (!venue) return '';

      return `
        <div class="hotspot-item ${index === 0 ? 'top-hotspot' : ''}">
          <div class="hotspot-rank">#${index + 1}</div>
          <div class="hotspot-info">
            <h3>${venue.name}</h3>
            <p>${venue.address}</p>
          </div>
          <div class="hotspot-meter">
            <div class="meter-bar">
              <div class="meter-fill" style="width: ${hotspot.crowdLevel}%"></div>
            </div>
            <div class="meter-value">${hotspot.crowdLevel}%</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Attach navigation listeners
   */
  attachNavigationListeners() {
    const navButtons = this.container.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.id.replace('nav-', '');
        this.setState({ view });
      });
    });
  }

  /**
   * Attach map listeners
   */
  attachMapListeners() {
    // Map marker clicks
    this.container.querySelectorAll('.map-marker').forEach(marker => {
      marker.addEventListener('click', () => {
        this.selectVenue(marker.dataset.venueId);
      });
    });

    // Control buttons
    const locationBtn = this.container.querySelector('#get-location');
    if (locationBtn) {
      locationBtn.addEventListener('click', async () => {
        try {
          await this.getUserLocation();
          alert('Location updated!');
        } catch (error) {
          alert(`Location error: ${error.message}`);
        }
      });
    }

    const refreshBtn = this.container.querySelector('#refresh-hotspots');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadHotspots());
    }

    // Selected venue actions
    const closeBtn = this.container.querySelector('#close-venue');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.setState({ selectedVenue: null });
      });
    }

    const navigateBtn = this.container.querySelector('#navigate-venue');
    if (navigateBtn) {
      navigateBtn.addEventListener('click', () => {
        this.navigateToVenue(this.state.selectedVenue.id);
      });
    }

    const filterBtn = this.container.querySelector('#filter-events');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        platform.emit('map:filter-events-by-venue', {
          venueId: this.state.selectedVenue.id,
          venueName: this.state.selectedVenue.name
        });
      });
    }
  }

  /**
   * Attach venue listeners
   */
  attachVenueListeners() {
    this.container.querySelectorAll('.venue-action-btn.select').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectVenue(btn.dataset.venueId);
        this.setState({ view: 'map' });
      });
    });

    this.container.querySelectorAll('.venue-action-btn.navigate').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigateToVenue(btn.dataset.venueId);
      });
    });
  }

  // ============= EVENT HANDLING =============

  /**
   * Register platform event listeners
   */
  registerEventListeners() {
    // Listen for event selections to show venue
    this.eventSelectedHandler = (data) => {
      if (data.event && data.event.venue) {
        // Try to find venue by name
        const venue = this.state.venues.find(v =>
          v.name.toLowerCase().includes(data.event.venue.toLowerCase())
        );
        if (venue) {
          this.selectVenue(venue.id);
        }
      }
    };
    platform.on('events:event-selected', this.eventSelectedHandler);

    // Listen for navigation requests
    this.navigateHandler = (data) => {
      if (data.location) {
        // Try to find venue by address
        const venue = this.state.venues.find(v =>
          v.address.toLowerCase().includes(data.location.name.toLowerCase())
        );
        if (venue) {
          this.selectVenue(venue.id);
        }
      }
    };
    platform.on('events:navigate-to-map', this.navigateHandler);
  }

  /**
   * Unregister event listeners
   */
  unregisterEventListeners() {
    if (this.eventSelectedHandler) platform.off('events:event-selected', this.eventSelectedHandler);
    if (this.navigateHandler) platform.off('events:navigate-to-map', this.navigateHandler);
  }

  // ============= PUBLIC API =============

  /**
   * Get venues
   */
  getVenues() {
    return [...this.state.venues];
  }

  /**
   * Get hotspots
   */
  getHotspots() {
    return [...this.state.hotspots];
  }

  /**
   * Get selected venue
   */
  getSelectedVenue() {
    return this.state.selectedVenue;
  }
}

// Export module
export default MapModule;