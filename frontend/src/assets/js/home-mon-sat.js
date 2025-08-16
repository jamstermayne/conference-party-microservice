// home-mon-sat.js — render Mon→Sat day pills on Home from live data
const CONFERENCE="gamescom2025";
const PARTIES_URL=`/api/parties?conference=${encodeURIComponent(CONFERENCE)}`;

const fmt = d => d.toISOString().slice(0,10);
const parseDate = v => {
  if (!v) return null;
  const t = typeof v === 'string' ? v : String(v);
  const m = t.match(/\d{4}-\d{2}-\d{2}/);
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

async function getParties() {
  try {
    const res = await fetch(PARTIES_URL, { headers:{accept:'application/json'} });
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data
               : Array.isArray(json?.parties) ? json.parties
               : Array.isArray(json) ? json : [];
    return list;
  } catch { return []; }
}

function pickAnchorDate(list){
  const dates = list
    .map(p => parseDate(p.date || p.start || p.startsAt))
    .filter(Boolean)
    .sort((a,b)=>a-b);
  return dates[0] || new Date(); // fallback today
}

function mountHomePills(){
  // Find the Parties section on Home
  const home = document.querySelector('.home-panel');
  if (!home) return false;
  const partiesSection = [...home.querySelectorAll('.home-section')].find(sec => {
    const h = sec.querySelector('h2,h3,[role=heading]');
    return h && /parties/i.test(h.textContent || '');
  });
  if (!partiesSection) return false;

  // container (create if missing)
  let row = partiesSection.querySelector('.day-pills');
  if (!row) {
    row = document.createElement('div');
    row.className = 'day-pills';
    partiesSection.appendChild(row);
  }
  row.innerHTML = ''; // reset

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
    btn.dataset.href = `#/parties/${iso}`;
    btn.textContent = label(d);
    btn.addEventListener('click', () => { location.hash = btn.dataset.href; });
    row.appendChild(btn);
  });
}

async function init(){
  if ((location.hash || '#/home').split('?')[0].split('#')[1] !== '/home') return;
  const row = mountHomePills();
  if (!row) return;

  const parties = await getParties();
  const anchor = pickAnchorDate(parties);
  const days = weekMonToSat(anchor);
  renderButtons(row, days);
}

// re-run on hash change (stay tiny)
window.addEventListener('hashchange', init, { passive:true });
document.addEventListener('DOMContentLoaded', init, { passive:true });