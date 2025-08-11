// Auto-instrument critical UX + unify error toasts. Zero controller edits needed.
import Events from './events.js';
import Metrics from './metrics.js';

// ---- Metrics hooks ----------------------------------------------------------
function m(name, props={}){ try{ Metrics.track(name, props); }catch(_){} }

// Parties / Events
Events.on('action:save',        ({ id }) => m('party_saved', { id }));
Events.on('action:attend',      ({ id }) => m('party_rsvp', { id }));
Events.on('action:share',       ({ id }) => m('party_share', { id }));
Events.on('action:navigate',    ({ address }) => m('navigate_open', { address }));

// Calendar
document.addEventListener('ui:calendar-connected', () => m('calendar_connected', {}));
document.addEventListener('ui:addToCalendar',      () => m('calendar_add_clicked', {}));

// PWA
window.addEventListener('beforeinstallprompt', ()=> m('install_prompt_shown', {}));
window.addEventListener('appinstalled',        ()=> m('install_accepted', {}));

// Auth
Events.on('auth:linkedin:connected', ()=> m('linkedin_connected', {}));
document.addEventListener('auth:google:connected', ()=> m('google_connected', {}));

// Invites (deeplink + redeem)
Events.on('invite:redeem', ({ code }) => {
  const prefix = (code||'').split('-')[0] || 'UNKNOWN';
  m('invite_deeplink', { prefix });
});
Events.on('invite:redeemed', ({ code }) => {
  const prefix = (code||'').split('-')[0] || 'UNKNOWN';
  m('invite_redeemed', { prefix });
});

// Route changes
Events.on('route:change', ({ route }) => m('route_change', { route }));

// ---- Error → toast normalization -------------------------------------------
function toastError(msg){
  try{ document.dispatchEvent(new CustomEvent('ui:toast', { detail:{ type:'error', message: msg }})); }
  catch(_){ console.error('[ERROR]', msg); }
}

// Generic network failure bridge
window.addEventListener('unhandledrejection', (e)=>{
  const r = e?.reason;
  if (r && (r.status || r.message === 'timeout')){
    toastError('Network issue. Please try again.');
  }
});

// Specific error channels (emit from anywhere for consistency)
document.addEventListener('ui:error', (e)=>{
  const msg = (e.detail && e.detail.message) || 'Something went wrong';
  toastError(msg);
});

// ---- Boot marker ------------------------------------------------------------
m('app_boot', { route: location.hash || '#parties' });