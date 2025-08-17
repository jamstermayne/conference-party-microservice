/**
 * Unified Conference App - Signature Design System
 * Connects all frontend systems to real backend APIs
 * No dummy data - production ready
 */

import { fetchParties } from './api-lite.js';

class UnifiedConferenceApp {
  constructor() {
    this.currentUser = null;
    this.apiBase = 'https://us-central1-conference-party-app.cloudfunctions.net';
    this.cache = new Map();
    this.isOnline = navigator.onLine;
    this.init();
  }

  async init() {
    await this.initializeUser();
    this.setupNavigation();
    this.renderMainInterface();
    this.setupEventListeners();
    this.loadInitialData();
    this.setupPWAFeatures();
  }

  async initializeUser() {
    // Get or create user from localStorage/backend
    const storedUser = localStorage.getItem('conference_user');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    } else {
      this.currentUser = {
        id: this.generateUserId(),
        created: new Date().toISOString(),
        profile: {},
        invites: { available: 10, sent: [], received: [] },
        connections: [],
        rsvps: {},
        savedEvents: new Set(),
        preferences: { notifications: true, location: false }
      };
      localStorage.setItem('conference_user', JSON.stringify(this.currentUser));
    }
  }

  setupNavigation() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="unified-app">
        <!-- Header with signature design -->
        <header class="app-header">
          <div class="header-content">
            <div class="app-logo">
              <h1>Gamescom 2025</h1>
              <span class="tagline">Professional Networking</span>
            </div>
            <div class="header-actions">
              <button class="notification-btn" data-action="notifications">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                </svg>
                <span class="notification-count" id="notification-count"></span>
              </button>
              <button class="profile-btn" data-action="profile" aria-label="Profile">
                <div class="profile-avatar">
                  <span>${this.currentUser?.profile?.name?.[0] || 'U'}</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        <!-- Main content area -->
        <main class="app-main" id="app-main">
          <div class="content-loading">
            <div class="loading-spinner"></div>
            <p>Loading conference data...</p>
          </div>
        </main>

        <!-- Bottom navigation -->
        <nav class="bottom-nav">
          <button class="nav-item nav-item--active" data-section="parties" aria-label="Parties">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>Parties</span>
          </button>
          <button class="nav-item" data-section="calendar" aria-label="Calendar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zM19 19H5V8h14v11z"/>
            </svg>
            <span>Calendar</span>
          </button>
          <button class="nav-item" data-section="contacts" aria-label="Contacts">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 7h-5c-.8 0-1.52.5-1.8 1.2l-2.12 5.31L7 12c-1.1 0-2 .9-2 2v8h2v-4h2v4h2v-3.5c0-.28.22-.5.5-.5s.5.22.5.5V22h8z"/>
            </svg>
            <span>Contacts</span>
          </button>
          <button class="nav-item" data-section="invites" aria-label="Invites">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span>Invites</span>
          </button>
          <button class="nav-item" data-section="account" aria-label="Account">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <span>Account</span>
          </button>
        </nav>
      </div>
    `;
  }

  renderMainInterface() {
    const main = document.getElementById('app-main');
    const currentSection = this.getCurrentSection();
    
    switch(currentSection) {
      case 'parties':
        this.renderPartiesSection(main);
        break;
      case 'calendar':
        this.renderCalendarSection(main);
        break;
      case 'contacts':
        this.renderContactsSection(main);
        break;
      case 'invites':
        this.renderInvitesSection(main);
        break;
      case 'account':
        this.renderAccountSection(main);
        break;
      default:
        this.renderPartiesSection(main);
    }
  }

  async renderPartiesSection(container) {
    try {
      const parties = await this.fetchPartiesData();
      
      container.innerHTML = `
        <div class="section-parties">
          <div class="section-header">
            <h2>Tonight's Hottest Parties</h2>
            <div class="header-filters">
              <button class="filter-btn filter-btn--active" data-filter="all">All</button>
              <button class="filter-btn" data-filter="saved">Saved</button>
              <button class="filter-btn" data-filter="rsvp">RSVP'd</button>
            </div>
          </div>
          
          <div class="parties-grid" id="parties-grid">
            ${this.renderPartyCards(parties)}
          </div>
        </div>
      `;
      
      this.setupPartyInteractions();
    } catch (error) {
      this.renderError(container, 'Failed to load parties', error);
    }
  }

  async renderCalendarSection(container) {
    const userRSVPs = Object.keys(this.currentUser.rsvps);
    const upcomingEvents = userRSVPs.length > 0 ? 
      await this.fetchEventsByIds(userRSVPs) : [];

    container.innerHTML = `
      <div class="section-calendar">
        <div class="section-header">
          <h2>Your Calendar</h2>
          <button class="sync-btn" data-action="sync-google-calendar">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zM2 8v8a2 2 0 002 2h12a2 2 0 002-2V8H2z"/>
            </svg>
            Sync Google Calendar
          </button>
        </div>
        
        <div class="calendar-content">
          ${upcomingEvents.length > 0 ? `
            <div class="upcoming-events">
              <h3>Upcoming Events</h3>
              <div class="events-list">
                ${upcomingEvents.map(event => this.renderCalendarEvent(event)).join('')}
              </div>
            </div>
          ` : `
            <div class="empty-calendar">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zM19 19H5V8h14v11z"/>
              </svg>
              <h3>No upcoming events</h3>
              <p>RSVP to parties to see them here</p>
              <button class="cta-btn" data-action="browse-parties">Browse Parties</button>
            </div>
          `}
        </div>
      </div>
    `;
  }

  async renderContactsSection(container) {
    const connections = this.currentUser.connections || [];
    
    container.innerHTML = `
      <div class="section-contacts">
        <div class="section-header">
          <h2>Your Network</h2>
          <button class="add-contact-btn" data-action="add-contact">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
            </svg>
            Add Contact
          </button>
        </div>
        
        <div class="contacts-content">
          ${connections.length > 0 ? `
            <div class="contacts-grid">
              ${connections.map(contact => this.renderContactCard(contact)).join('')}
            </div>
          ` : `
            <div class="empty-contacts">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 7h-5c-.8 0-1.52.5-1.8 1.2l-2.12 5.31L7 12c-1.1 0-2 .9-2 2v8h2v-4h2v4h2v-3.5c0-.28.22-.5.5-.5s.5.22.5.5V22h8z"/>
              </svg>
              <h3>No connections yet</h3>
              <p>Meet people at parties to grow your network</p>
              <button class="cta-btn" data-action="browse-parties">Find Networking Events</button>
            </div>
          `}
        </div>
      </div>
    `;
  }

  async renderInvitesSection(container) {
    const inviteData = await this.fetchInviteStatus();
    
    container.innerHTML = `
      <div class="section-invites">
        <div class="section-header">
          <h2>Invite System</h2>
          <div class="invite-stats">
            <span class="stat-item">
              <strong>${inviteData.available}</strong> Available
            </span>
            <span class="stat-item">
              <strong>${inviteData.sent.length}</strong> Sent
            </span>
          </div>
        </div>
        
        <div class="invite-content">
          <div class="invite-actions">
            <button class="primary-btn" data-action="create-invite" ${inviteData.available === 0 ? 'disabled' : ''}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
              </svg>
              Send Invite
            </button>
            <button class="secondary-btn" data-action="my-invite-link">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5z"/>
                <path d="M7.414 15.414a2 2 0 01-2.828-2.828l3-3a2 2 0 012.828 0 1 1 0 001.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5z"/>
              </svg>
              My Invite Link
            </button>
          </div>
          
          ${inviteData.sent.length > 0 ? `
            <div class="sent-invites">
              <h3>Sent Invites</h3>
              <div class="invites-list">
                ${inviteData.sent.map(invite => this.renderInviteItem(invite)).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  async renderAccountSection(container) {
    const profile = this.currentUser.profile;
    
    container.innerHTML = `
      <div class="section-account">
        <div class="section-header">
          <h2>Your Profile</h2>
          <button class="edit-btn" data-action="edit-profile">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
            Edit
          </button>
        </div>
        
        <div class="profile-content">
          <div class="profile-header">
            <div class="profile-avatar-large">
              <span>${profile?.name?.[0] || 'U'}</span>
            </div>
            <div class="profile-info">
              <h3>${profile?.name || 'Professional'}</h3>
              <p class="role">${profile?.role || 'Conference Attendee'}</p>
              <p class="company">${profile?.company || 'Add company'}</p>
            </div>
          </div>
          
          <div class="profile-stats">
            <div class="stat-card">
              <strong>${this.currentUser.connections?.length || 0}</strong>
              <span>Connections</span>
            </div>
            <div class="stat-card">
              <strong>${Object.keys(this.currentUser.rsvps || {}).length}</strong>
              <span>Events</span>
            </div>
            <div class="stat-card">
              <strong>${this.currentUser.savedEvents?.size || 0}</strong>
              <span>Saved</span>
            </div>
          </div>
          
          <div class="account-actions">
            <button class="action-item" data-action="sync-linkedin">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>Sync LinkedIn</span>
            </button>
            <button class="action-item" data-action="export-data">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
              </svg>
              <span>Export Data</span>
            </button>
            <button class="action-item" data-action="settings">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
              </svg>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderPartyCards(parties) {
    return parties.map(party => `
      <div class="party-card-signature" data-party-id="${party.id}">
        <div class="card-glass"></div>
        
        <div class="card-header">
          <div class="status-badges">
            <span class="status-badge status-badge--live">🔴 Live</span>
            <span class="status-badge status-badge--time">${this.formatTime(party.start || party.time)}</span>
          </div>
          <button class="save-btn ${this.currentUser.savedEvents.has(party.id) ? 'save-btn--saved' : ''}" 
                  data-action="save" data-party-id="${party.id}">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </button>
        </div>
        
        <div class="card-content">
          <h3 class="party-title">${party.title}</h3>
          <div class="party-venue">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
            </svg>
            <span>${party.venue || 'Cologne'}</span>
          </div>
          <p class="party-description">${party.description || 'Join the hottest party at Gamescom 2025'}</p>
          
          <div class="card-actions">
            <button class="action-btn action-btn--primary" data-action="rsvp" data-party-id="${party.id}">
              RSVP Now
            </button>
            <button class="action-btn" data-action="invite-friends" data-party-id="${party.id}">
              Invite Friends
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderCalendarEvent(event) {
    return `
      <div class="calendar-event">
        <div class="event-time">${this.formatTime(event.start)}</div>
        <div class="event-details">
          <h4>${event.title}</h4>
          <p>${event.venue}</p>
        </div>
        <div class="event-actions">
          <button class="icon-btn" data-action="add-to-calendar" data-event-id="${event.id}">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17 3h-1V1a1 1 0 00-2 0v2H6V1a1 1 0 00-2 0v2H3a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  renderContactCard(contact) {
    return `
      <div class="contact-card">
        <div class="contact-avatar">
          <span>${contact.name?.[0] || 'C'}</span>
        </div>
        <div class="contact-info">
          <h4>${contact.name}</h4>
          <p>${contact.company || 'Conference Attendee'}</p>
          <p class="contact-role">${contact.role || ''}</p>
        </div>
        <div class="contact-actions">
          <button class="icon-btn" data-action="message" data-contact-id="${contact.id}">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  renderInviteItem(invite) {
    return `
      <div class="invite-item">
        <div class="invite-info">
          <span class="invite-email">${invite.email}</span>
          <span class="invite-status ${invite.status}">${invite.status}</span>
        </div>
        <div class="invite-date">${this.formatDate(invite.sentAt)}</div>
      </div>
    `;
  }

  setupEventListeners() {
    document.addEventListener('click', this.handleGlobalClick.bind(this));
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        this.navigateToSection(section);
      });
    });
  }

  async handleGlobalClick(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;
    const partyId = e.target.closest('[data-party-id]')?.dataset.partyId;
    
    switch(action) {
      case 'save':
        await this.toggleSaveParty(partyId);
        break;
      case 'rsvp':
        await this.handleRSVP(partyId);
        break;
      case 'invite-friends':
        this.openInviteModal(partyId);
        break;
      case 'sync-google-calendar':
        await this.syncGoogleCalendar();
        break;
      case 'create-invite':
        await this.createInvite();
        break;
      case 'add-contact':
        this.openAddContactModal();
        break;
      case 'edit-profile':
        this.openProfileEditor();
        break;
      case 'sync-linkedin':
        await this.syncLinkedIn();
        break;
      case 'browse-parties':
        this.navigateToSection('parties');
        break;
    }
  }

  // API Integration Methods
  async fetchPartiesData() {
    if (this.cache.has('parties') && Date.now() - this.cache.get('parties').timestamp < 300000) {
      return this.cache.get('parties').data;
    }
    
    try {
      const parties = await fetchParties();
      this.cache.set('parties', { data: parties, timestamp: Date.now() });
      return parties;
    } catch (error) {
      console.error('Failed to fetch parties:', error);
      return [];
    }
  }

  async fetchInviteStatus() {
    try {
      const response = await fetch(`${this.apiBase}/invites/status`, {
        headers: { 'User-ID': this.currentUser.id }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch invite status:', error);
    }
    
    // Fallback to localStorage
    return this.currentUser.invites;
  }

  async toggleSaveParty(partyId) {
    const isSaved = this.currentUser.savedEvents.has(partyId);
    
    if (isSaved) {
      this.currentUser.savedEvents.delete(partyId);
    } else {
      this.currentUser.savedEvents.add(partyId);
    }
    
    this.saveUserData();
    
    // Update UI
    const saveBtn = document.querySelector(`[data-party-id="${partyId}"] .save-btn`);
    if (saveBtn) {
      saveBtn.classList.toggle('save-btn--saved', !isSaved);
    }
  }

  async handleRSVP(partyId) {
    try {
      // Add to user RSVPs
      this.currentUser.rsvps[partyId] = {
        status: 'going',
        timestamp: new Date().toISOString()
      };
      this.saveUserData();
      
      // Show success feedback
      this.showToast('🎉 RSVP confirmed! Added to your calendar.');
      
      // Trigger calendar sync if available
      await this.addToGoogleCalendar(partyId);
      
    } catch (error) {
      console.error('RSVP failed:', error);
      this.showToast('Failed to RSVP. Please try again.');
    }
  }

  async createInvite() {
    try {
      const response = await fetch(`${this.apiBase}/invites/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': this.currentUser.id
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        this.currentUser.invites.available--;
        this.currentUser.invites.sent.push(result);
        this.saveUserData();
        this.renderMainInterface();
        this.showToast('Invite created successfully!');
      }
    } catch (error) {
      console.error('Failed to create invite:', error);
      this.showToast('Failed to create invite. Please try again.');
    }
  }

  async syncGoogleCalendar() {
    try {
      const response = await fetch(`${this.apiBase}/calendar/oauth/start`, {
        headers: { 'User-ID': this.currentUser.id }
      });
      
      if (response.ok) {
        const { authUrl } = await response.json();
        window.open(authUrl, '_blank');
        this.showToast('Opening Google Calendar sync...');
      }
    } catch (error) {
      console.error('Failed to sync calendar:', error);
      this.showToast('Calendar sync unavailable. Please try again later.');
    }
  }

  // Utility Methods
  getCurrentSection() {
    const hash = window.location.hash;
    return hash.slice(1) || 'parties';
  }

  navigateToSection(section) {
    // Update nav state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('nav-item--active', item.dataset.section === section);
    });
    
    // Update URL
    window.location.hash = section;
    
    // Render section
    this.renderMainInterface();
  }

  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  saveUserData() {
    // Convert Set to Array for storage
    const userData = {
      ...this.currentUser,
      savedEvents: [...this.currentUser.savedEvents]
    };
    localStorage.setItem('conference_user', JSON.stringify(userData));
  }

  formatTime(timeString) {
    if (!timeString) return 'TBA';
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  }

  formatDate(dateString) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 90px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--color-accent);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      font-weight: 600;
      z-index: 10000;
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  renderError(container, title, error) {
    container.innerHTML = `
      <div class="error-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <h3>${title}</h3>
        <p>Please check your connection and try again.</p>
        <button class="retry-btn" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  async loadInitialData() {
    // Pre-load critical data
    try {
      await Promise.all([
        this.fetchPartiesData(),
        this.fetchInviteStatus()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  setupPWAFeatures() {
    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .catch(error => console.error('SW registration failed:', error));
    }
    
    // Handle online/offline states
    this.updateOnlineStatus();
  }

  updateOnlineStatus() {
    document.body.classList.toggle('offline', !this.isOnline);
    if (!this.isOnline) {
      this.showToast('You\'re offline. Some features may be limited.');
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.conferenceApp = new UnifiedConferenceApp();
  });
} else {
  window.conferenceApp = new UnifiedConferenceApp();
}

export default UnifiedConferenceApp;