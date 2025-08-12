// Enhancements for Parties: sticky footer action + 3-pick progress meter.
// Zero-coupling: we just observe the DOM and count selected cards.

import Events from './events.js';

function qs(s, r=document){return r.querySelector(s);}
function qsa(s, r=document){return Array.from(r.querySelectorAll(s));}

function ensureFooter(root) {
  if (qs('#parties-sticky', root)) return qs('#parties-sticky', root);
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
  (root || document.body).appendChild(bar);
  return bar;
}

function countSelected(root) {
  // We consider a party selected if it has aria-pressed="true" or .is-selected
  const sel = qsa('[data-party][aria-pressed="true"]', root)
    .concat(qsa('[data-party].is-selected', root))
    .filter((el, i, arr) => arr.indexOf(el) === i);
  return sel.length;
}

function updateMeter(root) {
  const n = countSelected(root);
  const meter = qs('#pick-meter', root);
  if (meter) meter.textContent = `Pick 3 parties you like • ${n}/3 selected`;
  // Subtle enable/disable
  const save = qs('#btn-save-sync', root);
  if (save) save.disabled = n === 0;
}

function wire(root) {
  const bar = ensureFooter(root);
  updateMeter(root);

  // Recompute on any click that toggles interest/selection
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t) return;
    if (t.matches('[data-action="interest"],[data-action="save"]') ||
        t.closest && t.closest('[data-action="interest"],[data-action="save"]')) {
      // Wait a tick for DOM to toggle classes/attributes
      setTimeout(() => updateMeter(root), 0);
    }
  });

  // Clear picks: remove aria-pressed/selected hints
  qs('#btn-clear-picks', bar)?.addEventListener('click', () => {
    qsa('[data-party][aria-pressed="true"]', root).forEach(el => el.setAttribute('aria-pressed','false'));
    qsa('[data-party].is-selected', root).forEach(el => el.classList.remove('is-selected'));
    updateMeter(root);
  });

  // Save & Sync: emit event the existing system can listen to
  qs('#btn-save-sync', bar)?.addEventListener('click', () => {
    try { Events.emit && Events.emit('parties:saveAndSync'); } catch {}
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const main = document.getElementById('main') || document;
  const partiesPanel = main; // enhance in-place
  if (location.hash.includes('parties')) wire(partiesPanel);
  try {
    Events.on && Events.on('route:change', (name) => {
      if (name === 'parties') wire(partiesPanel);
    });
  } catch {}
});