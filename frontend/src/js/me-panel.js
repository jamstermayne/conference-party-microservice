/**
 * me-panel.js - Account Hub MVP
 * Build: b012
 */

export function renderMe(mount) {
  if (!mount) return;
  
  const section = document.createElement('section');
  section.className = 'section-card';
  
  // Add accent
  const accent = document.createElement('div');
  accent.className = 'left-accent';
  section.appendChild(accent);
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = 'padding:0 22px;margin-bottom:24px';
  header.innerHTML = `
    <h2 style="margin:0;font-size:18px;font-weight:600">Account Hub</h2>
    <p style="color:var(--muted);font-size:13px;margin:8px 0 0">Manage your profile and connections</p>
  `;
  section.appendChild(header);
  
  // Content wrapper
  const content = document.createElement('div');
  content.style.cssText = 'padding:0 22px 22px';
  
  // Profile card
  const profileCard = document.createElement('div');
  profileCard.className = 'card account-card';
  
  // Get user data from localStorage or use defaults
  const userData = JSON.parse(localStorage.getItem('velocity_user') || '{}');
  const userName = userData.name || 'Guest User';
  const userEmail = userData.email || 'guest@velocity.ai';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  profileCard.innerHTML = `
    <div class="account-card__avatar">${userInitials}</div>
    <div class="account-card__name">${userName}</div>
    <div class="account-card__email">${userEmail}</div>
    
    <div class="account-card__stats">
      <div class="stat">
        <div class="stat__value">11</div>
        <div class="stat__label">Invites</div>
      </div>
      <div class="stat">
        <div class="stat__value">0</div>
        <div class="stat__label">Connections</div>
      </div>
      <div class="stat">
        <div class="stat__value">4</div>
        <div class="stat__label">Events</div>
      </div>
    </div>
    
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05)">
      <button class="btn btn-primary" style="width:100%;margin-bottom:8px" onclick="document.getElementById('profile-editor').style.display='block'">
        Edit Profile
      </button>
      <button class="btn btn-secondary" style="width:100%" onclick="alert('LinkedIn integration coming soon!')">
        Connect LinkedIn
      </button>
    </div>
  `;
  content.appendChild(profileCard);
  
  // Profile editor (hidden by default)
  const editor = document.createElement('div');
  editor.id = 'profile-editor';
  editor.style.cssText = 'display:none;margin-top:16px;padding:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:12px';
  editor.innerHTML = `
    <h3 style="font-size:14px;font-weight:600;margin-bottom:16px">Edit Profile</h3>
    <div style="display:flex;flex-direction:column;gap:12px">
      <input type="text" id="edit-name" placeholder="Your name" value="${userName}" 
        style="padding:10px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)">
      <input type="email" id="edit-email" placeholder="Your email" value="${userEmail}"
        style="padding:10px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)">
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="
          const name = document.getElementById('edit-name').value;
          const email = document.getElementById('edit-email').value;
          localStorage.setItem('velocity_user', JSON.stringify({name, email}));
          location.reload();
        ">Save Changes</button>
        <button class="btn btn-secondary" onclick="document.getElementById('profile-editor').style.display='none'">
          Cancel
        </button>
      </div>
    </div>
  `;
  content.appendChild(editor);
  
  // Settings sections
  const settingsTitle = document.createElement('h3');
  settingsTitle.style.cssText = 'font-size:16px;font-weight:600;margin:32px 0 16px';
  settingsTitle.textContent = 'Quick Settings';
  content.appendChild(settingsTitle);
  
  const settingsGrid = document.createElement('div');
  settingsGrid.style.cssText = 'display:grid;gap:12px';
  
  const settings = [
    { icon: '🔔', title: 'Notifications', desc: 'Event reminders & updates', action: 'Toggle notifications' },
    { icon: '🔒', title: 'Privacy', desc: 'Control your data', action: 'Manage privacy' },
    { icon: '🎨', title: 'Appearance', desc: 'Dark theme enabled', action: 'Theme settings' },
    { icon: '📱', title: 'Install App', desc: 'Add to home screen', action: 'Install PWA' }
  ];
  
  settings.forEach(setting => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'display:flex;align-items:center;gap:16px;padding:16px;cursor:pointer';
    card.onclick = () => handleSetting(setting.action);
    
    card.innerHTML = `
      <div style="font-size:24px">${setting.icon}</div>
      <div style="flex:1">
        <div style="font-weight:600;margin-bottom:2px">${setting.title}</div>
        <div style="color:var(--muted);font-size:12px">${setting.desc}</div>
      </div>
      <div style="color:var(--muted)">›</div>
    `;
    
    settingsGrid.appendChild(card);
  });
  
  content.appendChild(settingsGrid);
  
  // Danger zone
  const dangerZone = document.createElement('div');
  dangerZone.style.cssText = 'margin-top:32px;padding:16px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:12px';
  dangerZone.innerHTML = `
    <h3 style="font-size:14px;font-weight:600;margin-bottom:8px;color:#fca5a5">Danger Zone</h3>
    <p style="color:var(--muted);font-size:13px;margin-bottom:12px">These actions cannot be undone</p>
    <button class="btn btn-secondary" style="border-color:rgba(239,68,68,0.3);color:#fca5a5" 
      onclick="if(confirm('Clear all local data?')){localStorage.clear();location.reload()}">
      Clear Local Data
    </button>
  `;
  content.appendChild(dangerZone);
  
  section.appendChild(content);
  mount.replaceChildren(section);
}

function handleSetting(action) {
  switch(action) {
    case 'Install PWA':
      if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
      } else {
        alert('To install: Use browser menu > "Add to Home Screen"');
      }
      break;
    case 'Toggle notifications':
      Notification.requestPermission().then(permission => {
        alert(`Notifications ${permission === 'granted' ? 'enabled' : 'disabled'}`);
      });
      break;
    default:
      alert(`${action} - Coming soon!`);
  }
}

// Capture install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
});

export default { renderMe };