import { jsonGET } from '../utils/json-fetch.js';

export async function openParties(dayISO, activator) {
  const wrap = document.createElement('div');
  const grid = document.createElement('div');
  grid.className = 'card-grid';
  wrap.appendChild(grid);

  // Endless scroll
  let cursor = '';
  async function load() {
    const params = new URLSearchParams({ conference: 'gamescom2025' });
    if (dayISO) params.set('day', dayISO);
    if (cursor) params.set('after', cursor);
    const json = await jsonGET(`/api/parties?${params}`);
    (json.data || json.parties || []).forEach(p => grid.appendChild(renderParty(p)));
    cursor = json.page?.nextCursor || '';
    observer.observe(sentinel);
  }

  function renderParty(p) {
    const card = document.createElement('article');
    card.className = 'vcard';
    card.innerHTML = `
      <div class="vcard__body">
        <h2 class="vcard__title">${p.title || 'Untitled'}</h2>
        <div class="muted">${p.venue || ''} • ${fmtTime(p)}</div>
        <p class="vcard__desc">${p.description || ''}</p>
      </div>
      <footer class="vcard__footer">
        <button class="primary">Add to calendar</button>
        <button class="ghost">Details</button>
      </footer>
    `;
    card.querySelector('.primary').addEventListener('click', () => addToCalendar(p));
    return card;
  }

  async function addToCalendar(p) {
    const res = await fetch('/api/googleCalendar/create', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ event: p })
    });
    if (!res.ok) alert('Connect your calendar first.');
  }

  function fmtTime(p){
    try {
      const start = new Date(p.start || p.startTime);
      const end = new Date(p.end || p.endTime);
      const fmt = (d)=> d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      return `${fmt(start)}–${fmt(end)}`;
    } catch { return ''; }
  }

  const sentinel = document.createElement('div');
  sentinel.style.blockSize = '1px';
  wrap.appendChild(sentinel);

  const observer = new IntersectionObserver(entries => {
    if (entries.some(e=>e.isIntersecting)) {
      observer.unobserve(sentinel);
      if (cursor !== null) load();
    }
  });

  await load();
  Stack.push(`day-${dayISO}`, { title: new Date(dayISO).toLocaleDateString(undefined,{weekday:'long', day:'2-digit', month:'short'}), content: wrap }, activator);
}