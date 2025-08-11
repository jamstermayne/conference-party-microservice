// Central toast system + ARIA live announcements
import Events from './events.js';

let wrap, live;
function ensureContainers(){
  if (!wrap){
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  if (!live){
    live = document.createElement('div');
    live.className = 'sr-live';
    live.setAttribute('role','status');
    live.setAttribute('aria-live','polite');
    live.setAttribute('aria-atomic','true');
    document.body.appendChild(live);
  }
}

function announce(msg){
  if (!live) return;
  // Clear then set ensuring SR reads full message
  live.textContent = '';
  setTimeout(()=> live.textContent = msg, 40);
}

export function toast({ type='info', message='', timeout=3000 }){
  ensureContainers();
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.innerHTML = `
    <span class="t-dot" aria-hidden="true"></span>
    <span class="t-msg">${message}</span>
    <button class="t-close" aria-label="Dismiss">✕</button>
  `;
  wrap.appendChild(node);
  requestAnimationFrame(()=> node.classList.add('show'));
  announce(message);

  const kill = ()=> { node.classList.remove('show'); setTimeout(()=> node.remove(), 180); };
  node.querySelector('.t-close')?.addEventListener('click', kill);
  if (timeout) setTimeout(kill, timeout);
}

// Event bus integration
function onToast(ev){ toast(ev.detail || ev); }

export function initToasts(){
  ensureContainers();
  // Listen to Events.emit('ui:toast', {type, message})
  document.addEventListener('ui:toast', onToastProxy);
  Events.on && Events.on('ui:toast', (data)=> toast(data)); // if your Events supports .on
}

// Proxy to support DOM CustomEvents fallback
function onToastProxy(e){ toast(e.detail || {}); }

// Fallback: allow emitting without Events
export function emitToast(type, message, timeout){
  const event = new CustomEvent('ui:toast', { detail: { type, message, timeout } });
  document.dispatchEvent(event);
}

document.addEventListener('DOMContentLoaded', initToasts);
export default { toast, initToasts, emitToast };