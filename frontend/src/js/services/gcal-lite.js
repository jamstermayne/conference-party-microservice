/**
 * Google Calendar Service (Lite Version)
 * Uses implicit OAuth flow without GSI library to avoid CORS issues
 */

const GCAL_CONFIG = {
  clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com', // Replace with your client ID
  scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
  redirectUri: window.location.origin // Will redirect back to current domain
};

class GoogleCalendarLite {
  constructor() {
    this.token = this.getStoredToken();
  }

  /**
   * Get stored token from localStorage
   */
  getStoredToken() {
    const token = localStorage.getItem('gcal_access_token');
    const expiry = localStorage.getItem('gcal_token_expiry');
    
    // Check if token is expired
    if (token && expiry && Date.now() < parseInt(expiry)) {
      return token;
    }
    
    // Clear expired token
    this.clearToken();
    return null;
  }

  /**
   * Check if user has valid connection
   */
  async isConnected() {
    return !!this.token;
  }

  /**
   * Start OAuth flow using redirect (no popup, no CORS issues)
   */
  startOAuth() {
    // Store current location to return after auth
    sessionStorage.setItem('gcal_return_hash', window.location.hash);
    
    // Build OAuth URL for implicit flow
    const params = new URLSearchParams({
      client_id: GCAL_CONFIG.clientId,
      redirect_uri: GCAL_CONFIG.redirectUri,
      response_type: 'token',
      scope: GCAL_CONFIG.scope,
      include_granted_scopes: 'true',
      state: 'calendar_auth'
    });
    
    // Redirect to Google OAuth (full page redirect, no CORS)
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /**
   * Handle OAuth callback from URL hash
   */
  handleCallback() {
    // Check if we have token in hash
    if (!window.location.hash.includes('access_token')) {
      return false;
    }
    
    // Parse token from hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const expiresIn = hashParams.get('expires_in');
    const state = hashParams.get('state');
    
    if (accessToken && state === 'calendar_auth') {
      // Store token
      this.token = accessToken;
      const expiry = Date.now() + (parseInt(expiresIn) * 1000);
      
      localStorage.setItem('gcal_access_token', accessToken);
      localStorage.setItem('gcal_token_expiry', expiry.toString());
      
      // Clean up URL
      const returnHash = sessionStorage.getItem('gcal_return_hash') || '#calendar';
      sessionStorage.removeItem('gcal_return_hash');
      
      // Redirect to clean URL
      window.location.hash = returnHash;
      
      return true;
    }
    
    return false;
  }

  /**
   * Clear stored tokens
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('gcal_access_token');
    localStorage.removeItem('gcal_token_expiry');
  }

  /**
   * Disconnect and clear auth
   */
  disconnect() {
    this.clearToken();
    window.location.hash = '#calendar';
  }

  /**
   * List events from Google Calendar
   */
  async listEvents(options = {}) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    
    const now = new Date();
    let timeMin, timeMax;
    
    switch(options.range) {
      case 'today':
        timeMin = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        timeMax = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        break;
      case 'tomorrow':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        timeMin = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
        timeMax = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();
        break;
      case 'week':
        timeMin = new Date().toISOString();
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        timeMax = weekEnd.toISOString();
        break;
      default:
        timeMin = new Date().toISOString();
        timeMax = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    }
    
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      maxResults: '20',
      singleEvents: 'true',
      orderBy: 'startTime'
    });
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.status === 401) {
        // Token expired
        this.clearToken();
        throw new Error('Authentication expired. Please reconnect.');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return (data.items || []).map(event => ({
        id: event.id,
        summary: event.summary || 'Untitled Event',
        location: event.location || '',
        start: this.formatTime(event.start),
        end: this.formatTime(event.end),
        htmlLink: event.htmlLink
      }));
      
    } catch (error) {
      console.error('Calendar API error:', error);
      throw error;
    }
  }

  /**
   * Create event from party data
   */
  async createEventFromParty(partyData) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    
    // Build event object for Google Calendar
    const event = {
      summary: partyData.title || 'Conference Party',
      location: partyData.venue || '',
      description: `${partyData.description || ''}\n\nAdded from Conference Party App`,
      start: {
        dateTime: this.buildDateTime(partyData.date, partyData.start),
        timeZone: 'Europe/Berlin'
      },
      end: {
        dateTime: this.buildDateTime(partyData.date, partyData.end || partyData.start),
        timeZone: 'Europe/Berlin'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 1440 }
        ]
      }
    };
    
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.statusText}`);
      }
      
      const created = await response.json();
      
      // Show success
      this.showToast('Event added to Google Calendar!', 'success');
      
      return created;
      
    } catch (error) {
      console.error('Failed to create event:', error);
      this.showToast('Failed to add event', 'error');
      throw error;
    }
  }

  /**
   * Helper: Format datetime from Google Calendar
   */
  formatTime(dt) {
    if (!dt) return '';
    const date = new Date(dt.dateTime || dt.date);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Helper: Build ISO datetime
   */
  buildDateTime(date, time) {
    // Handle various date formats
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else {
      d = new Date();
    }
    
    // Parse time (HH:MM format)
    if (time && typeof time === 'string') {
      const [hours, minutes] = time.split(':').map(Number);
      d.setHours(hours || 0, minutes || 0, 0, 0);
    }
    
    return d.toISOString();
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
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutDown 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Create singleton instance
const GCal = new GoogleCalendarLite();

// Auto-handle OAuth callback when page loads
if (window.location.hash.includes('access_token')) {
  setTimeout(() => {
    GCal.handleCallback();
  }, 100);
}

export default GCal;