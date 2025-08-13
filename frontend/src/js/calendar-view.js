/**
 * Calendar view
 * Build: b018 - Uses shared ui-card factory
 */

import { ensureCardsCss, createHeroCard } from './ui-card.js?v=b018';

const DAY_EVENTS = [
  { id: 'e1', title: 'Gamescom Keynote', venue: 'Confex Hall A', when: '09:00–10:00', start: '09:00', duration: 60 },
  { id: 'e2', title: 'Indie Mixer', venue: 'Hall B Patio', when: '10:30–11:00', start: '10:30', duration: 30 },
  { id: 'e3', title: 'BizDev Roundtable', venue: 'Marriott', when: '13:00–14:00', start: '13:00', duration: 60 },
  { id: 'e4', title: 'Evening Party @ Rheinterr', venue: 'Rheinterr', when: '20:00–22:30', start: '20:00', duration: 150, free: true, live: true },
];

// Convert time string to minutes since midnight
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export async function renderCalendar(mount) {
  if (!mount) return;
  
  // Ensure CSS is loaded
  ensureCardsCss();
  addCss('/assets/css/calendar.css?v=b018');

  // Calculate calendar bounds
  const startHour = 9;  // 9:00 AM
  const endHour = 23;   // 11:00 PM
  const totalHours = endHour - startHour;
  const pixelsPerHour = 60; // Each hour is 60px tall
  const pixelsPerMinute = pixelsPerHour / 60;

  // Generate hour labels
  const hourLabels = [];
  for (let h = startHour; h <= endHour; h++) {
    hourLabels.push(`<div class="cal-hour-label">${h}:00</div>`);
  }

  // Generate hour slots (30-minute intervals)
  const hourSlots = [];
  for (let h = startHour; h < endHour; h++) {
    hourSlots.push(`<div class="cal-hour"></div>`);
    hourSlots.push(`<div class="cal-half"></div>`);
  }

  mount.innerHTML = `
    <div class="v-stack">
      <h2 class="section-title">Today's Schedule</h2>
      <div class="cal-wrap" style="--hour-h: ${pixelsPerHour}px">
        <div class="cal-grid">
          <div class="cal-hour-labels">
            ${hourLabels.join('')}
          </div>
          <div class="cal-hours">
            ${hourSlots.join('')}
          </div>
          <div class="cal-events" id="cal-events"></div>
        </div>
      </div>
    </div>
  `;

  // Place event cards with proper positioning
  const eventsContainer = document.getElementById('cal-events');
  if (eventsContainer) {
    const eventCards = DAY_EVENTS.map(event => {
      // Calculate position based on start time
      const eventStartMinutes = timeToMinutes(event.start);
      const calendarStartMinutes = startHour * 60;
      const minutesFromStart = eventStartMinutes - calendarStartMinutes;
      const topPosition = minutesFromStart * pixelsPerMinute;
      
      // Calculate height based on duration
      const height = (event.duration || 60) * pixelsPerMinute;
      
      // Create card with slot kind for calendar-specific styling
      const card = createHeroCard('slot', {
        title: event.title,
        time: event.when,
        venue: event.venue,
        badges: [
          event.free && { text: 'free', class: 'free' },
          event.live && { text: 'live', class: 'live' }
        ].filter(Boolean),
        actions: [
          { text: 'Add to Calendar', kind: 'primary' },
          { text: 'Details', kind: 'ghost' }
        ]
      });
      
      return `
        <div class="cal-event" style="top: ${topPosition}px; height: ${height}px; min-height: var(--card-min-h);">
          ${card}
        </div>
      `;
    });
    
    eventsContainer.innerHTML = eventCards.join('');
    
    // Set calendar container height to accommodate all events
    const lastEvent = DAY_EVENTS[DAY_EVENTS.length - 1];
    if (lastEvent) {
      const lastEventEnd = timeToMinutes(lastEvent.start) + (lastEvent.duration || 60);
      const totalMinutes = lastEventEnd - (startHour * 60);
      const containerHeight = Math.max(totalMinutes * pixelsPerMinute, totalHours * pixelsPerHour);
      eventsContainer.style.height = `${containerHeight}px`;
    }
  }
}

function addCss(href) {
  if ([...document.styleSheets].some(s => s.href && s.href.includes(href.split('?')[0]))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

export default { renderCalendar };