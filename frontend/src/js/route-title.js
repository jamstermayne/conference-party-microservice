// route-title.js
import Events from './events.js';

const TITLE = {
  parties: 'Parties',
  hotspots: 'Hotspots',
  map: 'Map',
  calendar: 'Calendar',
  invites: 'Invites',
  me: 'Account',
  settings: 'Settings',
};

function normalizeRoute(v) {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') return v.route || v.name || v.to || v.path || '';
  return '';
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

export function setTitles(routeLike) {
  const r = normalizeRoute(routeLike) || 'parties';
  const title = TITLE[r] || cap(r);

  const h1 = document.getElementById('page-title');
  const chip = document.getElementById('route-chip');
  if (h1) h1.textContent = title;
  if (chip) chip.textContent = `#${r}`;
}

Events.on('route:changed', setTitles);   // will run on every route change

export default setTitles;