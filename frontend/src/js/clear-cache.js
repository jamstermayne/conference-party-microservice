/**
 * One-time cache clear script
 * Add to index.html temporarily to clear stale caches
 */
(async function clearStaleCache() {
  if ('caches' in window) {
    const names = await caches.keys();
    console.log('[CacheClear] Found caches:', names);
    
    // Delete all caches to force fresh load
    for (const name of names) {
      await caches.delete(name);
      console.log(`[CacheClear] Deleted cache: ${name}`);
    }
    
    // Also unregister service worker if present
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[CacheClear] Unregistered service worker');
      }
    }
    
    // Clear localStorage cache keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('v='))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[CacheClear] Removed localStorage: ${key}`);
    });
    
    console.log('[CacheClear] ✅ All caches cleared. Reload the page for fresh content.');
  }
})();