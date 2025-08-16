/**
 * home-pills-fix.js
 * Ensures Home panel renders two sections:
 *   Parties — Mon..Sat pills → #/parties/YYYY-MM-DD
 *   Map     — Mon..Sat pills → #/map/YYYY-MM-DD
 * Data source: /api/parties?conference=gamescom2025 (fallback = current week)
 * No inline styles, uses existing .day-pill styles, idempotent.
 */
(function(){
  const CONF = 'gamescom2025';

  // --- utils
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => [...r.querySelectorAll(s)];
  const todayISO = () => new Date().toISOString().slice(0,10);

  const toISO = (d) => {
    const pad = (n)=> String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  };
  const fromISO = (s) => {
    const [y,m,d] = s.split('-').map(Number);
    return new Date(y, m-1, d);
  };
  const startOfISOWeek = (date) => {
    const d = new Date(date);
    const day = (d.getDay() || 7); // Mon=1..Sun=7
    if (day > 1) d.setDate(d.getDate() - (day - 1));
    return d;
  };
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const labelFor = (d) => {
    return d.toLocaleDateString(undefined, { weekday:'short', day:'2-digit' })
      .replace(',', ''); // e.g., "Mon 18"
  };

  // Pick Monday..Saturday for the "best" week in data (else current week)
  function pickWeekDates(uniqueISO){
    if (uniqueISO.size) {
      const sorted = [...uniqueISO].sort();
      const min = fromISO(sorted[0]);
      const startMon = startOfISOWeek(min);
      return Array.from({length:6}, (_,i)=> toISO(addDays(startMon,i))); // Mon..Sat
    } else {
      const startMon = startOfISOWeek(new Date());
      return Array.from({length:6}, (_,i)=> toISO(addDays(startMon,i)));
    }
  }

  async function fetchPartyDates(){
    try {
      const res = await fetch(`/api/parties?conference=${encodeURIComponent(CONF)}`, {
        headers: { accept: 'application/json' },
        credentials: 'include'
      });
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('application/json')) return new Set();
      const json = await res.json();
      const arr = Array.isArray(json?.data) ? json.data :
                  Array.isArray(json?.parties) ? json.parties :
                  Array.isArray(json) ? json : [];
      const dates = new Set();
      for (const e of arr) {
        const iso = String(e.date || e.start || e.startsAt || '').slice(0,10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) dates.add(iso);
      }
      return dates;
    } catch {
      return new Set();
    }
  }

  function ensureHomeShell(){
    const app = qs('#app') || document.body;
    let home = qs('.home-panel', app);
    if (!home) {
      home = document.createElement('div');
      home.className = 'home-panel';
      app.appendChild(home);
    }
    // Section helper
    const ensureSection = (kind, titleText) => {
      let sec = qs(`.home-section[data-kind="${kind}"]`, home);
      if (!sec) {
        sec = document.createElement('section');
        sec.className = 'home-section';
        sec.dataset.kind = kind;
        const h = document.createElement('h2');
        h.className = 'section-title';
        h.textContent = titleText;
        const pills = document.createElement('div');
        pills.className = 'day-pills';
        sec.append(h, pills);
        home.appendChild(sec);
      }
      return sec;
    };
    return { home, ensureSection };
  }

  function renderPills(pillsEl, baseRoute, isoList){
    // Keep exactly Mon..Sat (6 buttons). Replace content idempotently.
    const desired = isoList.slice(0,6);
    const current = qsa('button.day-pill', pillsEl).map(b => b.dataset.iso);
    const same = desired.length===current.length && desired.every((d,i)=>d===current[i]);
    if (!same) {
      pillsEl.textContent = '';
      desired.forEach(iso => {
        const b = document.createElement('button');
        b.className = 'day-pill';
        b.type = 'button';
        b.dataset.iso = iso;
        b.dataset.href = `${baseRoute}/${iso}`;
        b.setAttribute('aria-pressed','false');
        b.textContent = labelFor(fromISO(iso));
        pillsEl.appendChild(b);
      });
    }
    // pressed state from hash
    const {hash} = location;
    const m = hash.match(/^#\/(map|parties)\/(\d{4}-\d{2}-\d{2})$/);
    const activeISO = m?.[2] || null;
    qsa('button.day-pill', pillsEl).forEach(btn => {
      const pressed = btn.dataset.iso === activeISO;
      btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    });
  }

  function wireClicks(home){
    // Delegated clicks for .day-pill
    home.addEventListener('click', (e) => {
      const btn = e.target.closest('button.day-pill');
      if (!btn) return;
      const href = btn.dataset.href;
      if (href) location.hash = href;
    });
  }

  async function ensurePills(){
    // Only act on #/home
    if (!/^#\/($|home)/.test(location.hash || '#/home')) return;

    const { ensureSection, home } = ensureHomeShell();
    wireClicks(home);

    const dataDates = await fetchPartyDates();
    const week = pickWeekDates(dataDates);

    const partiesSec = ensureSection('parties', 'Parties');
    const mapSec     = ensureSection('map',     'Map');

    const partiesPills = qs('.day-pills', partiesSec);
    const mapPills     = qs('.day-pills', mapSec);

    renderPills(partiesPills, '#/parties', week);
    renderPills(mapPills,     '#/map',     week);
  }

  // keep pills in sync with route
  window.addEventListener('hashchange', ensurePills);
  document.addEventListener('DOMContentLoaded', ensurePills);
  ensurePills();
})();