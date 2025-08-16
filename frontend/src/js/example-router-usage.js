// example-router-usage.js - Example of using the router-stack helpers
import { pushPanel, popPanel } from './router-stack.js';
import { createChannelRows } from './components/channel-row.js';

/**
 * Example: Open a parties panel for a specific day
 */
export function openPartiesDay(date, title) {
  pushPanel(
    `#/parties/${date}`,
    title || 'Parties',
    async (container) => {
      // Show loading state
      container.innerHTML = '<div class="loading">Loading parties...</div>';
      
      try {
        // Fetch parties data
        const response = await fetch(`/api/parties?conference=gamescom2025&day=${date}`);
        const data = await response.json();
        
        // Render parties
        container.innerHTML = '';
        const parties = data.parties || data.data || [];
        
        if (parties.length === 0) {
          container.innerHTML = '<p>No parties on this day</p>';
          return;
        }
        
        // Create party cards
        const grid = document.createElement('div');
        grid.className = 'card-grid';
        
        parties.forEach(party => {
          const card = document.createElement('article');
          card.className = 'vcard';
          card.innerHTML = `
            <div class="vcard__body">
              <h3>${party.name || party.title}</h3>
              <p>${party.venue || 'TBA'}</p>
              <time>${party.time || ''}</time>
            </div>
          `;
          grid.appendChild(card);
        });
        
        container.appendChild(grid);
      } catch (error) {
        container.innerHTML = `<p class="error">Failed to load parties: ${error.message}</p>`;
      }
    }
  );
}

/**
 * Example: Open home panel with channel rows
 */
export function openHome() {
  pushPanel(
    '#/home',
    'Home',
    (container) => {
      // Create sections
      const partiesSection = document.createElement('section');
      partiesSection.innerHTML = '<h2>Parties</h2>';
      
      // Add day channels
      const days = [
        { route: '#/parties/2025-08-18', label: 'Mon, 18 Aug' },
        { route: '#/parties/2025-08-19', label: 'Tue, 19 Aug' },
        { route: '#/parties/2025-08-20', label: 'Wed, 20 Aug' },
        { route: '#/parties/2025-08-21', label: 'Thu, 21 Aug' },
        { route: '#/parties/2025-08-22', label: 'Fri, 22 Aug' },
        { route: '#/parties/2025-08-23', label: 'Sat, 23 Aug' },
      ];
      
      const rows = createChannelRows(days);
      partiesSection.appendChild(rows);
      
      // Add other sections
      const otherSection = document.createElement('section');
      otherSection.innerHTML = '<h2>Other</h2>';
      
      const otherChannels = [
        { route: '#/calendar', label: 'Calendar' },
        { route: '#/map', label: 'Map' },
        { route: '#/settings', label: 'Settings' },
      ];
      
      otherSection.appendChild(createChannelRows(otherChannels));
      
      container.appendChild(partiesSection);
      container.appendChild(otherSection);
    }
  );
}

/**
 * Example: Wire up navigation with the enhanced router
 */
export function initRouting() {
  // Use the enhanced router for automatic routing
  import('./router-stack-enhanced.js').then(({ registerRoute, navigateTo }) => {
    // Register routes
    registerRoute('#/home', () => ({
      title: 'Home',
      render: (container) => {
        // Same render logic as openHome
        openHome();
      }
    }));
    
    registerRoute(/^#\/parties\/(\d{4}-\d{2}-\d{2})$/, (match, date) => ({
      title: `Parties - ${new Date(date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}`,
      render: (container) => {
        openPartiesDay(date, 'Parties');
      }
    }));
    
    // Navigate to initial route
    const route = location.hash || '#/home';
    navigateTo(route);
  });
}