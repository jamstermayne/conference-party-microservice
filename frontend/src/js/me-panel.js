import { meCardHTML } from './ui-cards.js?v=b018';

const FALLBACK = { name:'Your Profile', role:'Attendee', status:'active', email:'', linkedin:false };

export async function renderMe(mount){
  if(!mount) return;
  addCss('/assets/css/cards.css?v=b018');
  const me = window.__USER || FALLBACK;
  mount.innerHTML = `<div class="v-stack" id="cards-me">${meCardHTML(me)}</div>`;
}

function addCss(href){
  if ([...document.styleSheets].some(s=>s.href && s.href.includes('cards.css'))) return;
  const link = document.createElement('link'); link.rel='stylesheet'; link.href=href; document.head.appendChild(link);
}

export default { renderMe };