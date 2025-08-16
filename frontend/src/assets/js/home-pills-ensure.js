/* home-pills-ensure.js - Ensure home pills render properly */
(() => {
  if (window.__HOME_PILLS_ENSURE__) return;
  window.__HOME_PILLS_ENSURE__ = true;

  const CONF = 'gamescom2025';
  
  // Date utilities
  const iso10 = d => d.toISOString().slice(0,10);
  const parseISO = s => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||'')); 
    return m ? new Date(Date.UTC(+m[1], +m[2]-1, +m[3])) : null;
  };
  
  // Generate Mon-Sat week from anchor date
  function weekMonSat(anchor) {
    const dow = (anchor.getUTCDay() + 6) % 7; // Mon=0..Sun=6
    const mon = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() - dow));
    return Array.from({length:6}, (_,i) => new Date(Date.UTC(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate()+i)));
  }
  
  function dayLabel(d) {
    const names = ['Mon','Tue','Wed','Thu','Fri','Sat'];
    return `${names[(d.getUTCDay()+6)%7]} ${String(d.getUTCDate()).padStart(2,'0')}`;
  }

  // Ensure home panel structure exists
  function ensureHomeStructure() {
    let app = document.querySelector('#app');
    if (!app) {
      app = document.createElement('div');
      app.id = 'app';
      document.body.appendChild(app);
    }

    let panel = document.querySelector('.home-panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'home-panel';
      panel.innerHTML = `
        <div class="channels-grid">
          <button type="button" class="channel-btn" data-channel="parties">
            <span class="channel-icon">🎉</span>
            <span class="channel-label">Parties</span>
          </button>
          <button type="button" class="channel-btn" data-channel="map">
            <span class="channel-icon">📍</span>
            <span class="channel-label">Map</span>
          </button>
          <button type="button" class="channel-btn" data-channel="calendar">
            <span class="channel-icon">📅</span>
            <span class="channel-label">Calendar</span>
          </button>
          <button type="button" class="channel-btn" data-channel="search">
            <span class="channel-icon">🔍</span>
            <span class="channel-label">Search</span>
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
      app.appendChild(panel);
      
      // Wire channel buttons
      panel.querySelectorAll('.channel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const channel = btn.dataset.channel;
          if (channel === 'parties') location.hash = '#/parties';
          else if (channel === 'map') location.hash = '#/map';
          else if (channel === 'calendar') location.hash = '#/calendar';
          else if (channel === 'search') location.hash = '#/search';
        });
      });
    }
    
    return panel;
  }

  // Render pills in container
  function renderPills(container, baseRoute, days) {
    if (!container) return;
    container.innerHTML = '';
    const activeISO = (/^#\/(?:parties|map)\/(\d{4}-\d{2}-\d{2})/.exec(location.hash||'')?.[1]) || null;
    
    days.forEach(d => {
      const iso = iso10(d);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-pill';
      btn.textContent = dayLabel(d);
      btn.dataset.iso = iso;
      if (activeISO === iso) btn.setAttribute('aria-pressed', 'true');
      btn.addEventListener('click', e => {
        e.preventDefault();
        location.hash = `${baseRoute}${iso}`;
      });
      container.appendChild(btn);
    });
  }

  // Main render function
  async function renderHomePills() {
    if (!location.hash.startsWith('#/home') && location.hash !== '' && location.hash !== '#') return;
    
    const panel = ensureHomeStructure();
    const partiesContainer = panel.querySelector('.home-section[data-section="parties"] .day-pills');
    const mapContainer = panel.querySelector('.home-section[data-section="map"] .day-pills');
    
    // Try to fetch parties data
    let dates = [];
    try {
      const r = await fetch(`/api/parties?conference=${CONF}`);
      const j = await r.json();
      const events = j?.data || j?.parties || [];
      dates = events.map(e => parseISO(e.date || e.start || e.startsAt)).filter(Boolean);
    } catch (err) {
      console.warn('[home-pills-ensure] API fetch failed:', err);
    }
    
    // Use earliest date or today as anchor
    const anchor = dates.length ? dates.reduce((a,b) => a < b ? a : b) : new Date();
    const week = weekMonSat(anchor);
    
    renderPills(partiesContainer, '#/parties/', week);
    renderPills(mapContainer, '#/map/', week);
    
    console.log('[home-pills-ensure] Rendered', week.length, 'day pills');
  }

  // Initialize on DOM ready and hash changes
  function init() {
    // Initial render
    renderHomePills();
    
    // Re-render on hash change to home
    window.addEventListener('hashchange', () => {
      if (location.hash.startsWith('#/home') || location.hash === '' || location.hash === '#') {
        renderHomePills();
      }
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once: true});
  } else {
    init();
  }
})();