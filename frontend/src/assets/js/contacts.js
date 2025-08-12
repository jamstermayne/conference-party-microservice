// Contacts: Handle addressBook:syncRequest → present choice (Google/Outlook), call endpoints, update Store + toasts
import { Store, Events } from './state.js';

let sheetEl = null;

document.addEventListener('DOMContentLoaded', () => {
  Events.on('addressBook:syncRequest', showSheet);
  
  // Listen for contact sync events to update UI
  Events.on('contacts:connected', handleContactsConnected);
});

function showSheet({ source, inputEl } = {}) {
  if (Store.get('profile.contactsConnected') === true) {
    Events.emit('ui:toast', { 
      type: 'info', 
      message: 'Contacts already synced ✓' 
    });
    return;
  }
  
  // Track the source for analytics
  Store.set('contactSync.requestSource', source);
  Store.set('contactSync.requestTime', Date.now());
  
  // Use the new permission sheet if available
  if (window.ContactsPermission) {
    window.ContactsPermission.show({ 
      trigger: source || 'manual' 
    }).then(result => {
      if (result.allowed) {
        // Contact sync was successful
        handleContactsConnected({ 
          provider: 'native', 
          contactCount: result.contactsCount || 0 
        });
      }
    });
  } else {
    // Fallback to original sheet
    mountSheet();
  }
}

