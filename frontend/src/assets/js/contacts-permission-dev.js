/**
 * Development shim for testing Contacts Permission Sheet
 * Add to HTML with: <script src="/assets/js/contacts-permission-dev.js"></script>
 */

(function() {
  'use strict';
  
  // Only in dev environment
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    return;
  }
  
  console.log('[Dev] Contacts Permission Sheet dev shim loaded');
  
  // Add test trigger button
  function addTestButton() {
    const button = document.createElement('button');
    button.textContent = '🧪 Test Contacts Permission';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      padding: 12px 20px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });
    
    button.addEventListener('click', async () => {
      console.log('[Dev] Triggering Contacts Permission Sheet...');
      
      if (window.ContactsPermission) {
        const result = await window.ContactsPermission.show({
          trigger: 'dev_test'
        });
        
        console.log('[Dev] Permission result:', result);
        
        // Show result in a toast
        if (window.Events) {
          window.Events.emit('ui:toast', {
            type: result.allowed ? 'success' : 'info',
            message: `Permission ${result.action}: ${result.allowed ? 'Granted ✓' : 'Denied'}`
          });
        }
      } else {
        console.error('[Dev] ContactsPermission not loaded!');
        alert('ContactsPermission not loaded. Check console for errors.');
      }
    });
    
    document.body.appendChild(button);
  }
  
  // Add keyboard shortcuts
  function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + C to open contacts permission
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        console.log('[Dev] Keyboard shortcut triggered');
        
        if (window.ContactsPermission) {
          window.ContactsPermission.show({
            trigger: 'keyboard_shortcut'
          });
        }
      }
      
      // Ctrl/Cmd + Shift + R to reset permission state
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        console.log('[Dev] Resetting permission state...');
        
        if (window.Store) {
          window.Store.remove('contacts.permissionGranted');
          window.Store.remove('contacts.permissionTimestamp');
          window.Store.remove('contacts.lastDismissed');
          console.log('[Dev] Permission state reset');
          
          if (window.Events) {
            window.Events.emit('ui:toast', {
              type: 'info',
              message: 'Contacts permission state reset'
            });
          }
        }
      }
    });
    
    console.log('[Dev] Keyboard shortcuts registered:');
    console.log('  - Ctrl/Cmd + Shift + C: Open permission sheet');
    console.log('  - Ctrl/Cmd + Shift + R: Reset permission state');
  }
  
  // Monitor permission events
  function monitorEvents() {
    if (window.Events) {
      window.Events.on('contacts:permission:shown', (data) => {
        console.log('[Dev] Permission sheet shown:', data);
      });
      
      window.Events.on('contacts:permission:granted', (data) => {
        console.log('[Dev] Permission granted:', data);
      });
      
      window.Events.on('contacts:permission:dismissed', (data) => {
        console.log('[Dev] Permission dismissed:', data);
      });
      
      window.Events.on('contacts:request:permission', (data) => {
        console.log('[Dev] Permission requested:', data);
      });
    }
  }
  
  // Test Store integration
  function testStoreIntegration() {
    if (window.Store) {
      console.log('[Dev] Current permission state:');
      console.log('  - Granted:', window.Store.get('contacts.permissionGranted'));
      console.log('  - Timestamp:', window.Store.get('contacts.permissionTimestamp'));
      console.log('  - Last dismissed:', window.Store.get('contacts.lastDismissed'));
      console.log('  - Provider:', window.Store.get('profile.contactsProvider'));
      console.log('  - Contacts count:', window.Store.get('profile.contactsCount'));
    }
  }
  
  // Initialize dev tools when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        addTestButton();
        addKeyboardShortcuts();
        monitorEvents();
        testStoreIntegration();
      }, 1000); // Wait for other scripts to load
    });
  } else {
    setTimeout(() => {
      addTestButton();
      addKeyboardShortcuts();
      monitorEvents();
      testStoreIntegration();
    }, 1000);
  }
  
  // Expose dev utilities globally
  window.ContactsPermissionDev = {
    show: () => window.ContactsPermission?.show({ trigger: 'dev_manual' }),
    promptOnce: () => window.ContactsPermission?.promptOnce({ trigger: 'dev_once' }),
    reset: () => {
      if (window.Store) {
        window.Store.remove('contacts.permissionGranted');
        window.Store.remove('contacts.permissionTimestamp');
        window.Store.remove('contacts.lastDismissed');
        console.log('[Dev] Permission state reset');
      }
    },
    status: () => {
      if (window.ContactsPermission) {
        console.log('Granted:', window.ContactsPermission.isGranted());
      }
      if (window.Store) {
        console.log('Store state:', {
          granted: window.Store.get('contacts.permissionGranted'),
          timestamp: window.Store.get('contacts.permissionTimestamp'),
          lastDismissed: window.Store.get('contacts.lastDismissed'),
          provider: window.Store.get('profile.contactsProvider'),
          contactsCount: window.Store.get('profile.contactsCount')
        });
      }
    }
  };
  
  console.log('[Dev] ContactsPermissionDev utilities available:');
  console.log('  - ContactsPermissionDev.show()');
  console.log('  - ContactsPermissionDev.promptOnce()');
  console.log('  - ContactsPermissionDev.reset()');
  console.log('  - ContactsPermissionDev.status()');
  
})();