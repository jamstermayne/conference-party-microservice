// public/js/app-wireup.js
// Minimal app bootstrap: installs listeners, triggers initial route, confirms boot.

import Router from '/js/router.js';

(function boot() {
  try {
    // route change → metrics
    window.addEventListener('hashchange', () => {
      try { window.Metrics?.trackRoute?.(location.hash || '#/parties'); } catch {}
    });

    // first paint
    window.Metrics?.track?.('app_boot', { ts: Date.now() });

    // ensure default route
    if (!location.hash) Router.go('#/parties');

    console.log('✅ App wire-up complete');
  } catch (e) {
    console.error('wire-up error', e);
  }
})();