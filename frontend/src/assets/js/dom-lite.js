export const $ = (sel,root=document)=>root.querySelector(sel);
export const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));
export const html = (s)=>{ const t=document.createElement('template'); t.innerHTML=s.trim(); return t.content.firstElementChild; };
export function delegate(root, type, sel, fn, opts){ root.addEventListener(type, e=>{ const m=e.target.closest(sel); if(m && root.contains(m)) fn(e,m); }, opts); }
export function mountOverlay(node){
  node.classList.add('panel'); document.body.appendChild(node);
  requestAnimationFrame(()=>node.classList.add('panel--active'));
  return node;
}
export function unmountOverlay(node){ node?.classList.remove('panel--active'); setTimeout(()=>node?.remove(), 220); }
