export async function renderInvites(mount){
  if(!mount) return;
  const invites = (await fetch('/assets/data/invites.json').then(r=>r.json()).catch(()=>[])) || [];
  mount.innerHTML = `<section style="padding:16px 20px"><h2 style="color:#eaf0ff;margin:0 0 12px">Invites</h2><div id="i-list"></div></section>`;
  const list = mount.querySelector('#i-list');
  list.innerHTML = invites.map(inv=>`
    <article class="vcard">
      <div class="vcard__head">
        <div class="vcard__title">${inv.toName||inv.email}</div>
        <div class="vcard__badges"><span class="vcard__pill ${inv.status==='accepted'?'is-live':''}">${inv.status||'pending'}</span></div>
      </div>
      <div class="vcard__subtitle">from ${inv.fromName||'me'}</div>
      <ul class="vcard__meta"><li>code: ${inv.code||''}</li><li>${inv.sentAt||''}</li></ul>
      <div class="vcard__actions"><button class="btn-primary">Resend</button><button class="btn">Copy link</button></div>
    </article>`).join('');
}
export default { renderInvites };