import { inviteCardHTML } from './ui-cards.js?v=b018';

const TEN = [
  { code:'VX1-A', email:'pat@example.com',   toName:'Pat',   status:'sent',     sentAt:'2d ago' },
  { code:'VX1-B', email:'jules@ex.com',      toName:'Jules', status:'redeemed', sentAt:'1d ago' },
  { code:'VX1-C', email:'morgan@ex.com',     toName:'Morgan',status:'pending',  sentAt:'3h ago' },
  { code:'VX1-D', email:'kai@ex.com',        toName:'Kai',   status:'sent',     sentAt:'5h ago' },
  { code:'VX1-E', email:'riley@ex.com',      toName:'Riley', status:'expired',  sentAt:'6d ago' },
  { code:'VX1-F', email:'taylor@ex.com',     toName:'Taylor',status:'sent',     sentAt:'1h ago' },
  { code:'VX1-G', email:'casey@ex.com',      toName:'Casey', status:'pending',  sentAt:'1h ago' },
  { code:'VX1-H', email:'jamie@ex.com',      toName:'Jamie', status:'sent',     sentAt:'2h ago' },
  { code:'VX1-I', email:'devon@ex.com',      toName:'Devon', status:'sent',     sentAt:'3h ago' },
  { code:'VX1-J', email:'alexis@ex.com',     toName:'Alexis',status:'sent',     sentAt:'4h ago' },
];

export async function renderInvites(mount){
  if(!mount) return;
  addCss('/assets/css/cards.css?v=b018');
  mount.innerHTML = `<div class="v-stack" id="cards-invites"></div>`;
  const root = document.getElementById('cards-invites');
  root.innerHTML = TEN.map(inviteCardHTML).join('');

  root.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-action]');
    if(!btn) return;
    const act = btn.getAttribute('data-action');
    if(act==='resend'){ /* TODO: wire to /api/invites/resend */ }
    if(act==='copy'){ navigator.clipboard?.writeText(location.origin + '/i/' + (btn.dataset.code||'')); }
  });
}

function addCss(href){
  if ([...document.styleSheets].some(s=>s.href && s.href.includes('cards.css'))) return;
  const link = document.createElement('link'); link.rel='stylesheet'; link.href=href; document.head.appendChild(link);
}

export default { renderInvites };