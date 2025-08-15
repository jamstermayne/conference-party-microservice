/**
 * OAuth Message Handler
 * Listens for postMessage from OAuth callback windows
 */

(function() {
  // Listen for OAuth completion messages
  window.addEventListener('message', (ev) => {
    // Security: Only accept messages from same origin
    if (ev.origin !== window.location.origin) return;
    
    // Handle Google Calendar OAuth messages
    if (ev.data?.source === 'gcal') {
      console.log('[OAuth] Google Calendar auth completed:', ev.data.ok ? 'success' : 'failed');
      
      if (ev.data.ok) {
        // Success - refresh calendar UI
        handleCalendarConnected(ev.data);
      } else {
        // Failed/cancelled
        handleCalendarError(ev.data);
      }
    }
    
    // Future: Handle other OAuth providers
    // if (ev.data?.source === 'outlook') { ... }
    // if (ev.data?.source === 'm2m') { ... }
  });
  
  function handleCalendarConnected(data) {
    // Update UI to show connected state
    const email = data.email || 'Connected';
    
    // Update any calendar buttons to show connected state
    document.querySelectorAll('[data-action="add-to-calendar"]').forEach(btn => {
      if (btn.textContent.includes('Connect')) {
        btn.textContent = btn.textContent.replace('Connect', 'Add to');
        btn.classList.add('connected');
      }
    });
    
    // Show success toast if toast function exists
    if (window.toast) {
      window.toast(`✅ Connected to Google Calendar${email ? ` (${email})` : ''}`, 'success');
    }
    
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('gcal:connected', { 
      detail: { email: data.email } 
    }));
    
    // Check for pending calendar event
    checkPendingCalendarAction();
  }
  
  function handleCalendarError(data) {
    const error = data.error || 'Authentication failed';
    
    // Show error toast if available
    if (window.toast) {
      window.toast(`❌ Google Calendar: ${error}`, 'error');
    }
    
    // Dispatch event for error handling
    window.dispatchEvent(new CustomEvent('gcal:error', { 
      detail: { error } 
    }));
  }
  
  function checkPendingCalendarAction() {
    // Check if there was a pending event to add after OAuth
    const pendingEvent = sessionStorage.getItem('pendingCalendarEvent');
    if (pendingEvent) {
      try {
        const event = JSON.parse(pendingEvent);
        sessionStorage.removeItem('pendingCalendarEvent');
        
        // Re-trigger the calendar add action
        console.log('[OAuth] Processing pending event:', event.title);
        
        // Import calendar service and add event
        import('./services/gcal-clean.js').then(({ createEvent }) => {
          createEvent(event).then(() => {
            if (window.toast) {
              window.toast(`✅ Event added to calendar: ${event.title}`, 'success');
            }
          }).catch(err => {
            console.error('[OAuth] Failed to add pending event:', err);
            if (window.toast) {
              window.toast('Failed to add event. Please try again.', 'error');
            }
          });
        });
      } catch (err) {
        console.error('[OAuth] Invalid pending event data:', err);
        sessionStorage.removeItem('pendingCalendarEvent');
      }
    }
  }
  
  // Also update the gcal-clean.js pollForCompletion to be simpler
  // since we now have postMessage working
  window.addEventListener('gcal:poll-helper', () => {
    // This event can be dispatched by startOAuth to use message-based
    // completion detection instead of polling
  });
})();