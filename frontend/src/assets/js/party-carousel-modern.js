/**
 * Signature Party Showcase - Enhanced Two-Panel Hero Feature
 * Premium carousel with viral features integration
 * Features: Swipeable cards, invites, contacts, calendar sync
 */

import { fetchParties } from './api-lite.js';

class SignaturePartyShowcase {
  constructor() {
    this.parties = [];
    this.savedParties = new Set(JSON.parse(localStorage.getItem('saved_parties') || '[]'));
    this.currentIndex = 0;
    this.itemsPerView = 1; // Single hero card with details panel
    this.isTransitioning = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isDragging = false;
  }

  async init() {
    await this.loadParties();
    this.render();
    this.bindEvents();
    this.startAutoPlay();
  }

  async loadParties() {
    try {
      const data = await fetchParties();
      console.log('[PartyCarousel] Loaded parties:', data);
      
      this.parties = data.map((party, index) => ({
        ...party,
        id: party.id || `party-${index}`,
        saved: this.savedParties.has(party.id || `party-${index}`),
        timeFormatted: this.formatTime(party.start || party.time),
        dateFormatted: this.formatDate(party.date)
      }));
    } catch (err) {
      console.error('[PartyCarousel] Failed to load parties:', err);
      this.parties = this.getFallbackParties();
    }
  }

