// home-wired.js - Properly wired Home panel with v-row components
import { pushPanel } from '../router-stack.js';
import { createChannelRow } from '../components/channel-row.js';
import { jsonGET } from '../utils/json-fetch.js';

// Mount functions for each panel
import { mountPartiesDay } from './mount-parties.js';
import { mountCalendar } from './mount-calendar.js';
import { mountMap } from './mount-map.js';
import { mountInvites } from './mount-invites.js';
import { mountContacts } from './mount-contacts.js';
import { mountMe } from './mount-me.js';
import { mountSettings } from './mount-settings.js';

export async function renderHome() {
  const stack = document.getElementById('stack') || document.getElementById('panel-stack');
  if (!stack) return;
  
  // Create root panel (no back button)
  const panel = document.createElement('section');
  panel.className = 'v-panel is-active';
  panel.id = 'panel-home';
  panel.innerHTML = `
    <header class="v-topbar">
      <span></span>
      <h1 class="v-topbar__title">Home</h1>
      <span></span>
    </header>
    <main class="v-panel__body">
      <section class="v-section">
        <h2>Parties</h2>
        <div id="party-days" class="v-rows"></div>
      </section>
      <section class="v-section">
        <h2>Channels</h2>
        <div id="channels" class="v-rows"></div>
      </section>
    </main>
  `;
  
  // Clear stack and add home
  stack.innerHTML = '';
  stack.appendChild(panel);
  
  // Load party days
  try {
    const days = await jsonGET('/api/party-days?conference=gamescom2025');
    const partyContainer = panel.querySelector('#party-days');
    
    days.forEach(day => {
      const row = createChannelRow({
        route: `#/parties/${day.date}`,
        label: day.label,
        ariaLabel: `View parties for ${day.label}`,
        icon: '🎉'
      });
      
      // Override click to use pushPanel
      row.onclick = (e) => {
        e.preventDefault();
        pushPanel(`#/parties/${day.date}`, day.label, (container) => {
          mountPartiesDay(container, day.date);
        }, row);
      };
      
      partyContainer.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load party days:', err);
    // Fallback to static days
    const fallbackDays = [
      { date: '2025-08-18', label: 'Mon, 18 Aug' },
      { date: '2025-08-19', label: 'Tue, 19 Aug' },
      { date: '2025-08-20', label: 'Wed, 20 Aug' },
      { date: '2025-08-21', label: 'Thu, 21 Aug' },
      { date: '2025-08-22', label: 'Fri, 22 Aug' },
      { date: '2025-08-23', label: 'Sat, 23 Aug' }
    ];
    
    const partyContainer = panel.querySelector('#party-days');
    fallbackDays.forEach(day => {
      const row = createChannelRow({
        route: `#/parties/${day.date}`,
        label: day.label,
        ariaLabel: `View parties for ${day.label}`,
        icon: '🎉'
      });
      
      row.onclick = (e) => {
        e.preventDefault();
        pushPanel(`#/parties/${day.date}`, day.label, (container) => {
          mountPartiesDay(container, day.date);
        }, row);
      };
      
      partyContainer.appendChild(row);
    });
  }
  
  // Add channel rows
  const channels = [
    { route: '#/calendar', label: 'My calendar', icon: '📅', mount: mountCalendar },
    { route: '#/map', label: 'Map', icon: '🗺️', mount: mountMap },
    { route: '#/invites', label: 'Invites', icon: '✉️', mount: mountInvites },
    { route: '#/contacts', label: 'Contacts', icon: '👥', mount: mountContacts },
    { route: '#/me', label: 'Me', icon: '👤', mount: mountMe },
    { route: '#/settings', label: 'Settings', icon: '⚙️', mount: mountSettings }
  ];
  
  const channelsContainer = panel.querySelector('#channels');
  channels.forEach(channel => {
    const row = createChannelRow({
      route: channel.route,
      label: channel.label,
      icon: channel.icon,
      ariaLabel: `Open ${channel.label}`
    });
    
    row.onclick = (e) => {
      e.preventDefault();
      pushPanel(channel.route, channel.label, channel.mount, row);
    };
    
    channelsContainer.appendChild(row);
  });
  
  // Focus on title for screen readers
  panel.querySelector('.v-topbar__title')?.focus();
}