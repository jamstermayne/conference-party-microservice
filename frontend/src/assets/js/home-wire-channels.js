// home-wire-channels.js — normalize channel buttons under the sections
// Final order: Invites, My Calendar, Contacts, Account
// Remove: Settings; Remove: extra "Map" channel button
const WANT = [
  { key:'invites',  label:'Invites',     href:'#/invites',  icon:'✉️' },
  { key:'cal',      label:'My calendar', href:'#/calendar', icon:'📅' },
  { key:'contacts', label:'Contacts',    href:'#/contacts', icon:'👥' },
  { key:'account',  label:'Account',     href:'#/me',       icon:'👤' },
];

function ensureChannelsSection() {
  // Check if channels section exists
  let section = document.querySelector('.home-section[data-section="channels"]');
  if (!section) {
    // Create it after map section
    const mapSection = document.querySelector('.home-section[data-section="map"]');
    if (mapSection) {
      section = document.createElement('section');
      section.className = 'home-section';
      section.dataset.section = 'channels';
      section.innerHTML = '<h2>Quick Actions</h2><div class="channels-grid"></div>';
      mapSection.parentNode.insertBefore(section, mapSection.nextSibling);
    }
  }
  return section?.querySelector('.channels-grid');
}

function normalizeChannels() {
  const wrap = ensureChannelsSection();
  if (!wrap) return;

  // Clear and rebuild
  wrap.innerHTML = '';
  for (const item of WANT) {
    const a = document.createElement('a');
    a.className = 'channel-btn';
    a.href = item.href;
    a.setAttribute('role', 'button');
    a.innerHTML = `<span class="ico" aria-hidden="true">${item.icon}</span> ${item.label}`;
    wrap.appendChild(a);
  }
}

// Wait for DOM and pills to render
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(normalizeChannels, 100);
  });
} else {
  setTimeout(normalizeChannels, 100);
}