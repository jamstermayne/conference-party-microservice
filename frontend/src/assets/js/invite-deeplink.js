// Parse /invite/:code and emit to invite system, route to Invites
import Events from './events.js';
import Store from './store.js';

function parseInviteFromLocation(){
  const path = location.pathname.replace(/\/+$/,'');
  const m = path.match(/^\/invite\/([A-Za-z0-9\-]+)/);
  if (m) return m[1];
  // Fallback: ?invite=CODE
  const p = new URLSearchParams(location.search);
  if (p.has('invite')) return p.get('invite');
  return null;
}

function handle(){
  const code = parseInviteFromLocation();
  if (!code) return;
  // Persist temporarily for later flows
  Store.patch('invites.pendingCode', code);
  // Notify invite controller layer
  Events.emit('invite:redeem', { code });
  // Navigate to invites panel
  Events.emit('navigate', '/invites');
  // Visual feedback
  Events.emit('ui:toast', { type:'info', message:`Invite detected: ${code}` });
}

document.addEventListener('DOMContentLoaded', handle);