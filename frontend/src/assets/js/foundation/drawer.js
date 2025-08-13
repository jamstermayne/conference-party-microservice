// drawer.js - off-canvas controller for mobile
const html = document.documentElement;
const body = document.body;
const sidebar = document.getElementById('sidebar');
const mask = document.getElementById('mask');
const burger = document.getElementById('burger');

let open = false;
function lockScroll(on){ body.style.overflow = on ? 'hidden' : ''; }
function setAria(on){
  burger?.setAttribute('aria-expanded', String(on));
  sidebar?.setAttribute('aria-hidden', String(!on));
  if (mask) mask.hidden = !on;
}

export function openDrawer(){
  if (open) return;
  open = true;
  sidebar?.classList.add('is-open');
  mask?.classList.add('is-open');
  lockScroll(true);
  setAria(true);
}

export function closeDrawer(){
  if (!open) return;
  open = false;
  sidebar?.classList.remove('is-open');
  mask?.classList.remove('is-open');
  lockScroll(false);
  setAria(false);
}

export function initDrawer(){
  if (!burger || !sidebar) return;
  burger.addEventListener('click', ()=> open ? closeDrawer() : openDrawer());
  mask?.addEventListener('click', closeDrawer);
  window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeDrawer(); });
  // Close when navigating routes
  window.addEventListener('hashchange', closeDrawer);
  // If desktop width, ensure closed state
  const mq = window.matchMedia('(min-width: 1024px)');
  mq.addEventListener?.('change', e => { if (e.matches) closeDrawer(); });
  setAria(false);
}