/**
 * party-card.js - Reusable party card component
 * Build: b012
 */

export function createPartyCard(event) {
  const card = document.createElement('article');
  card.className = 'card party-card';
  card.dataset.id = event.id;
  
  // Header with title and badges
  const header = document.createElement('div');
  header.className = 'party-card__header';
  
  const title = document.createElement('h3');
  title.className = 'party-card__title';
  title.textContent = event.title || 'Untitled Event';
  
  const badges = document.createElement('div');
  badges.className = 'party-card__badges';
  
  // Price/Free badge
  if (event.price) {
    const priceBadge = document.createElement('span');
    priceBadge.className = 'badge badge--price';
    priceBadge.textContent = event.price.startsWith('From') ? event.price : `From ${event.price}`;
    badges.appendChild(priceBadge);
  } else if (event.free) {
    const freeBadge = document.createElement('span');
    freeBadge.className = 'badge badge--free';
    freeBadge.textContent = 'Free';
    badges.appendChild(freeBadge);
  }
  
  // Live badge
  if (event.live) {
    const liveBadge = document.createElement('span');
    liveBadge.className = 'badge badge--live';
    liveBadge.textContent = '● Live';
    badges.appendChild(liveBadge);
  }
  
  header.appendChild(title);
  header.appendChild(badges);
  
  // Meta information
  const meta = document.createElement('div');
  meta.className = 'party-card__meta';
  
  // Date/Time row
  if (event.date || event.time) {
    const dateRow = document.createElement('div');
    dateRow.className = 'party-card__meta-row';
    dateRow.innerHTML = `
      <span class="party-card__icon">📅</span>
      <span>${event.date || ''} ${event.time ? `— ${event.time}` : ''}</span>
    `;
    meta.appendChild(dateRow);
  }
  
  // Venue row
  if (event.venue) {
    const venueRow = document.createElement('div');
    venueRow.className = 'party-card__meta-row';
    venueRow.innerHTML = `
      <span class="party-card__icon">📍</span>
      <span>${event.venue}</span>
    `;
    meta.appendChild(venueRow);
  }
  
  // Actions
  const actions = document.createElement('div');
  actions.className = 'party-card__actions';
  
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Save & Sync';
  saveBtn.onclick = () => handleSave(event);
  
  const detailsBtn = document.createElement('button');
  detailsBtn.className = 'btn btn-secondary';
  detailsBtn.textContent = 'Details';
  detailsBtn.onclick = () => handleDetails(event);
  
  actions.appendChild(saveBtn);
  actions.appendChild(detailsBtn);
  
  // Assemble card
  card.appendChild(header);
  card.appendChild(meta);
  card.appendChild(actions);
  
  return card;
}

function handleSave(event) {
  console.log('[Save & Sync]', event.id);
  // TODO: Implement calendar sync
  
  // Visual feedback
  const btn = document.querySelector(`[data-id="${event.id}"] .btn-primary`);
  if (btn) {
    const originalText = btn.textContent;
    btn.textContent = '✓ Saved';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 2000);
  }
}

function handleDetails(event) {
  console.log('[Details]', event.id);
  // TODO: Navigate to details view or show modal
}

export default { createPartyCard };