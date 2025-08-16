/* home-unified-fix.js — Unified fix for all home panel sections and pills */
const CONF = 'gamescom2025';

function iso10(d){ return d.toISOString().slice(0,10); }
function parseISO10(s){ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||'')); return m?new Date(Date.UTC(+m[1],+m[2]-1,+m[3])):null; }

function getEventDate(ev){
  return parseISO10(ev.date || ev.start || ev.startsAt || ev.startTime || (ev.time && ev.time.start));
}

function mondayThroughSaturday(min){
  const dow = (min.getUTCDay()+6)%7; // Mon=0
  const mon = new Date(Date.UTC(min.getUTCFullYear(),min.getUTCMonth(),min.getUTCDate()-dow));
  return Array.from({length:6},(_,i)=> new Date(Date.UTC(mon.getUTCFullYear(),mon.getUTCMonth(),mon.getUTCDate()+i)));
}

function dayLabel(d){
  const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const day = names[d.getUTCDay()];
  const date = String(d.getUTCDate()).padStart(2,'0');
  return `${day} ${date}`;
}

async function fetchParties(){
  try {
    const r = await fetch(`/api/parties?conference=${encodeURIComponent(CONF)}`, {headers:{accept:'application/json'}});
    const j = await r.json();
    const list = Array.isArray(j?.data)?j.data : Array.isArray(j?.parties)?j.parties : Array.isArray(j)?j : [];
    return list;
  } catch { return []; }
}

function ensureHomePanel(){
  let panel = document.querySelector('.home-panel');
  if (!panel) {
    const app = document.getElementById('app') || document.body;
    panel = document.createElement('div');
    panel.className = 'home-panel';
    app.appendChild(panel);
  }
  return panel;
}

function ensureSection(panel, sectionName, title){
  // Try multiple selectors to find existing section
  let section = panel.querySelector(`.home-section[data-section="${sectionName}"]`) ||
                panel.querySelector(`.home-section[data-kind="${sectionName}"]`) ||
                panel.querySelector(`.home-section.${sectionName}-section`) ||
                panel.querySelector(`.${sectionName}-section`);
  
  if (!section) {
    section = document.createElement('section');
    section.className = `home-section ${sectionName}-section`;
    section.dataset.section = sectionName;
    section.dataset.kind = sectionName; // Support both attributes
    
    const h2 = document.createElement('h2');
    h2.className = 'section-title';
    h2.textContent = title;
    section.appendChild(h2);
    
    const pills = document.createElement('div');
    pills.className = 'day-pills pill-row'; // Support both class names
    pills.dataset.kind = sectionName;
    pills.setAttribute('role', 'group');
    pills.setAttribute('aria-label', `Select day for ${title}`);
    section.appendChild(pills);
    
    // Insert parties before map if map exists
    if (sectionName === 'parties') {
      const mapSection = panel.querySelector('[data-section="map"], [data-kind="map"], .map-section');
      if (mapSection) {
        panel.insertBefore(section, mapSection);
      } else {
        panel.appendChild(section);
      }
    } else {
      panel.appendChild(section);
    }
  }
  
  // Ensure pills container exists
  let pillsContainer = section.querySelector('.day-pills') || section.querySelector('.pill-row');
  if (!pillsContainer) {
    pillsContainer = document.createElement('div');
    pillsContainer.className = 'day-pills pill-row';
    section.appendChild(pillsContainer);
  }
  
  return { section, pillsContainer };
}

function renderPills(container, sectionName, dates){
  // Clear existing pills
  container.innerHTML = '';
  
  // Get active date from hash
  const hashPattern = new RegExp(`^#\\/${sectionName}\\/(\\d{4}-\\d{2}-\\d{2})`);
  const activeISO = hashPattern.exec(location.hash)?.[1] || null;
  
  dates.forEach(date => {
    const btn = document.createElement('button');
    btn.className = 'day-pill';
    btn.type = 'button';
    
    const dateISO = iso10(date);
    btn.textContent = dayLabel(date);
    btn.dataset.iso = dateISO;
    btn.dataset.route = `#/${sectionName}/${dateISO}`;
    btn.setAttribute('aria-pressed', String(dateISO === activeISO));
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      location.hash = `#/${sectionName}/${dateISO}`;
    });
    
    container.appendChild(btn);
  });
}

async function initializeHome(){
  // Only run on home page
  const hash = location.hash || '#/home';
  if (!hash.startsWith('#/home') && hash !== '#/' && hash !== '#') return;
  
  const panel = ensureHomePanel();
  
  // Fetch party data
  const parties = await fetchParties();
  const dates = parties.map(getEventDate).filter(Boolean);
  
  // Use current week if no dates
  let weekDates;
  if (dates.length > 0) {
    const minDate = dates.reduce((a,b) => a<b?a:b);
    weekDates = mondayThroughSaturday(minDate);
  } else {
    // Use current week as fallback
    weekDates = mondayThroughSaturday(new Date());
  }
  
  // Ensure and render Parties section
  const partiesData = ensureSection(panel, 'parties', 'Parties');
  renderPills(partiesData.pillsContainer, 'parties', weekDates);
  
  // Ensure and render Map section
  const mapData = ensureSection(panel, 'map', 'Map');
  renderPills(mapData.pillsContainer, 'map', weekDates);
}

// Update pressed states on navigation
function updatePressedStates(){
  ['parties', 'map'].forEach(sectionName => {
    const hashPattern = new RegExp(`^#\\/${sectionName}\\/(\\d{4}-\\d{2}-\\d{2})`);
    const activeISO = hashPattern.exec(location.hash)?.[1] || null;
    
    // Find pills in any possible container
    const pills = document.querySelectorAll(`.home-section[data-section="${sectionName}"] .day-pill, .home-section[data-kind="${sectionName}"] .day-pill, .${sectionName}-section .day-pill`);
    
    pills.forEach(btn => {
      const btnISO = btn.dataset.iso;
      btn.setAttribute('aria-pressed', String(btnISO === activeISO));
    });
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeHome, {once: true});

// Reinitialize on hash change to home
window.addEventListener('hashchange', () => {
  const hash = location.hash || '#/home';
  if (hash.startsWith('#/home') || hash === '#/' || hash === '#') {
    initializeHome();
  } else {
    updatePressedStates();
  }
});