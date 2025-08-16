/* Enforce the Home contract: 2 sections (Parties, Map) with Mon–Sat pills (BUTTONS),
   channel grid untouched, routes wired, idempotent. */
const HOME_CONTRACT = (() => {
  const S = '[home-contract]';

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const on = (el, ev, fn, opt) => el.addEventListener(ev, fn, opt);

  // Compute Mon–Sat week from the earliest party date
  const weekFromData = async () => {
    try {
      const res = await fetch('/api/parties?conference=gamescom2025', { headers: { accept: 'application/json' } });
      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data?.data) ? data.data :
                   Array.isArray(data?.parties) ? data.parties :
                   Array.isArray(data) ? data : [];
      const dates = list
        .map(e => (e.date || e.start || e.startsAt || '').slice(0, 10))
        .filter(Boolean)
        .sort();
      const seed = dates[0] || new Date().toISOString().slice(0, 10);
      const d0 = new Date(seed + 'T00:00:00Z');
      // shift to Monday
      const day = d0.getUTCDay();               // 0..6 (Sun..Sat)
      const deltaToMon = (day === 0 ? -6 : 1 - day);
      d0.setUTCDate(d0.getUTCDate() + deltaToMon);
      // build Mon..Sat (6 days)
      const fmt = (d) => d.toISOString().slice(0, 10);
      const names = ['Mon','Tue','Wed','Thu','Fri','Sat'];
      const out = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(d0);
        d.setUTCDate(d0.getUTCDate() + i);
        out.push({ iso: fmt(d), label: `${names[i]} ${String(d.getUTCDate()).padStart(2, '0')}` });
      }
      return out;
    } catch {
      // Fallback: current week Mon–Sat
      const now = new Date();
      const day = now.getUTCDay();
      const deltaToMon = (day === 0 ? -6 : 1 - day);
      now.setUTCDate(now.getUTCDate() + deltaToMon);
      const names = ['Mon','Tue','Wed','Thu','Fri','Sat'];
      const pad = (n) => String(n).padStart(2, '0');
      const fmt = (d) => d.toISOString().slice(0, 10);
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now);
        d.setUTCDate(now.getUTCDate() + i);
        return { iso: fmt(d), label: `${names[i]} ${pad(d.getUTCDate())}` };
      });
    }
  };

  const ensureApp = () => {
    let app = qs('#app') || qs('main#app') || qs('[data-app]');
    if (!app) {
      app = document.createElement('main');
      app.id = 'app';
      document.body.appendChild(app);
    }
    return app;
  };

  const section = (name) => {
    // remove any duplicates first
    qsa(`.home-section[data-section="${name}"]`).forEach((n, i) => i > 0 && n.remove());
    let sec = qs(`.home-section[data-section="${name}"]`);
    if (!sec) {
      sec = document.createElement('section');
      sec.className = 'home-section';
      sec.setAttribute('data-section', name);
      sec.innerHTML = `
        <h2>${name === 'parties' ? 'Parties' : 'Map'}</h2>
        <div class="day-pills"></div>
      `;
    } else {
      const pills = qs('.day-pills', sec) || sec.appendChild(Object.assign(document.createElement('div'), { className: 'day-pills' }));
      pills.innerHTML = '';
    }
    return sec;
  };

  const renderPills = (sec, days, dest) => {
    const wrap = qs('.day-pills', sec);
    wrap.innerHTML = '';
    days.forEach((d, idx) => {
      const b = document.createElement('button');
      b.className = 'day-pill';
      b.type = 'button';
      b.textContent = d.label.replace(/\s+0/, ' ');
      b.setAttribute('aria-pressed', idx === 0 ? 'true' : 'false');
      on(b, 'click', () => { location.hash = `#/${dest}/${d.iso}`; }, { passive: true });
      wrap.appendChild(b);
    });
  };

  const ensureMapSubnav = async () => {
    const vis = /^#\/map(\/|$)/.test(location.hash);
    
    if (!vis) {
      // Hide subnav if not on map
      const sn = qs('.v-day-subnav');
      if (sn) sn.style.display = 'none';
      return;
    }
    
    // On map route - ensure subnav exists with Mon-Sat pills
    let sn = qs('.v-day-subnav');
    if (!sn) {
      sn = document.createElement('nav');
      sn.className = 'v-day-subnav';
      const app = ensureApp();
      app.prepend(sn);
    }
    
    // Populate with Mon-Sat pills if empty
    if (sn.children.length === 0) {
      const days = await weekFromData();
      days.forEach(d => {
        const b = document.createElement('button');
        b.className = 'day-pill';
        b.type = 'button';
        b.textContent = d.label.replace(/\s+0/, ' ');
        b.dataset.route = `#/map/${d.iso}`;
        b.setAttribute('aria-pressed', location.hash.includes(d.iso) ? 'true' : 'false');
        on(b, 'click', () => { location.hash = `#/map/${d.iso}`; }, { passive: true });
        sn.appendChild(b);
      });
    }
    
    sn.style.display = '';
  };

  const mount = async () => {
    const app = ensureApp();

    // Remove ALL existing home sections to start fresh
    qsa('.home-section').forEach(n => n.remove());
    
    // Also remove any loose pill containers
    qsa('.pill-row, .day-pills').forEach(n => {
      if (!n.closest('.home-section')) n.remove();
    });

    // Build or reuse sections
    const partiesSec = section('parties');
    const mapSec = section('map');

    // Compute week + render buttons
    const days = await weekFromData();
    renderPills(partiesSec, days, 'parties');
    renderPills(mapSec, days, 'map');

    // Insert sections at top of #app, Parties first then Map
    const first = app.firstElementChild;
    if (!partiesSec.isConnected) app.insertBefore(partiesSec, first || null);
    if (!mapSec.isConnected) app.insertBefore(mapSec, partiesSec.nextSibling);

    // Ensure map subnav if needed
    await ensureMapSubnav();
  };

  const init = () => {
    // Only enforce on /#/home re-entry too
    const ensure = () => {
      const atHome = /^#\/home$|^#$|^$/.test(location.hash);
      if (atHome) {
        // Add a delay to ensure we run after other scripts
        setTimeout(() => mount(), 250);
      }
      ensureMapSubnav();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ensure, { once: true });
    } else {
      ensure();
    }
    window.addEventListener('hashchange', ensure);
  };

  // Fire
  init();
  console.log(`${S} ready`);
  return { mount };
})();
export default HOME_CONTRACT;