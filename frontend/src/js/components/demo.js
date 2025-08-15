import { createChannelRows } from './channel-row.js';

/**
 * Demo showing how to use the channel row component
 */
export function createDemoPanel() {
  const panel = document.createElement('div');
  panel.className = 'v-panel is-active';
  
  panel.innerHTML = `
    <div class="v-topbar">
      <button class="v-topbar__back" aria-label="Back">←</button>
      <h1 class="v-topbar__title">Parties</h1>
      <span></span>
    </div>
    <div class="v-scroll" style="padding: var(--s-4);">
      <div id="channel-list"></div>
    </div>
  `;
  
  // Example party days data
  const partyDays = [
    { route: '#/parties/2025-08-18', label: 'Mon, 18 Aug', icon: '🎮' },
    { route: '#/parties/2025-08-19', label: 'Tue, 19 Aug', icon: '🎯' },
    { route: '#/parties/2025-08-20', label: 'Wed, 20 Aug', icon: '🎪' },
    { route: '#/parties/2025-08-21', label: 'Thu, 21 Aug', icon: '🎭' },
    { route: '#/parties/2025-08-22', label: 'Fri, 22 Aug', icon: '🎉' },
    { route: '#/parties/2025-08-23', label: 'Sat, 23 Aug', icon: '🎊' },
  ];
  
  // Add channel rows to the panel
  const channelList = panel.querySelector('#channel-list');
  channelList.appendChild(createChannelRows(partyDays));
  
  return panel;
}