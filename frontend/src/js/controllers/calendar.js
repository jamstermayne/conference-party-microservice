/**
 * CALENDAR CONTROLLER
 * Meet to Match integration and calendar syncing functionality
 */

import { Store } from '../store.js?v=b021';
import { Events } from '../events.js?v=b021';
import { calendar } from '../services/calendar.js?v=b021';

export function CalendarController(section) {
  const connectMount = section.querySelector('#calendar-connect-mount');
  const statusMount = section.querySelector('#calendar-status');
  const connectTpl = document.getElementById('tpl-calendar-connect');

  // Initialize calendar connection UI
  section.addEventListener('route:enter', () => {
    renderCalendarConnect();
  });

  // Handle calendar actions
  section.addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    
    if (action === 'cal.google.connect') {
      await connectGoogleCalendar();
    } else if (action === 'cal.ics.subscribe') {
      await subscribeToICS();
    }
  });

  function renderCalendarConnect() {
    if (!connectTpl) return;
    
    const clone = connectTpl.content.cloneNode(true);
    connectMount.innerHTML = '';
    connectMount.appendChild(clone);
    
    // Load current status
    const calStatus = Store.get().calendar || {};
    updateCalendarStatus(calStatus);
  }

  async function connectGoogleCalendar() {
    try {
      statusMount.innerHTML = `
        <div class="card" style="background:var(--surface-info)">
          <div class="text-sm">🔄 Connecting to Google Calendar...</div>
        </div>
      `;

      // Use Google OAuth from invites service
      const { signInWithGoogle } = await import('../services/invites.js?v=b021');
      const auth = await signInWithGoogle();
      
      // Connect calendar
      const result = await fetch('/api/calendar/google/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          id_token: auth.credential 
        })
      });

      if (result.ok) {
        const data = await result.json();
        Store.patch('calendar', { 
          googleConnected: true,
          syncEnabled: true,
          lastSync: new Date().toISOString()
        });
        
        updateCalendarStatus({ googleConnected: true, syncEnabled: true });
        Events.emit('calendar.connected', data);
      } else {
        throw new Error('Failed to connect Google Calendar');
      }
    } catch (error) {
      statusMount.innerHTML = `
        <div class="card" style="background:var(--surface-error)">
          <div class="text-sm">❌ Failed to connect: ${error.message}</div>
        </div>
      `;
    }
  }

  async function subscribeToICS() {
    const input = section.querySelector('#m2m-ics-url');
    const url = input?.value?.trim();
    
    if (!url || !url.startsWith('http')) {
      statusMount.innerHTML = `
        <div class="card" style="background:var(--surface-warning)">
          <div class="text-sm">⚠️ Please enter a valid Meet to Match .ics URL</div>
        </div>
      `;
      return;
    }

    try {
      statusMount.innerHTML = `
        <div class="card" style="background:var(--surface-info)">
          <div class="text-sm">🔄 Subscribing to Meet to Match calendar...</div>
        </div>
      `;

      const result = await fetch('/api/calendar/ics/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ icsUrl: url })
      });

      if (result.ok) {
        const data = await result.json();
        Store.patch('calendar', {
          icsSubscribed: true,
          icsUrl: url,
          lastSync: new Date().toISOString(),
          eventsCount: data.eventsCount || 0
        });
        
        updateCalendarStatus({ icsSubscribed: true, eventsCount: data.eventsCount });
        Events.emit('calendar.subscribed', data);
        input.value = '';
      } else {
        throw new Error('Failed to subscribe to calendar');
      }
    } catch (error) {
      statusMount.innerHTML = `
        <div class="card" style="background:var(--surface-error)">
          <div class="text-sm">❌ Failed to subscribe: ${error.message}</div>
        </div>
      `;
    }
  }

  function updateCalendarStatus(status) {
    if (!status.googleConnected && !status.icsSubscribed) return;

    statusMount.innerHTML = `
      <div class="card" style="background:var(--surface-success)">
        <div class="text-sm" style="font-weight:700;margin-bottom:8px">✅ Calendar Connected</div>
        <div class="stack">
          ${status.googleConnected ? '<div class="text-xs">📅 Google Calendar sync enabled</div>' : ''}
          ${status.icsSubscribed ? `<div class="text-xs">🔗 Meet to Match ICS subscribed (${status.eventsCount || 0} events)</div>` : ''}
          ${status.lastSync ? `<div class="text-xs">⏰ Last sync: ${new Date(status.lastSync).toLocaleString()}</div>` : ''}
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-secondary btn-sm" data-action="cal.sync.now">Sync Now</button>
          <button class="btn btn-ghost btn-sm" data-action="cal.disconnect">Disconnect</button>
        </div>
      </div>
    `;
  }

  // Handle privacy settings
  section.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      const settings = {
        includeTitles: section.querySelector('#cal-inc-titles')?.checked || false,
        includeAttendees: section.querySelector('#cal-inc-attendees')?.checked || false,
        conferenceWindowOnly: section.querySelector('#cal-conf-window')?.checked || true
      };
      
      Store.patch('calendar.privacy', settings);
      Events.emit('calendar.privacy.updated', settings);
    }
  });

  // Cleanup
  return () => {
    // No specific cleanup needed for calendar controller
  };
}

// Export for backward compatibility
export default CalendarController;