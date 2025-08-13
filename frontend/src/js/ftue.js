import Store from '/js/store.js';
import { renderParties } from '/js/events-controller.js';

function ensureOverlay(){
  let el = document.querySelector('.ftue-overlay');
  if(el) return el;
  el = document.createElement('div');
  el.className = 'ftue-overlay';
  el.innerHTML = `
    <div class="ftue-card">
      <div class="ftue-header">
        <img src="/assets/brand/v-logo.svg" alt="" width="24" height="24" />
        <div>
          <div class="ftue-title">Pick parties you like</div>
          <div class="ftue-sub">Save a few to get calendar sync & smart reminders.</div>
        </div>
      </div>
      <div id="ftue-body"></div>
      <div class="ftue-actions">
        <button class="btn btn-primary" data-action="ftue-continue">Continue</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener('click', (e)=>{ if(e.target?.dataset?.action==='ftue-continue'){ el.classList.remove('show'); Store.patch('ftue.seen', true); }});
  return el;
}

document.addEventListener('DOMContentLoaded', async ()=>{
  if(Store.get('ftue.seen')) return; // show once
  const overlay = ensureOverlay();
  const body = overlay.querySelector('#ftue-body');
  overlay.classList.add('show');
  // Render same beautiful cards inside FTUE
  await renderParties(body);
});