(() => {
  console.log('✅ Production PWA Install loaded');

  let deferredEvt = null;
  let cardNode = null;

  // Safe Metrics shim usage
  function track(name, payload){ try { window.Metrics && window.Metrics.track && window.Metrics.track(name, payload || {}); } catch {} }

  // Feature detect installability (standalone or display-mode)
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function buildCard() {
    if (cardNode) return cardNode;
    const div = document.createElement('div');
    div.className = 'install-card';
    div.innerHTML = `
      <div class="copy">
        <h4>Install for instant access</h4>
        <p>Add to Home Screen for offline access and 2× faster launches.</p>
      </div>
      <button class="btn btn-primary" id="install-cta">Install</button>
      <button class="btn btn-secondary" id="install-dismiss" aria-label="Dismiss install card">Not now</button>
    `;
    // Place near bottom of events page
    const mount = document.querySelector('.events-wrap') || document.body;
    mount.appendChild(div);
    // Focus management
    const cta = div.querySelector('#install-cta');
    cta?.addEventListener('click', onInstallClick);
    div.querySelector('#install-dismiss')?.addEventListener('click', () => {
      hideCard();
      track('pwa_install_dismiss');
    });
    cardNode = div;
    return div;
  }

  function hideCard(){
    if (!cardNode) return;
    cardNode.remove();
    cardNode = null;
  }

  async function onInstallClick() {
    if (!deferredEvt) {
      // Fallback A2HS instructions
      track('pwa_install_manual_fallback');
      alert('To install: Share → "Add to Home Screen".');
      return;
    }
    track('pwa_install_prompt_show');
    deferredEvt.prompt();
    const choice = await deferredEvt.userChoice.catch(() => ({ outcome: 'unknown' }));
    track('pwa_install_choice', { outcome: choice?.outcome });
    if (choice?.outcome === 'accepted') hideCard();
    deferredEvt = null;
  }

  // Public API if FTUE completes
  window.showInstallCard = function showInstallCard() {
    if (isStandalone()) return;
    buildCard();
    track('pwa_install_card_shown');
  };

  // Browser events
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredEvt = e;
    track('pwa_beforeinstall_ready');
    // Reveal card on parties route only (first impression)
    if (location.hash.startsWith('#parties')) {
      window.showInstallCard();
    }
  });

  window.addEventListener('appinstalled', () => {
    track('pwa_installed');
    hideCard();
  });

  // If already standalone, never show card
  if (isStandalone()) {
    hideCard();
  } else {
    // Show a subtle CTA on parties if browser supports install later
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      if (location.hash.startsWith('#parties')) setTimeout(() => window.showInstallCard(), 600);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (location.hash.startsWith('#parties')) setTimeout(() => window.showInstallCard(), 600);
      });
    }
  }
  
  // Listen for FTUE completion to show install card
  document.addEventListener('ftue.pick3.complete', () => {
    setTimeout(() => {
      if (window.showInstallCard) {
        window.showInstallCard();
      }
    }, 1000);
  });
})();