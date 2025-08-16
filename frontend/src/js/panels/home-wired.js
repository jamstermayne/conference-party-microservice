// home-wired.js - Properly wired Home panel with clean rendering
import { renderHome, getDefaultDays, getDefaultChannels } from '../home-render.js';
import { jsonGET } from '../utils/json-fetch.js';

// pushPanel is available on window object

// Mount functions for each panel
import { mountPartiesDay } from './mount-parties.js';
import { mountCalendar } from './mount-calendar.js';
import { mountMap as mountMapPanel } from './mount-map.js';
import { mountInvites } from './mount-invites.js';
import { mountContacts } from './mount-contacts.js';
import { mountMe } from './mount-me.js';
import { mountSettings } from './mount-settings.js';

export async function renderHome() {
  const stack = document.getElementById('main') || document.getElementById('stack') || document.getElementById('panel-stack');
  if (!stack) return;
  
  // Clear any existing panels first
  stack.innerHTML = '';
  
  // Clear the panel tracking array if it exists
  if (window.clearPanelStack) {
    window.clearPanelStack();
  }
  
  // Create root panel with clean structure
  const panel = document.createElement('section');
  panel.className = 'v-panel';
  panel.id = 'panel-home';
  panel.innerHTML = `
    <header class="v-topbar">
      <span></span>
      <h1 class="v-topbar__title">Home</h1>
      <span></span>
    </header>
    <main class="v-panel__body">
      <div class="home-panel">
        <section class="home-section">
          <h2 class="home-h2">Parties</h2>
          <div id="home-days" class="day-pills"></div>
        </section>
        <section class="home-section">
          <h2 class="home-h2">Channels</h2>
          <div id="home-channels" class="home-channels"></div>
        </section>
      </div>
    </main>
  `;
  
  // Add to stack
  stack.appendChild(panel);
  
  // Activate after adding to DOM
  requestAnimationFrame(() => {
    panel.classList.add('is-active');
  });
  
  // Load party days and render
  let days = getDefaultDays();
  let channels = getDefaultChannels();
  
  try {
    // Try to load party days from API
    const apiDays = await jsonGET('/api/party-days?conference=gamescom2025');
    if (apiDays && apiDays.length > 0) {
      days = apiDays.map(d => ({
        iso: d.date,
        label: d.label || new Date(d.date).toLocaleDateString('en', { weekday: 'short' })
      }));
    }
  } catch (err) {
    console.error('Failed to load party days:', err);
    // Use default days
  }
  
  // Render using the clean home-render module
  renderHome({ days, channels });
  
  // Set up panel navigation for channels (override default navigation)
  const setupPanelNavigation = () => {
    const channelButtons = panel.querySelectorAll('.channel-btn');
    const mountMap = {
      '#/calendar': mountCalendar,
      '#/map': mountMapPanel,
      '#/invites': mountInvites,
      '#/contacts': mountContacts,
      '#/me': mountMe,
      '#/settings': mountSettings
    };
    
    channelButtons.forEach(btn => {
      const href = btn.dataset.href;
      const mount = mountMap[href];
      if (mount) {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const label = btn.textContent.trim();
          window.pushPanel(href, label, mount, btn);
        };
      }
    });
    
    // Set up panel navigation for day pills
    const dayPills = panel.querySelectorAll('.day-pill');
    dayPills.forEach(pill => {
      const href = pill.dataset.href;
      const day = pill.dataset.day;
      pill.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const label = pill.textContent.trim();
        window.pushPanel(href, label, (container) => {
          mountPartiesDay(container, day);
        }, pill);
      };
    });
  };
  
  // Set up navigation after render
  requestAnimationFrame(setupPanelNavigation);
  
  // Focus on title for screen readers
  panel.querySelector('.v-topbar__title')?.focus();
}