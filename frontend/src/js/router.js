/** Minimal hash router + sidebar binder */
import Events from '/assets/js/events.js';
const NAV = ['parties','calendar','map','hotspots','invites','contacts','me','settings'];
let _current = null;

function norm(hash){ if(!hash) return 'parties'; return hash.replace(/^#\/?/, '').split('?')[0] || 'parties'; }
export function currentRoute(){ return _current; }

export function bindSidebar(){
  const side = document.getElementById('side-nav'); if(!side) return;
  side.querySelectorAll('.nav-item').forEach(btn=>{
    btn.addEventListener('click', e=>{ e.preventDefault(); route(btn.getAttribute('data-route')); }, {passive:false});
  });
}
export function route(name){
  const r = NAV.includes(name) ? name : 'parties';
  _current = r;
  // Active item
  const side = document.getElementById('side-nav');
  if(side){ side.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active', b.getAttribute('data-route')===r)); }
  // Mount
  const app = document.getElementById('app'); if(app) app.innerHTML = '';
  if(r==='parties'){ import('./events-controller.js').then(m=>m.renderParties?.(app)); Events.emit?.('route:parties'); return; }
  if(r==='calendar'){ import('./calendar-view.js').then(m=>m.renderCalendar?.(app)); Events.emit?.('route:calendar'); return; }
  if(r==='map'){ import('./map-controller.js').then(m=>m.renderMap?.(app)); Events.emit?.('route:map'); return; }
  if(r==='hotspots'){ import('./hotspots.js').then(m=>m.renderHotspots?.(app)); Events.emit?.('route:hotspots'); return; }
  if(r==='invites'){ import('./invite-panel.js').then(m=>m.renderInvites?.(app)); Events.emit?.('route:invites'); return; }
  if(r==='contacts'){ import('./contacts.js').then(m=>m.renderContacts?.(app)); Events.emit?.('route:contacts'); return; }
  if(r==='me'){ import('./me.js').then(m=>m.renderMe?.(app)); Events.emit?.('route:me'); return; }
  if(r==='settings'){ import('./settings.js').then(m=>m.renderSettings?.(app)); Events.emit?.('route:settings'); return; }
}
window.addEventListener('hashchange', ()=> route(norm(location.hash)));
window.addEventListener('DOMContentLoaded', ()=>{ bindSidebar(); route(norm(location.hash)); });