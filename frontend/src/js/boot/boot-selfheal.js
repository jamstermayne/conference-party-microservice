(() => {
  const once = (fn) => { let ran=false; return (...a)=>ran?null:(ran=true,fn(...a)); };
  const onReady = (cb) => (document.readyState === 'loading')
      ? document.addEventListener('DOMContentLoaded', cb, {once:true})
      : cb();

  const ensureCssOrder = () => {
    const head = document.head;
    const links = [...document.querySelectorAll('link[rel=stylesheet]')];
    const hasHome = links.some(l => /\/home\.css(\?|$)/.test(l.href));
    const hasCards = links.some(l => /\/cards-final\.css(\?|$)/.test(l.href));
    const homeHref  = '/assets/css/home.css';
    const cardsHref = '/assets/css/cards-final.css';

    const attach = (href) => {
      let l = [...document.querySelectorAll('link[rel=stylesheet]')].find(x => x.href.includes(href));
      if (!l) {
        l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href + '?v=b033';
        head.appendChild(l);
      }
      return l;
    };

    const home  = hasHome  ? [...links].find(l => /\/home\.css(\?|$)/.test(l.href))  : attach(homeHref);
    const cards = hasCards ? [...links].find(l => /\/cards-final\.css(\?|$)/.test(l.href)) : attach(cardsHref);

    // enforce order: home before cards-final
    if (home && cards && home.compareDocumentPosition(cards) & Node.DOCUMENT_POSITION_FOLLOWING) {
      head.insertBefore(cards, home.nextSibling);
    }
  };

  const h = (s) => String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));

  const injectHome = async () => {
    let home = document.querySelector('.home-panel');
    if (!home) {
      home = document.createElement('section');
      home.className = 'home-panel';
      home.innerHTML = `
        <h2>Home</h2>
        <div class="day-pills" role="group" aria-label="Days"></div>
        <div class="channel-grid"></div>
      `;
      (document.getElementById('app') || document.body).appendChild(home);
    }

    // pull unique YYYY-MM-DD from API (fallback to next 4 days if API fails)
    let isoDays = [];
    try {
      const r = await fetch('/api/parties?conference=gamescom2025', { headers:{accept:'application/json'} });
      const j = await r.json();
      const list = Array.isArray(j?.data) ? j.data : Array.isArray(j?.parties) ? j.parties : Array.isArray(j) ? j : [];
      const uniq = new Set(list.map(e => (e.start||e.startsAt||e.date||'').slice(0,10)).filter(Boolean));
      isoDays = [...uniq].sort().slice(0, 6);
    } catch {}
    if (isoDays.length === 0) {
      const d0 = new Date(); d0.setHours(0,0,0,0);
      for (let i=0;i<4;i++){ const d=new Date(d0); d.setDate(d0.getDate()+i); isoDays.push(d.toISOString().slice(0,10)); }
    }

    const dayPills = home.querySelector('.day-pills');
    dayPills.innerHTML = isoDays.map((iso,i) => {
      const dt = new Date(iso+'T00:00:00Z');
      const lab = dt.toLocaleDateString(undefined, { weekday:'short', day:'2-digit' });
      return `<button class="day-pill" aria-pressed="${i===0?'true':'false'}" data-route="#/map/${iso}">${h(lab)}</button>`;
    }).join('');

    const channels = [
      ['Map',       '#/map'],
      ['My calendar', '#/calendar'],
      ['Invites',   '#/invites'],
      ['Contacts',  '#/contacts'],
      ['Me',        '#/me'],
      ['Settings',  '#/settings'],
    ];
    const grid = home.querySelector('.channel-grid');
    grid.innerHTML = channels.map(([txt,route]) => `<button class="channel-btn" data-route="${route}">${h(txt)}</button>`).join('');

    // nav wiring (no router replacement; just set hash)
    document.addEventListener('click', (e) => {
      const pill = e.target.closest('.day-pill');
      if (pill) {
        [...dayPills.querySelectorAll('.day-pill')].forEach(b => b.setAttribute('aria-pressed','false'));
        pill.setAttribute('aria-pressed','true');
        location.hash = pill.dataset.route;
      }
      const ch = e.target.closest('.channel-btn');
      if (ch) location.hash = ch.dataset.route;
    }, {capture:false});
  };

  onReady(once(() => {
    ensureCssOrder();
    injectHome();
  }));
})();