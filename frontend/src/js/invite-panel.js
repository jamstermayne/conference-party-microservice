const TEN = [
  { id: 'VX1-A', title: 'Exclusive Access', from: 'Pat', email: 'pat@example.com', event: 'VIP Opening Night', expires: 'Aug 20', status: 'accepted', premium: true },
  { id: 'VX1-B', title: 'Developer Meetup', from: 'Jules', email: 'jules@ex.com', event: 'Unity Mixer', expires: 'Aug 22', status: 'sent', urgent: true },
  { id: 'VX1-C', title: 'Publisher Party', from: 'Morgan', email: 'morgan@ex.com', event: 'EA Lounge', expires: 'Aug 23', status: 'pending' },
  { id: 'VX1-D', title: 'Indies Unite', from: 'Kai', email: 'kai@ex.com', event: 'Indie Showcase', expires: 'Aug 24', status: 'sent' },
  { id: 'VX1-E', title: 'Media Preview', from: 'Riley', email: 'riley@ex.com', event: 'Press Conference', expires: 'Expired', status: 'expired', urgent: true },
  { id: 'VX1-F', title: 'Networking Night', from: 'Taylor', email: 'taylor@ex.com', event: 'Business Hub', expires: 'Aug 25', status: 'sent', premium: true },
  { id: 'VX1-G', title: 'After Party', from: 'Casey', email: 'casey@ex.com', event: 'Closing Celebration', expires: 'Aug 26', status: 'pending' },
  { id: 'VX1-H', title: 'Studio Tour', from: 'Jamie', email: 'jamie@ex.com', event: 'Ubisoft Campus', expires: 'Aug 21', status: 'sent' },
  { id: 'VX1-I', title: 'Investment Forum', from: 'Devon', email: 'devon@ex.com', event: 'VC Roundtable', expires: 'Aug 22', status: 'sent', premium: true },
  { id: 'VX1-J', title: 'Award Ceremony', from: 'Alexis', email: 'alexis@ex.com', event: 'Gamescom Awards', expires: 'Aug 25', status: 'sent', urgent: true },
];

export async function renderInvites(mount){
  if(!mount) return;
  
  mount.innerHTML = `
    <section style="padding:16px 20px">
      <h2 style="color:#eaf0ff;margin:0 0 12px">Your Invites</h2>
      <div id="i-list"></div>
    </section>`;
  
  const list = mount.querySelector('#i-list');
  list.innerHTML = TEN.map(inv=>`
    <article class="vcard">
      <div class="vcard__head">
        <div class="vcard__title">${inv.title||inv.email}</div>
        <div class="vcard__badges">
          <span class="vcard__pill ${inv.status==='accepted'?'is-live':''}">${inv.status||'pending'}</span>
          ${inv.premium?'<span class="vcard__pill is-live">premium</span>':''}
          ${inv.urgent?'<span class="vcard__pill is-free">urgent</span>':''}
        </div>
      </div>
      <div class="vcard__subtitle">From: ${inv.from||'Unknown'} • ${inv.event||''}</div>
      <ul class="vcard__meta">
        <li>Code: ${inv.id||''}</li>
        <li>Expires: ${inv.expires||''}</li>
      </ul>
      <div class="vcard__actions">
        <button class="btn-primary">${inv.status==='accepted'?'View':'Accept'}</button>
        <button class="btn">Share</button>
      </div>
    </article>`).join('');
}
export default { renderInvites };