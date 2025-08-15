const sample = [
  { name:"Alex Chen", role:"Producer", org:"IndieVerse" },
  { name:"Marta Ruiz", role:"BizDev",  org:"PlayForge" },
  { name:"Sam Patel",  role:"Engineer",org:"Voxel Labs" }
];
export async function renderContacts(mount){
  if(!mount) return;
  mount.innerHTML = `<section class="vwrap">
    <h2 class="vh1">Contacts</h2>
    <div class="vgrid" id="contacts-grid"></div>
  </section>`;
  const c = mount.querySelector("#contacts-grid");
  if (!c) return;
  c.innerHTML = sample.map(p => `
    <article class="vcard">
      <div class="vhead"><div class="vtitle">${p.name}</div><div class="vbadges"><span class="vpill">${p.role}</span></div></div>
      <div class="vmeta">🏢 ${p.org}</div>
      <div class="vactions"><button class="vbtn primary">Open Profile</button><button class="vbtn">Message</button></div>
    </article>`).join("");
}
export default { renderContacts };