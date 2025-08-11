import { Store, Events, EVENTS } from './state.js';
import { qs, toast } from './ui.js';

export function SettingsView(){
  const wrap = document.createElement('section');
  wrap.innerHTML = `
    <div class="card-row">
      <div>
        <div class="h1">Settings</div>
        <div class="sub">Privacy, notifications & app controls</div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">App Installation</div>
      <div class="list">
        <div class="list-item">
          <div>
            <div class="list-title">Install Velocity</div>
            <div class="list-sub">Add to home screen for faster access</div>
          </div>
          <button id="btn-install-app" class="btn btn-small ${Store.flags.installed ? 'btn-ghost' : 'btn-primary'}" ${Store.flags.installed ? 'disabled' : ''}>
            ${Store.flags.installed ? 'Installed' : 'Install App'}
          </button>
        </div>
        
        <div class="list-item">
          <div>
            <div class="list-title">PWA Status</div>
            <div class="list-sub">Progressive Web App capabilities</div>
          </div>
          <div class="cta">
            <span class="badge ${isPWA() ? 'ok' : 'warn'}">${isPWA() ? 'Active' : 'Browser'}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">Privacy & Data</div>
      <div class="list">
        <div class="list-item">
          <div>
            <div class="list-title">Location Sharing</div>
            <div class="list-sub">For proximity-based networking features</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="toggle-location" ${Store.settings.locationEnabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        
        <div class="list-item">
          <div>
            <div class="list-title">Analytics</div>
            <div class="list-sub">Anonymous usage statistics</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="toggle-analytics" ${Store.settings.analyticsEnabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        
        <div class="list-item">
          <div>
            <div class="list-title">Data Export</div>
            <div class="list-sub">Download your profile and activity data</div>
          </div>
          <button id="btn-export" class="btn btn-small btn-ghost">Export Data</button>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">Notifications</div>
      <div class="list">
        <div class="list-item">
          <div>
            <div class="list-title">Push Notifications</div>
            <div class="list-sub">Party reminders and connection updates</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="toggle-notifications" ${Store.settings.notificationsEnabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        
        <div class="list-item">
          <div>
            <div class="list-title">Email Updates</div>
            <div class="list-sub">Weekly summaries and important updates</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="toggle-email" ${Store.settings.emailEnabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">Performance</div>
      <div class="list">
        <div class="list-item">
          <div>
            <div class="list-title">Cache Size</div>
            <div class="list-sub">${getCacheSize()} MB cached data</div>
          </div>
          <button id="btn-clear-cache" class="btn btn-small btn-ghost">Clear Cache</button>
        </div>
        
        <div class="list-item">
          <div>
            <div class="list-title">Offline Mode</div>
            <div class="list-sub">Access saved data without internet</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="toggle-offline" ${Store.settings.offlineEnabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        
        <div class="list-item">
          <div>
            <div class="list-title">Performance Mode</div>
            <div class="list-sub">Optimize for slower devices</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="toggle-performance" ${Store.settings.performanceMode ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">Account</div>
      <div class="list">
        <div class="list-item">
          <div>
            <div class="list-title">Reset App Data</div>
            <div class="list-sub">Clear all local data and settings</div>
          </div>
          <button id="btn-reset" class="btn btn-small btn-warn">Reset</button>
        </div>
        
        <div class="list-item">
          <div>
            <div class="list-title">Sign Out</div>
            <div class="list-sub">Clear session and return to welcome</div>
          </div>
          <button id="btn-logout" class="btn btn-small btn-ghost">Sign Out</button>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">About</div>
      <div class="list">
        <div class="list-item">
          <div>
            <div class="list-title">Version</div>
            <div class="list-sub">Velocity v2.1.0 • Build 2025.08.10</div>
          </div>
          <button class="btn btn-small btn-ghost" disabled>Latest</button>
        </div>
        
        <div class="list-item">
          <div>
            <div class="list-title">Support</div>
            <div class="list-sub">Get help or report issues</div>
          </div>
          <button id="btn-support" class="btn btn-small btn-ghost">Contact</button>
        </div>
        
        <div class="list-item">
          <div>
            <div class="list-title">Privacy Policy</div>
            <div class="list-sub">How we handle your data</div>
          </div>
          <button id="btn-privacy" class="btn btn-small btn-ghost">View</button>
        </div>
      </div>
    </div>
  `;
  
  setupSettingsHandlers(wrap);
  return wrap;
}

