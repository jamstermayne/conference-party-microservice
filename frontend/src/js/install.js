// install.js (quiet banner, explicit user gesture)
import Metrics from './metrics.js';

let deferredEvt = null;
let cardShown = false;

function showInstallCard() {
  if (cardShown) return;
  cardShown = true;
  const node = document.getElementById('install-card');
  if (!node) return;

  node.hidden = false;
  Metrics.trackInstallPromptShown({ reason: 'card_shown' });

  const btn = node.querySelector('[data-action="install-now"]');
  btn?.addEventListener('click', async () => {
    if (!deferredEvt) {
      // No native prompt available (e.g., already installed) → fall back to instructions UI
      document.dispatchEvent(new CustomEvent('ui:toast', { detail: { type: 'ok', message: 'Open browser menu → "Add to Home Screen".' } }));
      return;
    }
    // Must be in user-gesture
    await deferredEvt.prompt();
    const choice = await deferredEvt.userChoice.catch(() => ({}));
    if (choice && choice.outcome) {
      Metrics.track('install_choice', { outcome: choice.outcome });
    }
    node.hidden = true;
    deferredEvt = null;
  });

  node.querySelector('[data-action="install-dismiss"]')?.addEventListener('click', () => {
    node.hidden = true;
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  // prevent auto-banner; keep console quiet
  e.preventDefault();
  deferredEvt = e;
  // Only show our card; no console warning needed
  showInstallCard();
}, { once: true });

// Optional: show card on explicit UI tap (e.g., "Install" in header)
document.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-action="show-install"]');
  if (!btn) return;
  ev.preventDefault();
  showInstallCard();
});

document.addEventListener('DOMContentLoaded', () => {
  // If standalone already, hide card
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) {
    const node = document.getElementById('install-card');
    if (node) node.hidden = true;
  }
});

console.info('✅ Production PWA Install loaded');