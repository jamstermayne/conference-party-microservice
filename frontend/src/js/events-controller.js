const FALLBACK = [
  { id: 'meet', title: 'MeetToMatch The Cologne Edition 2025', venue: 'Kölnmesse Confex', when: 'Fri Aug 22 — 09:00–18:00', price: '£127.04', live: true },
  { id: 'mixer', title: 'Marriott Rooftop Mixer', venue: 'Marriott Hotel', when: 'Fri Aug 22 — 20:00–23:30', free: true, live: true },
  { id: 'indie', title: 'Indie Games Poland Party', venue: 'Rheinterrassen', when: 'Sat Aug 23 — 19:00–02:00', free: true },
  { id: 'xbox', title: 'Xbox Developer Direct', venue: 'Microsoft Lounge', when: 'Sun Aug 24 — 14:00–18:00', price: '€45', live: true },
  { id: 'unity', title: 'Unity Networking Night', venue: 'Cologne Tower', when: 'Mon Aug 25 — 18:00–23:00', free: true },
  { id: 'devcom', title: 'devcom Developer Conference', venue: 'Kölnmesse Confex', when: 'Mon Aug 18, 09:00–23:30', price: 'From €299', live: true },
];

export async function renderParties(mount){
  if(!mount) return;
  
  // Try to fetch from API, fallback to demo data
  let data = FALLBACK;
  try {
    const res = await fetch('/api/parties?conference=gamescom2025', {credentials: 'omit'});
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length) data = json.data;
    }
  } catch(e) {
    console.log('Using fallback data');
  }
  
  mount.innerHTML = `
    <section style="padding:16px 20px">
      <h2 style="color:#eaf0ff;margin:0 0 12px">Recommended events</h2>
      <div id="events-list"></div>
    </section>`;
  const list = mount.querySelector('#events-list');
  list.innerHTML = data.map(ev => card(ev)).join('');
  
  function card(ev){
    return `
    <article class="vcard">
      <div class="vcard__head">
        <div class="vcard__title">${ev.title||'Untitled'}</div>
        <div class="vcard__badges">
          ${ev.free?'<span class="vcard__pill is-free">free</span>':''}
          ${ev.live?'<span class="vcard__pill is-live">live</span>':''}
        </div>
      </div>
      <div class="vcard__subtitle">📍 ${ev.venue||''}</div>
      <ul class="vcard__meta">
        <li>${ev.when||''}</li>
        ${ev.price && !ev.free ? `<li>${ev.price}</li>` : ''}
      </ul>
      <div class="vcard__actions">
        <button class="btn-primary">Save & Sync</button>
        <button class="btn">Details</button>
      </div>
    </article>`;
  }
}
export default { renderParties };