function setupSettingsHandlers(root) {
  // Install app
  root.querySelector('#btn-install-app')?.addEventListener('click', async () => {
    if (Store.flags.installed) return;
    
    try {
      // Try to trigger install prompt
      Events.emit(EVENTS.INSTALL_READY);
      toast('Install prompt triggered');
    } catch (error) {
      console.error('Install failed:', error);
      toast('Install not available in this browser');
    }
  });
  
  // Settings toggles
  root.querySelector('#toggle-location')?.addEventListener('change', (e) => {
    Store.settings.locationEnabled = e.target.checked;
    toast(e.target.checked ? 'Location sharing enabled' : 'Location sharing disabled');
    Events.emit(EVENTS.SETTINGS_CHANGED, { setting: 'location', value: e.target.checked });
  });
  
  root.querySelector('#toggle-analytics')?.addEventListener('change', (e) => {
    Store.settings.analyticsEnabled = e.target.checked;
    toast(e.target.checked ? 'Analytics enabled' : 'Analytics disabled');
    Events.emit(EVENTS.SETTINGS_CHANGED, { setting: 'analytics', value: e.target.checked });
  });
  
  root.querySelector('#toggle-notifications')?.addEventListener('change', async (e) => {
    if (e.target.checked) {
      // Request notification permission
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        Store.settings.notificationsEnabled = true;
        toast('✅ Notifications enabled');
      } else {
        e.target.checked = false;
        toast('Notification permission denied');
        return;
      }
    } else {
      Store.settings.notificationsEnabled = false;
      toast('Notifications disabled');
    }
    Events.emit(EVENTS.SETTINGS_CHANGED, { setting: 'notifications', value: e.target.checked });
  });
  
  root.querySelector('#toggle-email')?.addEventListener('change', (e) => {
    Store.settings.emailEnabled = e.target.checked;
    toast(e.target.checked ? 'Email updates enabled' : 'Email updates disabled');
    Events.emit(EVENTS.SETTINGS_CHANGED, { setting: 'email', value: e.target.checked });
  });
  
  root.querySelector('#toggle-offline')?.addEventListener('change', (e) => {
    Store.settings.offlineEnabled = e.target.checked;
    toast(e.target.checked ? 'Offline mode enabled' : 'Offline mode disabled');
    Events.emit(EVENTS.SETTINGS_CHANGED, { setting: 'offline', value: e.target.checked });
  });
  
  root.querySelector('#toggle-performance')?.addEventListener('change', (e) => {
    Store.settings.performanceMode = e.target.checked;
    toast(e.target.checked ? 'Performance mode enabled' : 'Performance mode disabled');
    Events.emit(EVENTS.SETTINGS_CHANGED, { setting: 'performance', value: e.target.checked });
  });
  
  // Data export
  root.querySelector('#btn-export')?.addEventListener('click', () => {
    exportUserData();
  });
  
  // Clear cache
  root.querySelector('#btn-clear-cache')?.addEventListener('click', async () => {
    if (confirm('Clear all cached data? This will require re-downloading content.')) {
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        // Clear localStorage (except settings)
        const settings = Store.settings;
        localStorage.clear();
        Store.settings = settings;
        
        toast('✅ Cache cleared');
        location.reload();
        
      } catch (error) {
        console.error('Failed to clear cache:', error);
        toast('Failed to clear cache');
      }
    }
  });
  
  // Reset app
  root.querySelector('#btn-reset')?.addEventListener('click', () => {
    if (confirm('Reset all app data? This cannot be undone.')) {
      if (confirm('Are you absolutely sure? All your data will be lost.')) {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if ('caches' in window) {
            caches.keys().then(names => 
              Promise.all(names.map(name => caches.delete(name)))
            );
          }
          
          toast('App data reset. Reloading...');
          setTimeout(() => location.reload(), 1000);
          
        } catch (error) {
          console.error('Reset failed:', error);
          toast('Reset failed');
        }
      }
    }
  });
  
  // Sign out
  root.querySelector('#btn-logout')?.addEventListener('click', () => {
    if (confirm('Sign out of Velocity?')) {
      // Clear user data but keep app settings
      Store.profile = null;
      Store.invites = { left: 10, redeemed: 0, totalGranted: 10, sent: [] };
      Store.savedPartyIds.clear();
      Store.connections = [];
      Store.calendar = { google: false, ics: false, mtm: false, lastSync: null };
      
      toast('Signed out');
      Events.emit(EVENTS.USER_LOGOUT);
      
      // Redirect to parties view
      setTimeout(() => {
        window.VelocityApp.mountRoute('parties');
      }, 1000);
    }
  });
  
  // Support contact
  root.querySelector('#btn-support')?.addEventListener('click', () => {
    window.open('mailto:support@velocity.app?subject=Velocity Support Request', '_blank');
  });
  
  // Privacy policy
  root.querySelector('#btn-privacy')?.addEventListener('click', () => {
    window.open('/privacy.html', '_blank');
  });
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  
  return Notification.permission;
}

function exportUserData() {
  const exportData = {
    profile: Store.profile,
    savedParties: [...Store.savedPartyIds],
    invites: Store.invites,
    connections: Store.connections || [],
    settings: Store.settings,
    calendar: Store.calendar,
    exportedAt: new Date().toISOString(),
    version: '2.1.0'
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `velocity-data-${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast('✅ Data exported');
}

function getCacheSize() {
  try {
    // Estimate localStorage size
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    
    // Convert to MB (rough estimate)
    return Math.round(total / 1024 / 1024 * 100) / 100 || 0.1;
  } catch {
    return 0.1;
  }
}

function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         Store.flags.installed;
}

// Listen for settings changes to persist them
Events.on(EVENTS.SETTINGS_CHANGED, (event) => {
  // Persistence will be handled by the persistence module
  console.log('Setting changed:', event.detail);
});