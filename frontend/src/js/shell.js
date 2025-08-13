import '/assets/css/tokens.css';
import { currentRoute, route } from './router.js';

let injected=false;
export async function ensureShell(){
  if (injected) return;
  const res = await fetch('/assets/templates/shell.html',{cache:'no-store'});
  document.body.innerHTML = await res.text();
  injected = true;
  document.querySelectorAll('.nav-item').forEach(a=>{
    a.addEventListener('click',(e)=>{e.preventDefault();route(a.dataset.route)},{passive:false});
  });
  setActive(currentRoute());
}
export function setActive(r){
  document.querySelectorAll('.nav-item').forEach(a=>{
    a.classList.toggle('active', a.dataset.route===r);
  });
}