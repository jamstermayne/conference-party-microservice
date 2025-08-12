/**
 * Route Title — robust & safe
 * Normalizes names, updates app title, avoids "##".
 */
import Events from '/assets/js/events.js';

function normRouteName(name) {
  if (!name || typeof name !== 'string') return 'parties';
  // remove any leading # or "#/"
  return name.replace(/^#\/?/, '').trim();
}

function labelFor(name) {
  const n = normRouteName(name);
  if (n === 'account') return 'account';
  return n; // parties, hotspots, map, calendar, invites, me, account
}

export function setTitles(routeName) {
  const label = labelFor(routeName);
  const appName = 'velocity.ai';
  document.title = `${appName} — #${label}`;

  // In-UI header (if present)
  const header = document.querySelector('.parties-header .ph-title');
  if (header) header.textContent = label;

  // Sidebar badge (no double #)
  document.querySelectorAll('[data-route]').forEach(btn => {
    const r = btn.getAttribute('data-route');
    if (!r) return;
    // Ensure text is "#name" exactly once
    if (btn.dataset.tagified !== '1') {
      const text = r; // raw route key
      btn.innerHTML = `<span class="side-tag">#</span><span class="side-name">${text}</span>`;
      btn.dataset.tagified = '1';
    }
    btn.classList.toggle('active', r === label);
  });
}

// Bind to router events
try {
  document.addEventListener('route:change', (e) => {
    const { name } = e.detail || {};
    setTitles(name || 'parties');
  });
} catch {}

export default setTitles;