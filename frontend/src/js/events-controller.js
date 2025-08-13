export async function renderParties(root){
  const mount = root || document.getElementById('app'); 
  if(!mount) return;
  
  const events = await getSample(); // replace with your API fetch
  
  // Create section wrapper
  const section = document.createElement('section');
  section.className = 'section-card';
  
  // Add accent
  const accent = document.createElement('div');
  accent.className = 'left-accent';
  accent.setAttribute('aria-hidden', 'true');
  section.appendChild(accent);
  
  // Add header
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px';
  header.innerHTML = `
    <h2 style="margin:0">Recommended events</h2>
    <small style="color:var(--muted)">Scroll to explore</small>
  `;
  section.appendChild(header);
  
  // Create responsive grid
  const grid = document.createElement('div');
  grid.className = 'card-grid'; // 1 col mobile, 2 col tablet, 3 col desktop via CSS
  grid.innerHTML = events.map(ev=>card(ev)).join('');
  section.appendChild(grid);
  
  // Replace mount children
  mount.replaceChildren(section);
}
function card(ev){
  const price = ev.price ? `From ${ev.price}` : (ev.free ? 'Free' : '');
  return `
  <article class="event-card" data-id="${ev.id}">
    <div class="card-hd">
      <div class="card-title">${ev.title}</div>
      <div class="badges">
        ${price?`<span class="badge badge-ghost">${price}</span>`:''}
        ${ev.live?`<span class="badge badge-live">live</span>`:''}
      </div>
    </div>
    <div class="meta">
      <span>📅 ${ev.date}</span><span>•</span>
      <span>📍 ${ev.venue}</span>
    </div>
    <div class="btns">
      <button class="btn btn-primary">Save & Sync</button>
      <button class="btn">Details</button>
    </div>
  </article>`;
}
async function getSample(){
  return [
    {id:'m2m', title:'MeetToMatch The Cologne Edition 2025', date:'Fri Aug 22 — 09:00 - 18:00', venue:'Kölnmesse Confex', price:'£127.04', live:true},
    {id:'marriott', title:'Marriott Rooftop Mixer', date:'Fri Aug 22 — 20:00 - 23:30', venue:'Marriott Hotel', free:true, live:true},
  ];
}