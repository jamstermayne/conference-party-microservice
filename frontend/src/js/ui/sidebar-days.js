import { prettyDayLabel } from '../services/parties-utils.js?v=b037';

// Listen for parties:loaded events to update sidebar
window.addEventListener('parties:loaded', (e) => {
  renderSidebarDays(e.detail.days, { fallbackWeek: buildMonSatFallback(e.detail.days?.[0]) });
});

// Render (or update) the nested days under the Map item
export function renderSidebarDays(days = [], { fallbackWeek = [] } = {}) {
  const aside = document.querySelector('aside,[data-role="sidebar"],#sidebar');
  if (!aside) return;

  const mapBtn = aside.querySelector('[data-route="map"]');
  if (!mapBtn) return;

  // Ensure a subnav container exists right after the Map button
  let ul = mapBtn.nextElementSibling;
  if (!ul || !ul.classList.contains('subnav')) {
    ul = document.createElement('ul');
    ul.className = 'subnav';
    mapBtn.after(ul);
  }

  const source = (days && days.length) ? days : fallbackWeek;
  ul.innerHTML = '';

  for (const day of source) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#/map/${day}`;
    a.dataset.route = 'map';
    a.dataset.day = day;
    a.textContent = prettyDayLabel(day);
    li.appendChild(a);
    ul.appendChild(li);
  }

  syncActiveDay();
}

export function syncActiveDay() {
  const dayParam = (location.hash.split('/')[2] || '').trim();
  document.querySelectorAll('.subnav a[data-day]').forEach(a => {
    a.classList.toggle('active', a.dataset.day === dayParam);
  });
}

// Generate Mon–Sat fallback for the event week if needed
export function buildMonSatFallback(anchorIsoDay) {
  // anchorIsoDay should be the first party day if known; otherwise current date
  const anchor = anchorIsoDay ? new Date(`${anchorIsoDay}T12:00:00Z`) : new Date();
  const day = anchor.getUTCDay(); // 0..6 (Sun..Sat)
  const mondayOffset = (day === 0 ? -6 : 1 - day); // shift back to Monday
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() + mondayOffset);
  const out = [];
  for (let i = 0; i < 6; i++) { // Mon..Sat
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}