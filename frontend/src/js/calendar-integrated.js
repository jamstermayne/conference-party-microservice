/**
 * Calendar View with Google Calendar Integration
 * Handles both connected and disconnected states
 */
import GCal from './services/gcal-backend.js?v=b030';

const HOUR_H = () => parseFloat(getComputedStyle(document.documentElement)
  .getPropertyValue('--hour-height')) || 240;

const BASE = 8;  // 08:00 baseline
const END  = 22; // 22:00 end
const GUTTER = () => parseFloat(getComputedStyle(document.documentElement)
  .getPropertyValue('--cal-gutter')) || 56;

/** Utilities */
const mins = t => { const [h,m] = String(t).split(':').map(Number); return h*60 + (m||0); };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/**
 * Render connect prompt for non-authenticated users
 */
function renderConnect(mount) {
  mount.innerHTML = `
    <section style="margin:24px">
      <h2 style="color:#eaf0ff;margin:0 0 12px">Your calendar</h2>
      <p style="color:#9aa7bf;margin:8px 0 16px">
        Connect Google Calendar to see your schedule here and one-click add parties.
      </p>
      <button class="vbtn primary" id="gcal-connect">Connect Google Calendar</button>
    </section>`;
  
  document.getElementById('gcal-connect')?.addEventListener('click', () => {
    GCal.startOAuth();
  });
}

/**
 * Render Google Calendar events in agenda view
 */
async function renderGcalAgenda(mount) {
  // Show loading state
  mount.innerHTML = `
    <section style="margin:24px">
      <div style="display:flex;gap:8px;margin:0 0 12px">
        <button class="vbtn primary" data-range="today">Today</button>
        <button class="vbtn" data-range="tomorrow">Tomorrow</button>
        <button class="vbtn" data-range="week">This week</button>
      </div>
      <div id="agenda">
        <div style="color:#9aa7bf;padding:24px;text-align:center">Loading events...</div>
      </div>
    </section>`;
  
  try {
    // Fetch events from Google Calendar
    const events = await GCal.listEvents({ range: 'today' });
    
    const agenda = document.getElementById('agenda');
    
    if (!events.length) {
      agenda.innerHTML = `
        <div style="color:#9aa7bf;padding:24px;text-align:center">
          No events scheduled for today
        </div>`;
      return;
    }
    
    // Render event cards
    agenda.innerHTML = events.map(ev => `
      <article class="vcard" style="margin-bottom:12px">
        <div class="vcard__head">
          <div class="vcard__title">${ev.summary}</div>
        </div>
        <div class="vmeta">📍 ${ev.location || 'No location'} • 🕒 ${ev.start} – ${ev.end}</div>
        <div class="vactions">
          <a href="${ev.htmlLink}" target="_blank" class="vbtn">View in Google Calendar</a>
        </div>
      </article>`).join('');
    
    // Add demo party cards to show "Add to Calendar" functionality
    agenda.innerHTML += `
      <h3 style="color:#9aa7bf;margin:24px 0 12px">Suggested parties</h3>
      <article class="vcard" style="margin-bottom:12px;border:1px solid rgba(139,129,255,.2)">
        <div class="vcard__head">
          <div class="vcard__title">Gamescom Opening Party</div>
          <div class="vcard__badges">
            <span class="vpill">Networking</span>
          </div>
        </div>
        <div class="vmeta">📍 Koelnmesse • 🕒 19:00 – 23:00</div>
        <div class="vactions">
          <button class="vbtn primary" data-party-id="gamescom-opening" data-act="add">
            Add to Calendar
          </button>
        </div>
      </article>`;
    
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    document.getElementById('agenda').innerHTML = `
      <div style="color:#f44336;padding:24px;text-align:center">
        Failed to load calendar events. Please reconnect.
      </div>`;
  }
  
  // Handle range switching
  mount.addEventListener('click', async (e) => {
    const rangeBtn = e.target.closest('[data-range]');
    if (rangeBtn) {
      // Update active button
      mount.querySelectorAll('[data-range]').forEach(btn => btn.classList.remove('primary'));
      rangeBtn.classList.add('primary');
      
      // Reload with new range
      const range = rangeBtn.dataset.range;
      const events = await GCal.listEvents({ range });
      
      // Re-render agenda (simplified for brevity)
      const agenda = document.getElementById('agenda');
      agenda.innerHTML = events.length ? 
        events.map(ev => `
          <article class="vcard" style="margin-bottom:12px">
            <div class="vcard__head">
              <div class="vcard__title">${ev.summary}</div>
            </div>
            <div class="vmeta">📍 ${ev.location || 'No location'} • 🕒 ${ev.start} – ${ev.end}</div>
          </article>`).join('') :
        `<div style="color:#9aa7bf;padding:24px;text-align:center">No events for ${range}</div>`;
    }
    
    // Handle add to calendar
    const addBtn = e.target.closest('[data-act="add"]');
    if (addBtn) {
      const partyId = addBtn.dataset.partyId;
      addBtn.disabled = true;
      addBtn.textContent = 'Adding...';
      
      try {
        await GCal.createEventFromParty(partyId);
        addBtn.textContent = 'Added!';
        addBtn.classList.remove('primary');
        addBtn.classList.add('success');
      } catch (error) {
        addBtn.textContent = 'Failed';
        addBtn.disabled = false;
      }
    }
  });
}

/**
 * Main render function - checks auth state
 */
export async function renderCalendar(mount) {
  if (!mount) return;
  
  // Check if user is connected to Google Calendar
  const connected = await GCal.isConnected();
  
  if (!connected) {
    return renderConnect(mount);
  }
  
  return renderGcalAgenda(mount);
}

export default { renderCalendar };