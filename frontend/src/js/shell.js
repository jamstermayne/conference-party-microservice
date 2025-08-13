import '/assets/css/tokens.css';
import { currentRoute, route } from './router.js';

let injected=false;
export async function ensureShell(){
  if (injected) return;
  const res = await fetch('/assets/templates/shell.html',{cache:'no-store'});
  document.body.innerHTML = await res.text();
  injected = true;
  
  // Wire nav clicks - close mobile sidebar on selection
  document.querySelectorAll('.nav-item').forEach(a=>{
    a.addEventListener('click',(e)=>{
      e.preventDefault();
      route(a.dataset.route);
      // Close mobile sidebar
      const sidebar = document.querySelector('.sidebar');
      if(sidebar && window.innerWidth <= 768) sidebar.classList.remove('open');
    },{passive:false});
  });
  
  setActive(currentRoute());
}

export function setActive(r){
  document.querySelectorAll('.nav-item').forEach(a=>{
    a.classList.toggle('active', a.dataset.route===r);
  });
}