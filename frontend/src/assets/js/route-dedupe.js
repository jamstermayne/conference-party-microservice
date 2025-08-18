/* route-dedupe.js — kill route storms/flicker */
(() => {
  if (window.__ROUTE_DEDUPE__) return;
  window.__ROUTE_DEDUPE__ = true;

  let last = '', lastAt = 0;
  const THRESH = 600; // ms window to treat as duplicate/burst

  function mark(h){ last = h; lastAt = Date.now(); }
  function isDup(h){ return h === last && (Date.now() - lastAt) < THRESH; }

  // Capture-phase listener runs before other handlers and can stop the storm early
  addEventListener('hashchange', (e) => {
    const h = location.hash || '#/home';
    if (isDup(h)) {
      e.stopImmediatePropagation?.(); // prevent other handlers from mounting again
      e.stopPropagation?.();
      return;
    }
    mark(h);
  }, true);

  // Also intercept pushState with hash URLs so programmatic spam gets deduped
  const origPush = history.pushState.bind(history);
  history.pushState = function (state, title, url) {
    if (typeof url === 'string' && url.includes('#')) {
      const h = url.slice(url.indexOf('#'));
      if (isDup(h)) return; // swallow
      mark(h);
    }
    return origPush(state, title, url);
  };

  console.log('[route-dedupe] installed');
})();