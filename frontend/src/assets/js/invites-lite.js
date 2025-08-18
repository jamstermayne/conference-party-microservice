import { fetchInvites, saveInvites } from './api-lite.js';

export async function renderInvites(root){
  const wrap = document.createElement('div');
  wrap.className = 'invites-panel';
  wrap.innerHTML = `
    <div class="panel__header">
      <h1 class="panel__title">Your Invites</h1>
      <div class="panel__subtitle">Exclusive event invitations</div>
    </div>
    <div class="card-modern-grid" id="inv-list"></div>
  `;
  root.appendChild(wrap);
  
  const listEl = wrap.querySelector('#inv-list');
  const items = await fetchInvites();
  
  if(!items.length){ 
    listEl.innerHTML = `
      <div class="card-modern card-modern--empty">
        <div class="card-modern__body">
          <div class="empty-state">
            <div class="empty-icon">📧</div>
            <h3>No invites yet</h3>
            <p>Event organizers will send you exclusive invitations here</p>
          </div>
        </div>
      </div>
    `; 
    return; 
  }
  
  for(const it of items){
    const card = document.createElement('div'); 
    card.className = 'card-modern card-modern--event';
    
    const status = it.status || 'pending';
    const statusBadge = status === 'accepted' ? 'live' : status === 'declined' ? 'revoked' : 'pending';
    
    card.innerHTML = `
      <div class="card-modern__header">
        <div class="card-modern__eyebrow">
          <span class="badge ${statusBadge}">${status.toUpperCase()}</span>
          <span>${it.date || ''}</span>
        </div>
        <h3 class="card-modern__title">${it.title || 'Exclusive Event Invite'}</h3>
        <div class="card-modern__subtitle">${it.venue || 'Premium venue'}</div>
      </div>
      
      <div class="card-modern__body">
        <div class="card-modern__details">
          <svg class="card-modern__icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          <div class="card-modern__detail">${it.time || 'Evening event'}</div>
          
          <svg class="card-modern__icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
          </svg>
          <div class="card-modern__detail">${it.location || 'Premium location'}</div>
        </div>
        
        ${it.description ? `<div class="card-modern__description">${it.description}</div>` : ''}
      </div>
      
      <div class="card-modern__footer" ${status !== 'pending' ? 'style="opacity: 0.6; pointer-events: none;"' : ''}>
        <button class="card-modern__action card-modern__action--primary" data-action="inv-accept" ${status === 'accepted' ? 'disabled' : ''}>
          ${status === 'accepted' ? 'Accepted ✓' : 'Accept Invite'}
        </button>
        <button class="card-modern__action card-modern__action--secondary" data-action="inv-decline" ${status === 'declined' ? 'disabled' : ''}>
          ${status === 'declined' ? 'Declined' : 'Decline'}
        </button>
      </div>
    `;
    
    card.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-action]');
      if(!btn || btn.disabled) return;
      
      const action = btn.dataset.action;
      it.status = action === 'inv-accept' ? 'accepted' : 'declined';
      saveInvites(items);
      
      // Update UI immediately
      if(action === 'inv-accept') {
        btn.textContent = 'Accepted ✓';
        btn.disabled = true;
        card.querySelector('.badge').className = 'badge live';
        card.querySelector('.badge').textContent = 'ACCEPTED';
      } else {
        btn.textContent = 'Declined';
        btn.disabled = true;
        card.querySelector('.badge').className = 'badge revoked';
        card.querySelector('.badge').textContent = 'DECLINED';
      }
      
      // Disable footer
      const footer = card.querySelector('.card-modern__footer');
      footer.style.opacity = '0.6';
      footer.style.pointerEvents = 'none';
      
    }, { passive: false });
    
    listEl.appendChild(card);
  }
}
