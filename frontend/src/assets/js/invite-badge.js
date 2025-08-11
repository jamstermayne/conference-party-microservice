import Store from './foundation/store.js';
const badge = () => document.getElementById('invites-badge');

function paint(n){
  const el = badge(); if (!el) return;
  if (typeof n !== 'number' || n < 0) { el.textContent = '—'; el.title = 'Invites'; return; }
  el.textContent = n;
  el.title = `${n} invite${n===1?'':'s'} left`;
}

async function fetchCount(){
  try{
    const r = await fetch('/api/invites/status', { credentials:'include' });
    if (!r.ok) throw new Error('http');
    const j = await r.json();
    const left = Number(j?.data?.left ?? j?.left ?? 0);
    Store.patch('invites.left', left);
    paint(left);
  }catch(_){
    // Quiet fallback; leave current value and do not log
    const n = Store.get('invites.left');
    paint(typeof n==='number' ? n : null);
  }
}

export function refreshInviteCount(){ fetchCount(); }
export function initInviteBadge(){
  paint(Store.get('invites.left'));
  if (window.__ENV?.INVITES_API !== false) {
    fetchCount();
  }
  // live updates on events
  document.addEventListener('invite:redeemed', (e)=>{
    const left = Number(e.detail?.left ?? Store.get('invites.left'));
    Store.patch('invites.left', left);
    paint(left);
  });
  document.addEventListener('invite:bonus', (e)=>{
    const left = Number(e.detail?.left ?? Store.get('invites.left'));
    Store.patch('invites.left', left);
    paint(left);
  });
}
if (document.readyState !== 'loading') initInviteBadge();
else document.addEventListener('DOMContentLoaded', initInviteBadge);