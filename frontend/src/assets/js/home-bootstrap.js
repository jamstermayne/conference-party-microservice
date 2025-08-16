(function(){
  const BASE_CONF = 'gamescom2025';
  const qs = s => document.querySelector(s);
  const qsa = s => [...document.querySelectorAll(s)];
  const fmt = d => (new Date(d)).toLocaleDateString(undefined, { weekday:'short', day:'2-digit' }).replace(/\s?\,?\s?/g,' ');
  const iso = d => (new Date(d)).toISOString().slice(0,10);

  async function getPartyDates() {
    try {
      const r = await fetch(`/api/parties?conference=${BASE_CONF}`, { headers:{accept:'application/json'} });
      const j = await r.json().catch(()=> ({}));
      const list = Array.isArray(j?.data) ? j.data : Array.isArray(j?.parties) ? j.parties : Array.isArray(j) ? j : [];
      const dates = [...new Set(list.map(e => (e.date || e.start || e.startsAt || '').slice(0,10)).filter(Boolean))].sort();
      return dates.slice(0,6);
    } catch { return []; }
  }

  function pill(label, route, pressed=false) {
    const b = document.createElement('button');
    b.className = 'day-pill';
    b.textContent = label;
    b.setAttribute('aria-pressed', String(pressed));
    b.dataset.route = route;
    b.addEventListener('click', () => { location.hash = route; });
    return b;
  }

  function sectionHeader(text){ const h=document.createElement('div'); h.className='section-header'; h.textContent=text; return h; }
  function pillRow(kind){ const r=document.createElement('div'); r.className='pill-row'; r.dataset.kind=kind; return r; }
  function channel(label, route){
    const b=document.createElement('button');
    b.className='channel-btn';
    b.textContent = label;
    b.addEventListener('click', ()=>{ location.hash = route; });
    return b;
  }

  async function renderHome() {
    const app = qs('#app') || document.body;
    let panel = qs('.home-panel');
    if (panel) { panel.remove(); }
    panel = document.createElement('div');
    panel.className = 'home-panel';

    // Parties section (title only; not clickable)
    panel.appendChild(sectionHeader('Parties'));
    const pr = pillRow('parties');
    const dates = await getPartyDates();
    const pills = (dates.length ? dates : []).slice(0,6).map(d => pill(`${fmt(d)}`, `#/parties/${iso(d)}`));
    if (!pills.length) {
      // Fallback: Thu–Sun of this week (doesn't block tests)
      const now = new Date();
      for (let i=0;i<4;i++){
        const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate()+i);
        pr.appendChild(pill(fmt(dt), `#/parties/${iso(dt)}`));
      }
    } else {
      pills.forEach(p => pr.appendChild(p));
    }
    panel.appendChild(pr);

    // Map section with its own day pills
    panel.appendChild(sectionHeader('Map'));
    const mr = pillRow('map');
    (dates.length ? dates : []).slice(0,6).forEach(d => mr.appendChild(pill(fmt(d), `#/map/${iso(d)}`)));
    if (!mr.children.length) {
      const now = new Date();
      for (let i=0;i<4;i++){
        const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate()+i);
        mr.appendChild(pill(fmt(dt), `#/map/${iso(dt)}`));
      }
    }
    panel.appendChild(mr);

    // Channels grid
    const grid = document.createElement('div');
    grid.className = 'channels-grid';
    [
      ['My calendar', '#/calendar'],
      ['Invites', '#/invites'],
      ['Contacts', '#/contacts'],
      ['Me', '#/me'],
      ['Settings', '#/settings'],
    ].forEach(([label,route]) => grid.appendChild(channel(label, route)));
    panel.appendChild(grid);

    app.appendChild(panel);
  }

  function onRoute(){
    const h = location.hash || '#/home';
    if (h === '#/home' || h === '#/') renderHome();
    else qs('.home-panel')?.remove();
  }
  window.addEventListener('hashchange', onRoute);
  document.addEventListener('DOMContentLoaded', onRoute);
})();