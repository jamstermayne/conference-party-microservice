import Events from './foundation/events.js';

function parseInviteFromURL(){
  const m1 = location.pathname.match(/\/invite\/([A-Za-z0-9\-]+)/);
  if (m1) return m1[1];
  const url = new URL(location.href);
  return url.searchParams.get('invite') || null;
}
async function validate(code){
  try{
    const r = await fetch(`/api/invites/validate?code=${encodeURIComponent(code)}`, { credentials:'include' });
    return r.ok;
  }catch{ return false; }
}

export async function handleInviteDeeplink(){
  const code = parseInviteFromURL();
  if (!code) return;
  Events.emit?.('invite:deeplink', { code });
  const ok = await validate(code);
  if (ok){
    document.dispatchEvent(new CustomEvent('ui:toast',{ detail:{ type:'ok', message:'Invite detected' }}));
    Events.emit?.('navigate', '#invites');
    Events.emit?.('invite:redeem', { code });
  }else{
    document.dispatchEvent(new CustomEvent('ui:toast',{ detail:{ type:'error', message:'Invalid invite link' }}));
  }
}

if (document.readyState !== 'loading') handleInviteDeeplink();
else document.addEventListener('DOMContentLoaded', handleInviteDeeplink);