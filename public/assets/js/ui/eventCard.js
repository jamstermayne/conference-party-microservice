// Event Card Component
import Events from '../foundation/events.js';

export function createEventCard(event) {
  const card = document.createElement('div');
  card.className = 'event-card fade-in';
  card.dataset.eventId = event.id;
  
  const now = new Date();
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  
  let status = 'upcoming';
  if (now >= startTime && now <= endTime) status = 'live';
  else if (now > endTime) status = 'ended';
  
  card.innerHTML = `
    <div class="event-card__header">
      <h3 class="event-card__title">${event.name}</h3>
      <div class="event-card__status event-card__status--${status}">
        ${status === 'live' ? '🔴 LIVE' : status === 'upcoming' ? 'Upcoming' : 'Ended'}
      </div>
    </div>
    <div class="event-card__meta">
      <div class="event-card__time">
        <span>🕐</span>
        <span>${formatTime(startTime)}</span>
      </div>
      <div class="event-card__location">
        <span>📍</span>
        <span>${event.location || 'TBD'}</span>
      </div>
    </div>
    ${event.description ? `<p class="event-card__description">${event.description}</p>` : ''}
    <div class="event-card__actions">
      <button class="btn btn-primary event-card__btn" data-action="join-event" data-event-id="${event.id}">
        ${status === 'live' ? 'Join Now' : 'View Details'}
      </button>
      <button class="btn event-card__btn" data-action="save-event" data-event-id="${event.id}">
        💾 Save
      </button>
    </div>
  `;
  
  return card;
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

// Event card interactions
Events.on('action:join-event', (data) => {
  console.log('Joining event:', data.eventId);
  // Handle event joining logic
});

Events.on('action:save-event', (data) => {
  console.log('Saving event:', data.eventId);
  // Handle event saving logic
});

export default { createEventCard };