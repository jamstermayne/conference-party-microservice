/**
 * Google Calendar Hooks
 * Handles calendar button clicks and OAuth flow
 */

import { addToGoogle, addToOutlook, addToM2M } from './calendar-providers.js?v=b030';

/**
 * Handle button state during async operations
 */
function withBusy(btn, fn) {
  const prev = { text: btn.textContent, disabled: btn.disabled };
  btn.disabled = true;
  btn.textContent = 'Working…';
  
  return fn().then((result) => {
    if (result?.success) {
      btn.textContent = '✓ Added';
      setTimeout(() => {
        btn.textContent = prev.text;
        btn.disabled = prev.disabled;
      }, 2000);
    } else {
      btn.textContent = 'Retry';
      btn.disabled = false;
    }
    return result;
  }).catch((error) => {
    btn.textContent = 'Failed';
    btn.disabled = false;
    setTimeout(() => {
      btn.textContent = prev.text;
      btn.disabled = prev.disabled;
    }, 2000);
    throw error;
  });
}

/**
 * Extract event data from button/card
 */
function extractEventData(element) {
  const card = element.closest('.vcard, .card, .party-card, .section-card');
  
  // Try to get data from button attributes first
  const event = {
    title: element.dataset.title || 
           card?.querySelector('.vcard__title, .card-title, .vtitle')?.textContent?.trim() || 
           'Event',
    venue: element.dataset.venue || 
           element.dataset.location ||
           card?.querySelector('.venue, .location')?.textContent?.replace('📍', '').trim() || 
           '',
    location: element.dataset.venue || element.dataset.location || '',
    start: element.dataset.start || element.dataset.startIso,
    end: element.dataset.end || element.dataset.endIso,
    description: element.dataset.description || 
                 card?.querySelector('.description')?.textContent?.trim() || 
                 'Added from Conference Party',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  
  // Parse when field if start/end not available
  if (!event.start && element.dataset.when) {
    const when = element.dataset.when;
    const timeMatch = when.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const [, startHour, startMin, endHour, endMin] = timeMatch;
      const dateMatch = when.match(/(\w+)\s+(\d+)/);
      if (dateMatch) {
        const [, month, day] = dateMatch;
        const year = new Date().getFullYear();
        const monthNum = new Date(Date.parse(month + " 1, 2025")).getMonth();
        
        const startDate = new Date(year, monthNum, parseInt(day), parseInt(startHour), parseInt(startMin));
        const endDate = new Date(year, monthNum, parseInt(day), parseInt(endHour), parseInt(endMin));
        
        event.start = startDate.toISOString();
        event.end = endDate.toISOString();
        event.startISO = event.start;
        event.endISO = event.end;
      }
    }
  }
  
  return event;
}

/**
 * Show calendar provider menu
 */
function showProviderMenu(button, event) {
  // Remove any existing menu
  const existingMenu = document.querySelector('.calendar-menu');
  if (existingMenu) existingMenu.remove();
  
  const menu = document.createElement('div');
  menu.className = 'calendar-menu';
  menu.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    background: #1a2134;
    border: 1px solid rgba(139,129,255,0.3);
    border-radius: 8px;
    padding: 4px;
    min-width: 180px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 1000;
  `;
  
  menu.innerHTML = `
    <button class="menu-item" data-provider="google">
      <span>📅</span> Google Calendar
    </button>
    <button class="menu-item" data-provider="outlook">
      <span>📧</span> Outlook (.ics)
    </button>
    <button class="menu-item" data-provider="m2m">
      <span>🤝</span> Meet to Match
    </button>
  `;
  
  // Style menu items
  menu.querySelectorAll('.menu-item').forEach(item => {
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      background: transparent;
      border: none;
      color: #e8ecff;
      font-size: 14px;
      cursor: pointer;
      text-align: left;
      border-radius: 4px;
      transition: background 0.2s;
    `;
    
    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(139,129,255,0.2)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });
  });
  
  // Position relative to button
  button.style.position = 'relative';
  button.appendChild(menu);
  
  // Handle menu item clicks
  menu.addEventListener('click', async (e) => {
    e.stopPropagation();
    const provider = e.target.closest('[data-provider]')?.dataset.provider;
    if (!provider) return;
    
    menu.remove();
    
    switch (provider) {
      case 'google':
        await withBusy(button, () => addToGoogle(event));
        break;
      case 'outlook':
        addToOutlook(event);
        break;
      case 'm2m':
        addToM2M(event);
        break;
    }
  });
  
  // Close menu on outside click
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 0);
}

/**
 * Global click handler for calendar buttons
 */
document.addEventListener('click', async (e) => {
  // Handle direct calendar add buttons
  const calendarBtn = e.target.closest('[data-action="addCalendar"], [data-gcal-add]');
  if (calendarBtn) {
    e.preventDefault();
    e.stopPropagation();
    
    const event = extractEventData(calendarBtn);
    
    // Check for modifier keys or menu button
    if (e.shiftKey || e.ctrlKey || calendarBtn.dataset.showMenu) {
      showProviderMenu(calendarBtn, event);
    } else {
      // Default to Google Calendar
      await withBusy(calendarBtn, () => addToGoogle(event));
    }
    return;
  }
  
  // Handle calendar menu toggle buttons
  const menuBtn = e.target.closest('[data-action="calendarMenu"]');
  if (menuBtn) {
    e.preventDefault();
    e.stopPropagation();
    
    const mainBtn = menuBtn.parentElement?.querySelector('[data-action="addCalendar"]') || menuBtn;
    const event = extractEventData(mainBtn);
    showProviderMenu(menuBtn, event);
    return;
  }
});

// Listen for OAuth success messages from popup
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) return;
  
  if (e.data === 'gcal:connected' || e.data?.type === 'gcal:connected') {
    // OAuth successful, trigger any pending calendar adds
    const pendingButton = document.querySelector('[data-pending-calendar]');
    if (pendingButton) {
      pendingButton.removeAttribute('data-pending-calendar');
      pendingButton.click();
    }
  }
});