function mountSheet() {
  if (sheetEl) return;
  
  sheetEl = document.createElement('div');
  sheetEl.className = 'contact-sheet';
  sheetEl.setAttribute('aria-hidden', 'false');
  
  sheetEl.innerHTML = `
    <div class="contact-sheet-content" role="dialog" aria-labelledby="cs-title" aria-describedby="cs-desc">
      <button class="sheet-close" aria-label="Close">&times;</button>
      <div class="sheet-header">
        <h3 id="cs-title">Sync address book</h3>
        <p id="cs-desc" class="cs-sub">Pick a provider to auto-complete emails everywhere.</p>
        ${getBonusMessage()}
      </div>
      <div class="cs-actions">
        <button class="btn btn-primary cs-provider" id="cs-google" data-provider="google">
          <svg class="provider-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google Contacts
        </button>
        <button class="btn btn-secondary cs-provider" id="cs-outlook" data-provider="outlook">
          <svg class="provider-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#0078d4" d="M24 12v9.38c0 .62-.38 1.12-1 1.12H1c-.62 0-1-.5-1-1.12V12h24z"/>
            <path fill="#28a8ea" d="M24 12V2.62C24 2 23.62 1.5 23 1.5H1C.38 1.5 0 2 0 2.62V12h24z"/>
            <circle fill="#fff" cx="12" cy="12" r="7"/>
            <path fill="#0078d4" d="M12 7a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm2.5 5.5h-5a.5.5 0 0 1 0-1h5a.5.5 0 0 1 0 1z"/>
          </svg>
          Outlook Contacts
        </button>
      </div>
      <div class="cs-footer">
        <button class="btn cs-cancel" id="cs-cancel">Not now</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(sheetEl);
  
  // Focus management
  const content = sheetEl.querySelector('.contact-sheet-content');
  content.setAttribute('tabindex', '-1');
  
  // Animate in
  requestAnimationFrame(() => {
    sheetEl.classList.add('visible');
    content.focus();
    
    // Add micro-pulse to provider buttons after sheet animation
    setTimeout(() => {
      const providerBtns = sheetEl.querySelectorAll('.cs-provider');
      providerBtns.forEach((btn, index) => {
        setTimeout(() => {
          if (document.contains(btn)) {
            btn.classList.add('micro-pulse');
            btn.addEventListener('animationend', () => {
              btn.classList.remove('micro-pulse');
            }, { once: true });
          }
        }, index * 200); // Stagger the pulses
      });
    }, 500);
  });

  // Wire up event handlers
  sheetEl.querySelector('#cs-google')?.addEventListener('click', () => connectProvider('google'));
  sheetEl.querySelector('#cs-outlook')?.addEventListener('click', () => connectProvider('outlook'));
  sheetEl.querySelector('#cs-cancel')?.addEventListener('click', hideSheet);
  sheetEl.querySelector('.sheet-close')?.addEventListener('click', hideSheet);
  
  // Click outside to dismiss
  sheetEl.addEventListener('click', (e) => { 
    if (e.target === sheetEl) hideSheet(); 
  });
  
  // Keyboard handling
  sheetEl.addEventListener('keydown', handleKeydown);
}

function getBonusMessage() {
  const invites = Store.get('invites') || {};
  const hasBonus = !Store.get('invites.syncBonusUsed');
  
  if (hasBonus) {
    return `<div class="cs-bonus">🎁 <strong>Bonus:</strong> Get +5 invites for syncing your first address book</div>`;
  }
  
  return '';
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    hideSheet();
    e.preventDefault();
  }
  
  // Tab trapping
  if (e.key === 'Tab') {
    const focusableElements = sheetEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      e.preventDefault();
    }
  }
}

function hideSheet() {
  if (!sheetEl) return;
  
  sheetEl.classList.remove('visible');
  sheetEl.setAttribute('aria-hidden', 'true');
  
  const el = sheetEl;
  sheetEl = null;
  
  setTimeout(() => {
    if (document.contains(el)) {
      el.remove();
    }
  }, 180);
}

async function connectProvider(provider) {
  const providerName = provider === 'google' ? 'Google' : 'Outlook';
  
  Events.emit('ui:toast', { 
    type: 'info', 
    message: `Connecting ${providerName} Contacts…` 
  });
  
  // Disable the buttons to prevent double-clicks
  const buttons = sheetEl?.querySelectorAll('.cs-provider');
  buttons?.forEach(btn => {
    btn.disabled = true;
    btn.classList.add('loading');
  });
  
  try {
    // For now, simulate the API call since we don't have these endpoints
    // In production, these would be real OAuth flows
    const response = await simulateContactsAPI(provider);
    
    if (!response.ok) {
      throw new Error(`Failed to connect ${providerName}`);
    }
    
    const data = await response;
    
    // Update store with connection info
    Store.patch('profile', { 
      contactsConnected: true, 
      contactsProvider: provider,
      contactsConnectedAt: Date.now(),
      contactsCount: data.contactCount || 0
    });
    
    // Mark sync bonus as used if this was first sync
    if (!Store.get('invites.syncBonusUsed')) {
      const currentInvites = Store.get('invites.left') || 10;
      Store.patch('invites', {
        left: currentInvites + 5,
        syncBonusUsed: true,
        syncBonusProvider: provider
      });
      
      Events.emit('ui:toast', { 
        type: 'success', 
        message: `${providerName} Contacts synced! +5 bonus invites added 🎉` 
      });
      
      // Update invite badges
      Events.emit('invites:stats', Store.get('invites'));
    } else {
      Events.emit('ui:toast', { 
        type: 'success', 
        message: `${providerName} Contacts synced ✓` 
      });
    }
    
    Events.emit('contacts:connected', { provider, contactCount: data.contactCount });
    
    // Track the successful connection
    Events.emit('analytics:track', {
      event: 'contacts_connected',
      provider,
      source: Store.get('contactSync.requestSource'),
      contactCount: data.contactCount
    });
    
    hideSheet();
    
  } catch (error) {
    console.error(`${providerName} contacts connection failed:`, error);
    
    Events.emit('ui:toast', { 
      type: 'error', 
      message: `${providerName} Contacts connection failed. Please try again.` 
    });
    
    // Re-enable buttons
    buttons?.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('loading');
    });
  }
}

// Simulate API response since we don't have the backend endpoints yet
async function simulateContactsAPI(provider) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  // Simulate occasional failure for testing
  if (Math.random() < 0.1) {
    return { ok: false };
  }
  
  return {
    ok: true,
    contactCount: Math.floor(Math.random() * 500) + 50, // 50-550 contacts
    provider,
    synced: true
  };
}

function handleContactsConnected({ provider, contactCount }) {
  // Show contextual success message in reward strip
  Events.emit('contacts:sync:success', {
    provider,
    contactCount,
    message: `${contactCount || 'Your'} contacts synced! Email autocomplete is now active.`
  });
  
  // Enable email autocomplete features
  enableEmailAutocomplete(provider);
}

function enableEmailAutocomplete(provider) {
  // This would enable email autocomplete in forms
  // For now, just mark it as available
  Store.patch('features.emailAutocomplete', {
    enabled: true,
    provider,
    enabledAt: Date.now()
  });
  
  console.log(`✅ Email autocomplete enabled via ${provider}`);
}

// Export the main functions
export default {
  showSheet,
  hideSheet,
  connectProvider: connectProvider
};