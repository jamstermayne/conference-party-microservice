// Minimal hash router + sidebar binder (production)
import Events from './events.js';
import { renderAccount } from './account.js';
import { setTitles } from './route-title.js';

const NAV = ['parties','hotspots','map','calendar','invites','me'];
let _sidebarEl = null;
let _current = null;

function norm(hash) {
  if (!hash) return 'parties';
  return hash.replace(/^#\/?/, '').split('?')[0] || 'parties';
}

function highlightSidebar() {
  if (!_sidebarEl) return;
  _sidebarEl.querySelectorAll('a[data-route]').forEach(el => {
    el.classList.toggle('active', el.dataset.route === _current);
  });
}

export function bindSidebar(root=document) {
  _sidebarEl = root.querySelector('[data-sidebar]');
  if (!_sidebarEl) return;
  
  // Render once (prevents blink/disappear)
  if (_sidebarEl.dataset.wired !== '1') {
    _sidebarEl.innerHTML = `
      <div class="brand">
        <a href="#/parties" class="brand-link">
          <img src="/images/veloc-v.svg" alt="velocity.ai" width="24" height="24" />
          <div class="brand-meta">
            <div class="b-name">velocity.ai</div>
            <div class="b-sub">gamescom 2025</div>
          </div>
        </a>
      </div>
      <nav class="nav">
        ${NAV.map(n=>`<a href="#/${n}" data-route="${n}"><span class="hash">#</span><span class="lbl">${n}</span></a>`).join('')}
      </nav>`;
    _sidebarEl.dataset.wired = '1';
    _sidebarEl.querySelectorAll('a[data-route]').forEach(el=>{
      el.addEventListener('click',(e)=>{ 
        e.preventDefault(); 
        route(el.getAttribute('data-route')); 
      }, {passive:false});
    });
  }
  highlightSidebar();
}

export function route(to) {
  const name = typeof to === 'string' ? to : norm(location.hash);
  const r = (name === 'settings') ? 'me' : name;
  _current = r;
  highlightSidebar();
  Events.emit?.('route:change', { name: r });
  setTitles(r);
  
  const app = document.getElementById('app'); 
  if (app) app.innerHTML = '';
  
  if (r === 'parties')   { 
    import('./events-controller.js').then(m=>m.renderParties?.(app));
    Events.emit?.('route:parties');
    return;
  }
  if (r === 'hotspots')  { 
    import('./hotspots.js').then(m=>m.renderHotspots?.(app));
    Events.emit?.('route:hotspots');
    return;
  }
  if (r === 'calendar')  { 
    import('./calendar-view.js').then(m=>m.renderCalendar?.(app));
    Events.emit?.('route:calendar');
    return;
  }
  if (r === 'map')       { 
    import('./map-controller.js').then(m=>m.renderMap?.(app));
    Events.emit?.('route:map');
    return;
  }
  if (r === 'invites')   { 
    import('./invite-panel.js').then(m=>m.renderInvites?.(app));
    Events.emit?.('route:invites');
    return;
  }
  if (r === 'me' || r === 'account')        { 
    renderAccount?.();
    Events.emit?.('route:account');
    return;
  }
  
  // Fallback
  if (app) app.innerHTML = `<div class="card"><div style="color:#9aa3b2">This feature isn't available yet.</div></div>`;
}

function routeFromHash() {
  return norm(location.hash);
}

// boot
window.addEventListener('hashchange', ()=> route(routeFromHash()));
export function startRouter() { 
  bindSidebar(); 
  return route(routeFromHash()); 
}
export default { route, bindSidebar, startRouter };