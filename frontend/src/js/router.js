/**
 * Router: toggles [data-view] and asks view-registry to render only the active
 * Never clears #app; the shell is stable.
 */
import Events from './events.js';
import { setTitles } from './route-title.js';

const NAV = ['parties','hotspots','map','calendar','invites','me'];
let _current = null;

const q = sel => document.querySelector(sel);
const qa = sel => Array.from(document.querySelectorAll(sel));
const norm = (hash)=> (hash||'#/parties').replace(/^#\/?/, '').split('?')[0] || 'parties';

export function bindSidebar(doc=document){
  const sb = doc.getElementById('sidebar');
  if (!sb) return;
  
  // Only render if not already rendered
  if (!sb.dataset.wired) {
    sb.innerHTML = `
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
        ${NAV.map(n=>`<a data-route="${n}" href="#/${n}"><span class="hash">#</span><span class="lbl">${n}</span></a>`).join('')}
      </nav>`;
    sb.dataset.wired = '1';
    
    sb.querySelectorAll('a[data-route]').forEach(a=>{
      a.addEventListener('click', (e)=>{ 
        e.preventDefault(); 
        route(a.dataset.route); 
      }, {passive:false});
    });
  }
}

export async function route(to){
  const r = norm(to || location.hash);
  
  // Normalize special routes
  const actualRoute = (r === 'settings') ? 'me' : r;
  
  if (_current === actualRoute) return;
  _current = actualRoute;

  // Update URL if needed
  if (location.hash !== `#/${actualRoute}`) {
    location.hash = `#/${actualRoute}`;
  }

  // Highlight active in sidebar
  q('#sidebar')?.querySelectorAll('a[data-route]').forEach(a=>{
    a.classList.toggle('active', a.dataset.route === actualRoute);
  });

  // Toggle [data-view] sections
  qa('[data-view]').forEach(s => {
    s.classList.toggle('hidden', s.getAttribute('data-view') !== actualRoute);
  });

  // Update titles
  setTitles(actualRoute);
  
  // Page header
  const pageTitle = q('[data-page-title]');
  const pageChip = q('[data-page-chip]');
  if (pageTitle) pageTitle.textContent = actualRoute.charAt(0).toUpperCase() + actualRoute.slice(1);
  if (pageChip) pageChip.textContent = `#${actualRoute}`;

  // Ask the view registry to render the active mount only
  try {
    const { renderActive } = await import('./view-registry.js' + (window.__ENV?.BUILD ? `?v=${window.__ENV.BUILD}` : ''));
    await renderActive(actualRoute);
  } catch (e) {
    console.error('route render error', actualRoute, e);
  }

  Events.emit?.('route:change', { name: actualRoute });
}

// Initialize on load
function routeFromHash() {
  return norm(location.hash);
}

window.addEventListener('hashchange', ()=>route(routeFromHash()), {passive:true});

export function startRouter() { 
  bindSidebar(); 
  return route(routeFromHash()); 
}

export default { route, bindSidebar, startRouter };