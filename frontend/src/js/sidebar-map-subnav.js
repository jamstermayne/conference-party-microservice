// sidebar-map-subnav.js - Build day navigation for map and parties sections
(function mapSubnav(){
  const aside = document.querySelector('.v-sidebar');
  const mapHost = document.querySelector('.v-subnav[data-subnav="map"]');
  const partiesHost = document.querySelector('.v-subnav[data-subnav="parties"]');
  if (!aside || (!mapHost && !partiesHost)) return;

  const conf = (window.APP && APP.conference) || 'gamescom2025';

  const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const toISO = x => {
    if (!x) return null;
    const d = new Date(x);
    if (isNaN(d)) return null;
    // normalize to local day
    const local = new Date(d.getTime() - d.getTimezoneOffset()*60000);
    return local.toISOString().slice(0,10);
  };

  const fmt = iso => {
    const d = new Date(iso + 'T00:00:00');
    return `${DAY[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')} ${MON[d.getMonth()]}`;
  };

  async function fetchDays() {
    try {
      const r = await fetch(`/api/parties?conference=${encodeURIComponent(conf)}`);
      if (!r.ok) throw new Error('fetch parties failed');
      const json = await r.json();
      const rows = json.data || json.parties || json || [];
      const set = new Set();
      for (const e of rows) {
        const iso = e.date || toISO(e.start || e.startsAt || e.startTime || e.when);
        if (iso) set.add(iso);
      }
      // Sort and keep Mon–Sat only (business ask)
      const days = Array.from(set).sort();
      return days.filter(iso => {
        const g = new Date(iso + 'T00:00:00').getDay();
        return g >= 1 && g <= 6; // Mon..Sat
      });
    } catch {
      // fallback: current week Mon–Sat
      const now = new Date();
      const day = now.getDay();                  // 0..6
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day+6)%7));
      const out = [];
      for (let i=0;i<6;i++){
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        out.push(d.toISOString().slice(0,10));
      }
      return out;
    }
  }

  function render(days){
    // Render for map section
    if (mapHost) {
      mapHost.innerHTML = '';
      for (const iso of days) {
        const a = document.createElement('a');
        a.className = 'v-subnav__link';
        a.href = `#/map/${iso}`;
        a.dataset.route = `#/map/${iso}`;
        a.textContent = fmt(iso);
        mapHost.appendChild(a);
      }
    }
    
    // Render for parties section
    if (partiesHost) {
      partiesHost.innerHTML = '';
      for (const iso of days) {
        const a = document.createElement('a');
        a.className = 'v-subnav__link';
        a.href = `#/parties/${iso}`;
        a.dataset.route = `#/parties/${iso}`;
        a.textContent = fmt(iso);
        partiesHost.appendChild(a);
      }
    }
  }

  function syncActive(){
    const h = location.hash;
    const isMap = h.startsWith('#/map');
    const isParties = h.startsWith('#/parties') || h === '#' || h === '';
    
    // Show subnav for map or parties routes
    aside.classList.toggle('v-show-subnav', isMap || isParties);

    // Sync active state for map subnav
    if (mapHost) {
      const mapLinks = mapHost.querySelectorAll('.v-subnav__link');
      mapLinks.forEach(a => a.classList.toggle('is-active', h.startsWith(a.getAttribute('href'))));
    }
    
    // Sync active state for parties subnav
    if (partiesHost) {
      const partiesLinks = partiesHost.querySelectorAll('.v-subnav__link');
      partiesLinks.forEach(a => a.classList.toggle('is-active', h.startsWith(a.getAttribute('href'))));
    }
  }

  window.addEventListener('hashchange', syncActive);
  document.addEventListener('DOMContentLoaded', syncActive);

  fetchDays().then(render).then(syncActive);
})();