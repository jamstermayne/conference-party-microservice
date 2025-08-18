(() => {
  // 1) Remove any visible search UI
  document.querySelector('[data-role="search"], .search, .search-bar')?.remove();

  // 2) Kill "/" hotkey that opens search
  window.addEventListener('keydown', e => {
    if (e.key === '/') e.preventDefault();
  }, {capture:true});

  // 3) Reroute accidental hits to #/search → #/home
  const reroute = () => { if (location.hash.startsWith('#/search')) location.hash = '#/home'; };
  window.addEventListener('hashchange', reroute, {capture:true});
  reroute();
})();