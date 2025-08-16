/* home-channels-ensure.js - Ensure channel buttons exist on home */
(() => {
  if (window.__HOME_CHANNELS_ENSURE__) return;
  window.__HOME_CHANNELS_ENSURE__ = true;

  function ensureChannels() {
    // Only run on home
    if (!location.hash.startsWith('#/home') && location.hash !== '' && location.hash !== '#') return;
    
    // Wait a bit for other scripts to run first
    setTimeout(() => {
      let panel = document.querySelector('.home-panel');
      if (!panel) return;
      
      // Check if channels already exist
      if (document.querySelectorAll('.channel-btn, a.channel-btn').length > 0) return;
      
      // Find or create channels grid
      let grid = panel.querySelector('.channels-grid');
      if (!grid) {
        grid = document.createElement('div');
        grid.className = 'channels-grid';
        // Insert at the beginning of panel
        panel.insertBefore(grid, panel.firstChild);
      }
      
      // Add channel buttons if grid is empty
      if (grid.children.length === 0) {
        const channels = [
          { icon: '🎉', label: 'Parties', route: '#/parties' },
          { icon: '📍', label: 'Map', route: '#/map' },
          { icon: '📅', label: 'Calendar', route: '#/calendar' },
          { icon: '🔍', label: 'Search', route: '#/search' }
        ];
        
        channels.forEach(ch => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'channel-btn';
          btn.innerHTML = `
            <span class="channel-icon">${ch.icon}</span>
            <span class="channel-label">${ch.label}</span>
          `;
          btn.addEventListener('click', () => {
            location.hash = ch.route;
          });
          grid.appendChild(btn);
        });
        
        console.log('[home-channels-ensure] Added', channels.length, 'channel buttons');
      }
    }, 100); // Small delay to let other scripts run first
  }

  // Run on load and hash changes
  window.addEventListener('hashchange', ensureChannels);
  document.addEventListener('DOMContentLoaded', ensureChannels);
  ensureChannels();
})();