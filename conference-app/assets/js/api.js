// API Module
class APIClient {
  constructor() {
    this.baseURL = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/api'
      : 'https://us-central1-conference-party-app.cloudfunctions.net/api';
    this.token = localStorage.getItem('api_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Party endpoints
  async getParties() {
    return this.request('/parties');
  }

  async saveParties(parties) {
    return this.request('/parties/save', {
      method: 'POST',
      body: JSON.stringify({ parties })
    });
  }

  // Invite endpoints
  async getInvites() {
    return this.request('/invites');
  }

  async redeemInvite(inviteCode) {
    return this.request('/invites/redeem', {
      method: 'POST',
      body: JSON.stringify({ code: inviteCode })
    });
  }

  // Calendar endpoints
  async syncCalendar(provider, token) {
    return this.request('/calendar/sync', {
      method: 'POST',
      body: JSON.stringify({ provider, token })
    });
  }

  async getCalendarEvents() {
    return this.request('/calendar/events');
  }

  // Profile endpoints
  async getProfile() {
    return this.request('/profile');
  }

  async updateProfile(profileData) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Auth endpoints
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('api_token', response.token);
    }
    
    return response;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('api_token');
    return this.request('/auth/logout', { method: 'POST' });
  }
}

export const API = new APIClient();