(function(){
  const CONF = 'gamescom2025';
  const qs = s => document.querySelector(s);

  function card(evt){
    const d = document.createElement('article');
    d.className = 'vcard';
    d.innerHTML = `
      <header class="vcard-h">
        <h3 class="title">${(evt.title||evt.name||'Party')}</h3>
        <div class="meta">${(evt.venue||'')}</div>
      </header>
      <div class="vcard-b">
        <div class="time">${(evt.start||evt.date||'').toString().slice(0,16)}</div>
      </div>
    `;
    return d;
  }

  function wrap(){ const w=document.createElement('div'); w.className='parties-panel'; return w; }

  async function render(dateIso){
    const root = qs('#app') || document.body;
    qs('.parties-panel')?.remove();
    const panel = wrap();
    root.appendChild(panel);

    let list=[];
    try {
      const r = await fetch(`/api/parties?conference=${CONF}`, { headers:{accept:'application/json'} });
      const j = await r.json().catch(()=> ({}));
      const all = Array.isArray(j?.data) ? j.data : Array.isArray(j?.parties) ? j.parties : Array.isArray(j) ? j : [];
      list = all.filter(e => (e.date||e.start||'').slice(0,10) === dateIso);
    } catch {}

    if (!list.length){
      panel.innerHTML = `<div class="empty-state">No parties for ${dateIso}</div>`;
      return;
    }
    const grid = document.createElement('section');
    grid.className = 'card-grid';
    list.forEach(e => grid.appendChild(card(e)));
    panel.appendChild(grid);
  }

  function onRoute(){
    const m = /#\/parties\/(\d{4}-\d{2}-\d{2})/.exec(location.hash||'');
    if (m) render(m[1]); else qs('.parties-panel')?.remove();
  }
  window.addEventListener('hashchange', onRoute);
  document.addEventListener('DOMContentLoaded', onRoute);
})();