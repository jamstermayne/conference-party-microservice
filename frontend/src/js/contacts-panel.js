export async function renderContacts(mount){
  if(!mount) return;
  const people = (await fetch('/assets/data/contacts.json').then(r=>r.json()).catch(()=>[])) || [];
  mount.innerHTML = `<section style="padding:16px 20px"><h2 style="color:#eaf0ff;margin:0 0 12px">Contacts</h2><div id="c-list"></div></section>`;
  const list = mount.querySelector('#c-list');
  list.innerHTML = people.map(p=>`
    <article class="vcard">
      <div class="vcard__head">
        <div class="vcard__title">${p.name||'Unknown'}</div>
        <div class="vcard__badges">${p.role?`<span class="vcard__pill">${p.role}</span>`:''}</div>
      </div>
      <div class="vcard__subtitle">${p.company||''}</div>
      <ul class="vcard__meta"><li>✉️ ${p.email||''}</li><li>🕑 ${p.availability||''}</li></ul>
      <div class="vcard__actions"><button class="btn-primary">Message</button><button class="btn">Details</button></div>
    </article>`).join('');
}
export default { renderContacts };