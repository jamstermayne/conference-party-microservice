import '/assets/css/tokens.css';
import { currentRoute, route } from './router.js';

let injected = false;

export async function ensureShell(){
  if (injected) return;
  const res = await fetch('/assets/templates/shell.html', { cache: 'no-store' });
  const html = await res.text();
  document.body.innerHTML = html; // full replace -> single source
  injected = true;

  // Wire clicks
  document.querySelectorAll('.nav-item').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const r = a.getAttribute('data-route');
      if (!r) return;
      route(r);
    }, { passive:false });
  });

  // Initial active state
  setActive(currentRoute());
}

export function setActive(r){
  document.querySelectorAll('.nav-item').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('data-route') === r);
  });
}