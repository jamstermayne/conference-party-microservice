const CONTACTS = [
  { id:'1', name:'Alex Rivera', role:'BD @ Studio X', where:'Hall 9', badges:['live'] },
  { id:'2', name:'Sam Wu', role:'Producer @ IndieDev', where:'Confex A', badges:[''] },
];
function pill(b){ return b?`<span class="vcard__pill">${b}</span>`:'' }
function card(c){
  return `<article class="vcard">
    <div class="vcard__head">
      <div class="vcard__title">${c.name}</div>
      <div class="vcard__badges">${(c.badges||[]).map(pill).join('')}</div>
    </div>
    <div class="vcard__subtitle">${c.role}</div>
    <ul class="vcard__meta"><li>📍 ${c.where}</li></ul>
    <div class="vcard__actions">
      <button class="btn btn-primary">Message</button>
      <button class="btn">Details</button>
    </div>
  </article>`;
}
export async function renderContacts(m){
  m.innerHTML = `<h2 style="margin:0 0 14px">Contacts</h2><div class="vstack">${CONTACTS.map(card).join('')}</div>`;
}
export default { renderContacts };
