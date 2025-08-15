(async () => {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    if (regs?.length) for (const r of regs) await r.unregister();
    if ('caches' in window) for (const k of await caches.keys()) await caches.delete(k);
    sessionStorage.clear?.(); localStorage.clear?.();
    console.log('[SW] Unregistered and caches cleared');
  } catch (e) { console.warn('[SW] kill failed', e); }
})();
