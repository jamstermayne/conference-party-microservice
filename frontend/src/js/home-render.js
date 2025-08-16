// home-render.js - Clean Home panel rendering with no inline styles

/**
 * Render the Home panel with day pills and channel buttons
 * @param {Object} options - Rendering options
 * @param {Array} options.days - Array of day objects with {iso, label} 
 * @param {Array} options.channels - Array of channel objects with {label, href}
 */
export function renderHome({ days, channels }) {
  const daysRoot = document.getElementById('home-days');
  const chRoot = document.getElementById('home-channels');
  
  if (!daysRoot || !chRoot) {
    console.warn('Home containers not found');
    return;
  }
  
  // Clear existing content
  daysRoot.innerHTML = '';
  chRoot.innerHTML = '';
  
  // Render day pills
  if (days && days.length > 0) {
    daysRoot.innerHTML = days.map(d => 
      `<button class="day-pill" 
               data-href="#/map/${d.iso}" 
               data-day="${d.iso}"
               aria-pressed="false"
               aria-label="View parties for ${d.label}">
         ${d.label}
       </button>`
    ).join('');
  } else {
    daysRoot.innerHTML = '<div class="home-empty">No party days available</div>';
  }
  
  // Render channel buttons
  if (channels && channels.length > 0) {
    chRoot.innerHTML = channels.map(ch => 
      `<button class="channel-btn" 
               data-href="${ch.href}" 
               role="link"
               aria-label="Navigate to ${ch.label}">
         ${ch.icon ? `<span class="channel-icon" aria-hidden="true">${ch.icon}</span>` : ''}
         <span>${ch.label}</span>
       </button>`
    ).join('');
  } else {
    chRoot.innerHTML = '<div class="home-empty">No channels available</div>';
  }
  
  // Set up event delegation for navigation
  setupNavigation(daysRoot, chRoot);
}

/**
 * Set up navigation event handlers using delegation
 */
function setupNavigation(daysRoot, chRoot) {
  // Handle day pill clicks
  daysRoot.addEventListener('click', (e) => {
    const pill = e.target.closest('.day-pill');
    if (!pill) return;
    
    e.preventDefault();
    const href = pill.dataset.href;
    const day = pill.dataset.day;
    
    // Update aria-pressed for all pills
    daysRoot.querySelectorAll('.day-pill').forEach(p => {
      p.setAttribute('aria-pressed', p === pill ? 'true' : 'false');
    });
    
    // Navigate
    if (href && window.location) {
      window.location.hash = href;
    }
    
    // Dispatch custom event for analytics
    window.dispatchEvent(new CustomEvent('home:daySelected', { 
      detail: { day, href } 
    }));
  });
  
  // Handle channel button clicks
  chRoot.addEventListener('click', (e) => {
    const btn = e.target.closest('.v-cta');
    if (!btn) return;
    
    e.preventDefault();
    const href = btn.dataset.href;
    const label = btn.textContent.trim();
    
    // Navigate
    if (href && window.location) {
      window.location.hash = href;
    }
    
    // Dispatch custom event for analytics
    window.dispatchEvent(new CustomEvent('home:channelSelected', { 
      detail: { channel: label, href } 
    }));
  });
}

/**
 * Get default party days for Gamescom
 */
export function getDefaultDays() {
  return [
    { iso: '2025-08-18', label: 'Mon' },
    { iso: '2025-08-19', label: 'Tue' },
    { iso: '2025-08-20', label: 'Wed' },
    { iso: '2025-08-21', label: 'Thu' },
    { iso: '2025-08-22', label: 'Fri' },
    { iso: '2025-08-23', label: 'Sat' }
  ];
}

/**
 * Get default channel configuration
 */
export function getDefaultChannels() {
  return [
    { label: 'My calendar', href: '#/calendar', icon: '📅' },
    { label: 'Map', href: '#/map', icon: '🗺️' },
    { label: 'Invites', href: '#/invites', icon: '✉️' },
    { label: 'Contacts', href: '#/contacts', icon: '👥' },
    { label: 'Me', href: '#/me', icon: '👤' },
    { label: 'Settings', href: '#/settings', icon: '⚙️' }
  ];
}

/**
 * Initialize Home panel with loading state
 */
export function initHomePanel() {
  const container = document.querySelector('.v-panel__body') || document.querySelector('.home-panel');
  if (!container) return;
  
  // Add loading class
  container.classList.add('home-loading');
  
  // Render with defaults
  renderHome({
    days: getDefaultDays(),
    channels: getDefaultChannels()
  });
  
  // Remove loading class after render
  requestAnimationFrame(() => {
    container.classList.remove('home-loading');
  });
}