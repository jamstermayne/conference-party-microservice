(function(){
  const qs = s => document.querySelector(s);
  const qsa = s => [...document.querySelectorAll(s)];

  function ensureSubnav(dates){
    let sub = qs('.v-day-subnav');
    if (!sub){
      sub = document.createElement('nav');
      sub.className = 'v-day-subnav';
      const host = qs('#app') || document.body;
      host.prepend(sub);
    }
    sub.innerHTML = '';
    dates.forEach(d => {
      const b = document.createElement('button');
      b.className = 'day-pill';
      b.textContent = (new Date(d)).toLocaleDateString(undefined, { weekday:'short', day:'2-digit' }).replace(/\s?\,?\s?/g,' ');
      b.dataset.route = `#/map/${d}`;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => location.hash = b.dataset.route);
      sub.appendChild(b);
    });
    return sub;
  }

  async function dedupeDates(){
    try {
      const r = await fetch('/api/parties?conference=gamescom2025', { headers:{accept:'application/json'} });
      const j = await r.json().catch(()=> ({}));
      const list = Array.isArray(j?.data) ? j.data : Array.isArray(j?.parties) ? j.parties : Array.isArray(j) ? j : [];
      return [...new Set(list.map(e => (e.date||e.start||'').slice(0,10)).filter(Boolean))].sort().slice(0,6);
    } catch { return []; }
  }

  async function onRoute(){
    const h = location.hash || '#/home';
    const onMap = /^#\/map(\/|$)/.test(h);
    const sub = qs('.v-day-subnav');

    if (!onMap){ sub?.remove(); return; }

    const dates = (await dedupeDates());
    const nav = ensureSubnav(dates.length ? dates : [new Date().toISOString().slice(0,10)]);
    // pressed state
    const m = /^#\/map\/(\d{4}-\d{2}-\d{2})/.exec(h);
    const target = m ? m[1] : null;
    qsa('.v-day-subnav .day-pill').forEach(b => {
      b.setAttribute('aria-pressed', String(!!(target && b.dataset.route.endsWith(target))));
    });
  }

  window.addEventListener('hashchange', onRoute);
  document.addEventListener('DOMContentLoaded', onRoute);
})();