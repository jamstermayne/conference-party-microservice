// Small renderer + per-card actions
const Store = window.Store;

export function eventCard(event){
  const { id, title, time, venue, price } = event;
  const priceLabel = price && price.trim() ? `From ${price}` : 'Free';
  const isFree = !price || /free/i.test(priceLabel);

  return `
  <article class="event-card" data-id="${id}">
    <div class="price-badge ${isFree?'free':''}">${priceLabel}</div>
    <h3>${escapeHTML(title)}</h3>
    <div class="eyebrow">
      <span>🕘 ${escapeHTML(time||'TBA')}</span>
      <span>📍 ${escapeHTML(venue||'Venue TBA')}</span>
    </div>
    <p class="subtle">Tap to RSVP, save, or open the event.</p>
    <div class="cta-row">
      <button class="btn" data-action="rsvp">RSVP</button>
      <button class="btn" data-action="save">Save</button>
      <button class="btn primary" data-action="save-sync">Save & Sync</button>
      <button class="btn" data-action="open">↗</button>
    </div>
  </article>`;
}

export function wireCardActions(root){
  root.addEventListener('click', async (e)=>{
    const btn = e.target.closest('[data-action]'); if(!btn) return;
    const card = e.target.closest('.event-card'); if(!card) return;
    const id = card.dataset.id;
    try {
      switch(btn.dataset.action){
        case 'rsvp':       await track('rsvp', id); toast('RSVP opened'); break;
        case 'save':       await saveOnly(id); toast('Saved'); break;
        case 'save-sync':  await saveAndSync(id); toast('Saved & synced'); break;
        case 'open':       openEvent(id); break;
      }
    } catch(err){ console.error(err); toast('Action failed','error'); }
  });
}

async function saveOnly(id){
  const sel = Store.get('selected.events')||[];
  if(!sel.includes(id)) sel.push(id);
  Store.set('selected.events', sel);
}
async function saveAndSync(id){
  await saveOnly(id);
  document.dispatchEvent(new CustomEvent('calendar:sync', { detail:{ ids: Store.get('selected.events') } }));
}
function openEvent(id){
  // If you have a details route, navigate; else noop
  const ev = (Store.get('events.all')||[]).find(e=>e.id===id);
  if (ev?.link) window.open(ev.link, '_blank','noopener');
}

function track(name,id){
  try{ window.Metrics?.track?.('event_'+name,{ id }); }catch{}
  return Promise.resolve();
}
function toast(msg,type='ok'){
  try{ document.dispatchEvent(new CustomEvent('ui:toast',{detail:{type,message:msg}})); }catch{}
}
function escapeHTML(s){ return String(s??'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }