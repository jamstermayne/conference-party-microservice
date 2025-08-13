export async function renderMe(mount){
  if(!mount) return;
  mount.innerHTML = `<section class="vwrap">
    <h2 class="vh1">My Profile</h2>
    <article class="vcard">
      <div class="vhead"><div class="vtitle">Your Name</div><div class="vbadges"><span class="vpill">Member</span></div></div>
      <div class="vmeta">📧 you@example.com • 🔗 linkedin.com/in/you</div>
      <div class="vactions"><button class="vbtn primary">Edit Profile</button><button class="vbtn">Manage Account</button></div>
    </article>
  </section>`;
}
export default { renderMe };