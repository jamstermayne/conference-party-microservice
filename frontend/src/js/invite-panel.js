export async function renderInvites(mount){
  if(!mount) return;
  const invites = [
    { id:"vip",  title:"Exclusive Access", from:"Pat • VIP Opening Night", code:"VX1-A", expires:"Aug 20", state:"accepted" },
    { id:"dev",  title:"Developer Meetup", from:"Jules • Unity Mixer",     code:"VX1-B", expires:"Aug 22", state:"pending" },
    { id:"pub",  title:"Publisher Party",  from:"Morgan • EA Lounge",      code:"VX1-C", expires:"Aug 23", state:"pending" }
  ];
  mount.innerHTML = `<section style="margin:24px">
    <h2 style="margin:0 0 14px">Your Invites</h2>
    <div id="invite-list"></div>
  </section>`;
  const el = document.getElementById("invite-list");
  el.innerHTML = invites.map(x => `
    <article class="vcard">
      <div class="vcard__head">
        <div class="vcard__title">${x.title}</div>
      </div>
      <div class="vmeta">From: ${x.from}</div>
      <ul class="vmeta" style="margin-top:0">
        <li>• Code: <strong>${x.code}</strong></li>
        <li>• Expires: ${x.expires}</li>
      </ul>
      <div class="vactions">
        ${x.state==="accepted"
          ? `<button class="vbtn">View</button><button class="vbtn ghost">Share</button>`
          : `<button class="vbtn primary">Accept</button><button class="vbtn ghost">Share</button>`}
      </div>
    </article>
  `).join("");
}
export default { renderInvites };
