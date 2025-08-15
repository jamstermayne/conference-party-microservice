// google-calendar.js - Google Calendar integration helpers

export async function ensureGoogleConnected() {
  // Check if already connected
  const statusRes = await fetch('/api/googleCalendar/status', { credentials: 'include' });
  const { connected } = await statusRes.json().catch(() => ({ connected: false }));
  
  if (connected) {
    return true;
  }
  
  // Open OAuth popup
  const popup = window.open(
    '/api/googleCalendar/connect',
    'google-oauth',
    'width=520,height=640,noopener,noreferrer'
  );
  
  if (!popup) {
    alert('Please allow popups to connect Google Calendar');
    return false;
  }
  
  // Poll for connection status
  return new Promise((resolve) => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/googleCalendar/status', { credentials: 'include' });
        const { connected } = await res.json();
        
        if (connected) {
          clearInterval(pollInterval);
          popup.close();
          resolve(true);
        }
      } catch (err) {
        // Keep polling
      }
      
      // Check if popup was closed
      if (popup.closed) {
        clearInterval(pollInterval);
        resolve(false);
      }
    }, 1000);
    
    // Timeout after 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      try { popup.close(); } catch {}
      resolve(false);
    }, 120000);
  });
}

export async function addToGoogleCalendar(party) {
  try {
    const res = await fetch('/api/googleCalendar/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        summary: party.title,
        description: party.description,
        location: party.location,
        start: {
          dateTime: party.start,
          timeZone: party.timezone
        },
        end: {
          dateTime: party.end,
          timeZone: party.timezone
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 10 }
          ]
        }
      })
    });
    
    if (!res.ok) {
      throw new Error(`Failed to add event: ${res.status}`);
    }
    
    const result = await res.json();
    
    // Show success feedback
    showToast('Event added to Google Calendar!', 'success');
    
    return result;
  } catch (err) {
    console.error('Failed to add to Google Calendar:', err);
    showToast('Failed to add event to calendar', 'error');
    throw err;
  }
}

// Simple toast notification
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: ${type === 'success' ? '#2ec27e' : type === 'error' ? '#ff6b6b' : '#39c6ff'};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
    animation: slideUp 0.3s ease;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from { transform: translateX(-50%) translateY(100%); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
  `;
  if (!document.querySelector('style[data-toast]')) {
    style.setAttribute('data-toast', '1');
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}