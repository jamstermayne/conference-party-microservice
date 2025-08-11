import { API } from './api.js';
import { Store, Events, EVENTS } from './state.js';
import { qs, toast } from './ui.js';

export function CalendarView(){
  const wrap = document.createElement('section');
  wrap.innerHTML = `
    <div class="card-row">
      <div>
        <div class="h1">Calendar Sync</div>
        <div class="sub">Add your saved parties to your calendar</div>
      </div>
      <div class="cta">
        <div class="pill">${Store.savedPartyIds.size} saved</div>
      </div>
    </div>
    
    ${!Store.savedPartyIds.size ? `
    <div class="card">
      <div class="card-row">
        <div>
          <div class="card-title">No Parties Saved</div>
          <div class="meta">Go to Parties tab and save some events first</div>
        </div>
        <button class="btn btn-ghost btn-small" onclick="window.VelocityApp.mountRoute('parties')">Browse Parties</button>
      </div>
    </div>
    ` : ''}
    
    <div class="card">
      <div class="card-title">Sync Options</div>
      <div class="list">
        <div class="list-item">
          <div>
            <div class="list-title">
              <span>Google Calendar</span>
              ${Store.calendar.google ? '<span class="badge ok">Connected</span>' : ''}
            </div>
            <div class="list-sub">Two-way sync with your Google account</div>
          </div>
          <button id="btn-google" class="btn btn-small ${Store.calendar.google ? 'btn-ghost' : 'btn-primary'}">
            ${Store.calendar.google ? 'Disconnect' : 'Connect'}
          </button>
        </div>
        
        <div class="list-item">
          <div>
            <div class="list-title">Apple Calendar</div>
            <div class="list-sub">Download .ics file for Apple Calendar</div>
          </div>
          <button id="btn-apple" class="btn btn-small btn-primary" ${!Store.savedPartyIds.size ? 'disabled' : ''}>
            Download ICS
          </button>
        </div>
        
        <div class="list-item">
          <div>
            <div class="list-title">Outlook</div>
            <div class="list-sub">Download .ics file for Outlook</div>
          </div>
          <button id="btn-outlook" class="btn btn-small btn-primary" ${!Store.savedPartyIds.size ? 'disabled' : ''}>
            Download ICS
          </button>
        </div>
        
        <div class="list-item">
          <div>
            <div class="list-title">
              <span>Meet to Match</span>
              ${Store.calendar.mtm ? '<span class="badge ok">Connected</span>' : ''}
            </div>
            <div class="list-sub">Sync with Meet to Match networking platform</div>
          </div>
          <button id="btn-mtm" class="btn btn-small ${Store.calendar.mtm ? 'btn-ghost' : 'btn-primary'}">
            ${Store.calendar.mtm ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
    
    ${Store.calendar.lastSync ? `
    <div class="card">
      <div class="card-row">
        <div>
          <div class="card-title">Last Sync</div>
          <div class="meta">${formatSyncDate(Store.calendar.lastSync)}</div>
        </div>
        <button id="btn-resync" class="btn btn-small btn-ghost">Sync Now</button>
      </div>
    </div>
    ` : ''}
    
    <div id="mtm-form" class="card" hidden>
      <div class="card-title">Connect Meet to Match</div>
      <div class="form">
        <input type="email" id="mtm-email" placeholder="Meet to Match email" class="input" required>
        <input type="password" id="mtm-password" placeholder="Password" class="input" required>
        <div class="form-row">
          <button id="btn-mtm-cancel" class="btn btn-ghost">Cancel</button>
          <button id="btn-mtm-connect" class="btn btn-primary">Connect</button>
        </div>
      </div>
    </div>
  `;
  
  setupCalendarHandlers(wrap);
  return wrap;
}

