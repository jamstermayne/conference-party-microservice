// Unified delegation for [data-action] (click + Enter/Space); emits Events + DOM events
import Events from './events.js';

function payloadFrom(el){
  const p = { action: el.dataset.action };
  for (const [k,v] of Object.entries(el.dataset)){
    if (k==='action') continue; p[k] = v;
  }
  return p;
}
function emit(el){
  const data = payloadFrom(el);
  // Events bus
  Events.emit('action', data);
  Events.emit(`action:${data.action}`, data);
  // DOM CustomEvent (legacy compat)
  document.dispatchEvent(new CustomEvent(`action:${data.action}`, { detail:data }));
}

function onClick(e){
  const el = e.target.closest('[data-action]');
  if (!el) return;
  emit(el);
}
function onKey(e){
  if (!['Enter',' '].includes(e.key)) return;
  const el = e.target.closest('[data-action]');
  if (!el) return;
  e.preventDefault();
  emit(el);
}

export function initActions(){
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
}
initActions();
export default { initActions };