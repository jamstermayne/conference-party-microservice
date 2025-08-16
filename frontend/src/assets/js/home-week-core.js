/* home-week-core.js — enforce Mon–Sat pills (buttons only) for Parties & Map */
const CONF = 'gamescom2025';

const iso10 = d => d.toISOString().slice(0,10);
const parseISO = s => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||'')); 
  return m ? new Date(Date.UTC(+m[1], +m[2]-1, +m[3])) : null;
};
const pickDate = e => parseISO(e.date||e.start||e.startsAt||e.startTime||(e.time&&e.time.start));

function weekMonSat(anchor) {
  // anchor = any date inside the conference week
  const dow = (anchor.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  const mon = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() - dow));
  return Array.from({length:6}, (_,i) => new Date(Date.UTC(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate()+i)));
}
function label(d) {
  const names = ['Mon','Tue','Wed','Thu','Fri','Sat'];
  return `${names[(d.getUTCDay()+6)%7]} ${String(d.getUTCDate()).padStart(2,'0')}`;
}

async function loadParties() {
  try {
    const r = await fetch(`/api/parties?conference=${encodeURIComponent(CONF)}`, { headers:{accept:'application/json'} });
    const j = await r.json().catch(()=>null);
    return Array.isArray(j?.data) ? j.data : Array.isArray(j?.parties) ? j.parties : Array.isArray(j) ? j : [];
  } catch { return []; }
}

function ensureHomeShell() {
  let wrap = document.querySelector('.home-panel');
  if (!wrap) {
    wrap = Object.assign(document.createElement('section'), { className: 'home-panel' });
    (document.querySelector('#app') || document.body).appendChild(wrap);
  }
  const ensureSection = (key, title) => {
    let sec = document.querySelector(`.home-section[data-section="${key}"]`);
    if (!sec) {
      sec = document.createElement('section');
      sec.className = 'home-section';
      sec.dataset.section = key;
      const h2 = document.createElement('h2'); h2.textContent = title;
      const pills = document.createElement('div'); pills.className = 'day-pills';
      sec.append(h2, pills);
      wrap.appendChild(sec);
    }
    return sec.querySelector('.day-pills');
  };
  return { partiesPills: ensureSection('parties','Parties'),
           mapPills:     ensureSection('map','Map') };
}

function renderPills(container, baseRoute, days) {
  container.textContent = '';
  const activeISO = (/^#\/(?:parties|map)\/(\d{4}-\d{2}-\d{2})/.exec(location.hash||'')?.[1]) || null;
  days.forEach(d=>{
    const iso = iso10(d);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-pill';
    btn.textContent = label(d);
    btn.dataset.iso = iso;
    btn.setAttribute('aria-pressed', String(activeISO === iso));
    btn.addEventListener('click', e => { e.preventDefault(); location.hash = `${baseRoute}${iso}`; }, {passive:false});
    container.appendChild(btn);
  });
}

async function ensureWeekOnHome() {
  if (!location.hash.startsWith('#/home')) return;
  const { partiesPills, mapPills } = ensureHomeShell();

  const list = await loadParties();
  const dates = list.map(pickDate).filter(Boolean);

  // Fallback: if API gives nothing, use the current week
  const anchor = dates.length ? dates.reduce((a,b)=> a<b?a:b) : new Date();
  const days = weekMonSat(anchor);

  renderPills(partiesPills, '#/parties/', days);
  renderPills(mapPills,     '#/map/',     days);
}

// boot + watch
addEventListener('hashchange', () => ensureWeekOnHome(), {passive:true});
document.addEventListener('DOMContentLoaded', () => ensureWeekOnHome(), {once:true, passive:true});