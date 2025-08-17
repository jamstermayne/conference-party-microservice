(function(){
  const CONF = 'gamescom2025';
  const qs = s => document.querySelector(s);

  function card(evt){
    const d = document.createElement('article');
    d.className = 'card-modern card-modern--event';
    
    const dateObj = evt.date ? new Date(evt.date) : null;
    const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }) : '';
    const timeStr = evt.time || '';
    const venue = evt.venue || '';
    
    d.innerHTML = `
      <header class="card-modern__header">
        <div class="card-modern__eyebrow">
          <span>${dateStr}</span>
          ${timeStr ? `<span>•</span><span>${timeStr}</span>` : ''}
        </div>
        <h3 class="card-modern__title">${(evt.title||evt.name||'Party')}</h3>
        ${venue ? `<p class="card-modern__subtitle">${venue}</p>` : ''}
      </header>
      
      ${evt.description ? `
        <div class="card-modern__body">
          <p class="card-modern__description">${evt.description}</p>
        </div>
      ` : ''}
      
      <footer class="card-modern__footer">
        <button class="card-modern__action card-modern__action--primary" data-action="view-details">
          View Details
        </button>
        <button class="card-modern__action card-modern__action--secondary" data-action="save">
          Save
        </button>
      </footer>
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
    grid.className = 'card-modern-grid';
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