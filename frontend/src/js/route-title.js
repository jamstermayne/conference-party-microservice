// route-title.js  v2
import Events from './events.js';

const TITLES = {
  parties: 'Parties',
  hotspots: 'Hotspots',
  map: 'Map',
  calendar: 'Calendar',
  invites: 'Invites',
  me: 'Account',
  settings: 'Settings',
};

function asRoute(v) {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') return v.route || v.name || v.to || v.path || '';
  return '';
}
function titleFor(r) { return TITLES[r] || (r ? r[0].toUpperCase() + r.slice(1) : ''); }

export function setTitles(routeLike) {
  const r = asRoute(routeLike) || 'parties';
  const h1  = document.getElementById('page-title');
  const chip = document.getElementById('route-chip');
  if (h1)  h1.textContent = titleFor(r);
  if (chip) chip.textContent = `#${r}`;
}

Events.on('route:changed', setTitles);
export default setTitles;