// home-parties-pills.js — Home → Parties section: Mon–Sat buttons (NOT links)
const CONFERENCE="gamescom2025";
const PARTIES_URL=`/api/parties?conference=${encodeURIComponent(CONFERENCE)}`;

const fmtISO = d => d.toISOString().slice(0,10);
const pickDate = v => {
  if (!v) return null;
  const m = String(v).match(/\d{4}-\d{2}-\d{2}/);
  return m ? new Date(m[0]+'T00:00:00Z') : null;
};
const mondayThroughSaturday = (anchor) => {
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

async function fetchParties(){
  try {
    const r = await fetch(PARTIES_URL, { headers:{accept:'application/json'} });
    const j = await r.json();
    return Array.isArray(j?.data) ? j.data
         : Array.isArray(j?.parties) ? j.parties
         : Array.isArray(j) ? j : [];
  } catch { return []; }
}
function anchorFromParties(list){
  const ds = list.map(p => pickDate(p.date || p.start || p.startsAt)).filter(Boolean).sort((a,b)=>a-b);
  return ds[0] || new Date();
}

function ensurePartiesSection(){
  const home = document.querySelector('.home-panel');
  if (!home) return null;

  // Find/create the "Parties" section container
  let sec = [...home.querySelectorAll('.home-section')].find(s => {
    const h = s.querySelector('h2,h3,[role=heading]');
    return h && /^parties$/i.test(h.textContent.trim());
  });
  if (!sec) {
    sec = document.createElement('section');
    sec.className = 'home-section';
    const h = document.createElement('h2');
    h.textContent = 'Parties';
    sec.appendChild(h);
    // Insert Parties section before Map section if possible
    const mapSection = [...home.querySelectorAll('.home-section')].find(s => {
      const h = s.querySelector('h2,h3,[role=heading]'); return h && /^map$/i.test(h.textContent.trim());
    });
    home.insertBefore(sec, mapSection || home.firstChild);
  }

  let row = sec.querySelector('.day-pills');
  if (!row) {
    row = document.createElement('div');
    row.className = 'day-pills';
    sec.appendChild(row);
  }
  row.innerHTML = '';
  return row;
}

function renderButtons(row, days){
  const todayISO = new Date().toISOString().slice(0,10);
  days.forEach(d => {
    const iso = fmtISO(d);
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
  if ((location.hash || '#/home').split('#')[1] !== '/home') return;
  const row = ensurePartiesSection();
  if (!row) return;
  const parties = await fetchParties();
  const anchor = anchorFromParties(parties);
  renderButtons(row, mondayThroughSaturday(anchor));
}

window.addEventListener('hashchange', init, { passive:true });
document.addEventListener('DOMContentLoaded', init, { passive:true });