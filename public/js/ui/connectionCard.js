import { ViewTX } from './viewTX.js?v=b023';
import * as Conn from '../services/connections.js?v=b023';

export function renderConnectionCard(data){
  const tpl = document.getElementById('tpl-connection-card');
  const node = tpl.content.firstElementChild.cloneNode(true);

  node.dataset.id = data.id;
  node.querySelector('.cc-avatar').src = data.picture || '';
  node.querySelector('.cc-avatar').alt = `${data.name} avatar`;
  node.querySelector('.cc-name').textContent = data.name || 'Unknown';
  node.querySelector('.cc-meta').textContent = [data.domain, data.role].filter(Boolean).join(' · ');

  node.querySelector('[data-bind="conference"]').textContent = data.conferenceLabel || '';
  node.querySelector('[data-bind="event"]').textContent = data.eventLabel || '';
  node.querySelector('[data-bind="metAt"]').textContent = data.metAtLabel || '';

  const connectBtn = node.querySelector('[data-action="conn.connect"]');
  if (data.connected) {
    connectBtn.textContent = 'Connected';
    connectBtn.classList.remove('btn-primary');
    connectBtn.disabled = true;
  }

  // Actions
  connectBtn?.addEventListener('click', async ()=>{
    connectBtn.disabled = true;
    try{
      await Conn.create({
        userId: data.viewerId, connectionId: data.id,
        eventId: data.eventId, conferenceId: data.conferenceId, tags: data.tags||[]
      });
      connectBtn.textContent = 'Connected';
      connectBtn.classList.remove('btn-primary');
    }catch{ connectBtn.disabled = false; }
  });

  const notes = node.querySelector('.cc-notes');
  node.querySelector('[data-action="conn.note.open"]').addEventListener('click', ()=>{
    notes.hidden = false;
    node.querySelector('.cc-note-input').focus();
  });
  node.querySelector('[data-action="conn.note.cancel"]').addEventListener('click', ()=>{
    notes.hidden = true;
  });
  node.querySelector('[data-action="conn.note.save"]').addEventListener('click', async ()=>{
    const text = node.querySelector('.cc-note-input').value.trim();
    if(!text) return;
    try{ await Conn.addNote(data.id, text); notes.hidden = true; flash(node); }catch{}
  });

  let starred = !!data.starred;
  node.querySelector('[data-action="conn.star.toggle"]').addEventListener('click', async (e)=>{
    const btn = e.currentTarget;
    starred = !starred;
    btn.textContent = starred ? '⭐ Starred' : '⭐ Star';
    try{ await Conn.toggleStar(data.id, starred); }catch{}
  });

  const histWrap = node.querySelector('.cc-history');
  node.querySelector('[data-action="conn.history.open"]').addEventListener('click', async ()=>{
    histWrap.hidden = false;
    const listEl = node.querySelector('.cc-history-list');
    listEl.innerHTML = 'Loading…';
    try{
      const h = await Conn.history(data.id);
      listEl.innerHTML = h.map(it => `
        <div class="cc-history-item">
          <div class="cc-history-dot"></div>
          <div>
            <div class="text-sm" style="font-weight:600">${it.conference} · ${it.event}</div>
            ${it.note ? `<div class="text-sm">${escapeHtml(it.note)}</div>` : ''}
            <div class="cc-history-meta">${new Date(it.ts).toLocaleString()}</div>
          </div>
        </div>`).join('');
    }catch{ listEl.textContent = 'Could not load history.'; }
  });
  node.querySelector('[data-action="conn.history.close"]').addEventListener('click', ()=>{
    histWrap.hidden = true;
  });

  return node;
}

function flash(card){
  card.animate([{ filter:'brightness(1)' }, { filter:'brightness(1.25)' }, { filter:'brightness(1)' }], { duration:400 });
}
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }