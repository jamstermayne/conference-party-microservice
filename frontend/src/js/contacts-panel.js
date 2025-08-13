import { contactCardHTML } from './ui-cards.js?v=b018';

const SEED = [
  { id:'c1', name:'Alex Chen',   role:'Producer', company:'Nebula Games', email:'alex@nebula.gg' },
  { id:'c2', name:'Sam Rivera',  role:'Biz Dev',  company:'Solar Forge',  email:'sam@solarforge.io' },
  { id:'c3', name:'Dana Patel',  role:'Publisher',company:'Blue Owl',     email:'dana@blueowl.com' },
];

export async function renderContacts(mount){
  if(!mount) return;
  addCss('/assets/css/cards.css?v=b018');
  mount.innerHTML = `<div class="v-stack" id="cards-contacts"></div>`;
  const root = document.getElementById('cards-contacts');
  root.innerHTML = SEED.map(contactCardHTML).join('');
}

function addCss(href){
  if ([...document.styleSheets].some(s=>s.href && s.href.includes('cards.css'))) return;
  const link = document.createElement('link'); link.rel='stylesheet'; link.href=href; document.head.appendChild(link);
}

export default { renderContacts };