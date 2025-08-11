// Android: capture prompt; iOS: show coachmark. No backend.
import { Events } from '../events.js';

const KEY = { lastHint: 'pwa.lastHintAt', dismissed: 'pwa.dismissed' };
let deferredPrompt = null, shown = false;

export function mountInstallFTUE(){
  window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; maybeShow('bip'); });
  Events.on('calendar.synced', ()=> maybeShow('calendar'));
  Events.on('events.saved', e => { if ((e?.count||0) >= 2) maybeShow('events'); });

  document.getElementById('install-now')?.addEventListener('click', onInstallClick);
  document.getElementById('install-later')?.addEventListener('click', onLaterClick);
  window.addEventListener('appinstalled', ()=>{ hideCard(); Events.emit('pwa.installed'); });
}

function maybeShow(source){
  if (shown || isInstalled() || !shouldHint()) return;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const card = byId('install-ftue'); if (!card) return;

  byId('install-ios-hint').hidden = !isIOS;
  byId('install-now').hidden = isIOS;
  if (!isIOS && !deferredPrompt) return; // wait for Android prompt availability

  card.hidden = false; shown = true; markHint();
  try{ card.scrollIntoView({ behavior:'smooth', block:'center' }); }catch{}
  setTimeout(()=>{ if (!card.hidden) hideCard(); }, 25000);
}

async function onInstallClick(){
  if (!deferredPrompt) return hideCard();
  deferredPrompt.prompt();
  await deferredPrompt.userChoice; deferredPrompt = null;
  hideCard(); // success handled by appinstalled
}
function onLaterClick(){ localStorage.setItem(KEY.dismissed, new Date().toISOString()); hideCard(); }
function hideCard(){ const c = byId('install-ftue'); if (c) c.hidden = true; shown = false; }

function isInstalled(){
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || (navigator.standalone === true);
}
function shouldHint(){
  const now = Date.now();
  const last = Date.parse(localStorage.getItem(KEY.lastHint)||'');
  const dis  = Date.parse(localStorage.getItem(KEY.dismissed)||'');
  if (last && now - last < 6*60*60*1000) return false; // 6h quiet
  if (dis &&  now - dis  < 24*60*60*1000) return false; // 24h snooze
  return true;
}
function markHint(){ localStorage.setItem(KEY.lastHint, new Date().toISOString()); }
function byId(id){ return document.getElementById(id); }