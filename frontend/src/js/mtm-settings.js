/**
 * MeetToMatch Settings Module
 * Clean, drop-in frontend for MTM sync + Google mirroring
 */

// Helper to get auth token
const getIdToken = async () => {
  if (!window.Auth?.getIdToken) {
    throw new Error('Auth not initialized');
  }
  return await window.Auth.getIdToken();
};

// API helper
async function api(method, path, body) {
  try {
    const token = await getIdToken();
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    };
    
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    
    const res = await fetch(`/api/integrations/mtm${path}`, options);
    return await res.json();
  } catch (error) {
    console.error(`API call failed: ${method} ${path}`, error);
    return { ok: false, error: error.message };
  }
}

// Toast/alert helper (uses existing pattern or fallback)
function toast(message, type = 'info') {
  // Use existing toast system if available
  if (window.showToast) {
    window.showToast(message, type);
  } else {
    // Fallback to alert
    alert(message);
  }
}

// Initialize MTM settings
export async function initMtmSettings() {
  // Get all DOM elements
  const elements = {
    badge: document.getElementById('mtm-status-badge'),
    icsInput: document.getElementById('mtm-ics'),
    connectBtn: document.getElementById('mtm-connect'),
    syncBtn: document.getElementById('mtm-sync-now'),
    lastSync: document.getElementById('mtm-last-sync'),
    mirrorToggle: document.getElementById('mtm-mirror-toggle'),
    calIdInput: document.getElementById('mtm-cal-id'),
    saveMirrorBtn: document.getElementById('mtm-save-mirror'),
    hint: document.getElementById('mtm-hint'),
  };
  
  // State
  let state = {
    connected: false,
    lastSyncAt: null,
    mirrorToGoogle: false,
    googleCalendarId: 'primary',
    hasGoogleAuth: false,
  };
  
  // Update UI based on state
  function updateUI() {
    // Update badge
    if (state.connected) {
      elements.badge.textContent = 'Connected';
      elements.badge.className = 'badge success';
      elements.icsInput.disabled = true;
      elements.connectBtn.textContent = 'Disconnect';
      elements.connectBtn.className = 'danger';
      elements.syncBtn.disabled = false;
    } else {
      elements.badge.textContent = 'Not connected';
      elements.badge.className = 'badge';
      elements.icsInput.disabled = false;
      elements.connectBtn.textContent = 'Connect';
      elements.connectBtn.className = 'primary';
      elements.syncBtn.disabled = true;
    }
    
    // Update last sync
    if (state.lastSyncAt) {
      const date = new Date(state.lastSyncAt);
      const relative = getRelativeTime(date);
      elements.lastSync.textContent = `Last sync: ${relative}`;
    } else {
      elements.lastSync.textContent = '';
    }
    
    // Update mirror controls
    elements.mirrorToggle.checked = state.mirrorToGoogle;
    elements.calIdInput.value = state.googleCalendarId || 'primary';
    
    // Enable/disable mirror controls based on connection and auth
    const mirrorEnabled = state.connected && state.hasGoogleAuth;
    elements.mirrorToggle.disabled = !mirrorEnabled;
    elements.calIdInput.disabled = !mirrorEnabled;
    elements.saveMirrorBtn.disabled = !mirrorEnabled;
    
    if (!state.hasGoogleAuth && state.connected) {
      elements.hint.textContent = 'Sign in with Google to enable calendar mirroring.';
      elements.hint.className = 'muted warning';
    } else {
      elements.hint.textContent = 'When enabled, new/updated MTM events will be created/updated in your Google Calendar.';
      elements.hint.className = 'muted';
    }
  }
  
  // Get relative time string
  function getRelativeTime(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }
  
  // Load current status
  async function loadStatus() {
    elements.badge.textContent = 'Checking…';
    elements.badge.className = 'badge';
    
    const res = await api('GET', '/status');
    
    if (res.ok) {
      state = {
        connected: res.connected || false,
        lastSyncAt: res.lastSyncAt,
        mirrorToGoogle: res.mirrorToGoogle || false,
        googleCalendarId: res.googleCalendarId || 'primary',
        hasGoogleAuth: res.hasGoogleAuth || false,
      };
    }
    
    updateUI();
  }
  
  // Connect/disconnect handler
  elements.connectBtn.addEventListener('click', async () => {
    if (state.connected) {
      // Disconnect
      if (!confirm('Are you sure you want to disconnect MeetToMatch?')) return;
      
      elements.connectBtn.disabled = true;
      const res = await api('POST', '/disconnect');
      
      if (res.ok) {
        state.connected = false;
        toast('Disconnected from MeetToMatch');
        updateUI();
      } else {
        toast(res.error || 'Failed to disconnect', 'error');
      }
      elements.connectBtn.disabled = false;
    } else {
      // Connect
      const icsUrl = elements.icsInput.value.trim();
      if (!icsUrl) {
        toast('Please enter your MeetToMatch ICS URL', 'warning');
        elements.icsInput.focus();
        return;
      }
      
      elements.connectBtn.disabled = true;
      elements.connectBtn.textContent = 'Connecting…';
      
      const res = await api('POST', '/connect', { icsUrl });
      
      if (res.ok) {
        state.connected = true;
        elements.icsInput.value = ''; // Clear the URL for security
        toast('Connected! Your events are syncing…', 'success');
        
        // Reload status to get sync info
        setTimeout(loadStatus, 2000);
      } else {
        toast(res.error || 'Failed to connect', 'error');
      }
      
      elements.connectBtn.disabled = false;
      updateUI();
    }
  });
  
  // Sync now handler
  elements.syncBtn.addEventListener('click', async () => {
    elements.syncBtn.disabled = true;
    elements.syncBtn.textContent = 'Syncing…';
    
    const res = await api('POST', '/syncNow');
    
    if (res.ok) {
      toast(`Synced ${res.count || 0} events`, 'success');
      state.lastSyncAt = new Date().toISOString();
      updateUI();
    } else {
      toast(res.error || 'Sync failed', 'error');
    }
    
    elements.syncBtn.disabled = false;
    elements.syncBtn.textContent = 'Sync now';
  });
  
  // Save mirror settings handler
  elements.saveMirrorBtn.addEventListener('click', async () => {
    const enabled = elements.mirrorToggle.checked;
    const calendarId = elements.calIdInput.value.trim() || 'primary';
    
    elements.saveMirrorBtn.disabled = true;
    elements.saveMirrorBtn.textContent = 'Saving…';
    
    const res = await api('POST', '/mirror', { enabled, calendarId });
    
    if (res.ok) {
      state.mirrorToGoogle = enabled;
      state.googleCalendarId = calendarId;
      toast(enabled ? 'Mirror enabled' : 'Mirror disabled', 'success');
      
      // Trigger sync if enabling
      if (enabled) {
        setTimeout(() => {
          elements.syncBtn.click();
        }, 1000);
      }
    } else {
      toast(res.error || 'Failed to save', 'error');
      // Revert UI
      elements.mirrorToggle.checked = state.mirrorToGoogle;
      elements.calIdInput.value = state.googleCalendarId;
    }
    
    elements.saveMirrorBtn.disabled = false;
    elements.saveMirrorBtn.textContent = 'Save mirroring';
  });
  
  // Auto-refresh status every 60 seconds
  let refreshInterval;
  
  function startAutoRefresh() {
    refreshInterval = setInterval(() => {
      if (state.connected) {
        loadStatus();
      }
    }, 60000);
  }
  
  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }
  
  // Initialize
  await loadStatus();
  startAutoRefresh();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', stopAutoRefresh);
  
  return {
    refresh: loadStatus,
    getState: () => state,
  };
}

// Auto-init if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMtmSettings);
} else {
  initMtmSettings();
}