export function createPartyCard(p) {
  const price = p.price ? `From £${p.price}` : 'Free';
  return `
  <article class="party-card" data-id="${p.id}">
    <h3 class="party-card__title">${p.title}</h3>
    <div class="party-card__row">📍 ${p.venue || ''}</div>
    <div class="party-card__row">📅 ${p.datePretty || ''} — ${p.timePretty || ''}</div>
    <div class="party-card__badges">
      <span class="badge-pill">${price}</span>
      ${p.live ? '<span class="badge-pill">live</span>' : ''}
    </div>
    <div class="party-card__actions">
      <button class="btn--primary" data-action="save-sync" data-id="${p.id}">Save & Sync</button>
      <button class="btn--ghost" data-action="details"   data-id="${p.id}">Details</button>
    </div>
  </article>`;
}