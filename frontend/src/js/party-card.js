export function createPartyCard(p) {
  const price = p.priceLabel || p.price || 'Free';
  const timeRange = p.start && p.end ? 
    `${new Date(p.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} – ${new Date(p.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` :
    (p.timePretty || '');
  const datePretty = p.start ? 
    new Date(p.start).toLocaleDateString([], {weekday:'short', month:'short', day:'numeric'}) :
    (p.datePretty || '');
    
  const el = document.createElement('article');
  el.className = 'vcard';
  el.dataset.id = p.id;
  el.innerHTML = `
    <header class="vcard__head">
      <h3 class="vcard__title">${p.title}</h3>
      <div class="vcard__badges">
        <span class="vcard__pill${price === 'Free' ? ' is-free' : ''}">${price}</span>
        ${p.isLive || p.live ? '<span class="vcard__pill is-live">live</span>' : ''}
      </div>
    </header>
    <ul class="vcard__meta">
      <li>📍 ${p.venue || ''}</li>
      <li>📅 ${datePretty} — ${timeRange}</li>
    </ul>
    <div class="vcard__actions">
      <button class="btn btn--primary" data-action="save-sync" data-id="${p.id}">Save & Sync</button>
      <button class="btn" data-action="details" data-id="${p.id}">Details</button>
    </div>
  `;
  return el;
}