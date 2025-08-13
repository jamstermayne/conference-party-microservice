export async function renderContacts(mount){
  if(!mount) return;
  const people = [
    { name:"Alex Chen",  title:"Producer",        org:"Nebula Games", loc:"Hall 7, Booth A23",  link:"" },
    { name:"Sam Rivera", title:"Biz Dev",         org:"Solar Forge",  loc:"Business Area",      link:"" },
    { name:"Dana Patel", title:"Publisher",       org:"Blue Owl",     loc:"",                   link:"linkedin.com/in/danapatel" }
  ];
  const initials = (n)=> (n||"").split(/\s+/).filter(Boolean).map(x=>x[0]).join("").slice(0,2).toUpperCase();

  mount.innerHTML = `
    <section style="margin:24px">
      <h2 style="margin:0 0 14px">Professional Network</h2>
      <div id="people"></div>
    </section>`;
  const el = document.getElementById("people");
  el.innerHTML = people.map(p => `
    <article class="vcard vprofile">
      <div class="vpf-avatar">${initials(p.name)}</div>
      <div class="vpf-body">
        <div class="vpf-name">${p.name}</div>
        <div class="vpf-meta">${p.title}${p.org ? " • "+p.org : ""}</div>
        ${p.loc  ? `<div class="vpf-row">📍 ${p.loc}</div>` : ""}
        ${p.link ? `<div class="vpf-row">🔗 ${p.link}</div>` : ""}
        <div class="vactions">
          <button class="vbtn primary">Connect</button>
          <button class="vbtn">Message</button>
        </div>
      </div>
    </article>`).join("");
}
export default { renderContacts };
