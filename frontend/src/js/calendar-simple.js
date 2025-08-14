/**
 * Simple Calendar View
 * Uses minimal GCal service for clean backend integration
 */
import { GCal } from './services/gcal-minimal.js?v=b031';

/**
 * Show connect prompt
 */
function renderConnect(mount) {
  mount.innerHTML = `
    <section class="calendar-connect" style="padding:24px">
      <h2 style="color:#eaf0ff;margin:0 0 12px">Connect Your Calendar</h2>
      <p style="color:#9aa7bf;margin:0 0 20px">
        See your schedule and add parties with one click
      </p>
      <button class="vbtn primary" onclick="GCal.startOAuth()">
        Connect Google Calendar
      </button>
    </section>`;
  
  // Make GCal available globally for onclick
  window.GCal = GCal;
}

/**
 * Show calendar events
 */
async function renderEvents(mount) {
  // Initial loading state
  mount.innerHTML = `
    <section class="calendar-events" style="padding:24px">
      <div class="cal-nav" style="display:flex;gap:8px;margin:0 0 16px">
        <button class="vbtn primary" data-range="today">Today</button>
        <button class="vbtn" data-range="tomorrow">Tomorrow</button>
        <button class="vbtn" data-range="week">Week</button>
      </div>
      <div id="events-list">
        <div style="color:#9aa7bf;text-align:center;padding:24px">
          Loading events...
        </div>
      </div>
    </section>`;
  
  try {
    // Load today's events
    const events = await GCal.listEvents('today');
    const list = document.getElementById('events-list');
    
    if (!events || !events.length) {
      list.innerHTML = `
        <div style="color:#9aa7bf;text-align:center;padding:24px">
          No events scheduled for today
        </div>`;
      return;
    }
    
    // Render event cards
    list.innerHTML = events.map(event => `
      <article class="vcard" style="margin-bottom:12px">
        <div class="vcard__head">
          <div class="vcard__title">${event.summary || 'Untitled'}</div>
        </div>
        <div class="vmeta">
          📍 ${event.location || 'No location'} • 
          🕒 ${formatTime(event.start)} - ${formatTime(event.end)}
        </div>
      </article>
    `).join('');
    
  } catch (error) {
    console.error('Failed to load events:', error);
    document.getElementById('events-list').innerHTML = `
      <div style="color:#f44336;text-align:center;padding:24px">
        Failed to load events. Please try reconnecting.
      </div>`;
  }
  
  // Handle range switching
  mount.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-range]');
    if (!btn) return;
    
    // Update active button
    mount.querySelectorAll('[data-range]').forEach(b => 
      b.classList.remove('primary'));
    btn.classList.add('primary');
    
    // Load new range
    const range = btn.dataset.range;
    const list = document.getElementById('events-list');
    list.innerHTML = '<div style="color:#9aa7bf;text-align:center;padding:24px">Loading...</div>';
    
    try {
      const events = await GCal.listEvents(range);
      
      if (!events || !events.length) {
        list.innerHTML = `
          <div style="color:#9aa7bf;text-align:center;padding:24px">
            No events for ${range}
          </div>`;
        return;
      }
      
      list.innerHTML = events.map(event => `
        <article class="vcard" style="margin-bottom:12px">
          <div class="vcard__head">
            <div class="vcard__title">${event.summary || 'Untitled'}</div>
          </div>
          <div class="vmeta">
            📍 ${event.location || 'No location'} • 
            🕒 ${formatTime(event.start)} - ${formatTime(event.end)}
          </div>
        </article>
      `).join('');
      
    } catch (error) {
      list.innerHTML = `
        <div style="color:#f44336;text-align:center;padding:24px">
          Failed to load events
        </div>`;
    }
  });
}

/**
 * Add demo parties section
 */
function addDemoParties(mount) {
  const demoParties = [
    {
      id: 'gamescom-opening',
      title: 'Gamescom Opening Night',
      venue: 'Koelnmesse Hall 1',
      start: '2025-08-20T19:00:00',
      end: '2025-08-20T23:00:00'
    },
    {
      id: 'indie-mixer',
      title: 'Indie Developer Mixer',
      venue: 'Marriott Hotel Rooftop',
      start: '2025-08-21T18:00:00',
      end: '2025-08-21T21:00:00'
    }
  ];
  
  const section = document.createElement('section');
  section.style.padding = '0 24px 24px';
  section.innerHTML = `
    <h3 style="color:#9aa7bf;margin:24px 0 12px">Add to Calendar</h3>
    ${demoParties.map(party => `
      <article class="vcard" style="margin-bottom:12px;border:1px solid rgba(139,129,255,.2)">
        <div class="vcard__head">
          <div class="vcard__title">${party.title}</div>
        </div>
        <div class="vmeta">
          📍 ${party.venue} • 
          🕒 ${formatTime(party.start)} - ${formatTime(party.end)}
        </div>
        <div class="vactions">
          <button class="vbtn primary" data-party='${JSON.stringify(party)}'>
            Add to Calendar
          </button>
        </div>
      </article>
    `).join('')}`;
  
  mount.appendChild(section);
  
  // Handle add to calendar
  section.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-party]');
    if (!btn) return;
    
    const party = JSON.parse(btn.dataset.party);
    btn.disabled = true;
    btn.textContent = 'Adding...';
    
    try {
      // Convert to ISO format for backend
      party.startISO = party.start;
      party.endISO = party.end;
      
      await GCal.createFromParty(party);
      btn.textContent = 'Added!';
      btn.classList.remove('primary');
      
      // Show success toast
      showToast('Event added to Google Calendar!', 'success');
      
    } catch (error) {
      console.error('Failed to add event:', error);
      btn.textContent = 'Failed';
      btn.disabled = false;
      showToast('Failed to add event', 'error');
    }
  });
}

/**
 * Helper: Format time
 */
function formatTime(dateStr) {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return dateStr;
  }
}

/**
 * Helper: Show toast notification
 */
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  const colors = {
    success: 'linear-gradient(135deg, #667eea, #764ba2)',
    error: 'linear-gradient(135deg, #f093fb, #f5576c)',
    info: 'linear-gradient(135deg, #4facfe, #00f2fe)'
  };
  
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 16px 24px;
    background: ${colors[type]};
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideUp 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add animations if not present
if (!document.querySelector('style[data-calendar-animations]')) {
  const style = document.createElement('style');
  style.setAttribute('data-calendar-animations', 'true');
  style.textContent = `
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideDown {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Main render function
 */
export async function renderCalendar(mount) {
  if (!mount) return;
  
  // Check connection status
  const connected = await GCal.isConnected();
  
  if (!connected) {
    renderConnect(mount);
  } else {
    await renderEvents(mount);
    addDemoParties(mount);
  }
}

export default { renderCalendar };