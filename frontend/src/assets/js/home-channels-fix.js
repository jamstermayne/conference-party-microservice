(function(){
  const routes = [
    ['Map', '#/map'],
    ['My calendar', '#/calendar'],
    ['Invites', '#/invites'],
    ['Contacts', '#/contacts'],
    ['Me', '#/me'],
    ['Settings', '#/settings'],
  ];

  function ensureChannels(){
    const h = location.hash || '#/home';
    if (!/^#\/($|home)/.test(h)) return;

    const app = document.querySelector('#app') || document.body;

    // Ensure home panel exists
    let home = app.querySelector('.home-panel');
    if (!home) {
      home = document.createElement('div');
      home.className = 'home-panel';
      app.appendChild(home);
    }

    // Ensure channels grid exists
    let grid = home.querySelector('.channels-grid');
    if (!grid) {
      grid = document.createElement('nav');
      grid.className = 'channels-grid';
      home.appendChild(grid);
    }

    // Ensure required anchors exist (deduped by href)
    routes.forEach(([label, href]) => {
      if (!grid.querySelector(`.channel-btn[href="${href}"]`)) {
        const a = document.createElement('a');
        a.className = 'channel-btn';
        a.href = href;
        a.textContent = label;
        grid.appendChild(a);
      }
    });
  }

  window.addEventListener('hashchange', ensureChannels);
  document.addEventListener('DOMContentLoaded', ensureChannels);
  ensureChannels();
})();