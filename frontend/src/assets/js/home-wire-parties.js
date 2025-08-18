// home-wire-parties.js - Wire parties pills with live API
import { showOverlay } from './overlay-panel.js';

// Generate .ics file for calendar download
function generateICS(event) {
  const start = new Date(event.date || event.start || event.startsAt || new Date());
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2 hours default
  
  const formatDate = (d) => {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Conference Party App//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@conference-party-app.web.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${event.title || 'Event'}`,
    `LOCATION:${event.venue || ''}`,
    `DESCRIPTION:${event.description || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(event.title || 'event').replace(/\s+/g, '-').toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// Create party card
function createCard(party) {
  const card = document.createElement('div');
  card.style.cssText = `
    padding: var(--s-4);
    border: 1px solid var(--border-primary, #e0e0e0);
    border-radius: var(--r-2);
    margin-bottom: var(--s-3);
  `;
  
  const title = document.createElement('h3');
  title.textContent = party.title || 'Untitled';
  title.style.cssText = 'margin: 0 0 var(--s-2) 0; font-size: 1.125rem;';
  
  const meta = document.createElement('div');
  meta.style.cssText = 'color: var(--text-secondary, #666); margin-bottom: var(--s-3);';
  meta.innerHTML = `
    ${party.venue ? `<div>${party.venue}</div>` : ''}
    ${party.time ? `<div>${party.time}</div>` : ''}
  `;
  
  const btn = document.createElement('button');
  btn.textContent = 'Add to calendar';
  btn.style.cssText = `
    background: var(--bg-interactive, #007bff);
    color: white;
    border: none;
    padding: var(--s-2) var(--s-3);
    border-radius: var(--r-1);
    cursor: pointer;
  `;
  btn.addEventListener('click', () => generateICS(party));
  
  card.appendChild(title);
  if (party.venue || party.time) card.appendChild(meta);
  card.appendChild(btn);
  
  return card;
}

// Fetch and render parties
async function loadParties(date) {
  const body = showOverlay(`Parties — ${date}`);
  
  try {
    const response = await fetch('/api/parties?conference=gamescom2025');
    const data = await response.json();
    const parties = Array.isArray(data) ? data : (data.data || data.parties || []);
    
    // Filter by date
    const filtered = parties.filter(p => {
      const pDate = (p.date || p.start || p.startsAt || '').slice(0, 10);
      return pDate === date;
    });
    
    if (filtered.length === 0) {
      body.innerHTML = `<div style="color: var(--text-muted, #999); text-align: center; padding: var(--s-8);">
        No parties found for ${date}.
      </div>`;
      return;
    }
    
    // Simple lazy render (can be optimized with IntersectionObserver)
    const container = document.createElement('div');
    filtered.forEach(party => {
      container.appendChild(createCard(party));
    });
    body.appendChild(container);
    
  } catch (err) {
    body.innerHTML = `<div style="color: var(--text-error, #f00); padding: var(--s-4);">
      Failed to load parties. Please try again.
    </div>`;
  }
}

// Wire up party pills
document.addEventListener('click', (e) => {
  const pill = e.target.closest('.home-section[data-section="parties"] .day-pill');
  if (!pill) return;
  
  e.preventDefault();
  const date = pill.dataset.iso;
  if (date) loadParties(date);
});