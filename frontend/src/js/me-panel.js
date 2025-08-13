export async function renderMe(mount){
  if(!mount) return;
  const me = (await fetch('/assets/data/me.json').then(r=>r.json()).catch(()=>({}))); 
  mount.innerHTML = `<section style="padding:16px 20px"><h2 style="color:#eaf0ff;margin:0 0 12px">My profile</h2>
    <article class="vcard">
      <div class="vcard__head">
        <div class="vcard__title">${me.name||'Me'}</div>
        <div class="vcard__badges"><span class="vcard__pill">${me.role||'Attendee'}</span></div>
      </div>
      <div class="vcard__subtitle">${me.company||''}</div>
      <ul class="vcard__meta"><li>✉️ ${me.email||''}</li></ul>
      <div class="vcard__actions"><button class="btn-primary">Edit</button></div>
    </article></section>`;
}
export default { renderMe };