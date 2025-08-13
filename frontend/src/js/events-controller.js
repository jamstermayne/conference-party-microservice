export async function renderParties(root){
  const el = root || document.getElementById('app'); if(!el) return;
  const events = await getSample(); // replace with your API fetch
  el.innerHTML = `
    <section class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h2 style="margin:0">Recommended events</h2>
        <small style="color:var(--muted)">Scroll to explore</small>
      </div>
      <div class="events-grid">
        ${events.map(ev=>card(ev)).join('')}
      </div>
    </section>`;
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