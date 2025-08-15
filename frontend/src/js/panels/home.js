import { openPartiesDay, openCalendar, openMapToday, openInvites, openContacts, openMe, openSettings } from './openers.js';

export async function openHome(activator) {
  const el = document.createElement('div');
  el.className = 'v-list';

  // Sections
  const partiesSec = document.createElement('section');
  partiesSec.className = 'v-section';
  partiesSec.innerHTML = `<h2>Parties</h2><div class="v-days" id="days"></div>`;
  el.appendChild(partiesSec);

  const otherSec = document.createElement('section');
  otherSec.className = 'v-section';
  otherSec.innerHTML = `<h2>Channels</h2>`;
  const list = [
    ['My calendar', openCalendar],
    ['Map', openMapToday],
    ['Invites', openInvites],
    ['Contacts', openContacts],
    ['Me', openMe],
    ['Settings', openSettings],
  ];
  list.forEach(([label, fn]) => {
    const b = document.createElement('button');
    b.className = 'v-item';
    b.textContent = label;
    b.addEventListener('click', (e)=>fn(e.currentTarget));
    otherSec.appendChild(b);
  });
  el.appendChild(otherSec);

  // Load days (API: /api/party-days or derive from /api/parties)
  const daysNode = partiesSec.querySelector('#days');
  const days = await getDays();
  const today = new Date().toISOString().slice(0,10);

  days.forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'v-pill';
    btn.type = 'button';
    btn.setAttribute('aria-pressed', String(d.date === today));
    btn.textContent = d.label;
    btn.addEventListener('click', () => openPartiesDay(d.date, btn));
    daysNode.appendChild(btn);
  });

  Stack.push('home', { title: 'Home', content: el }, activator);
}

async function getDays() {
  try {
    const res = await fetch(`/api/party-days?conference=gamescom2025`);
    if (res.ok) return res.json();
  } catch {}
  // fallback: derive from parties
  const res = await fetch(`/api/parties?conference=gamescom2025`);
  const json = await res.json();
  const uniq = Array.from(new Set((json.data||json.parties||[]).map(p => p.start?.slice(0,10))));
  return uniq
    .filter(Boolean)
    .sort()
    .slice(0,7)
    .map(d => ({ date: d, label: new Date(d).toLocaleDateString(undefined,{weekday:'short', day:'2-digit', month:'short'}) }));
}