const BASE='velocity.ai';
const H=document.createElement('h1'); H.className='page-title';
function ensure(){ const app=document.getElementById('app'); if(!app) return null; if(app.firstElementChild!==H){ app.prepend(H);} return H;}
function label(r){ const n=(r||location.hash||'#/parties').replace(/^#\/?/, '').split('?')[0]||'parties'; return `#${n}`;}
export function setTitles(route){const l=label(route); document.title=`${BASE} — ${l}`; const hd=ensure(); if(hd) hd.textContent=l;}
addEventListener('hashchange', ()=>setTitles());
document.addEventListener('DOMContentLoaded', ()=>setTitles());