// public/js/metrics-shim.js
window.Metrics = window.Metrics || {
  track: (name, payload) => { /* no-op or send to /api/metrics */ },
  trackInstallPromptShown: () => {},
  trackRoute: (route) => {}
};