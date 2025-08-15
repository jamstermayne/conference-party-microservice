// Helper to get token synchronously (assumes Auth is already initialized)
const getIdToken = {
  sync: () => {
    const user = window.Auth?.current?.();
    if (!user) throw new Error('Not authenticated');
    // Return a promise that will be awaited by the fetch
    return window.Auth.getIdToken();
  }
};

async function post(path, body) {
  const token = await getIdToken.sync();
  return fetch(`/api/integrations/mtm${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body || {})
  }).then(r => r.json());
}

export function initMtmIntegration() {
  const actions = document.getElementById('mtm-actions');
  const panel = document.getElementById('mtm-connect');
  const urlInput = document.getElementById('mtm-ics-url');
  const btn = document.getElementById('mtm-connect-btn');

  const state = { 
    connected: false, 
    lastSyncAt: null,
    mirrorToGoogle: false,
    hasGoogleAuth: false,
    googleCalendarId: 'primary'
  };

  const render = () => {
    let actionsHtml = '';
    
    if (state.connected) {
      actionsHtml = `
        <button id="mtm-sync">Sync now</button>
        <button id="mtm-disconnect">Disconnect</button>
        <small>${state.lastSyncAt ? `Last sync: ${new Date(state.lastSyncAt.seconds*1000).toLocaleString()}` : ''}</small>
      `;
      
      // Add Google Calendar mirror toggle if connected
      if (state.hasGoogleAuth) {
        actionsHtml += `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--neutral-300);">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
              <input type="checkbox" id="mtm-mirror-toggle" ${state.mirrorToGoogle ? 'checked' : ''}>
              <span>Mirror to Google Calendar</span>
            </label>
            <div style="margin-top: 8px;">
              <input type="text" id="mtm-cal-id" 
                     placeholder="primary" 
                     value="${state.googleCalendarId || 'primary'}"
                     style="padding: 4px 8px; background: var(--alias-0f1114); border: 1px solid var(--neutral-300); 
                            border-radius: 4px; color: var(--white); font-size: 13px; width: 150px;">
              <button id="mtm-save-mirror" 
                      style="margin-left: 8px; padding: 4px 12px; background: var(--brand-500); 
                             border: none; border-radius: 4px; color: white; font-size: 13px; 
                             cursor: pointer;">
                Save
              </button>
            </div>
            <small style="display: block; margin-top: 4px; color: var(--neutral-700);">
              Calendar ID (use 'primary' for main calendar)
            </small>
          </div>
        `;
      } else {
        actionsHtml += `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--neutral-300);">
            <small style="color: var(--neutral-700);">
              Sign in with Google to enable calendar mirroring
            </small>
          </div>
        `;
      }
    } else {
      actionsHtml = `<button id="mtm-show">Connect MeetToMatch</button>`;
    }
    
    actions.innerHTML = actionsHtml;

    document.getElementById('mtm-show')?.addEventListener('click', () => {
      panel.classList.remove('hidden');
      urlInput.focus();
    });
    document.getElementById('mtm-sync')?.addEventListener('click', async () => {
      const res = await post('/syncNow');
      alert(res.ok ? `Synced ${res.count} items` : res.error);
    });
    document.getElementById('mtm-disconnect')?.addEventListener('click', async () => {
      const res = await post('/disconnect');
      if (res.ok) { state.connected = false; panel.classList.add('hidden'); render(); }
    });
    
    // Wire mirror controls
    const tgl = document.getElementById('mtm-mirror-toggle');
    const cal = document.getElementById('mtm-cal-id');
    const save = document.getElementById('mtm-save-mirror');
    
    save?.addEventListener('click', async () => {
      const enabled = !!tgl.checked;
      const calendarId = (cal.value || 'primary').trim();
      const res = await post('/mirror', { enabled, calendarId });
      if (res.ok) {
        state.mirrorToGoogle = enabled;
        state.googleCalendarId = calendarId;
        alert('Saved');
      } else {
        alert(res.error || 'Failed');
      }
    });
  };

  btn.addEventListener('click', async () => {
    const icsUrl = urlInput.value.trim();
    if (!icsUrl) return alert('Paste your ICS URL.');
    const res = await post('/connect', { icsUrl });
    if (res.ok) { state.connected = true; panel.classList.add('hidden'); render(); }
    else alert(res.error || 'Failed to connect');
  });

  // Fetch current status on init
  const checkStatus = async () => {
    try {
      let token = '';
      try {
        token = await window.Auth.getIdToken();
      } catch (e) {
        console.warn('Not authenticated');
        return;
      }
      
      const res = await fetch('/api/integrations/mtm/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(r => r.json());
      
      if (res.ok && res.connected) {
        state.connected = true;
        state.lastSyncAt = res.lastSyncAt ? { seconds: new Date(res.lastSyncAt).getTime() / 1000 } : null;
        state.mirrorToGoogle = res.mirrorToGoogle || false;
        state.hasGoogleAuth = res.hasGoogleAuth || false;
        state.googleCalendarId = res.googleCalendarId || 'primary';
      }
    } catch (e) {
      console.error('Failed to check MTM status:', e);
    }
    render();
  };
  
  checkStatus();
  
  // (Optional) Hydrate toggle from a status endpoint or Firestore fetch later.
  // The checkStatus function above already does this by fetching /status on init
}