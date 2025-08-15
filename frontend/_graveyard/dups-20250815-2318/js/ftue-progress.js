// FTUE: track first-session "Pick 3"
(() => {
  const FTUE_KEY = 'ftue.pick3.count';
  const COMPLETED_KEY = 'ftue.pick3.completed';
  const FIRST_VISIT_KEY = 'ftue.firstSeenAt';

  function getStore(path, fallback){ 
    try { 
      return path.split('.').reduce((a,k)=>a?.[k], window.Store?.state) ?? fallback; 
    } catch { 
      return fallback; 
    } 
  }
  
  function setStore(path, value){
    if (!window.Store || !window.Store.set) return;
    window.Store.set(path, value);
  }

  function getCount(){ 
    return Number(getStore(FTUE_KEY, 0)) || 0; 
  }
  
  function bump(){
    const current = getCount();
    if (current >= 3) return; // Already completed
    
    const n = Math.min(3, current + 1);
    setStore(FTUE_KEY, n);
    render(n);
    
    if (n >= 3) {
      setStore(COMPLETED_KEY, true);
      // Emit completion event
      if (window.Events?.emit) {
        window.Events.emit('ftue.pick3.complete');
      }
      // Show install card after a delay
      setTimeout(() => {
        try { 
          if (window.showInstallCard) window.showInstallCard(); 
        } catch {}
      }, 1500);
      // Fade out the FTUE header
      setTimeout(() => {
        const wrap = document.getElementById('ftue-wrap');
        if (wrap) {
          wrap.style.transition = 'opacity 300ms ease-out';
          wrap.style.opacity = '0';
          setTimeout(() => {
            wrap.style.display = 'none';
          }, 300);
        }
      }, 3000);
    }
  }

  function render(n) {
    const wrap = document.getElementById('ftue-wrap');
    if (!wrap) return;
    
    const percentage = (n / 3) * 100;
    wrap.innerHTML = `
      <div class="ftue-header">
        <div style="flex: 1;">
          <div class="ftue-title">Pick 3 parties you like</div>
          <div class="ftue-sub">${n}/3 selected • save & sync to calendar</div>
        </div>
        <div class="ftue-progress" aria-label="Selection progress" role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${n}">
          <i style="width:${percentage}%"></i>
        </div>
      </div>`;
  }

  function init() {
    const wrap = document.getElementById('ftue-wrap');
    if (!wrap) return;
    
    // Check if already completed
    if (getStore(COMPLETED_KEY)) {
      wrap.style.display = 'none';
      return;
    }
    
    // Track first visit
    if (!getStore(FIRST_VISIT_KEY)) {
      setStore(FIRST_VISIT_KEY, Date.now());
    }
    
    // Initial render
    const count = getCount();
    render(count);
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', init);

  // Listen for party interest events
  document.addEventListener('party:interest', bump);
  
  // Also count clicks on interest/attend buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="interest"], [data-action="attend"]');
    if (!btn) return;
    
    // Debounce per card
    const card = btn.closest('[data-id]');
    if (card && card.dataset._picked) return;
    if (card) card.dataset._picked = '1';
    
    // Emit the event that triggers bump
    if (window.Events?.emit) {
      window.Events.emit('party:interest');
    } else {
      // Fallback: directly bump
      bump();
    }
  });

  // Re-render on route change to parties
  document.addEventListener('route:changed', (e) => {
    if (e.detail?.route === 'parties') {
      init();
    }
  });
  
  // Export for external use
  window.ftueInit = init;
})();