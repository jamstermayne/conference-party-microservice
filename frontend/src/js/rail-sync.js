function currentRoute(){
  const h = location.hash || '#/parties';
  const m = h.match(/#\/([^?]+)/);
  return m ? m[1] : 'parties';
}

function applyActiveUI(routeId){
  // Sidebar
  document.querySelectorAll('.side-nav .nav-item').forEach(el=>{
    el.classList.toggle('active', el.getAttribute('data-route') === routeId);
  });

  // Main sections (expects ids like "view-parties", "view-hotspots", ...)
  document.querySelectorAll('main .section-rail').forEach(sec=>{
    const id = (sec.id || '').replace(/^view-/, '');
    const isCurrent = id === routeId;
    sec.toggleAttribute('hidden', !isCurrent);
    sec.classList.toggle('is-current', isCurrent);
  });
}

// Initial + on hash navigation
document.addEventListener('DOMContentLoaded', ()=> applyActiveUI(currentRoute()));
window.addEventListener('hashchange', ()=> applyActiveUI(currentRoute()));

export {}; // ESM