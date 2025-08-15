// mount-parties.js - Mount parties for a specific day
import { jsonGET } from '../utils/json-fetch.js';

export async function mountPartiesDay(container, date) {
  container.innerHTML = '<div class="loading">Loading parties...</div>';
  
  try {
    const params = new URLSearchParams({ conference: 'gamescom2025', day: date });
    const data = await jsonGET(`/api/parties?${params}`);
    const parties = data.data || data.parties || [];
    
    if (parties.length === 0) {
      container.innerHTML = '<p class="empty-state">No parties on this day</p>';
      return;
    }
    
    // Create hero card grid
    const grid = document.createElement('div');
    grid.className = 'hero-card-grid';
    grid.innerHTML = parties.map(party => `
      <article class="hero-card">
        <div class="hero-card__body">
          <h3 class="hero-card__title">${party.name || party.title || 'Untitled'}</h3>
          <p class="hero-card__venue">${party.venue || party.location || 'TBA'}</p>
          <time class="hero-card__time">${formatTime(party)}</time>
          ${party.description ? `<p class="hero-card__desc">${party.description}</p>` : ''}
        </div>
        <footer class="hero-card__footer">
          <button class="btn btn--primary" data-party-id="${party.id}">
            Add to Calendar
          </button>
        </footer>
      </article>
    `).join('');
    
    container.innerHTML = '';
    container.appendChild(grid);
    
    // Wire up calendar buttons
    grid.querySelectorAll('[data-party-id]').forEach(btn => {
      btn.onclick = () => openSmartCalendar(parties.find(p => p.id === btn.dataset.partyId));
    });
    
  } catch (err) {
    console.error('Failed to load parties:', err);
    container.innerHTML = '<p class="error">Failed to load parties</p>';
  }
}

function formatTime(party) {
  try {
    const start = new Date(party.start || party.startTime || party.date);
    const end = party.end || party.endTime ? new Date(party.end || party.endTime) : null;
    const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
  } catch {
    return party.time || '';
  }
}

function openSmartCalendar(party) {
  // Use existing smart calendar implementation
  if (window.SmartCalendar) {
    window.SmartCalendar.open(party);
  } else {
    // Fallback to Google Calendar
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(party.name || party.title)}&location=${encodeURIComponent(party.venue || '')}&details=${encodeURIComponent(party.description || '')}`;
    window.open(gcalUrl, '_blank');
  }
}