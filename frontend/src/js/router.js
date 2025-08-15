import { openHome } from './panels/home.js';
import { openPartiesDay } from './panels/openers.js';
import { openCalendar } from './panels/openers.js';
import { openMapToday } from './panels/openers.js';
import { wireGlobalButtons } from './wire-buttons.js';
import { wireCalendarButtons } from './wiring/wire-calendar.js';

// Wire buttons once on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  wireGlobalButtons(document);
  wireCalendarButtons(document);
});

// Mount to #main (Stack handles the actual mounting via getElementById('main'))
const main = () => document.getElementById('main');

const routes = [
  [/^#\/home$/, () => openHome()],
  [/^#\/parties\/(\d{4}-\d{2}-\d{2})$/, (_, day) => openPartiesDay(day)],
  [/^#\/calendar$/, () => openCalendar()],
  [/^#\/map(?:\/(\d{4}-\d{2}-\d{2}))?$/, () => openMapToday()],
];

window.addEventListener('hashchange', handle);
function handle(){
  const h = location.hash || '#/home';
  
  // Gate day subnav to Map route only
  const isMap = h.startsWith('#/map');
  document.querySelector('.v-day-subnav')?.classList.toggle('is-visible', isMap);
  
  for (const [re, fn] of routes) {
    const m = h.match(re); if (m) return fn(...m);
  }
  openHome();
}
handle();