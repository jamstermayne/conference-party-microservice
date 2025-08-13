/**
 * Renders a set of events into the #eventsContainer element
 * Each event object must include: title, date, time, venue, price
 */
export function renderEvents(events) {
  const container = document.querySelector('#eventsContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="events-grid">
      ${events.map(event => `
        <div class="event-card">
          <div>
            <div class="event-title">${event.title}</div>
            <div class="event-tags">
              <span class="event-tag">${event.date}</span>
              <span class="event-tag">${event.time}</span>
              <span class="event-tag">${event.venue}</span>
              <span class="event-tag">${event.price}</span>
            </div>
          </div>
          <div class="event-actions">
            <button class="event-btn" onclick="saveEvent('${event.id}')">Save</button>
            <button class="event-btn" onclick="syncEvent('${event.id}')">Sync</button>
            <button class="event-btn" onclick="shareEvent('${event.id}')">Share</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Example button handlers (can be replaced by real logic)
window.saveEvent = (id) => console.log(`Save event ${id}`);
window.syncEvent = (id) => console.log(`Sync event ${id}`);
window.shareEvent = (id) => console.log(`Share event ${id}`);