  formatTime(time) {
    if (!time) return 'TBA';
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return time;
    }
  }

  formatDate(date) {
    if (!date) return '';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  }

  render() {
    // Replace the parties section with signature showcase
    const partiesSection = document.querySelector('.home-section[data-section="parties"]');
    if (!partiesSection) {
      console.warn('[PartyShowcase] Parties section not found');
      return;
    }

    partiesSection.innerHTML = `
      <div class="signature-party-showcase">
        <div class="showcase-header">
          <h2 class="showcase-title">
            <span class="showcase-title__main">Tonight's Hottest</span>
            <span class="showcase-title__accent">Party Scene</span>
          </h2>
          <div class="showcase-controls">
            <button class="showcase-nav showcase-nav--prev" data-action="prev" aria-label="Previous party">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
              </svg>
            </button>
            <span class="showcase-indicator">
              <span class="current">${this.currentIndex + 1}</span>
              <span class="divider">/</span>
              <span class="total">${this.parties.length}</span>
            </span>
            <button class="showcase-nav showcase-nav--next" data-action="next" aria-label="Next party">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="showcase-main">
          <div class="showcase-carousel-track" style="transform: translateX(-${this.currentIndex * 100}%)">
            ${this.renderPartyCards()}
          </div>
        </div>
        
        <div class="showcase-footer">
          <div class="showcase-dots">
            ${this.renderDots()}
          </div>
          <button class="showcase-view-all" data-action="view-all">
            <span>View All ${this.parties.length} Parties</span>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    this.updateActiveCard();
  }

  renderPartyCards() {
    if (this.parties.length === 0) {
      return '<div class="showcase-empty">No parties found</div>';
    }
    
    return this.parties.map((party, index) => this.renderSignatureCard(party, index)).join('');
  }

  renderSignatureCard(party, index) {
    const isActive = index === this.currentIndex;
    const isSaved = this.savedParties.has(party.id);
    
    return `
      <div class="showcase-card ${isActive ? 'showcase-card--active' : ''}" data-party-id="${party.id}" data-index="${index}">
        <div class="showcase-card__glass"></div>
        
        <!-- Two-panel layout -->
        <div class="showcase-card__main">
          <!-- Left Panel: Hero Content -->
          <div class="showcase-card__hero">
            <div class="showcase-card__status">
              <span class="status-badge status-badge--live">🔴 Live Now</span>
              <span class="status-badge status-badge--time">${party.timeFormatted}</span>
            </div>
            
            <div class="showcase-card__content">
              <h3 class="showcase-card__title">${party.title}</h3>
              <div class="showcase-card__venue">
                <svg class="venue-icon" width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 7 5 7s5-3.25 5-7c0-2.76-2.24-5-5-5zm0 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
                <span>${party.venue || 'Secret Location'}</span>
              </div>
              
              <div class="showcase-card__description">
                ${party.description || 'Join the hottest party at Gamescom 2025. Network with industry leaders, enjoy premium drinks, and experience unforgettable moments.'}
              </div>
              
              <div class="showcase-card__meta">
                <div class="meta-item">
                  <span class="meta-label">Crowd</span>
                  <span class="meta-value">🔥 450+ attending</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Vibe</span>
                  <span class="meta-value">⚡ High Energy</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right Panel: Actions & Details -->
          <div class="showcase-card__actions">
            <div class="action-group">
              <h4 class="action-group__title">Quick Actions</h4>
              
              <!-- Primary RSVP -->
              <button class="action-btn action-btn--primary" data-action="rsvp" data-party-id="${party.id}">
                <span class="action-icon">🎉</span>
                <div class="action-content">
                  <span class="action-title">RSVP Now</span>
                  <span class="action-subtitle">Add to calendar & get updates</span>
                </div>
              </button>
              
              <!-- Invite Friends (Viral Feature) -->
              <button class="action-btn action-btn--secondary" data-action="invite" data-party-id="${party.id}">
                <span class="action-icon">✉️</span>
                <div class="action-content">
                  <span class="action-title">Invite Friends</span>
                  <span class="action-subtitle">Share exclusive access</span>
                </div>
              </button>
              
              <!-- Find Contacts -->
              <button class="action-btn action-btn--secondary" data-action="find-contacts" data-party-id="${party.id}">
                <span class="action-icon">👥</span>
                <div class="action-content">
                  <span class="action-title">Find Contacts</span>
                  <span class="action-subtitle">See who's going</span>
                </div>
              </button>
            </div>
            
            <div class="action-group">
              <h4 class="action-group__title">Calendar</h4>
              
              <div class="calendar-actions">
                <button class="calendar-btn" data-action="google-calendar" data-party-id="${party.id}">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17 3h-1V1a1 1 0 00-2 0v2H6V1a1 1 0 00-2 0v2H3a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM3 7h14v10H3V7z"/>
                  </svg>
                  Google Calendar
                </button>
                <button class="calendar-btn" data-action="download-ics" data-party-id="${party.id}">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
                  </svg>
                  Download .ics
                </button>
              </div>
            </div>
            
            <!-- Save Toggle -->
            <div class="save-section">
              <button class="save-btn ${isSaved ? 'save-btn--saved' : ''}" data-action="save" data-party-id="${party.id}">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  ${isSaved ? 
                    '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>' :
                    '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="none" stroke="currentColor" stroke-width="2"/>'
                  }
                </svg>
                <span>${isSaved ? 'Saved' : 'Save for Later'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderDots() {
    return this.parties.map((_, i) => `
      <button class="showcase-dot ${i === this.currentIndex ? 'showcase-dot--active' : ''}" 
              data-index="${i}" 
              aria-label="Go to party ${i + 1}"></button>
    `).join('');
  }

  bindEvents() {
    const showcase = document.querySelector('.signature-party-showcase');
    if (!showcase) return;

    // Click events
    showcase.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      const partyId = e.target.closest('[data-party-id]')?.dataset.partyId;
      
      switch (action) {
        case 'prev':
          this.navigatePrev();
          break;
        case 'next':
          this.navigateNext();
          break;
        case 'view-all':
          this.viewAll();
          break;
        case 'save':
          if (partyId) this.toggleSave(partyId, e.target.closest('[data-action="save"]'));
          break;
        case 'rsvp':
          if (partyId) this.handleRSVP(partyId);
          break;
        case 'invite':
          if (partyId) this.openInvitePanel(partyId);
          break;
        case 'find-contacts':
          if (partyId) this.findContacts(partyId);
          break;
        case 'google-calendar':
          if (partyId) this.addToGoogleCalendar(partyId);
          break;
        case 'download-ics':
          if (partyId) this.downloadICS(partyId);
          break;
      }
      
      // Dot navigation
      const dot = e.target.closest('.showcase-dot');
      if (dot) {
        this.goToSlide(parseInt(dot.dataset.index));
      }
    });

    // Enhanced touch gestures
    const track = showcase.querySelector('.showcase-carousel-track');
    if (track) {
      this.bindTouchEvents(track);
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (showcase.matches(':hover, :focus-within')) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.navigatePrev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.navigateNext();
        }
      }
    });
  }

  navigatePrev() {
    if (this.isTransitioning) return;
    this.goToSlide(this.currentIndex > 0 ? this.currentIndex - 1 : this.parties.length - 1);
  }

  navigateNext() {
    if (this.isTransitioning) return;
    this.goToSlide(this.currentIndex < this.parties.length - 1 ? this.currentIndex + 1 : 0);
  }

  goToSlide(index) {
    if (this.isTransitioning || index === this.currentIndex) return;
    
    this.isTransitioning = true;
    this.currentIndex = index;
    
    const track = document.querySelector('.showcase-carousel-track');
    if (track) {
      track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    }
    
    this.updateIndicators();
    this.updateActiveCard();
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, 600);
  }

  updateIndicators() {
    // Update dots
    const dots = document.querySelectorAll('.showcase-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('showcase-dot--active', index === this.currentIndex);
    });
    
    // Update counter
    const currentEl = document.querySelector('.showcase-indicator .current');
    if (currentEl) {
      currentEl.textContent = this.currentIndex + 1;
    }
    
    // Update navigation buttons state
    const prevBtn = document.querySelector('.showcase-nav--prev');
    const nextBtn = document.querySelector('.showcase-nav--next');
    
    if (prevBtn && nextBtn) {
      prevBtn.disabled = false; // Always enabled for loop
      nextBtn.disabled = false;
    }
  }

  updateActiveCard() {
    const cards = document.querySelectorAll('.showcase-card');
    cards.forEach((card, index) => {
      card.classList.toggle('showcase-card--active', index === this.currentIndex);
    });
  }

  toggleSave(partyId, button) {
    const party = this.parties.find(p => p.id === partyId);
    if (!party) return;
    
    party.saved = !party.saved;
    
    if (party.saved) {
      this.savedParties.add(partyId);
      button.classList.add('is-saved');
    } else {
      this.savedParties.delete(partyId);
      button.classList.remove('is-saved');
    }
    
    // Update icon
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        ${party.saved ? 
          '<path d="M10 18l-1.45-1.32C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0c1.74 0 3.41.81 4.5 2.09C11.09.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.54L10 18z"/>' :
          '<path d="M10 18l-1.45-1.32C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0c1.74 0 3.41.81 4.5 2.09C11.09.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.54L10 18z" fill="none" stroke="currentColor" stroke-width="2"/>'
        }
      </svg>
    `;
    
    localStorage.setItem('saved_parties', JSON.stringify([...this.savedParties]));
    
    // Pulse animation
    button.style.animation = 'pulse 0.3s ease';
    setTimeout(() => button.style.animation = '', 300);
  }

  openInvitePanel(partyId) {
    const party = this.parties.find(p => p.id === partyId);
    if (!party) return;
    
    // Store party context for invite system
    localStorage.setItem('invite_context_party', JSON.stringify(party));
    
    // Navigate to invites with party context
    location.hash = '#/invites';
    
    this.showToast(`Opening invites for ${party.title}`);
  }

  findContacts(partyId) {
    const party = this.parties.find(p => p.id === partyId);
    if (!party) return;
    
    // Store party context for contacts system
    localStorage.setItem('contacts_context_party', JSON.stringify(party));
    
    // Navigate to contacts
    location.hash = '#/contacts';
    
    this.showToast(`Finding contacts for ${party.title}`);
  }

  addToGoogleCalendar(partyId) {
    const party = this.parties.find(p => p.id === partyId);
    if (!party) return;
    
    // Use existing calendar integration
    const calendarUrl = new URL('https://calendar.google.com/calendar/render');
    calendarUrl.searchParams.set('action', 'TEMPLATE');
    calendarUrl.searchParams.set('text', party.title);
    calendarUrl.searchParams.set('location', party.venue || 'Cologne, Germany');
    
    if (party.start || party.time) {
      const startDate = new Date(party.start || party.time).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const endDate = new Date(new Date(party.start || party.time).getTime() + 3 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      calendarUrl.searchParams.set('dates', `${startDate}/${endDate}`);
    }
    
    window.open(calendarUrl.toString(), '_blank');
    this.showToast(`Added ${party.title} to Google Calendar!`);
  }

  downloadICS(partyId) {
    const party = this.parties.find(p => p.id === partyId);
    if (!party) return;
    
    // Generate ICS content
    const icsContent = this.generateICS(party);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${party.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    link.click();
    
    URL.revokeObjectURL(url);
    this.showToast(`Downloaded ${party.title} calendar file!`);
  }

  generateICS(party) {
    const now = new Date();
    const startDate = new Date(party.start || party.time || now);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gamescom Party App//EN',
      'BEGIN:VEVENT',
      `UID:${party.id}@gamescom-party-app.web.app`,
      `DTSTAMP:${formatDate(now)}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${party.title}`,
      `LOCATION:${party.venue || 'Cologne, Germany'}`,
      `DESCRIPTION:${party.description || 'Gamescom 2025 Party'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  handleRSVP(partyId) {
    const party = this.parties.find(p => p.id === partyId);
    if (!party) return;
    
    // Show enhanced RSVP modal
    this.showRSVPModal(party);
  }

  showRSVPModal(party) {
    const modal = document.createElement('div');
    modal.className = 'rsvp-modal';
    modal.innerHTML = `
      <div class="rsvp-modal__backdrop"></div>
      <div class="rsvp-modal__content">
        <div class="rsvp-modal__header">
          <h3>RSVP to ${party.title}</h3>
          <button class="rsvp-modal__close" data-action="close-rsvp">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
          </button>
        </div>
        
        <div class="rsvp-modal__body">
          <div class="rsvp-options">
            <button class="rsvp-option rsvp-option--primary" data-action="rsvp-yes">
              <span class="rsvp-option__icon">🎉</span>
              <div class="rsvp-option__content">
                <span class="rsvp-option__title">I'm Going!</span>
                <span class="rsvp-option__subtitle">Add to calendar & get updates</span>
              </div>
            </button>
            
            <button class="rsvp-option" data-action="rsvp-maybe">
              <span class="rsvp-option__icon">🤔</span>
              <div class="rsvp-option__content">
                <span class="rsvp-option__title">Maybe</span>
                <span class="rsvp-option__subtitle">Save for later decision</span>
              </div>
            </button>
            
            <button class="rsvp-option" data-action="rsvp-share">
              <span class="rsvp-option__icon">✉️</span>
              <div class="rsvp-option__content">
                <span class="rsvp-option__title">Share with Friends</span>
                <span class="rsvp-option__subtitle">Invite others to join</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle modal interactions
    modal.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      
      switch (action) {
        case 'close-rsvp':
          modal.remove();
          break;
        case 'rsvp-yes':
          this.confirmRSVP(party);
          modal.remove();
          break;
        case 'rsvp-maybe':
          this.maybeRSVP(party);
          modal.remove();
          break;
        case 'rsvp-share':
          this.shareParty(party);
          modal.remove();
          break;
      }
      
      // Close on backdrop
      if (e.target.classList.contains('rsvp-modal__backdrop')) {
        modal.remove();
      }
    });
  }

  confirmRSVP(party) {
    // Add to calendar automatically
    this.addToGoogleCalendar(party.id);
    
    // Save to local storage
    const rsvps = JSON.parse(localStorage.getItem('party_rsvps') || '{}');
    rsvps[party.id] = {
      status: 'going',
      timestamp: new Date().toISOString(),
      party: {
        id: party.id,
        title: party.title,
        venue: party.venue,
        date: party.date
      }
    };
    localStorage.setItem('party_rsvps', JSON.stringify(rsvps));
    
    this.showToast(`🎉 You're going to ${party.title}! Added to calendar.`);
  }

  maybeRSVP(party) {
    const rsvps = JSON.parse(localStorage.getItem('party_rsvps') || '{}');
    rsvps[party.id] = {
      status: 'maybe',
      timestamp: new Date().toISOString(),
      party: {
        id: party.id,
        title: party.title,
        venue: party.venue,
        date: party.date
      }
    };
    localStorage.setItem('party_rsvps', JSON.stringify(rsvps));
    
    this.showToast(`🤔 Saved ${party.title} for later!`);
  }

  shareParty(party) {
    // Open invite panel with party context
    this.openInvitePanel(party.id);
  }

  viewAll() {
    // Navigate to full parties view
    location.hash = '#/parties';
  }

  showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--bg-gradient-primary);
      color: white;
      padding: 12px 24px;
      border-radius: 100px;
      font-size: 14px;
      font-weight: 600;
      z-index: 10000;
      transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  bindTouchEvents(track) {
    track.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.isDragging = false;
    }, { passive: true });
    
    track.addEventListener('touchmove', (e) => {
      if (!this.isDragging) {
        const deltaX = Math.abs(e.touches[0].clientX - this.touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - this.touchStartY);
        
        if (deltaX > deltaY && deltaX > 10) {
          this.isDragging = true;
        }
      }
    }, { passive: true });
    
    track.addEventListener('touchend', (e) => {
      if (!this.isDragging) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const diff = this.touchStartX - touchEndX;
      const threshold = 50;
      
      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          this.navigateNext();
        } else {
          this.navigatePrev();
        }
      }
      
      this.isDragging = false;
    }, { passive: true });
  }

  startAutoPlay() {
    // Optional: Auto-advance every 8 seconds
    if (this.parties.length > 1) {
      setInterval(() => {
        if (!this.isTransitioning && !this.isDragging) {
          this.navigateNext();
        }
      }, 8000);
    }
  }

  getFallbackParties() {
    return [
      {
        id: 'opening-night',
        title: 'Gamescom Opening Night Live',
        venue: 'Koelnmesse Hall 11',
        start: '2025-08-19T18:00:00',
        date: '2025-08-19',
        description: 'The biggest gaming event kicks off with exclusive reveals, celebrity guests, and premium networking. Join industry leaders for an unforgettable opening celebration.',
        lat: 50.9473,
        lng: 6.9838
      },
      {
        id: 'xbox-party',
        title: 'Xbox Showcase After Party',
        venue: 'Hyatt Regency Cologne',
        start: '2025-08-19T21:00:00',
        date: '2025-08-19',
        description: 'Celebrate the latest Xbox announcements with developers, press, and VIP guests. Premium cocktails, exclusive game demos, and surprise announcements.',
        lat: 50.9406,
        lng: 6.9464
      },
      {
        id: 'indie-mixer',
        title: 'Indie Developer Mixer',
        venue: 'Belgian Quarter',
        start: '2025-08-20T19:00:00',
        date: '2025-08-20',
        description: 'Connect with independent developers, publishers, and investors. Discover groundbreaking indie titles and forge partnerships that matter.',
        lat: 50.9356,
        lng: 6.9374
      },
      {
        id: 'playstation-lounge',
        title: 'PlayStation VIP Lounge',
        venue: 'Excelsior Hotel Ernst',
        start: '2025-08-20T20:00:00',
        date: '2025-08-20',
        description: 'Exclusive PlayStation experience with hands-on demos of upcoming titles, developer Q&As, and luxury hospitality in Cologne\'s premier venue.',
        lat: 50.9376,
        lng: 6.9511
      },
      {
        id: 'esports-finale',
        title: 'Esports Championship Finale',
        venue: 'Lanxess Arena',
        start: '2025-08-21T20:00:00',
        date: '2025-08-21',
        description: 'Witness the grand finale of Europe\'s biggest esports tournament. Meet professional players, streamers, and industry legends.',
        lat: 50.9333,
        lng: 6.9833
      }
    ].map((party, index) => ({
      ...party,
      saved: false,
      timeFormatted: this.formatTime(party.start),
      dateFormatted: this.formatDate(party.date)
    }));
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.signaturePartyShowcase = new SignaturePartyShowcase();
    window.signaturePartyShowcase.init();
  });
} else {
  window.signaturePartyShowcase = new SignaturePartyShowcase();
  window.signaturePartyShowcase.init();
}

export default SignaturePartyShowcase;