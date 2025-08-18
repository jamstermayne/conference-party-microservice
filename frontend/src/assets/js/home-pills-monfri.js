// home-pills-monfri.js
import { fetchAll, getPartiesByDate } from './parties-data.js';

const pill = (iso, label) => {
  const b = document.createElement('button');
  b.className = 'day-pill';
  b.type = 'button';
  b.dataset.iso = iso;
  b.textContent = label;
  return b;
};
const labelFor = (iso) => {
  const d = new Date(iso+'T00:00:00Z');
  return d.toLocaleDateString(undefined, { weekday:'short', day:'2-digit' })
           .replace(',', ' ');
};

async function ensureSection(name) {
  let sec = document.querySelector(`.home-section[data-section="${name}"]`);
  if (!sec) {
    sec = document.createElement('section');
    sec.className = 'home-section';
    sec.dataset.section = name;
    sec.innerHTML = `<h2>${name[0].toUpperCase()+name.slice(1)}</h2><div class="day-pills" role="group"></div>`;
    (document.querySelector('.home-panel') || document.body).appendChild(sec);
  }
  return sec;
}

async function renderPills() {
  await fetchAll(); // Load the data
  
  // Generate Mon-Fri for current week
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  monday.setDate(diff);
  
  const monfri = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    monfri.push(d.toISOString().slice(0, 10));
  }

  for (const secName of ['parties','map']) {
    const sec = await ensureSection(secName);
    const wrap = sec.querySelector('.day-pills');
    wrap.innerHTML = '';
    monfri.forEach((iso, i) => {
      const b = pill(iso, labelFor(iso));
      if (i === 0) b.setAttribute('aria-pressed', 'true');
      wrap.appendChild(b);
    });
  }
}
// Navigation wiring removed - handled by overlay-live.js
renderPills();