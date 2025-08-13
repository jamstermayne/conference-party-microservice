const FALLBACK = {
  name: 'Your Profile',
  email: 'user@example.com',
  role: 'Attendee',
  company: 'Conference Participant',
  status: 'active',
  linkedin: false,
  savedEvents: 3,
  connections: 12,
  invitesSent: 5
};

export async function renderMe(mount){
  if(!mount) return;
  
  const me = window.__USER || FALLBACK;
  
  mount.innerHTML = `
    <section style="padding:16px 20px">
      <h2 style="color:#eaf0ff;margin:0 0 12px">My Profile</h2>
      
      <article class="vcard">
        <div class="vcard__head">
          <div class="vcard__title">${me.name||'Me'}</div>
          <div class="vcard__badges">
            <span class="vcard__pill">${me.role||'Attendee'}</span>
            ${me.status==='active'?'<span class="vcard__pill is-live">active</span>':''}
          </div>
        </div>
        <div class="vcard__subtitle">${me.company||''}</div>
        <ul class="vcard__meta">
          <li>✉️ ${me.email||''}</li>
          ${me.linkedin?`<li>🔗 linkedin.com/in/${me.linkedin}</li>`:''}
        </ul>
        <div class="vcard__actions">
          <button class="btn-primary">Edit Profile</button>
          <button class="btn">Settings</button>
        </div>
      </article>
      
      <article class="vcard" style="margin-top:12px">
        <div class="vcard__head">
          <div class="vcard__title">Conference Stats</div>
        </div>
        <ul class="vcard__meta">
          <li>📅 Events Saved: ${me.savedEvents || 0}</li>
          <li>👥 Connections: ${me.connections || 0}</li>
          <li>✉️ Invites Sent: ${me.invitesSent || 0}</li>
        </ul>
        <div class="vcard__actions">
          <button class="btn-primary">View Calendar</button>
          <button class="btn">Export Contacts</button>
        </div>
      </article>
    </section>`;
}
export default { renderMe };