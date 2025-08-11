/**
 * Production PWA install flow (Jobs/Ive polished)
 * - Captures beforeinstallprompt
 * - Exposes showInstallCard() to call prompt() in a user gesture
 * - Emits CustomEvents for UI to react to
 * - Safe if Metrics is absent (optional chaining)
 */

let deferredPrompt = null;
let installed = false;

// Capture the BIP event and hold it until user taps our CTA
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent auto-banner; we'll show a branded CTA first
  e.preventDefault();
  deferredPrompt = e;

  // Light telemetry if available
  try { window.Metrics?.trackInstallPromptShown?.({ source: 'bip_capture' }); } catch {}

  // Notify UI layers they can show the install CTA
  document.dispatchEvent(new CustomEvent('pwa:install-available'));
});

// Mark installed for UI and telemetry
window.addEventListener('appinstalled', () => {
  installed = true;
  try { window.Metrics?.trackInstallPromptAccepted?.({ outcome: 'installed' }); } catch {}
  document.dispatchEvent(new CustomEvent('pwa:installed'));
});

// Public API: call this from a user gesture (button click)
export async function showInstallCard() {
  // Must be triggered by a user gesture for browsers to allow prompt()
  if (!deferredPrompt || installed) return;

  try {
    // Show the native prompt
    const result = await deferredPrompt.prompt();
    // Some browsers expose .outcome
    const outcome = result?.outcome || 'unknown';

    try { window.Metrics?.trackInstallPromptAccepted?.({ outcome, source: 'cta' }); } catch {}
    // Reset; most browsers require a new BIP event for another prompt
    deferredPrompt = null;

    // Let UI know the attempt is done
    document.dispatchEvent(new CustomEvent('pwa:install-attempt', { detail: { outcome } }));
  } catch {
    // Silently ignore—user might have blocked prompts
    deferredPrompt = null;
  }
}

// Optional auto-nudge hooks (listen to product moments)
function wireAutoNudges() {
  // After first "Save" action in Parties
  document.addEventListener('ui:first-save', () => {
    // Don't auto prompt; just tell UI to reveal card/cta
    if (deferredPrompt && !installed) {
      document.dispatchEvent(new CustomEvent('pwa:install-available', { detail: { reason: 'first-save' } }));
    }
  });

  // After user connects calendar
  document.addEventListener('ui:calendar-connected', () => {
    if (deferredPrompt && !installed) {
      document.dispatchEvent(new CustomEvent('pwa:install-available', { detail: { reason: 'calendar-connected' } }));
    }
  });
}

// Initialize module
(function init() {
  try { console.log('✅ Production PWA Install loaded'); } catch {}
  wireAutoNudges();
})();

// Optional: expose for imperative callers
window.PWAInstall = window.PWAInstall || { show: showInstallCard };