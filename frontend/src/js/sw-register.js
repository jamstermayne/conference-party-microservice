// sw-register.js - Service Worker registration with dev bypass
(() => {
  try {
    const params = new URLSearchParams(location.search);
    const bypass = params.has('nocache') || window.__ENV?.SW_DISABLE;
    if (bypass) {
      console.log('🛑 SW registration bypassed (nocache or SW_DISABLE)');
      return;
    }
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js?v=b022').then(reg => {
          console.log('🚀 Service Worker loaded, version:', '1.0.1');
          // always update on page load during polish
          reg.update().catch(()=>{});
        }).catch(err => console.warn('SW register fail', err));
      });
    }
  } catch (e) {
    console.warn('SW bootstrap error', e);
  }
})();