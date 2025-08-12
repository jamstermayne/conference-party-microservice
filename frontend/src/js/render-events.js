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
            <button class="event-btn">Save</button>
            <button class="event-btn">Sync</button>
            <button class="event-btn">Share</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}