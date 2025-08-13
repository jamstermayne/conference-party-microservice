export async function renderParties(mount){
  if(!mount) return;
  const data = (await fetch('/assets/data/events.json').then(r=>r.json()).catch(()=>[])) || [];
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
          ${ev.price==='free'?'<span class="vcard__pill is-free">free</span>':''}
          <span class="vcard__pill is-live">live</span>
        </div>
      </div>
      <div class="vcard__subtitle">📍 ${ev.venue||''}</div>
      <ul class="vcard__meta">
        <li>🗓️ ${ev.when||''}</li>
      </ul>
      <div class="vcard__actions">
        <button class="btn-primary">Save & Sync</button>
        <button class="btn">Details</button>
      </div>
    </article>`;
  }
}
export default { renderParties };