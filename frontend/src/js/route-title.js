/**
 * Route title coordinator (robust)
 * Normalizes route names and updates main header/subtitle safely.
 * Listens to Events.emit('route:change', { name })
 */
import Events from '/assets/js/events.js';

const TITLE_MAP = {
  parties: '#parties',
  hotspots: '#hotspots',
  map: '#map',
  calendar: '#calendar',
  invites: '#invites',
  account: 'account', // gear, not a channel
  settings: 'account'
};

function normName(n) {
  if (typeof n !== 'string') return 'parties';
  const s = n.trim().toLowerCase();
  return TITLE_MAP[s] ? s : 'parties';
}

function setTitles(route) {
  const name = normName(route);
  const titleEl = document.querySelector('[data-role="route-title"]');
  const subtitleEl = document.querySelector('[data-role="route-subtitle"]');

  // ensure header shows channel-style only for channels
  const label = TITLE_MAP[name] || '#parties';
  if (titleEl) titleEl.textContent = label;
  if (subtitleEl) {
    if (name === 'parties') subtitleEl.textContent = 'Pick parties and save to your calendar';
    else if (name === 'hotspots') subtitleEl.textContent = 'Trending venues and heat';
    else if (name === 'calendar') subtitleEl.textContent = 'Your schedule, synced';
    else if (name === 'invites') subtitleEl.textContent = 'Manage your invites';
    else if (name === 'account') subtitleEl.textContent = 'Profile, security, and summary';
    else subtitleEl.textContent = '';
  }

  // Hide duplicated micro‑titles inside panels
  document.querySelectorAll('[data-panel-title]').forEach(n => {
    n.style.display = 'none';
  });
}

try {
  document.addEventListener('route:change', (e)=> setTitles(e?.detail?.name));
} catch {}

export { setTitles, normName };
export default { setTitles, normName };