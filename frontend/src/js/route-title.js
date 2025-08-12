// Keeps the top route title, document.title, and inner page titles in sync.
// Hides duplicate <h1> inside content so the app header is the single source.
import Events from './events.js';

const appName = 'Velocity';

function setTitles(routeName) {
  const pretty = (routeName||'').charAt(0).toUpperCase() + (routeName||'').slice(1);
  const nice = ({ parties:'Parties', hotspots:'Hotspots', map:'Map', calendar:'Calendar', invites:'Invites', me:'Me', settings:'Settings' }[routeName] || pretty || 'Home');

  // Update the top header title if present
  const hdr = document.querySelector('[data-role="route-title"]') || document.querySelector('.route-title-text') || document.getElementById('page-title');
  if (hdr) hdr.textContent = nice;

  // Update tab title (no "ProNet" ghosts)
  document.title = `${appName} — ${nice}`;

  // Hide duplicate H1s within the panel content
  const main = document.getElementById('main') || document;
  const dupH1s = main.querySelectorAll('h1, .page-title, .panel-title, .text-heading');
  dupH1s.forEach((el) => {
    // Keep the very first one visible, hide the rest as decorative
    if (el !== dupH1s[0]) {
      el.setAttribute('aria-hidden', 'true');
      el.classList.add('sr-only');
    }
  });
}

function currentRoute() {
  const hash = location.hash.replace('#/','').split('?')[0] || 'parties';
  return hash;
}

document.addEventListener('DOMContentLoaded', () => {
  setTitles(currentRoute());
});

window.addEventListener('hashchange', () => {
  setTitles(currentRoute());
});

try {
  Events.on && Events.on('route:change', (name) => setTitles(name));
} catch {}