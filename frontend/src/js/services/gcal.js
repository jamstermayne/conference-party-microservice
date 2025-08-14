/**
 * Google Calendar Service
 * Handles OAuth flow and calendar API interactions
 */

const GCAL_CONFIG = {
  clientId: 'YOUR_CLIENT_ID', // Set from environment/config
  apiKey: 'YOUR_API_KEY',
  scope: 'https://www.googleapis.com/auth/calendar.events',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  redirectUri: `${window.location.origin}/auth/callback`
};

class GoogleCalendarService {
  constructor() {
    this.token = localStorage.getItem('gcal_token');
    this.tokenExpiry = localStorage.getItem('gcal_token_expiry');
  }

  /**
   * Check if user has valid Google Calendar connection
   */
  async isConnected() {
    if (!this.token) return false;
    
    // Check token expiry
    if (this.tokenExpiry && Date.now() > parseInt(this.tokenExpiry)) {
      this.clearToken();
      return false;
    }
    
    // Optionally validate token with Google
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + this.token);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Start OAuth flow for Google Calendar
   */
  startOAuth() {
    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: GCAL_CONFIG.clientId,
      redirect_uri: GCAL_CONFIG.redirectUri,
      response_type: 'token',
      scope: GCAL_CONFIG.scope,
      access_type: 'online',
      prompt: 'consent'
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    
    // Store current route to return to after auth
    sessionStorage.setItem('gcal_return_route', window.location.hash);
    
    // Redirect to Google OAuth
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback and extract token
   */
  handleCallback() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    const expiresIn = params.get('expires_in');
    
    if (token) {
      this.token = token;
      this.tokenExpiry = Date.now() + (parseInt(expiresIn) * 1000);
      
      localStorage.setItem('gcal_token', this.token);
      localStorage.setItem('gcal_token_expiry', this.tokenExpiry);
      
      // Return to original route
      const returnRoute = sessionStorage.getItem('gcal_return_route') || '#calendar';
      sessionStorage.removeItem('gcal_return_route');
      window.location.hash = returnRoute;
      
      return true;
    }
    
    return false;
  }

  /**
   * Clear stored tokens
   */
  clearToken() {
    this.token = null;
    this.tokenExpiry = null;
    localStorage.removeItem('gcal_token');
    localStorage.removeItem('gcal_token_expiry');
  }

  /**
   * List events from Google Calendar
   * @param {Object} options - { range: 'today'|'tomorrow'|'week', maxResults: 10 }
   */
  async listEvents(options = {}) {
    if (!this.token) throw new Error('Not authenticated');
    
    const now = new Date();
    let timeMin = now.toISOString();
    let timeMax;
    
    switch(options.range) {
      case 'today':
        timeMax = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        break;
      case 'tomorrow':
        timeMin = new Date(now.setDate(now.getDate() + 1)).setHours(0, 0, 0, 0);
        timeMax = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        break;
      case 'week':
        timeMax = new Date(now.setDate(now.getDate() + 7)).toISOString();
        break;
      default:
        timeMax = new Date(now.setDate(now.getDate() + 1)).toISOString();
    }
    
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      maxResults: options.maxResults || 10,
      singleEvents: true,
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
      
      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          throw new Error('Authentication expired');
        }
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      
      // Transform Google Calendar events to our format
      return (data.items || []).map(event => ({
        id: event.id,
        summary: event.summary || 'Untitled',
        location: event.location || '',
        start: this.formatDateTime(event.start),
        end: this.formatDateTime(event.end),
        description: event.description || '',
        htmlLink: event.htmlLink
      }));
    } catch (error) {
      console.error('Failed to list events:', error);
      return [];
    }
  }

  /**
   * Create a Google Calendar event from a party
   * @param {String} partyId - ID of the party to add
   */
  async createEventFromParty(partyId) {
    if (!this.token) throw new Error('Not authenticated');
    
    // Fetch party details (from your API)
    const party = await this.fetchPartyDetails(partyId);
    
    const event = {
      summary: party.title,
      location: party.venue,
      description: `${party.description}\n\nAdded from Conference Party App`,
      start: {
        dateTime: this.parseToGoogleDateTime(party.date, party.start),
        timeZone: 'Europe/Berlin' // Cologne timezone
      },
      end: {
        dateTime: this.parseToGoogleDateTime(party.date, party.end),
        timeZone: 'Europe/Berlin'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 }
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
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      
      const created = await response.json();
      
      // Show success feedback
      this.showNotification('Event added to Google Calendar!', 'success');
      
      return created;
    } catch (error) {
      console.error('Failed to create event:', error);
      this.showNotification('Failed to add event', 'error');
      throw error;
    }
  }

  /**
   * Helper: Fetch party details from your API
   */
  async fetchPartyDetails(partyId) {
    // Replace with actual API call
    const response = await fetch(`/api/parties/${partyId}`);
    if (!response.ok) {
      // Fallback to demo data
      return {
        id: partyId,
        title: 'Sample Party',
        venue: 'Conference Center',
        date: '2025-08-22',
        start: '20:00',
        end: '23:00',
        description: 'Gaming industry networking event'
      };
    }
    return response.json();
  }

  /**
   * Helper: Format Google Calendar datetime
   */
  formatDateTime(dt) {
    if (!dt) return '';
    const date = new Date(dt.dateTime || dt.date);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  /**
   * Helper: Parse time to Google Calendar format
   */
  parseToGoogleDateTime(date, time) {
    const [hours, minutes] = time.split(':');
    const dt = new Date(date);
    dt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dt.toISOString();
  }

  /**
   * Helper: Show notification
   */
  showNotification(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#4caf50' : '#f44336'};
      color: white;
      border-radius: 8px;
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Export singleton instance
const GCal = new GoogleCalendarService();

// Handle OAuth callback if returning from Google
if (window.location.hash.includes('access_token')) {
  GCal.handleCallback();
}

export default GCal;