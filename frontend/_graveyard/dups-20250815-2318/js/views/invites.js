const INVITES = [
  { email:'sam@example.com', status:'accepted' },
  { email:'jordan@example.com', status:'sent' },
  { email:'lee@example.com', status:'redeemed' },
];
function statusPill(s){
  const c = s==='accepted'?'is-live': (s==='redeemed'?'is-free':'');
  return `<span class="vcard__pill ${c}">${s}</span>`;
}
function card(i){
  return `<article class="vcard">
    <div class="vcard__head">
      <div class="vcard__title">${i.email}</div>
      <div class="vcard__badges">${statusPill(i.status)}</div>
    </div>
    <div class="vcard__subtitle">Invite</div>
    <div class="vcard__actions">
      <button class="btn btn-primary">Resend</button>
      <button class="btn">Details</button>
    </div>
  </article>`;
}
export async function renderInvites(m){
  m.innerHTML = `<h2 style="margin:0 0 14px">Invites</h2><div class="vstack">${INVITES.map(card).join('')}</div>`;
}
export default { renderInvites };
