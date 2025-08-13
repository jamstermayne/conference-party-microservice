const SEED = [
  { id: 'c1', name: 'Alex Chen', role: 'Producer', company: 'Nebula Games', location: 'Hall 7, Booth A23', status: 'online' },
  { id: 'c2', name: 'Sam Rivera', role: 'Biz Dev', company: 'Solar Forge', location: 'Business Area', verified: true },
  { id: 'c3', name: 'Dana Patel', role: 'Publisher', company: 'Blue Owl', linkedin: 'linkedin.com/in/danapatel' },
  { id: 'c4', name: 'Jordan Kim', role: 'Investor', company: 'GameVentures', location: 'VIP Lounge', status: 'online', verified: true },
  { id: 'c5', name: 'Morgan Lee', role: 'Developer', company: 'Indie Studio', linkedin: 'linkedin.com/in/morganlee' },
];

export async function renderContacts(mount){
  if(!mount) return;
  
  mount.innerHTML = `
    <section style="padding:16px 20px">
      <h2 style="color:#eaf0ff;margin:0 0 12px">Professional Network</h2>
      <div id="c-list"></div>
    </section>`;
  
  const list = mount.querySelector('#c-list');
  list.innerHTML = SEED.map(p=>`
    <article class="vcard">
      <div class="vcard__head">
        <div class="vcard__title">${p.name||'Unknown'}</div>
        <div class="vcard__badges">
          ${p.role?`<span class="vcard__pill">${p.role}</span>`:''}
          ${p.status==='online'?'<span class="vcard__pill is-live">online</span>':''}
          ${p.verified?'<span class="vcard__pill is-free">verified</span>':''}
        </div>
      </div>
      <div class="vcard__subtitle">${p.company||''}</div>
      <ul class="vcard__meta">
        ${p.location?`<li>📍 ${p.location}</li>`:''}
        ${p.linkedin?`<li>🔗 ${p.linkedin}</li>`:''}
      </ul>
      <div class="vcard__actions">
        <button class="btn-primary">Connect</button>
        <button class="btn">Message</button>
      </div>
    </article>`).join('');
}
export default { renderContacts };