/**
 * Party Carousel Modern - Two-Column Card Design
 * Consistent with the modern design system
 */

import { fetchParties } from './api-lite.js';

class PartyCarouselModern {
  constructor() {
    this.parties = [];
    this.savedParties = new Set(JSON.parse(localStorage.getItem('saved_parties') || '[]'));
    this.currentPage = 0;
    this.itemsPerPage = 4; // 2x2 grid
  }

  async init() {
    await this.loadParties();
    this.render();
    this.bindEvents();
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
    // Replace the parties section content
    const partiesSection = document.querySelector('.home-section[data-section="parties"]');
    if (!partiesSection) {
      console.warn('[PartyCarousel] Parties section not found');
      return;
    }

    // Clear old pills and add carousel
    partiesSection.innerHTML = `
      <h2>Tonight's Parties</h2>
      <div class="party-carousel-modern">
        <div class="party-carousel-modern__header">
          <div class="party-carousel-modern__nav">
            <button class="party-carousel-modern__btn party-carousel-modern__btn--prev" data-action="prev">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
              </svg>
            </button>
            <span class="party-carousel-modern__indicator">
              <span class="current">${Math.min(this.parties.length, this.itemsPerPage)}</span> / <span class="total">${this.parties.length}</span>
            </span>
            <button class="party-carousel-modern__btn party-carousel-modern__btn--next" data-action="next">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
              </svg>
            </button>
          </div>
          <button class="party-carousel-modern__view-all" data-action="view-all">
            View All Parties
          </button>
        </div>
        
        <div class="party-carousel-modern__grid">
          ${this.renderCurrentPage()}
        </div>
        
        <div class="party-carousel-modern__dots">
          ${this.renderDots()}
        </div>
      </div>
    `;
  }

  renderCurrentPage() {
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const pageParties = this.parties.slice(start, end);
    
    if (pageParties.length === 0) {
      return '<p class="party-carousel-modern__empty">No parties found</p>';
    }
    
    return pageParties.map(party => this.renderPartyCard(party)).join('');
  }

  renderPartyCard(party) {
    return `
      <article class="card-modern party-card-modern" data-party-id="${party.id}">
        <div class="card-modern__glass"></div>
        
        <button class="party-card-modern__save ${party.saved ? 'is-saved' : ''}" data-action="save" aria-label="Save party">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            ${party.saved ? 
              '<path d="M10 18l-1.45-1.32C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0c1.74 0 3.41.81 4.5 2.09C11.09.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.54L10 18z"/>' :
              '<path d="M10 18l-1.45-1.32C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0c1.74 0 3.41.81 4.5 2.09C11.09.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.54L10 18z" fill="none" stroke="currentColor" stroke-width="2"/>'
            }
          </svg>
        </button>
        
        <div class="card-modern__header">
          <span class="card-modern__badge">${party.timeFormatted}</span>
          <span class="card-modern__date">${party.dateFormatted}</span>
        </div>
        
        <div class="card-modern__content">
          <h3 class="card-modern__title">${party.title}</h3>
          <p class="card-modern__venue">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="opacity: 0.6">
              <path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 7 5 7s5-3.25 5-7c0-2.76-2.24-5-5-5zm0 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
            ${party.venue || 'Secret Location'}
          </p>
          
          <div class="card-modern__actions">
            <button class="card-modern__btn" data-action="details">
              Details
            </button>
            <button class="card-modern__btn card-modern__btn--primary" data-action="rsvp">
              RSVP
            </button>
          </div>
        </div>
      </article>
    `;
  }

  renderDots() {
    const totalPages = Math.ceil(this.parties.length / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => `
      <button class="party-carousel-modern__dot ${i === this.currentPage ? 'is-active' : ''}" 
              data-page="${i}" 
              aria-label="Go to page ${i + 1}"></button>
    `).join('');
  }

