// js/controllers/FomoController.js
import { Events } from '../events.js?v=b023';
import { Store }  from '../store.js?v=b023';

const API = '/api/events?filter=tonight';

export function FomoController(section){
  let saved = new Set(JSON.parse(localStorage.getItem('savedParties')||'[]'));
  const list  = section.querySelector('#pff-party-list');
  const footer= section.querySelector('#pff-footer');
  const count = section.querySelector('#pff-saved-count');
  const btnGo = section.querySelector('#pff-continue');

  // Lifecycle
  section.addEventListener('route:enter', onEnter);
  section.addEventListener('route:leave', onLeave);
  list.addEventListener('click', onClick);
  btnGo.addEventListener('click', onContinue);

  function onEnter(){
    paintSkeletons(6);
    fetchTonight().then(items=>{
      Store.patch && Store.patch('events', items);
      render(items);
      Events.emit('events.tonight.loaded', { count: items.length });
      updateFooter();
    }).catch(()=> render([]));
  }

  function onLeave(){
    // noop for now
  }

  // Data
  async function fetchTonight(){
    const r = await fetch(API, { credentials:'include' });
    if (!r.ok) throw new Error('events');
    const data = await r.json();
    // normalize minimal fields
    return data.map(x => ({
      id: x.id,
      title: x.title || x.name || 'Untitled',
      time:  x.timeLabel || x.startTimeLabel || x.startTime,
      venue: x.venue || x.location || 'TBA',
      rsvp:  x.rsvpCount || x.attending || 0,
      source: (x.provenance && x.provenance[0]) || (x.sourceHint) || 'Verified',
      image: x.image || x.cover || '/img/placeholders/party.jpg'
    }));
  }

  // Render
  function render(items){
    if (!items.length){
      list.innerHTML = `<div class="pff-skeleton" style="padding:16px">No parties yet. Check back soon.</div>`;
      return;
    }
    const tpl = document.getElementById('tpl-pff-card');
    const frag = document.createDocumentFragment();
    items.forEach(item=>{
      const node = tpl.content.firstElementChild.cloneNode(true);
      node.dataset.id = item.id;

      const img = node.querySelector('img');
      img.alt = `${item.title} at ${item.venue}`;
      img.src = item.image;

      node.querySelector('.title').textContent = item.title;
      node.querySelector('.time').textContent  = item.time || 'Tonight';
      node.querySelector('.venue').textContent = item.venue;
      node.querySelector('.badge.rsvp').textContent = `${item.rsvp} going`;
      node.querySelector('.badge.source').textContent = item.source;

      const saveBtn = node.querySelector('.save');
      const isSaved = saved.has(item.id);
      saveBtn.classList.toggle('saved', isSaved);
      saveBtn.textContent = isSaved ? 'Saved!' : 'Save to My Night';

      frag.appendChild(node);
    });
    list.replaceChildren(frag);
  }

  function paintSkeletons(n=6){
    const tpl = document.getElementById('tpl-pff-skeleton');
    const frag = document.createDocumentFragment();
    for (let i=0;i<n;i++) frag.appendChild(tpl.content.firstElementChild.cloneNode(true));
    list.replaceChildren(frag);
  }

  // Events
  function onClick(e){
    const saveBtn = e.target.closest('.save');
    if (!saveBtn) return;

    const card = e.target.closest('.pff-card');
    const id   = card?.dataset.id;
    if (!id) return;

    if (saved.has(id)){
      saved.delete(id);
      saveBtn.classList.remove('saved');
      saveBtn.textContent = 'Save to My Night';
    } else {
      saved.add(id);
      saveBtn.classList.add('saved');
      saveBtn.textContent = 'Saved!';
      if (navigator.vibrate) navigator.vibrate(6);
    }
    persist();
    updateFooter();
  }

  function updateFooter(){
    const n = saved.size;
    if (n>0){ footer.hidden = false; count.textContent = String(n); }
    else { footer.hidden = true; count.textContent = '0'; }
  }

  function persist(){
    try { localStorage.setItem('savedParties', JSON.stringify([...saved])); } catch {}
  }

  async function onContinue(){
    // Mark intent & hand over to next stage (Account → Calendar → Install)
    Events.emit('fomo.saved.ready', { saved: [...saved] });
    // Route to account step (handled by your router/controller map)
    location.hash = '#/account-link?source=fomo';
  }
}