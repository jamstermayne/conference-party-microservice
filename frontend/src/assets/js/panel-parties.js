// panel-parties.js
import { loadParties } from './parties-index.js';

const panelHTML = (title) => `
  <section class="panel panel--active" data-panel="parties" aria-label="${title}">
    <header class="panel__header">
      <button class="btn-back" data-action="back" aria-label="Back">← Back</button>
      <h1>${title}</h1>
    </header>
    <div class="panel__body"><div class="list" id="parties-list"></div></div>
  </section>`;

function card(e) {
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML = `
    <div class="card__title">${e.title ?? 'Untitled'}</div>
    <div class="card__meta">${e.venue ?? ''} <span>${e.time ?? ''}</span></div>
    <div class="card__actions">
      <button class="btn-ghost btn-add-to-calendar">Add to calendar</button>
    </div>`;
  return el;
}

export async function mountPartiesPanel(iso) {
  document.querySelector('.panel.panel--active')?.remove();
  const host = document.getElementById('app') || document.body;
  host.insertAdjacentHTML('beforeend', panelHTML(`Parties — ${iso}`));
  const out = document.getElementById('parties-list');

  const { byDate } = await loadParties();
  const items = (byDate[iso] || []).slice().sort((a,b) => (a.time||'').localeCompare(b.time||''));

  // simple endless: chunked render
  let i = 0, CHUNK = 20;
  const renderMore = () => {
    const slice = items.slice(i, i+CHUNK);
    slice.forEach(p => out.appendChild(card(p)));
    i += slice.length;
    return i < items.length;
  };
  renderMore();

  const io = new IntersectionObserver((entries)=>{
    if (entries.some(e=>e.isIntersecting) && renderMore() === false) io.disconnect();
  });
  const sentinel = document.createElement('div'); sentinel.style.height = '1px';
  out.appendChild(sentinel); io.observe(sentinel);

  host.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="back"]')) {
      e.preventDefault(); history.back(); return;
    }
  }, { passive: false });
}