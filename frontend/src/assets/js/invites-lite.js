import { fetchInvites, saveInvites } from './api-lite.js';
export async function renderInvites(root){
  const wrap = document.createElement('div');
  wrap.innerHTML = `<h1>Invites</h1><div class="card-list" id="inv-list"></div>`;
  root.appendChild(wrap);
  const listEl = wrap.querySelector('#inv-list');
  const items = await fetchInvites();
  if(!items.length){ listEl.innerHTML = `<div class="card"><p>No invites yet.</p></div>`; return; }
  for(const it of items){
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <h3 class="card__title">${it.title||'Invite'}</h3>
      <div class="card__meta">${it.date||''} ${it.time||''}</div>
      <div class="card__actions">
        <button class="btn btn--primary" data-action="inv-accept">Accept</button>
        <button class="btn btn--ghost" data-action="inv-decline">Decline</button>
      </div>`;
    card.addEventListener('click', (e)=>{
      const a = e.target.closest('button[data-action]');
      if(!a) return;
      it.status = a.dataset.action === 'inv-accept' ? 'accepted' : 'declined';
      saveInvites(items);
      a.textContent = it.status === 'accepted' ? 'Accepted' : 'Declined';
    }, { passive:true });
    listEl.appendChild(card);
  }
}
