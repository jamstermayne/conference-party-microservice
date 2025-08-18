// Event Card Component
import Events from '../foundation/events.js';

export function createEventCard(event) {
  const card = document.createElement('article');
  card.className = 'card-modern card-modern--event fade-in';
  card.dataset.eventId = event.id;
  
  const now = new Date();
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  
  let status = 'upcoming';
  if (now >= startTime && now <= endTime) status = 'live';
  else if (now > endTime) status = 'ended';
  
  const dateStr = startTime.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  const timeStr = formatTime(startTime);
  
  card.innerHTML = `
    <span class="card-modern__badge ${status === 'live' ? 'card-modern__badge--free' : ''}">
      ${status === 'live' ? 'LIVE' : status === 'upcoming' ? 'Upcoming' : 'Ended'}
    </span>
    
    <header class="card-modern__header">
      <div class="card-modern__eyebrow">
        <span>${dateStr}</span>
        <span>•</span>
        <span>${timeStr}</span>
      </div>
      <h3 class="card-modern__title">${event.name}</h3>
      ${event.location ? `<p class="card-modern__subtitle">${event.location}</p>` : ''}
    </header>
    
    ${event.description ? `
      <div class="card-modern__body">
        <p class="card-modern__description">${event.description}</p>
      </div>
    ` : ''}
    
    <footer class="card-modern__footer">
      <button class="card-modern__action card-modern__action--primary" data-action="join-event" data-event-id="${event.id}">
        ${status === 'live' ? 'Join Now' : 'View Details'}
      </button>
      <button class="card-modern__action card-modern__action--secondary" data-action="save-event" data-event-id="${event.id}">
        Save
      </button>
    </footer>
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