  bindEvents() {
    const carousel = document.querySelector('.party-carousel-modern');
    if (!carousel) return;

    carousel.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      const partyCard = e.target.closest('.party-card-modern');
      const partyId = partyCard?.dataset.partyId;
      
      switch (action) {
        case 'prev':
          this.navigate(-1);
          break;
        case 'next':
          this.navigate(1);
          break;
        case 'view-all':
          this.viewAll();
          break;
        case 'save':
          if (partyId) this.toggleSave(partyId, e.target.closest('[data-action="save"]'));
          break;
        case 'details':
          if (partyId) this.showDetails(partyId);
          break;
        case 'rsvp':
          if (partyId) this.handleRSVP(partyId);
          break;
      }
      
      // Dot navigation
      const dot = e.target.closest('.party-carousel-modern__dot');
      if (dot) {
        this.currentPage = parseInt(dot.dataset.page);
        this.updateView();
      }
    });

    // Touch gestures
    let touchStartX = 0;
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          this.navigate(1);
        } else {
          this.navigate(-1);
        }
      }
    }, { passive: true });
  }

  navigate(direction) {
    const totalPages = Math.ceil(this.parties.length / this.itemsPerPage);
    this.currentPage = Math.max(0, Math.min(totalPages - 1, this.currentPage + direction));
    this.updateView();
  }

  updateView() {
    const grid = document.querySelector('.party-carousel-modern__grid');
    const dots = document.querySelector('.party-carousel-modern__dots');
    const indicator = document.querySelector('.party-carousel-modern__indicator');
    
    if (grid) {
      grid.innerHTML = this.renderCurrentPage();
      // Add animation
      grid.style.animation = 'slideIn 0.3s ease-out';
      setTimeout(() => grid.style.animation = '', 300);
    }
    
    if (dots) {
      dots.innerHTML = this.renderDots();
    }
    
    if (indicator) {
      const start = this.currentPage * this.itemsPerPage + 1;
      const end = Math.min(start + this.itemsPerPage - 1, this.parties.length);
      indicator.querySelector('.current').textContent = `${start}-${end}`;
    }
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

  showDetails(partyId) {
    const party = this.parties.find(p => p.id === partyId);
    if (!party) return;
    
    // Use existing overlay system
    location.hash = '#/party/' + partyId;
    
    // Or show inline details
    const card = document.querySelector(`[data-party-id="${partyId}"]`);
    if (card) {
      card.classList.add('is-expanded');
      // Could add more details here
    }
  }

  handleRSVP(partyId) {
    const party = this.parties.find(p => p.id === partyId);
    if (!party) return;
    
    // Add to calendar
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
    
    // Show feedback
    this.showToast(`RSVP sent for ${party.title}!`);
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

  getFallbackParties() {
    return [
      {
        id: 'opening-night',
        title: 'Gamescom Opening Night Live',
        venue: 'Koelnmesse Hall 11',
        start: '2025-08-19T18:00:00',
        date: '2025-08-19',
        lat: 50.9473,
        lng: 6.9838
      },
      {
        id: 'xbox-party',
        title: 'Xbox Showcase After Party',
        venue: 'Hyatt Regency Cologne',
        start: '2025-08-19T21:00:00',
        date: '2025-08-19',
        lat: 50.9406,
        lng: 6.9464
      },
      {
        id: 'indie-mixer',
        title: 'Indie Developer Mixer',
        venue: 'Belgian Quarter',
        start: '2025-08-20T19:00:00',
        date: '2025-08-20',
        lat: 50.9356,
        lng: 6.9374
      },
      {
        id: 'playstation-lounge',
        title: 'PlayStation VIP Lounge',
        venue: 'Excelsior Hotel Ernst',
        start: '2025-08-20T20:00:00',
        date: '2025-08-20',
        lat: 50.9376,
        lng: 6.9511
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
    window.partyCarouselModern = new PartyCarouselModern();
    window.partyCarouselModern.init();
  });
} else {
  window.partyCarouselModern = new PartyCarouselModern();
  window.partyCarouselModern.init();
}

export default PartyCarouselModern;