// home-map-pills.js — render Mon→Sat buttons under "Map" on #/home
const CONFERENCE="gamescom2025";
const PARTIES_URL=`/api/parties?conference=${encodeURIComponent(CONFERENCE)}`;

const fmt = d => d.toISOString().slice(0,10);
const parseDate = v => {
  if (!v) return null;
  const m = String(v).match(/\d{4}-\d{2}-\d{2}/);
  return m ? new Date(m[0]+'T00:00:00Z') : null;
};
const weekMonToSat = (anchor) => {
  const d = new Date(anchor);
  const day = d.getUTCDay() || 7; // Sun=0 → 7
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - (day-1)));
  return Array.from({length:6},(_,i)=>new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()+i)));
};
const label = d => {
  const wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()];
  const dd = String(d.getUTCDate()).padStart(2,'0');
  return `${wd} ${dd}`;
};

async function getParties(){
  try {
    const r = await fetch(PARTIES_URL, { headers:{accept:'application/json'} });
    const j = await r.json();
    const list = Array.isArray(j?.data) ? j.data
              : Array.isArray(j?.parties) ? j.parties
              : Array.isArray(j) ? j : [];
    return list;
  } catch { return []; }
}
function pickAnchorDate(list){
  const ds = list.map(p => parseDate(p.date || p.start || p.startsAt)).filter(Boolean).sort((a,b)=>a-b);
  return ds[0] || new Date();
}

function mountMapPillsRow(){
  const home = document.querySelector('.home-panel');
  if (!home) return null;

  // Find/create the "Map" section on Home
  let mapSection = [...home.querySelectorAll('.home-section')].find(sec => {
    const h = sec.querySelector('h2,h3,[role=heading]');
    return h && /^map$/i.test(h.textContent.trim());
  });
  if (!mapSection) {
    mapSection = document.createElement('section');
    mapSection.className = 'home-section';
    mapSection.dataset.section = 'map';
    const h = document.createElement('h2');
    h.textContent = 'Map';
    mapSection.appendChild(h);
    home.appendChild(mapSection);
  }

  let row = mapSection.querySelector('.day-pills');
  if (!row) {
    row = document.createElement('div');
    row.className = 'day-pills';
    mapSection.appendChild(row);
  }
  row.innerHTML = '';
  return row;
}

function renderButtons(row, days){
  const todayISO = new Date().toISOString().slice(0,10);
  days.forEach(d => {
    const iso = fmt(d);
    const btn = document.createElement('button');
    btn.className = 'day-pill';
    btn.type = 'button';
    btn.setAttribute('aria-pressed', String(iso===todayISO));
    btn.dataset.date = iso;
    btn.textContent = label(d);
    // No onclick - router handles clicks
    row.appendChild(btn);
  });
}

async function init(){
  if ((location.hash || '#/home').split('#')[1] !== '/home') return;
  const row = mountMapPillsRow();
  if (!row) return;

  const parties = await getParties();
  const anchor = pickAnchorDate(parties);
  const days = weekMonToSat(anchor);
  renderButtons(row, days);
}

window.addEventListener('hashchange', init, { passive:true });
document.addEventListener('DOMContentLoaded', init, { passive:true });