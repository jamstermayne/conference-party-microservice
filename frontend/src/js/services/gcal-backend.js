/**
 * Google Calendar Service - Backend OAuth Flow
 * All OAuth handled by Firebase Functions, frontend only manages state
 */

class GoogleCalendarBackend {
  constructor() {
    // Check if user has calendar connected (from backend state)
    this.checkConnectionStatus();
  }

  /**
   * Check connection status from backend
   */
  async checkConnectionStatus() {
    try {
      const response = await fetch('/api/calendar/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.connected = data.connected || false;
        return this.connected;
      }
    } catch (error) {
      console.error('Failed to check calendar status:', error);
    }
    
    this.connected = false;
    return false;
  }

  /**
   * Check if user has valid connection
   */
  async isConnected() {
    // Always check fresh status from backend
    return await this.checkConnectionStatus();
  }

  /**
   * Start OAuth flow via backend redirect
   */
  startOAuth() {
    // Save current location to return after auth
    sessionStorage.setItem('calendar_return_path', window.location.hash);
    
    // Redirect to backend OAuth endpoint
    // Backend will handle all OAuth and redirect back
    window.location.href = '/api/calendar/google/start';
  }

  /**
   * Disconnect calendar (revoke access)
   */
  async disconnect() {
    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        this.connected = false;
        this.showToast('Calendar disconnected', 'info');
        
        // Refresh the view
        if (window.location.hash === '#calendar') {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      this.showToast('Failed to disconnect calendar', 'error');
    }
  }

  /**
   * List events from Google Calendar via backend
   */
  async listEvents(options = {}) {
    if (!this.connected) {
      await this.checkConnectionStatus();
      if (!this.connected) {
        throw new Error('Calendar not connected');
      }
    }
    
    try {
      const params = new URLSearchParams({
        range: options.range || 'today',
        maxResults: options.maxResults || '20'
      });
      
      const response = await fetch(`/api/calendar/events?${params}`, {
        credentials: 'include'
      });
      
      if (response.status === 401) {
        // Token expired or not connected
        this.connected = false;
        throw new Error('Calendar connection expired. Please reconnect.');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform backend response to consistent format
      return (data.events || []).map(event => ({
        id: event.id,
        summary: event.summary || 'Untitled Event',
        location: event.location || '',
        start: this.formatTime(event.start),
        end: this.formatTime(event.end),
        htmlLink: event.htmlLink || '#'
      }));
      
    } catch (error) {
      console.error('Failed to list events:', error);
      throw error;
    }
  }

  /**
   * Create event from party data via backend
   */
  async createEventFromParty(partyId) {
    if (!this.connected) {
      throw new Error('Calendar not connected');
    }
    
    try {
      // First fetch party details
      const partyResponse = await fetch(`/api/parties/${partyId}`);
      let partyData;
      
      if (partyResponse.ok) {
        partyData = await partyResponse.json();
      } else {
        // Use demo data as fallback
        partyData = {
          id: partyId,
          title: 'Gamescom Opening Party',
          venue: 'Koelnmesse',
          date: '2025-08-22',
          start: '19:00',
          end: '23:00',
          description: 'Official opening party for Gamescom 2025'
        };
      }
      
      // Send to backend to create calendar event
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          summary: partyData.title,
          location: partyData.venue,
          description: partyData.description,
          date: partyData.date,
          startTime: partyData.start,
          endTime: partyData.end || partyData.start,
          timeZone: 'Europe/Berlin'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.statusText}`);
      }
      
      const created = await response.json();
      
      // Show success
      this.showToast('Event added to Google Calendar!', 'success');
      
      return created;
      
    } catch (error) {
      console.error('Failed to create event:', error);
      this.showToast('Failed to add event to calendar', 'error');
      throw error;
    }
  }

  /**
   * Helper: Format time from backend response
   */
  formatTime(dt) {
    if (!dt) return '';
    
    // Handle different formats from backend
    if (typeof dt === 'string') {
      // If it's already formatted as HH:MM
      if (dt.match(/^\d{2}:\d{2}$/)) {
        return dt;
      }
      
      // Parse ISO date or datetime
      const date = new Date(dt);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    }
    
    if (dt.dateTime) {
      const date = new Date(dt.dateTime);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    
    return '';
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.gcal-toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = 'gcal-toast';
    toast.textContent = message;
    
    const styles = {
      success: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);',
      error: 'background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);',
      info: 'background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);'
    };
    
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 16px 24px;
      ${styles[type] || styles.info}
      color: white;
      border-radius: 12px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideInUp 0.3s ease;
      max-width: 320px;
    `;
    
    // Add animation if not already present
    if (!document.querySelector('style[data-gcal-animations]')) {
      const style = document.createElement('style');
      style.setAttribute('data-gcal-animations', 'true');
      style.textContent = `
        @keyframes slideInUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideOutDown {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutDown 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Create singleton instance
const GCal = new GoogleCalendarBackend();

// Check if returning from OAuth flow
window.addEventListener('load', () => {
  // If we have a success param, we just came back from OAuth
  const params = new URLSearchParams(window.location.search);
  if (params.get('calendar') === 'connected') {
    GCal.connected = true;
    GCal.showToast('Google Calendar connected successfully!', 'success');
    
    // Clean URL and restore hash
    const returnPath = sessionStorage.getItem('calendar_return_path') || '#calendar';
    sessionStorage.removeItem('calendar_return_path');
    
    // Remove query params and set hash
    window.history.replaceState({}, '', window.location.pathname + returnPath);
    
    // Trigger hash change to reload view
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else if (params.get('calendar') === 'error') {
    GCal.showToast('Failed to connect Google Calendar', 'error');
    
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname + '#calendar');
  }
});

export default GCal;