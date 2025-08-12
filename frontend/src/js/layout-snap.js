// Enforce a clean 2-panel layout on hotspot/map screens and ensure side brand looks right.
// Non-destructive: only adds/sets classes if containers exist.

function qs(s,r=document){return r.querySelector(s);}
function addClass(el, c){ if (el && !el.classList.contains(c)) el.classList.add(c); }

function applyTwoPanel(root){
  const wrap = qs('[data-layout="main-grid"]', root) || qs('.main-grid') || qs('#main');
  if (wrap) addClass(wrap, 'main-grid');

  // Hide any accidental right-rail third column if present
  const third = qs('[data-panel="third"]') || qs('.col-third') || qs('.rail-right');
  if (third) third.style.display = 'none';
}

function polishBrand(){
  const head = qs('.side-head');
  const brand = qs('.side-head .brand');
  const ws = qs('.side-head .workspace');
  if (head && brand && ws) {
    head.style.paddingTop = '14px';
    brand.style.letterSpacing = '0.2px';
    ws.style.opacity = '0.9';
  }
}

function onRoute(){
  const r = (location.hash.replace('#/','').split('?')[0] || 'parties');
  if (r === 'hotspots' || r === 'map') applyTwoPanel(document);
}

document.addEventListener('DOMContentLoaded', () => {
  polishBrand();
  onRoute();
});
window.addEventListener('hashchange', onRoute);