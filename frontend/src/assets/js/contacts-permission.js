/**
 * Contacts Permission Sheet
 * Clean modal for requesting contacts sync permission
 * Uses Store/Events pattern from existing architecture
 */

(function() {
  'use strict';

  // Early exit if already initialized
  if (window.ContactsPermission) return;

  // Initialize immediately to capture early calls
  const pendingCalls = [];
  window.ContactsPermission = {
    show: (options) => {
      pendingCalls.push(options);
    }
  };

  // Modal state
  let modal = null;
  let focusTrap = null;
  let lastFocus = null;
  let resolvePromise = null;

  /**
   * Create the permission modal DOM
   */
  function createModal() {
    const modalHTML = `
      <div class="contacts-permission-modal" role="dialog" aria-modal="true" aria-labelledby="contacts-title">
        <div class="contacts-permission-backdrop"></div>
        <div class="contacts-permission-sheet">
          <button class="contacts-permission-close" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          
          <div class="contacts-permission-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="23" stroke="#10B981" stroke-width="2"/>
              <path d="M24 12C19 12 15 16 15 21C15 26 24 36 24 36S33 26 33 21C33 16 29 12 24 12Z" fill="#10B981"/>
              <circle cx="24" cy="21" r="3" fill="white"/>
            </svg>
          </div>
          
          <h2 id="contacts-title" class="contacts-permission-title">
            Connect with your contacts
          </h2>
          
          <p class="contacts-permission-description">
            Find friends and colleagues already at Gamescom. We'll match your contacts 
            to help you network more effectively.
          </p>
          
          <div class="contacts-permission-features">
            <div class="contacts-permission-feature">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#10B981">
                <path d="M7 10l2 2 4-4" stroke="#10B981" stroke-width="2"/>
              </svg>
              <span>Private & secure matching</span>
            </div>
            <div class="contacts-permission-feature">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#10B981">
                <path d="M7 10l2 2 4-4" stroke="#10B981" stroke-width="2"/>
              </svg>
              <span>See who's attending</span>
            </div>
            <div class="contacts-permission-feature">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#10B981">
                <path d="M7 10l2 2 4-4" stroke="#10B981" stroke-width="2"/>
              </svg>
              <span>Coordinate meetups</span>
            </div>
          </div>
          
          <div class="contacts-permission-actions">
            <button class="contacts-permission-allow" data-action="allow">
              Allow Access
            </button>
            <button class="contacts-permission-skip" data-action="skip">
              Not Now
            </button>
          </div>
          
          <p class="contacts-permission-privacy">
            Your contacts stay on your device. We never store or share them.
          </p>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = modalHTML;
    return container.firstElementChild;
  }

  /**
   * Focus trap management
   */
  function createFocusTrap(element) {
    const focusableSelectors = [
      'button',
      '[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    const focusableElements = element.querySelectorAll(focusableSelectors.join(','));
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function handleTabKey(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }

    function handleEscKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        hide('escape');
      }
    }

    element.addEventListener('keydown', handleTabKey);
    element.addEventListener('keydown', handleEscKey);

    return {
      activate: () => firstFocusable && firstFocusable.focus(),
      destroy: () => {
        element.removeEventListener('keydown', handleTabKey);
        element.removeEventListener('keydown', handleEscKey);
      }
    };
  }

  /**
   * Show the permission modal
   */
  function show(options = {}) {
    return new Promise((resolve) => {
      // Store the promise resolver
      resolvePromise = resolve;

      // Save current focus
      lastFocus = document.activeElement;

      // Create and append modal
      modal = createModal();
      document.body.appendChild(modal);

      // Set up focus trap
      focusTrap = createFocusTrap(modal);

      // Add event listeners
      const backdrop = modal.querySelector('.contacts-permission-backdrop');
      const closeBtn = modal.querySelector('.contacts-permission-close');
      const allowBtn = modal.querySelector('.contacts-permission-allow');
      const skipBtn = modal.querySelector('.contacts-permission-skip');

      backdrop.addEventListener('click', () => hide('backdrop'));
      closeBtn.addEventListener('click', () => hide('close'));
      allowBtn.addEventListener('click', handleAllow);
      skipBtn.addEventListener('click', () => hide('skip'));

      // Trigger animation
      requestAnimationFrame(() => {
        modal.classList.add('contacts-permission-modal--visible');
        focusTrap.activate();
      });

      // Track impression
      if (window.Events) {
        window.Events.emit('contacts:permission:shown', { 
          trigger: options.trigger || 'manual' 
        });
      }
    });
  }

  /**
   * Hide the modal
   */
  function hide(action = 'close') {
    if (!modal) return;

    // Trigger hide animation
    modal.classList.add('contacts-permission-modal--hiding');

    // Clean up after animation
    setTimeout(() => {
      if (modal) {
        // Destroy focus trap
        if (focusTrap) {
          focusTrap.destroy();
          focusTrap = null;
        }

        // Remove from DOM
        modal.remove();
        modal = null;

        // Restore focus
        if (lastFocus && lastFocus.focus) {
          lastFocus.focus();
        }

        // Resolve promise
        if (resolvePromise) {
          resolvePromise({ action, allowed: false });
          resolvePromise = null;
        }

        // Track dismissal
        if (window.Events) {
          window.Events.emit('contacts:permission:dismissed', { action });
        }
      }
    }, 300);
  }

  /**
   * Handle allow action
   */
  async function handleAllow() {
    const allowBtn = modal.querySelector('.contacts-permission-allow');
    allowBtn.disabled = true;
    allowBtn.textContent = 'Connecting...';

    try {
      // Request actual permission
      const permission = await requestContactsPermission();
      
      if (permission.granted) {
        // Update Store
        if (window.Store) {
          window.Store.set('contacts.permissionGranted', true);
          window.Store.set('contacts.permissionTimestamp', Date.now());
        }

        // Track success
        if (window.Events) {
          window.Events.emit('contacts:permission:granted', {
            contactsCount: permission.contactsCount || 0
          });
        }

        // Show success state
        allowBtn.textContent = '✓ Connected';
        allowBtn.classList.add('contacts-permission-allow--success');

        // Close after delay
        setTimeout(() => {
          if (resolvePromise) {
            resolvePromise({ action: 'allow', allowed: true });
            resolvePromise = null;
          }
          hide('allow');
        }, 1000);
      } else {
        throw new Error('Permission denied');
      }
    } catch (error) {
      console.warn('[ContactsPermission] Access denied:', error);
      
      // Show error state
      allowBtn.textContent = 'Access Denied';
      allowBtn.classList.add('contacts-permission-allow--error');
      
      // Close after delay
      setTimeout(() => hide('error'), 2000);
    }
  }

  /**
   * Request actual contacts permission
   * This is where you'd integrate with the Contacts API
   */
  async function requestContactsPermission() {
    // Check if Contacts API is available
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'email', 'tel'];
        const opts = { multiple: true };
        const contacts = await navigator.contacts.select(props, opts);
        
        return {
          granted: true,
          contactsCount: contacts.length
        };
      } catch (error) {
        return { granted: false, error };
      }
    }
    
    // Fallback for browsers without Contacts API
    // In production, you might want to show a different flow
    console.warn('[ContactsPermission] Contacts API not available');
    
    // Simulate success for development
    if (window.location.hostname === 'localhost') {
      await new Promise(r => setTimeout(r, 500));
      return { granted: true, contactsCount: 42 };
    }
    
    return { granted: false, error: 'API not available' };
  }

  /**
   * Check if permission was already granted
   */
  function isGranted() {
    if (window.Store && window.Store.get) {
      return window.Store.get('contacts.permissionGranted') === true;
    }
    return false;
  }

  /**
   * Public API
   */
  window.ContactsPermission = {
    show,
    hide,
    isGranted,
    
    // Utility method for one-time prompts
    promptOnce: async function(options = {}) {
      if (isGranted()) {
        return { action: 'already_granted', allowed: true };
      }
      
      // Check if recently dismissed
      if (window.Store && window.Store.get) {
        const lastDismissed = window.Store.get('contacts.lastDismissed');
        if (lastDismissed && Date.now() - lastDismissed < 7 * 24 * 60 * 60 * 1000) {
          return { action: 'recently_dismissed', allowed: false };
        }
      }
      
      const result = await show(options);
      
      // Track dismissal
      if (!result.allowed && window.Store && window.Store.set) {
        window.Store.set('contacts.lastDismissed', Date.now());
      }
      
      return result;
    }
  };

  // Process any pending calls
  if (pendingCalls.length > 0) {
    // Only process the first call to avoid multiple modals
    const firstCall = pendingCalls[0];
    pendingCalls.length = 0;
    window.ContactsPermission.show(firstCall);
  }

  // Listen for events from other parts of the app
  if (window.Events) {
    window.Events.on('contacts:request:permission', (data) => {
      window.ContactsPermission.promptOnce(data);
    });
  }

})();