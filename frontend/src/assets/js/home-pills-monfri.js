// home-pills-monfri.js
import { loadParties, weekMonFriFromEarliest } from './parties-index.js';

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
  const { dates } = await loadParties();
  const monfri = weekMonFriFromEarliest(dates); // Mon–Fri only

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
function wireNav() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.home-section .day-pills .day-pill');
    if (!btn) return;
    const iso = btn.dataset.iso;
    const sec = btn.closest('.home-section')?.dataset.section;
    if (sec === 'parties') location.hash = `#/parties/${iso}`;
    else if (sec === 'map') location.hash = `#/map/${iso}`;
  }, { passive: true });
}
renderPills(); wireNav();