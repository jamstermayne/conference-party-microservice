/**
 * Minimal hash router with stable sidebar and title updates.
 */
import { setTitles } from './route-title.js';

const NAV = [
  ['parties','#parties'],
  ['hotspots','#hotspots'],
  ['map','#map'],
  ['calendar','#calendar'],
  ['invites','#invites'],
  ['me','account'] // not a channel; label shown without '#'
];

let _side=null, _app=null, _current='';

function norm(hash){
  if(!hash) return 'parties';
  return hash.replace(/^#\/?/, '').split('?')[0] || 'parties';
}

function ensureSidebar(){
  _side = document.getElementById('sidebar');
  if(!_side) return;

  const missing = NAV.some(([r])=>!_side.querySelector(`[data-route="${r}"]`));
  if(missing){
    _side.innerHTML = NAV.map(([r,label])=>{
      const isAccount = r==='me';
      const icon = isAccount ? `<span class="gear">⚙️</span>` : `<span class="hash">#</span>`;
      const text = isAccount ? 'account' : label.replace(/^##?/,'#'); // normalize single '#'
      return `<button class="channel" data-route="${r}" aria-label="${text}">${icon}<span>${text}</span></button>`;
    }).join('');
  }

  _side.querySelectorAll('.channel').forEach(btn=>{
    btn.onclick = (e)=>{ e.preventDefault(); route(btn.getAttribute('data-route')); };
  });
}

function highlight(route){
  if(!_side) return;
  _side.querySelectorAll('.channel').forEach(b=>b.classList.remove('active'));
  const el = _side.querySelector(`[data-route="${route}"]`);
  if(el) el.classList.add('active');
}

async function mount(route){
  _app = document.getElementById('app');
  if(!_app) return;

  // clean mount
  _app.innerHTML = '';

  if(route==='parties'){
    const m = await import('./events-controller.js');
    await m.renderParties(_app);
    return;
  }
  if(route==='hotspots'){
    const m = await import('./hotspots.js');
    await m.renderHotspots(_app);
    return;
  }
  if(route==='calendar'){
    const m = await import('./calendar-view.js');
    await m.renderCalendar(_app);
    return;
  }
  if(route==='map'){
    const m = await import('./map-controller.js');
    await m.renderMap(_app);
    return;
  }
  if(route==='invites'){
    const m = await import('./invite-panel.js');
    await m.renderInvites(_app);
    return;
  }
  if(route==='me'){
    const m = await import('./account.js');
    await m.renderAccount(_app);
    return;
  }
  _app.textContent = 'Not found.';
}

export async function route(next){
  const r = norm(typeof next==='string' ? next : location.hash);
  if(r===_current) return;
  _current = r;

  ensureSidebar();
  highlight(r);
  setTitles(r);

  // update hash without double hashes
  if(location.hash.replace(/^#\/?/, '') !== r){
    history.replaceState(null,'',`#/${r}`);
  }

  await mount(r);
}

window.addEventListener('hashchange', ()=>route(location.hash));
window.addEventListener('DOMContentLoaded', ()=>route(location.hash));