/* home-parties-pills.js - Render Mon-Sat pills for Parties section */
(() => {
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
    return Array.from({length:6}, (_,i) => {
      const d = new Date(Date.UTC(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate()+i));
      return {
        iso: iso10(d),
        label: ['Mon','Tue','Wed','Thu','Fri','Sat'][i] + ' ' + String(d.getUTCDate()).padStart(2,'0')
      };
    });
  }
  
  async function renderPartiesPills() {
    // Only on home
    if (!location.hash.startsWith('#/home') && location.hash !== '' && location.hash !== '#') return;
    
    // Find or create parties section
    let section = document.querySelector('[data-section="parties"]');
    if (!section) return; // Let home-contract create it
    
    let container = section.querySelector('.day-pills');
    if (!container) {
      container = document.createElement('div');
      container.className = 'day-pills';
      section.appendChild(container);
    }
    
    // Get dates from API
    try {
      const r = await fetch(`/api/parties?conference=${CONF}`);
      const j = await r.json();
      const events = j?.data || j?.parties || [];
      const dates = events.map(e => parseISO(e.date || e.start || e.startsAt)).filter(Boolean);
      const anchor = dates.length ? dates.reduce((a,b) => a < b ? a : b) : new Date();
      const week = weekMonSat(anchor);
      
      // Clear and render pills
      container.innerHTML = '';
      week.forEach(day => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'day-pill';
        btn.textContent = day.label.replace(/\s+0/, ' ');
        btn.dataset.iso = day.iso;
        btn.addEventListener('click', () => {
          location.hash = `#/parties/${day.iso}`;
        });
        container.appendChild(btn);
      });
    } catch (err) {
      console.warn('[home-parties-pills] Failed to load dates:', err);
    }
  }
  
  // Run on load and hash changes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPartiesPills);
  } else {
    renderPartiesPills();
  }
  window.addEventListener('hashchange', renderPartiesPills);
})();