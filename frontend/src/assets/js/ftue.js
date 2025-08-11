// PWA install FTUE (Android prompt / iOS coachmark)
import { Events, EVENTS, Store } from './state.js';
import { qs, showInstallCard, hideInstallCard, toast } from './ui.js';

let deferredPrompt = null;

export function initInstallFTUE(){
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    Events.emit(EVENTS.INSTALL_READY);
  });

  window.addEventListener('appinstalled', () => {
    Store.flags.installed = true;
    hideInstallCard();
    toast('🎉 Installed — +5 invites unlocked');
    // first-install bonus
    // (Optional: protect to one-time via backend)
  });

  // Buttons
  qs('#install-now')?.addEventListener('click', async () => {
    if (!deferredPrompt) return hideInstallCard();
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
  qs('#install-later')?.addEventListener('click', () => {
    Store.flags.installSnoozeAt = Date.now();
    hideInstallCard();
  });

  // When user saves ≥2 parties, nudge install
  Events.on(EVENTS.SAVED_PARTIES, () => maybeShowInstall());
  // Also when calendar connected, nudge if not installed
  Events.on(EVENTS.CAL_SYNCED, () => maybeShowInstall(true));
}

function maybeShowInstall(force=false){
  if (Store.flags.installed) return;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const sinceSnooze = Date.now() - (Store.flags.installSnoozeAt||0);
  if (!force && sinceSnooze < 6*60*60*1000) return; // 6h quiet
  if (!ios && !deferredPrompt && !force) return; // wait for prompt
  showInstallCard({ ios });
}