export function createPartyCard(p) {
  const price = p.priceLabel || p.price || 'Free';
  const timeRange = p.start && p.end ? 
    `${new Date(p.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} – ${new Date(p.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` :
    (p.timePretty || '');
  const datePretty = p.start ? 
    new Date(p.start).toLocaleDateString([], {weekday:'short', month:'short', day:'numeric'}) :
    (p.datePretty || '');
    
  const el = document.createElement('article');
  el.className = 'party-card';
  el.dataset.id = p.id;
  el.innerHTML = `
    <h3 class="party-card__title">${p.title}</h3>
    <div class="party-card__row">📍 ${p.venue || ''}</div>
    <div class="party-card__row">📅 ${datePretty} — ${timeRange}</div>
    <div class="party-card__badges">
      <span class="badge-pill">${price}</span>
      ${p.isLive ? '<span class="badge-pill">live</span>' : ''}
    </div>
    <div class="party-card__actions">
      <button class="btn--primary" data-action="save-sync" data-id="${p.id}">Save & Sync</button>
      <button class="btn--ghost" data-action="details"   data-id="${p.id}">Details</button>
    </div>
  `;
  return el;
}