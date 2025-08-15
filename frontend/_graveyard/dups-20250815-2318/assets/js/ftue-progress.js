/**
 * FTUE "Pick 3 parties" progress bar.
 * - Shows only on first session (Store flag)
 * - Tracks clicks on data-action="save" within Parties route
 * - Emits 'ftue:complete' when 3 are saved
 */

import Store from './foundation/store.js';

(function initFTUE(){
  if (Store.get('ftue.pick3.done')) return;
  const route = document.querySelector('section[data-route="parties"]');
  if (!route) return;

  // Header + progress bar
  const hdr = document.createElement('div');
  hdr.className = 'ftue-header';
  hdr.innerHTML = `
    <div class="text-secondary">Pick <strong>3</strong> parties you'd go to</div>
    <div class="flex-1"></div>
  `;
  const barWrap = document.createElement('div');
  barWrap.className = 'ftue-progress'; barWrap.style.flex = '1 0 120px';
  const bar = document.createElement('i');
  barWrap.appendChild(bar);
  hdr.appendChild(barWrap);

  // Insert at top if not present
  const list = route.querySelector('[data-role="events-list"]');
  route.insertBefore(hdr, list || route.firstChild);

  let count = Number(Store.get('ftue.pick3.count') || 0);
  update();

  route.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="save"]');
    if (!btn) return;
    const id = btn.dataset.id;
    const saved = new Set(Store.get('events.saved') || []);
    // Count only first-time saves
    if (!saved.has(id)) {
      count = Math.min(3, count + 1);
      Store.patch('ftue.pick3.count', count);
      update();
      if (count === 3) complete();
    }
  });

  function update(){
    bar.style.width = `${(count/3)*100}%`;
  }

  function complete(){
    Store.patch('ftue.pick3.done', true);
    setTimeout(() => hdr.remove(), 400);
    document.dispatchEvent(new CustomEvent('ftue:complete', { detail: { flow: 'pick3' } }));
    // Nice moment to show PWA CTA
    document.dispatchEvent(new CustomEvent('pwa:install-available', { detail: { reason: 'ftue-pick3' } }));
  }
})();