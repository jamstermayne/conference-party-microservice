/**
 * Clean Calendar View
 * Minimal implementation with Google Calendar integration
 */
import { GCal } from './services/gcal.js?v=b032';

export async function renderCalendar(mount) {
  mount.innerHTML = '';
  
  // Check connection status
  const connected = await GCal.isConnected().catch(() => false);
  
  if (!connected) {
    // Show connect prompt
    mount.innerHTML = `
      <section style="margin:24px">
        <h2 style="color:#eaf0ff">Your calendar</h2>
        <p style="color:#9aa7bf">Connect Google Calendar to see your schedule here and one-click add parties.</p>
        <button class="vbtn primary" id="gcal-connect">Connect Google Calendar</button>
      </section>`;
    
    document.getElementById('gcal-connect')?.addEventListener('click', GCal.startOAuth);
    return;
  }

  // Create calendar panel
  const panel = document.createElement('section');
  panel.style.margin = '24px';
  panel.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <button class="vbtn primary" data-range="today">Today</button>
      <button class="vbtn" data-range="tomorrow">Tomorrow</button>
      <button class="vbtn" data-range="week">This week</button>
    </div>
    <div id="agenda" aria-busy="true"></div>`;
  mount.appendChild(panel);

  // Load events function
  async function load(range = 'today') {
    const el = panel.querySelector('#agenda');
    el.setAttribute('aria-busy', 'true');
    
    // Update active button
    panel.querySelectorAll('[data-range]').forEach(btn => {
      btn.classList.toggle('primary', btn.dataset.range === range);
    });
    
    try {
      const events = await GCal.listEvents(range);
      
      if (!events || !events.length) {
        el.innerHTML = '<p style="color:#9aa7bf;text-align:center;padding:24px">No events.</p>';
        return;
      }
      
      el.innerHTML = events.map(ev => `
        <article class="vcard" style="margin-bottom:12px">
          <div class="vcard__head">
            <div class="vcard__title">${ev.summary || 'Untitled'}</div>
          </div>
          <div class="vmeta">📍 ${ev.location || '—'} • 🕒 ${formatTime(ev.start)}–${formatTime(ev.end)}</div>
        </article>`).join('');
        
    } catch (error) {
      el.innerHTML = '<p style="color:#f44336;text-align:center;padding:24px">Failed to load events.</p>';
      
    } finally {
      el.removeAttribute('aria-busy');
    }
  }
  
  // Handle range selection
  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-range]');
    if (btn) load(btn.dataset.range);
  });
  
  // Load initial events
  load();
}

// Helper: Format time from various formats
function formatTime(timeStr) {
  if (!timeStr) return '';
  
  // If already formatted as HH:MM
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  
  // Parse and format
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return timeStr;
  }
}

export default { renderCalendar };