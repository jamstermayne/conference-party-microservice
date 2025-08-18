// home-restore-channels.js - Restore 4 channel buttons (no Settings)
import { showOverlay } from './overlay-panel.js';

// Ensure channels section exists
function ensureChannelsSection() {
  let section = document.querySelector('.home-section[data-section="channels"]');
  if (!section) {
    section = document.createElement('section');
    section.className = 'home-section';
    section.dataset.section = 'channels';
    section.innerHTML = `
      <h2>Quick Actions</h2>
      <div class="channels-grid"></div>
    `;
    
    // Insert after map section or at end
    const mapSection = document.querySelector('.home-section[data-section="map"]');
    const homePanel = document.querySelector('.home-panel') || document.querySelector('#home-panel');
    if (mapSection && mapSection.nextSibling) {
      homePanel.insertBefore(section, mapSection.nextSibling);
    } else if (homePanel) {
      homePanel.appendChild(section);
    }
  }
  return section;
}

// Create channel button
function createChannelButton(label, icon = '') {
  const btn = document.createElement('button');
  btn.className = 'channel-btn channel-btn--wide';
  btn.type = 'button';
  btn.style.cssText = `
    display: flex;
    align-items: center;
    gap: var(--s-3);
    padding: var(--s-3) var(--s-4);
    background: var(--bg-secondary, #f5f5f5);
    border: 1px solid var(--border-primary, #e0e0e0);
    border-radius: var(--r-2);
    cursor: pointer;
    font-size: 1rem;
    text-align: left;
    transition: background 0.2s;
  `;
  
  if (icon) {
    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    iconSpan.style.fontSize = '1.25rem';
    btn.appendChild(iconSpan);
  }
  
  const labelSpan = document.createElement('span');
  labelSpan.textContent = label;
  btn.appendChild(labelSpan);
  
  // Add hover effect
  btn.addEventListener('mouseenter', () => {
    btn.style.background = 'var(--bg-hover, #ebebeb)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = 'var(--bg-secondary, #f5f5f5)';
  });
  
  // Click handler
  btn.addEventListener('click', () => {
    const body = showOverlay(label);
    body.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-muted, #999);
        font-size: 1.125rem;
      ">
        Coming soon.
      </div>
    `;
  });
  
  return btn;
}

// Initialize channels
function initChannels() {
  const section = ensureChannelsSection();
  const grid = section.querySelector('.channels-grid');
  
  // Clear existing buttons
  grid.innerHTML = '';
  
  // Add exactly these 4 buttons (no Settings)
  const channels = [
    { label: 'Invites', icon: '✉️' },
    { label: 'My calendar', icon: '📅' },
    { label: 'Contacts', icon: '👥' },
    { label: 'Account', icon: '👤' }
  ];
  
  channels.forEach(channel => {
    grid.appendChild(createChannelButton(channel.label, channel.icon));
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChannels);
} else {
  initChannels();
}