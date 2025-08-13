export async function renderMe(mount){
  if(!mount) return;
  const me = {
    name: "Your Name",
    title: "Founder",
    org: "velocity.ai",
    email: "you@example.com",
    link: "linkedin.com/in/you"
  };
  const initials = (n)=> (n||"")
    .split(/\s+/).filter(Boolean).map(x=>x[0]).join("").slice(0,2).toUpperCase();

  mount.innerHTML = `
    <section style="margin:24px">
      <h2 style="margin:0 0 14px">My profile</h2>
      <article class="vcard vprofile">
        <div class="vpf-avatar">${initials(me.name)}</div>
        <div class="vpf-body">
          <div class="vpf-name">${me.name}</div>
          <div class="vpf-meta">${me.title} • ${me.org}</div>
          <div class="vpf-row">📧 ${me.email} ${me.link ? "• 🔗 "+me.link : ""}</div>
          <div class="vactions">
            <button class="vbtn primary">Edit profile</button>
            <button class="vbtn ghost">Share</button>
          </div>
        </div>
      </article>
    </section>`;
}
export default { renderMe };