function setupCalendarHandlers(root) {
  // Google Calendar
  root.querySelector('#btn-google')?.addEventListener('click', async () => {
    if (Store.calendar.google) {
      // Disconnect
      Store.calendar.google = false;
      Store.calendar.lastSync = null;
      toast('Google Calendar disconnected');
      refreshCalendarView(root);
    } else {
      // Connect
      try {
        await API.connectGoogle();
        Store.calendar.google = true;
        Store.calendar.lastSync = Date.now();
        toast('✅ Google Calendar connected');
        Events.emit(EVENTS.CAL_SYNCED, { provider: 'google' });
        refreshCalendarView(root);
      } catch (error) {
        console.error('Failed to connect Google Calendar:', error);
        toast('Failed to connect Google Calendar');
      }
    }
  });
  
  // Apple Calendar ICS
  root.querySelector('#btn-apple')?.addEventListener('click', async () => {
    if (!Store.savedPartyIds.size) {
      toast('No parties saved to export');
      return;
    }
    
    try {
      const blob = await API.generateICS('apple');
      if (blob) {
        downloadFile(blob, 'gamescom-parties.ics');
        toast('✅ Apple Calendar file downloaded');
      } else {
        // Fallback - generate basic ICS
        const icsContent = generateBasicICS();
        downloadFile(new Blob([icsContent], { type: 'text/calendar' }), 'gamescom-parties.ics');
        toast('✅ Calendar file downloaded');
      }
    } catch (error) {
      console.error('Failed to generate ICS:', error);
      toast('Failed to generate calendar file');
    }
  });
  
  // Outlook ICS
  root.querySelector('#btn-outlook')?.addEventListener('click', async () => {
    if (!Store.savedPartyIds.size) {
      toast('No parties saved to export');
      return;
    }
    
    try {
      const blob = await API.generateICS('outlook');
      if (blob) {
        downloadFile(blob, 'gamescom-parties-outlook.ics');
        toast('✅ Outlook calendar file downloaded');
      } else {
        // Fallback
        const icsContent = generateBasicICS();
        downloadFile(new Blob([icsContent], { type: 'text/calendar' }), 'gamescom-parties-outlook.ics');
        toast('✅ Calendar file downloaded');
      }
    } catch (error) {
      console.error('Failed to generate ICS:', error);
      toast('Failed to generate calendar file');
    }
  });
  
  // Meet to Match
  root.querySelector('#btn-mtm')?.addEventListener('click', () => {
    if (Store.calendar.mtm) {
      // Disconnect
      Store.calendar.mtm = false;
      Store.calendar.lastSync = null;
      toast('Meet to Match disconnected');
      refreshCalendarView(root);
    } else {
      // Show form
      root.querySelector('#mtm-form').hidden = false;
    }
  });
  
  // Meet to Match form handlers
  root.querySelector('#btn-mtm-cancel')?.addEventListener('click', () => {
    root.querySelector('#mtm-form').hidden = true;
    root.querySelector('#mtm-email').value = '';
    root.querySelector('#mtm-password').value = '';
  });
  
  root.querySelector('#btn-mtm-connect')?.addEventListener('click', async () => {
    const email = root.querySelector('#mtm-email').value.trim();
    const password = root.querySelector('#mtm-password').value.trim();
    
    if (!email || !password) {
      toast('Email and password required');
      return;
    }
    
    try {
      await API.connectMTM({ email, password });
      Store.calendar.mtm = true;
      Store.calendar.lastSync = Date.now();
      
      root.querySelector('#mtm-form').hidden = true;
      root.querySelector('#mtm-email').value = '';
      root.querySelector('#mtm-password').value = '';
      
      toast('✅ Meet to Match connected');
      Events.emit(EVENTS.CAL_SYNCED, { provider: 'mtm' });
      refreshCalendarView(root);
      
    } catch (error) {
      console.error('Failed to connect Meet to Match:', error);
      toast('Failed to connect Meet to Match');
    }
  });
  
  // Resync
  root.querySelector('#btn-resync')?.addEventListener('click', async () => {
    try {
      if (Store.calendar.google) await API.connectGoogle();
      if (Store.calendar.mtm) await API.connectMTM({ refresh: true });
      
      Store.calendar.lastSync = Date.now();
      toast('✅ Calendar synced');
      refreshCalendarView(root);
      
    } catch (error) {
      console.error('Failed to resync:', error);
      toast('Sync failed - check connections');
    }
  });
}

function refreshCalendarView(root) {
  // Re-render the calendar view with updated state
  const newView = CalendarView();
  root.parentNode.replaceChild(newView, root);
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateBasicICS() {
  const savedParties = Store.parties.filter(p => 
    Store.savedPartyIds.has(p.id || p.eventId || 'unknown')
  );
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Velocity//Gamescom 2025//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];
  
  savedParties.forEach(party => {
    const startDate = new Date(party.start || party.startTime);
    const endDate = new Date(party.end || party.endTime);
    const uid = `party-${party.id || party.eventId}@velocity.app`;
    
    ics.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS(party.title || party.name || 'Gamescom Party')}`,
      `DESCRIPTION:${escapeICS(party.description || 'Gamescom 2025 networking event')}`,
      `LOCATION:${escapeICS(party.venue || party.location || 'TBD')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });
  
  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICS(str) {
  return String(str || '').replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
}

function formatSyncDate(ts) {
  try {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Unknown';
  }
}

// Listen for saved parties changes
Events.on(EVENTS.SAVED_PARTIES, () => {
  const activeView = document.querySelector('#route section');
  if (activeView && activeView.querySelector('#btn-apple')) {
    refreshCalendarView(activeView);
  }
});