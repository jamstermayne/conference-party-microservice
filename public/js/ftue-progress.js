// FTUE progress: counts interactions on [data-action="interest"] or "attend"
(() => {
  const FTUE_KEY = 'ftue.pickedCount';
  const FIRST_VISIT_KEY = 'ftue.firstSeenAt';
  const ROUTE = '#parties';

  function getStore(path, fallback){ try { return path.split('.').reduce((a,k)=>a?.[k], window.Store?.state) ?? fallback; } catch { return fallback; } }
  function patchStore(path, value){
    if (!window.Store || !window.Store.patch) return;
    window.Store.patch(path, value);
  }

  function getCount(){ return Number(getStore(FTUE_KEY, 0)) || 0; }
  function incCount(){
    const n = Math.min(3, getCount() + 1);
    patchStore(FTUE_KEY, n);
    updateBar(n);
  }

  function ensureHeader() {
    if (!location.hash || !location.hash.startsWith(ROUTE)) return;
    let hdr = document.getElementById('ftue-header');
    if (hdr) return hdr;
    const container = document.querySelector('.events-wrap') || document.querySelector('#main');
    if (!container) return null;
    hdr = document.createElement('div');
    hdr.id = 'ftue-header';
    hdr.className = 'ftue-header';
    hdr.innerHTML = `
      <div class="ftue-title">Pick 3 parties you're interested in</div>
      <div class="ftue-sub">We'll save them and prepare calendar sync.</div>
      <div class="ftue-progress" aria-label="Selection progress" role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="0">
        <span></span>
      </div>`;
    container.prepend(hdr);
    return hdr;
  }

  function updateBar(n){
    const bar = document.querySelector('.ftue-progress');
    const fill = bar?.querySelector('span');
    if (!bar || !fill) return;
    const pct = Math.min(100, Math.round((n/3)*100));
    fill.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', String(Math.min(3, n)));
    if (pct === 100) {
      // Small nudge: show install card if available
      try { window.showInstallCard && window.showInstallCard(); } catch {}
    }
  }

  // First render
  document.addEventListener('DOMContentLoaded', () => {
    if (!getStore(FIRST_VISIT_KEY)) patchStore(FIRST_VISIT_KEY, Date.now());
    const hdr = ensureHeader();
    if (hdr) updateBar(getCount());
  });

  // Count interactions on parties list
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="interest"], [data-action="attend"]');
    if (!btn) return;
    // Debounce per card
    const card = btn.closest('[data-id]');
    if (card && card.dataset._picked) return;
    if (card) card.dataset._picked = '1';
    incCount();
  });

  // Rebuild header on route change (if router emits event)
  document.addEventListener('route:changed', (e) => {
    if (e.detail?.route === 'parties') {
      const hdr = ensureHeader();
      if (hdr) updateBar(getCount());
    }
  });
})();