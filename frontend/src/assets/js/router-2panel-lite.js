/* router-2panel-lite.js - CSP-safe 2-panel router system */
(() => {
  const CONF = 'gamescom2025';
  const API_BASE = '/api';
  
  // Utilities
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)]];
  const on = (el, ev, fn, opt) => el?.addEventListener(ev, fn, opt);
  
  // Date utilities
  const iso10 = d => d.toISOString().slice(0,10);
  const parseISO = s => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||'')); 
    return m ? new Date(Date.UTC(+m[1], +m[2]-1, +m[3])) : null;
  };
  
  // Generate Mon-Sat week from anchor date
  function weekMonSat(anchor) {
    const dow = (anchor.getUTCDay() + 6) % 7;
    const mon = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() - dow));
    return Array.from({length:6}, (_,i) => {
      const d = new Date(Date.UTC(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate()+i));
      return {
        iso: iso10(d),
        label: ['Mon','Tue','Wed','Thu','Fri','Sat'][i] + ' ' + String(d.getUTCDate()).padStart(2,'0')
      };
    });
  }
  
  // State management
  const state = {
    events: [],
    currentDate: null,
    map: null
  };
  
  // Initialize app structure
  function initApp() {
    let app = qs('#app');
    if (!app) {
      app = document.createElement('div');
      app.id = 'app';
      app.className = 'panel-container';
      document.body.appendChild(app);
    } else {
      app.className = 'panel-container';
    }
    
    // Clear any existing content
    app.innerHTML = '';
    
    // Create home panel
    const homePanel = document.createElement('div');
    homePanel.className = 'panel home-panel';
    homePanel.innerHTML = `
      <div class="channels-grid">
        <button type="button" class="channel-btn" data-channel="map">
          <span class="channel-icon">📍</span>
          <span class="channel-label">Map</span>
        </button>
        <button type="button" class="channel-btn" data-channel="calendar">
          <span class="channel-icon">📅</span>
          <span class="channel-label">My calendar</span>
        </button>
        <button type="button" class="channel-btn" data-channel="invites">
          <span class="channel-icon">✉️</span>
          <span class="channel-label">Invites</span>
        </button>
        <button type="button" class="channel-btn" data-channel="contacts">
          <span class="channel-icon">👥</span>
          <span class="channel-label">Contacts</span>
        </button>
        <button type="button" class="channel-btn" data-channel="me">
          <span class="channel-icon">👤</span>
          <span class="channel-label">Me</span>
        </button>
        <button type="button" class="channel-btn" data-channel="settings">
          <span class="channel-icon">⚙️</span>
          <span class="channel-label">Settings</span>
        </button>
      </div>
      <section class="home-section" data-section="parties">
        <h2>Parties</h2>
        <div class="day-pills"></div>
      </section>
      <section class="home-section" data-section="map">
        <h2>Map</h2>
        <div class="day-pills"></div>
      </section>
    `;
    app.appendChild(homePanel);
    
    // Create detail panel
    const detailPanel = document.createElement('div');
    detailPanel.className = 'panel detail-panel';
    detailPanel.innerHTML = `
      <header class="panel-header">
        <button class="back-btn" aria-label="Back">←</button>
        <h1 class="panel-title"></h1>
      </header>
      <div class="panel-content"></div>
    `;
    app.appendChild(detailPanel);
    
    return { app, homePanel, detailPanel };
  }
  
  // Fetch and cache events data
  async function fetchEvents() {
    if (state.events.length > 0) return state.events;
    
    try {
      const r = await fetch(`${API_BASE}/parties?conference=${CONF}`);
      const j = await r.json();
      state.events = j?.data || j?.parties || [];
      return state.events;
    } catch (err) {
      console.warn('[router-2panel] Failed to load events:', err);
      return [];
    }
  }
  
  // Render home pills for both sections
  async function renderHomePills() {
    const { homePanel } = initApp();
    const events = await fetchEvents();
    
    // Determine week from earliest event
    const dates = events.map(e => parseISO(e.date || e.start || e.startsAt)).filter(Boolean);
    const anchor = dates.length ? dates.reduce((a,b) => a < b ? a : b) : new Date();
    const week = weekMonSat(anchor);
    
    // Render parties pills (buttons not links)
    const partiesContainer = qs('[data-section="parties"] .day-pills', homePanel);
    if (partiesContainer) {
      partiesContainer.innerHTML = '';
      week.forEach(day => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'day-pill';
        btn.textContent = day.label.replace(/\s+0/, ' ');
        btn.dataset.iso = day.iso;
        btn.dataset.route = `parties/${day.iso}`;
        partiesContainer.appendChild(btn);
      });
    }
    
    // Render map pills (buttons not links)
    const mapContainer = qs('[data-section="map"] .day-pills', homePanel);
    if (mapContainer) {
      mapContainer.innerHTML = '';
      week.forEach(day => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'day-pill';
        btn.textContent = day.label.replace(/\s+0/, ' ');
        btn.dataset.iso = day.iso;
        btn.dataset.route = `map/${day.iso}`;
        mapContainer.appendChild(btn);
      });
    }
  }
  
  // Render parties for a specific date
  async function renderParties(date, container) {
    const events = await fetchEvents();
    const filtered = events.filter(e => 
      (e.date || e.start || e.startsAt || '').startsWith(date)
    );
    
    if (filtered.length === 0) {
      container.innerHTML = '<p class="no-data">No parties found for this date.</p>';
      return;
    }
    
    // Sort by time
    filtered.sort((a, b) => {
      const timeA = a.time || a.start || a.startsAt || '';
      const timeB = b.time || b.start || b.startsAt || '';
      return timeA.localeCompare(timeB);
    });
    
    container.innerHTML = filtered.map(e => `
      <div class="party-card">
        <div class="card-header">
          <h3>${e.title || e.name || 'Event'}</h3>
          ${e.time ? `<span class="card-time">${e.time}</span>` : ''}
        </div>
        ${e.venue ? `<p class="card-venue">📍 ${e.venue}</p>` : ''}
        ${e.description ? `<p class="card-description">${e.description}</p>` : ''}
        ${e.tags ? `<div class="card-tags">${e.tags.split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('')}</div>` : ''}
      </div>
    `).join('');
  }
  
  // Initialize Google Maps
  async function initMap(date, container) {
    // Ensure Maps API is loaded
    if (!window.google?.maps) {
      // Try to load maps API
      const key = qs('meta[name="maps-key"]')?.content;
      if (key && !qs('script[src*="maps.googleapis.com"]')) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=mapsReady`;
          script.async = true;
          script.defer = true;
          window.mapsReady = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
    }
    
    if (!window.google?.maps) {
      container.innerHTML = '<p class="no-data">Map not available.</p>';
      return;
    }
    
    // Create map container
    container.innerHTML = '<div id="map-container" style="width:100%;height:500px;"></div>';
    const mapEl = qs('#map-container', container);
    
    // Initialize map centered on Cologne/Gamescom area
    const map = new google.maps.Map(mapEl, {
      center: { lat: 50.9375, lng: 6.9603 },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false
    });
    
    state.map = map;
    
    // Load and plot events for this date
    const events = await fetchEvents();
    const filtered = events.filter(e => 
      (e.date || e.start || e.startsAt || '').startsWith(date)
    );
    
    // Create bounds to fit all markers
    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;
    
    filtered.forEach(e => {
      const lat = parseFloat(e.lat || e.latitude);
      const lng = parseFloat(e.lng || e.longitude || e.lon);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        const position = { lat, lng };
        
        const marker = new google.maps.Marker({
          position,
          map,
          title: e.title || e.name || 'Event'
        });
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="map-info">
              <h4>${e.title || e.name || 'Event'}</h4>
              ${e.venue ? `<p>${e.venue}</p>` : ''}
              ${e.time ? `<p>${e.time}</p>` : ''}
            </div>
          `
        });
        
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
        
        bounds.extend(position);
        hasMarkers = true;
      }
    });
    
    // Fit map to markers if any
    if (hasMarkers) {
      map.fitBounds(bounds);
    }
  }
  
  // Handle routing
  function handleRoute() {
    const hash = location.hash || '#/home';
    const { homePanel, detailPanel } = initApp();
    
    // Parse route: #/section or #/section/param
    const parts = hash.slice(2).split('/');
    const section = parts[0] || 'home';
    const param = parts[1];
    
    // Always render home pills first
    renderHomePills();
    
    // Handle different routes
    switch (section) {
      case 'home':
        // Show home panel only
        detailPanel.classList.remove('active');
        break;
        
      case 'parties':
        if (param) {
          // Show parties detail panel
          const title = qs('.panel-title', detailPanel);
          const content = qs('.panel-content', detailPanel);
          
          if (title) {
            const d = parseISO(param);
            const formatted = d ? d.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            }) : param;
            title.textContent = `Parties - ${formatted}`;
          }
          
          if (content) {
            content.innerHTML = '<p class="loading">Loading parties...</p>';
            renderParties(param, content);
          }
          
          detailPanel.classList.add('active');
        } else {
          // Redirect to home if no date specified
          location.hash = '#/home';
        }
        break;
        
      case 'map':
        if (param) {
          // Show map detail panel
          const title = qs('.panel-title', detailPanel);
          const content = qs('.panel-content', detailPanel);
          
          if (title) {
            const d = parseISO(param);
            const formatted = d ? d.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            }) : param;
            title.textContent = `Map - ${formatted}`;
          }
          
          if (content) {
            content.innerHTML = '<p class="loading">Loading map...</p>';
            initMap(param, content);
          }
          
          detailPanel.classList.add('active');
        } else {
          // Redirect to home if no date specified
          location.hash = '#/home';
        }
        break;
        
      case 'calendar':
      case 'invites':
      case 'contacts':
      case 'me':
      case 'settings':
        // Show channel detail panel
        const title = qs('.panel-title', detailPanel);
        const content = qs('.panel-content', detailPanel);
        
        if (title) {
          title.textContent = section.charAt(0).toUpperCase() + section.slice(1);
        }
        
        if (content) {
          content.innerHTML = `<p class="placeholder">Channel: ${section}</p>`;
        }
        
        detailPanel.classList.add('active');
        break;
        
      case 'search':
        // Search is disabled, redirect to home
        location.hash = '#/home';
        break;
        
      default:
        // Unknown route, redirect to home
        location.hash = '#/home';
    }
  }
  
  // Set up event delegation
  function setupEventDelegation() {
    // Handle all clicks on document
    on(document, 'click', e => {
      const target = e.target;
      
      // Handle back button
      if (target.closest('.back-btn')) {
        e.preventDefault();
        location.hash = '#/home';
        return;
      }
      
      // Handle channel buttons
      const channelBtn = target.closest('.channel-btn');
      if (channelBtn) {
        e.preventDefault();
        const channel = channelBtn.dataset.channel;
        if (channel) {
          location.hash = `#/${channel}`;
        }
        return;
      }
      
      // Handle day pills
      const dayPill = target.closest('.day-pill');
      if (dayPill) {
        e.preventDefault();
        const route = dayPill.dataset.route;
        if (route) {
          location.hash = `#/${route}`;
        }
        return;
      }
    });
    
    // Disable search hotkey
    on(window, 'keydown', e => {
      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
      }
    }, { capture: true });
  }
  
  // Initialize router
  function init() {
    // Set up app structure
    initApp();
    
    // Set up event delegation
    setupEventDelegation();
    
    // Handle initial route
    if (!location.hash || location.hash === '#' || location.hash === '#/') {
      location.hash = '#/home';
    } else {
      handleRoute();
    }
    
    // Listen for route changes
    on(window, 'hashchange', handleRoute);
    
    console.log('[router-2panel] initialized');
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();