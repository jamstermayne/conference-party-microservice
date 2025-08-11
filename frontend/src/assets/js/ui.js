import { Store } from './state.js';

export function qs(sel, el=document){ return el.querySelector(sel); }
export function qsa(sel, el=document){ return [...el.querySelectorAll(sel)]; }

export function toast(msg){
  const tpl = document.getElementById('tpl-toast');
  if (!tpl) return alert(msg);
  const n = tpl.content.firstElementChild.cloneNode(true);
  n.querySelector('.msg').textContent = msg;
  document.body.appendChild(n);
  setTimeout(()=> n.remove(), 1800);
  const sr = document.getElementById('sr-live'); if (sr) sr.textContent = msg;
}

export function setTitle(t){ const h = document.getElementById('page-title'); if (h) h.textContent = t; }

export function bump(el){ if (!el) return; el.classList.add('bump'); setTimeout(()=> el.classList.remove('bump'), 340); }

export function showInstallCard({ ios=false }={}){
  const card = qs('#install-card'); if (!card) return;
  qs('#ios-hint').hidden = !ios;
  qs('#install-now').hidden = ios;
  card.hidden = false;
}

export function hideInstallCard(){ const card = qs('#install-card'); if (card) card.hidden = true; }

export function renderPillCount(){
  const pill = document.getElementById('invite-pill');
  if (!pill) return;
  pill.textContent = Store.invites.left;
}