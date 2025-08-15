(async () => {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    if (regs?.length) for (const r of regs) await r.unregister();
    if ("caches" in window) for (const k of await caches.keys()) await caches.delete(k);
    console.log("[SW] nuked");
  } catch(e){ console.warn(e) }
})();
