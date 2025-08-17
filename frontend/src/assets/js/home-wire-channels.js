// home-wire-channels.js — normalize channel buttons under the sections
// Final order: Invites, My Calendar, Contacts, Account
// Remove: Settings; Remove: extra "Map" channel button
const WANT = [
  { key:'invites',  label:'Invites',     href:'#/invites',  icon:'✉️' },
  { key:'cal',      label:'My calendar', href:'#/calendar', icon:'📅' },
  { key:'contacts', label:'Contacts',    href:'#/contacts', icon:'👥' },
  { key:'account',  label:'Account',     href:'#/me',       icon:'👤' },
];

function normalizeChannels() {
  const wrap = document.querySelector('.home-panel .channels-grid');
  if (!wrap) return;

  // remove any buttons we don't want (Settings, Map)
  [...wrap.children].forEach(n => {
    const t = (n.textContent || '').toLowerCase();
    if (t.includes('settings') || t.match(/\bmap\b/)) n.remove();
  });

  // build dictionary of existing (reuse if present)
  const findByLabel = (lab) =>
    [...wrap.children].find(n => (n.textContent||'').trim().toLowerCase().includes(lab.toLowerCase()));

  // ensure final order & existence
  wrap.innerHTML = '';
  for (const item of WANT) {
    const exist = findByLabel(item.label);
    const a = exist || Object.assign(document.createElement('a'), { className:'channel-btn', href:item.href });
    a.setAttribute('role','button');
    a.innerHTML = `<span class="ico" aria-hidden="true">${item.icon}</span> ${item.label}`;
    wrap.appendChild(a);
  }
}

document.addEventListener('DOMContentLoaded', normalizeChannels);