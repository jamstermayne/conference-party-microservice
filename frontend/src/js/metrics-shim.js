// Minimal no-op Metrics to avoid runtime errors until backend is wired.
window.Metrics = window.Metrics || {
  track: (name, payload) => {
    try { console.debug('📊 Metric tracked:', name, payload || {}); } catch {}
  },
  trackRoute: (route) => {
    try { console.debug('📊 Route metric:', route); } catch {}
  },
  trackInstallPromptShown: () => {
    try { console.debug('📊 Install prompt shown'); } catch {}
  },
  flush: () => {}
};