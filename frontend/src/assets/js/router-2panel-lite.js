/* router-2panel-lite.js - Lightweight 2-panel router system */
(() => {
  const CONF = 'gamescom2025';
  
  // Utilities
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const on = (el, ev, fn, opt) => el?.addEventListener(ev, fn, opt);
  
  // Date utilities
  const iso10 = d => d.toISOString().slice(0,10);
  const parseISO = s => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||'')); 
    return m ? new Date(Date.UTC(+m[1], +m[2]-1, +m[3])) : null;
  };
  
  // Generate Mon-Sat week
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
    
    // Create home panel if needed
    let homePanel = qs('.home-panel', app);
    if (!homePanel) {
      homePanel = document.createElement('div');
      homePanel.className = 'panel home-panel';
      homePanel.innerHTML = `
        <div class="channels-grid">
          <button type="button" class="channel-btn" data-route="#/parties">
            <span class="channel-icon">🎉</span>
            <span class="channel-label">Parties</span>
          </button>
          <button type="button" class="channel-btn" data-route="#/map">
            <span class="channel-icon">📍</span>
            <span class="channel-label">Map</span>
          </button>
          <button type="button" class="channel-btn" data-route="#/calendar">
            <span class="channel-icon">📅</span>
            <span class="channel-label">Calendar</span>
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
    }
    
    // Create detail panel if needed
    let detailPanel = qs('.detail-panel', app);
    if (!detailPanel) {
      detailPanel = document.createElement('div');
      detailPanel.className = 'panel detail-panel';
      detailPanel.innerHTML = `
        <header class="panel-header">
          <button class="back-btn" aria-label="Back">←</button>
          <h1 class="panel-title"></h1>
        </header>
        <div class="panel-content"></div>
      `;
      app.appendChild(detailPanel);
      
      // Wire back button
      on(qs('.back-btn', detailPanel), 'click', () => {
        location.hash = '#/home';
      });
    }
    
    return { app, homePanel, detailPanel };
  }
  
  // Render home pills
  async function renderHomePills() {
    const { homePanel } = initApp();
    
    try {
      const r = await fetch(`/api/parties?conference=${CONF}`);
      const j = await r.json();
      const events = j?.data || j?.parties || [];
      const dates = events.map(e => parseISO(e.date || e.start || e.startsAt)).filter(Boolean);
      const anchor = dates.length ? dates.reduce((a,b) => a < b ? a : b) : new Date();
      const week = weekMonSat(anchor);
      
      // Render parties pills
      const partiesContainer = qs('[data-section="parties"] .day-pills', homePanel);
      if (partiesContainer) {
        partiesContainer.innerHTML = '';
        week.forEach(day => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'day-pill';
          btn.textContent = day.label.replace(/\s+0/, ' ');
          btn.dataset.iso = day.iso;
          on(btn, 'click', () => location.hash = `#/parties/${day.iso}`);
          partiesContainer.appendChild(btn);
        });
      }
      
      // Render map pills
      const mapContainer = qs('[data-section="map"] .day-pills', homePanel);
      if (mapContainer) {
        mapContainer.innerHTML = '';
        week.forEach(day => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'day-pill';
          btn.textContent = day.label.replace(/\s+0/, ' ');
          btn.dataset.iso = day.iso;
          on(btn, 'click', () => location.hash = `#/map/${day.iso}`);
          mapContainer.appendChild(btn);
        });
      }
    } catch (err) {
      console.warn('[router-2panel] Failed to load data:', err);
    }
    
    // Wire channel buttons
    qsa('.channel-btn', homePanel).forEach(btn => {
      on(btn, 'click', () => {
        const route = btn.dataset.route;
        if (route) location.hash = route;
      });
    });
  }
  
  // Handle routing
  function handleRoute() {
    const { detailPanel } = initApp();
    const hash = location.hash || '#/home';
    
    // Parse route
    const [_, section, param] = hash.match(/^#\/([^\/]+)(?:\/(.+))?$/) || [];
    
    // Handle different routes
    if (section === 'home' || !section) {
      // Show home panel only
      detailPanel.classList.remove('active');
      renderHomePills();
    } else if (section === 'parties' && param) {
      // Show parties detail
      const title = qs('.panel-title', detailPanel);
      const content = qs('.panel-content', detailPanel);
      if (title) title.textContent = `Parties - ${param}`;
      if (content) content.innerHTML = `<p>Loading parties for ${param}...</p>`;
      detailPanel.classList.add('active');
      
      // Load parties for this date
      loadParties(param, content);
    } else if (section === 'map' && param) {
      // Show map detail
      const title = qs('.panel-title', detailPanel);
      const content = qs('.panel-content', detailPanel);
      if (title) title.textContent = `Map - ${param}`;
      if (content) content.innerHTML = `<div id="map-container" style="width:100%;height:500px;">Loading map...</div>`;
      detailPanel.classList.add('active');
      
      // Initialize map
      initMap(param, content);
    } else if (section === 'search') {
      // Redirect search to home (search disabled)
      location.hash = '#/home';
    } else {
      // Default to home for unknown routes
      location.hash = '#/home';
    }
  }
  
  // Load parties for a specific date
  async function loadParties(date, container) {
    if (!container) return;
    
    try {
      const r = await fetch(`/api/parties?conference=${CONF}`);
      const j = await r.json();
      const events = (j?.data || j?.parties || [])
        .filter(e => (e.date || e.start || e.startsAt || '').startsWith(date));
      
      if (events.length === 0) {
        container.innerHTML = '<p>No parties found for this date.</p>';
        return;
      }
      
      container.innerHTML = events.map(e => `
        <div class="party-card">
          <h3>${e.title || e.name || 'Event'}</h3>
          <p>${e.venue || ''}</p>
          <p>${e.time || ''}</p>
          <p>${e.description || ''}</p>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = '<p>Failed to load parties.</p>';
    }
  }
  
  // Initialize map
  function initMap(date, container) {
    if (!container || !window.google?.maps) {
      if (container) container.innerHTML = '<p>Map not available.</p>';
      return;
    }
    
    const mapEl = qs('#map-container', container);
    if (!mapEl) return;
    
    const map = new google.maps.Map(mapEl, {
      center: { lat: 50.9375, lng: 6.9603 },
      zoom: 12
    });
    
    // Load and plot parties for this date
    fetch(`/api/parties?conference=${CONF}`)
      .then(r => r.json())
      .then(j => {
        const events = (j?.data || j?.parties || [])
          .filter(e => (e.date || e.start || e.startsAt || '').startsWith(date));
        
        events.forEach(e => {
          const lat = Number(e.lat || e.latitude);
          const lng = Number(e.lng || e.longitude || e.lon);
          if (lat && lng) {
            new google.maps.Marker({
              position: { lat, lng },
              map,
              title: e.title || e.name || 'Event'
            });
          }
        });
      })
      .catch(() => {});
  }
  
  // Initialize router
  function init() {
    // Set up initial structure
    initApp();
    
    // Handle initial route
    handleRoute();
    
    // Listen for route changes
    on(window, 'hashchange', handleRoute);
    
    // Disable search hotkey
    on(window, 'keydown', e => {
      if (e.key === '/') e.preventDefault();
    }, { capture: true });
    
    console.log('[router-2panel] initialized');
  }
  
  // Start when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();