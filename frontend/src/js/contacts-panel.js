export async function renderContacts(mount){
  if(!mount) return;
  const people = [
    { name:"Alex Chen",   title:"Producer online", org:"Nebula Games",  loc:"Hall 7, Booth A23", link:"" },
    { name:"Sam Rivera",  title:"Biz Dev verified", org:"Solar Forge",   loc:"Business Area",     link:"" },
    { name:"Dana Patel",  title:"Publisher",        org:"Blue Owl",      loc:"",                  link:"linkedin.com/in/danapatel" }
  ];
  mount.innerHTML = `<section style="margin:24px">
    <h2 style="margin:0 0 14px">Professional Network</h2>
    <div id="people"></div>
  </section>`;
  const el = document.getElementById("people");
  el.innerHTML = people.map(p => `
    <article class="vcard">
      <div class="vcard__head"><div class="vcard__title">${p.name}</div></div>
      <div class="vmeta">${p.title}${p.org ? " • "+p.org : ""}</div>
      ${p.loc  ? `<div class="vmeta">📍 ${p.loc}</div>` : ""}
      ${p.link ? `<div class="vmeta">🔗 ${p.link}</div>` : ""}
      <div class="vactions">
        <button class="vbtn primary">Connect</button>
        <button class="vbtn">Message</button>
      </div>
    </article>
  `).join("");
}
export default { renderContacts };
