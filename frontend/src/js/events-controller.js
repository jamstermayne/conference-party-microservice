import Events from '/assets/js/events.js';

const API = '/api/parties?conference=gamescom2025';

function el(tag, cls, html){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(html!=null) n.innerHTML = html;
  return n;
}

function card(event){
  const c = el('article', 'card');
  const price = event.price ? `<span class="badge">${event.price}</span>` : '';
  c.innerHTML = `
    <div class="card-header">
      <div class="card-title">${event.title || event['Event Name'] || 'Untitled'}</div>
      <div class="badges">
        ${price}
        <span class="badge ok">live</span>
      </div>
    </div>
    <div class="card-body">
      <div class="card-row">📍 ${event.venue || event['Location'] || 'TBA'}</div>
      <div class="card-row">🗓️ ${event.date || event['Date'] || ''} ${event.time ? '— '+event.time : ''}</div>
      ${event.hosts ? `<div class="card-row">🎙️ ${event.hosts}</div>` : ''}
    </div>
    <div class="card-actions">
      <button class="btn btn-primary" data-action="save-sync">Save & Sync</button>
      <button class="btn btn-outline" data-action="details">Details</button>
    </div>
  `;
  c.querySelector('[data-action="save-sync"]').addEventListener('click', ()=>{
    Events.emit?.('calendar:add', { event });
  }, {passive:true});
  return c;
}

async function fetchEvents(){
  try{
    const resp = await fetch(API);
    if(!resp.ok) return [];
    const json = await resp.json().catch(()=>({data:[]}));
    return json.data || [];
  }catch{ return []; }
}

export async function renderParties(root){
  // Guard against undefined root
  if(!root) {
    console.warn('[events-controller] renderParties called with undefined root');
    return;
  }
  const wrap = el('section','section-card');
  wrap.appendChild(el('div','left-accent'));
  const body = el('div','section-body');
  const header = el('div','header-row');
  header.innerHTML = `
    <div class="header-title">Recommended events</div>
    <div class="header-meta muted">Scroll to explore</div>
  `;
  body.appendChild(header);

  const grid = el('div','grid grid-3');
  body.appendChild(grid);
  wrap.appendChild(body);
  root.appendChild(wrap);

  // skeletons
  for(let i=0;i<6;i++){ const s=el('div','skeleton'); s.style.height='160px'; grid.appendChild(s); }

  const items = await fetchEvents();
  grid.innerHTML = '';
  if(!items.length){
    const empty = el('div','muted','No events yet.');
    empty.style.padding='24px';
    grid.appendChild(empty);
    return;
  }
  items.forEach(ev=> grid.appendChild(card(ev)));
}