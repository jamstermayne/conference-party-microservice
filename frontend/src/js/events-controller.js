/**
 * Events Controller
 * Handles party/hotspot/calendar rendering
 * Accepts data from API and renders into cards
 */
import { fetchEvents } from '/assets/js/api.js';
import { saveEvent, syncEvent } from '/assets/js/save-sync.js';

export async function initEventsController(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`initEventsController: No container with id ${containerId}`);
    return;
  }

  try {
    const events = await fetchEvents();
    container.innerHTML = events.map(event => renderEventCard(event)).join('');
    container.querySelectorAll('.save-sync').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.target.dataset.id;
        saveEvent(id);
        syncEvent(id);
      });
    });
  } catch (err) {
    console.error('Error loading events:', err);
    container.innerHTML = `<div class="error">Unable to load events. Please try again later.</div>`;
  }
}

function renderEventCard(event) {
  return `
    <div class="party-card">
      <h3>${event.name}</h3>
      <p>${event.description || ''}</p>
      <button class="save-sync" data-id="${event.id}">Save & Sync</button>
    </div>
  `;
}