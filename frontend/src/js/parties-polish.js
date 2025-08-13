/**
 * Parties polish (non-destructive): shows skeletons, renders compact cards,
 * and falls back to a friendly empty state. Works with your Events bus if present.
 */
import Events from './events.js?v=b023';

const q = (s, r=document)=>r.querySelector(s);
const qa = (s, r=document)=>Array.from(r.querySelectorAll(s));

function mountSkeletons(container, count=6){
  if (!container) return;
  const frag = document.createDocumentFragment();
  for (let i=0;i<count;i++){ const d=document.createElement('div'); d.className='skel'; frag.appendChild(d); }
  container.innerHTML = ''; container.appendChild(frag);
}

function emptyState(container, message='No parties yet.'){
  if (!container) return;
  container.innerHTML = `
    <div class="card card-outlined card-compact text-secondary" role="status" aria-live="polite">
      ${message}
    </div>`;
}

function renderCards(container, items=[]){
  if (!container) return;
  const frag = document.createDocumentFragment();
  items.forEach(ev=>{
    const card = document.createElement('div');
    card.className = 'party-card card-hover';
    card.innerHTML = `
      <div>
        <div class="party-title">${ev.title || ev['Event Name'] || 'Untitled'}</div>
        <div class="party-sub">
          <span class="glyph clock"><span class="dot"></span>${ev.time || ev['Time'] || 'TBA'}</span>
          <span class="glyph pin"><span class="dot"></span>${ev.venue || ev['Venue'] || ev.location || 'Venue TBA'}</span>
          ${ev.capacity ? `<span class="glyph cap"><span class="dot"></span>${ev.capacity} cap</span>`:''}
        </div>
        <div class="party-badges" style="margin-top:8px">
          ${ev.tier ? `<span class="badge-pill" data-variant="${ev.tier==='premium'?'prem':'ok'}">${(ev.tier+'').toUpperCase()}</span>`:''}
          ${ev.price ? `<span class="badge-pill" data-variant="${ev.price==='Free'?'ok':'warn'}">${ev.price}</span>`:''}
        </div>
      </div>
      <div class="party-actions">
        <button class="btn btn-primary" data-action="attend" aria-label="RSVP to ${ev.title||'event'}">RSVP</button>
        <button class="btn btn-outline" data-action="save" aria-label="Save ${ev.title||'event'}">Save</button>
        <button class="btn btn-ghost btn-icon" data-action="share" aria-label="Share ${ev.title||'event'}">↗</button>
      </div>
    `;
    frag.appendChild(card);
  });
  container.innerHTML = '';
  container.appendChild(frag);

  // light wiring for buttons
  qa('[data-action="attend"]', container).forEach(b=>b.addEventListener('click',()=>toast('RSVP coming soon')));
  qa('[data-action="save"]', container).forEach(b=>b.addEventListener('click',()=>toast('Saved')));
  qa('[data-action="share"]', container).forEach(b=>b.addEventListener('click',()=>navigator.share?.({title:'Velocity'}).catch(()=>{})));
}

function toast(msg){ try { document.dispatchEvent(new CustomEvent('ui:toast',{detail:{message:msg}})); } catch {} }

async function fetchParties(){
  try{
    const res = await fetch('/api/parties?conference=gamescom2025', { credentials:'omit' });
    if (!res.ok) return [];
    const j = await res.json();
    return j.data || [];
  }catch{ return []; }
}

async function hydrate(){
  const target = q('[data-parties-list]') || q('#parties-list') || q('#main');
  if (!target) return;

  mountSkeletons(target);

  // Prefer Events/state if already present
  let list = (window.Store?.get && window.Store.get('events')) || [];
  if (!list || !list.length) {
    list = await fetchParties();
  }

  if (!list || !list.length) {
    emptyState(target, 'No parties yet. Try refreshing shortly.');
  } else {
    renderCards(target, list.slice(0, 20));
  }
}

// Also add the sticky footer from before
function ensureFooter(root) {
  if (q('#parties-sticky', root)) return q('#parties-sticky', root);

  const bar = document.createElement('div');
  bar.id = 'parties-sticky';
  bar.className = 'card card-filled';
  bar.style.position = 'sticky';
  bar.style.bottom = '0';
  bar.style.zIndex = '45';
  bar.style.padding = '12px 16px';
  bar.style.display = 'flex';
  bar.style.alignItems = 'center';
  bar.style.justifyContent = 'space-between';
  bar.innerHTML = `
    <div class="text-secondary" id="pick-meter">Pick 3 parties you like • 0/3 selected</div>
    <div class="flex flex-row" style="gap:8px">
      <button class="btn btn-secondary" id="btn-clear-picks">Clear</button>
      <button class="btn btn-primary" id="btn-save-sync">Save & Sync</button>
    </div>`;
  root.appendChild(bar);
  return bar;
}

document.addEventListener('DOMContentLoaded', () => {
  hydrate();
  const partiesRoot = q('[data-route="parties"]');
  if (partiesRoot) ensureFooter(partiesRoot);
});

try { Events.on && Events.on('route:change', (r)=>{ if (r==='parties') { hydrate(); ensureFooter(q('[data-route="parties"]')); } }); } catch {}