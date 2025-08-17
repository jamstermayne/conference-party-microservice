/**
 * Party Flow - A Revolutionary Party Discovery Experience
 * 
 * "Design is not just what it looks like and feels like. 
 * Design is how it works." - Steve Jobs
 */

import { fetchParties } from './api-lite.js';

class PartyFlow {
  constructor() {
    this.parties = [];
    this.savedParties = new Set(JSON.parse(localStorage.getItem('saved_parties') || '[]'));
    this.currentView = 'carousel'; // carousel | grid | map
    this.container = null;
    this.mapInstance = null;
    this.activeDetail = null;
    
    // Touch gesture support
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.currentIndex = 0;
  }

  async init() {
    await this.loadParties();
    this.setupContainer();
    this.render();
    this.bindEvents();
    this.startAutoRotate();
  }

  async loadParties() {
    try {
      const data = await fetchParties();
      console.log('[PartyFlow] Loaded parties:', data);
      
      // Enrich party data with design elements
      this.parties = data.map((party, index) => ({
        ...party,
        id: party.id || `party-${index}`,
        image: this.generatePartyImage(party),
        gradient: this.generateGradient(index),
        saved: this.savedParties.has(party.id),
        timeFormatted: this.formatTime(party.start || party.time),
        dateFormatted: this.formatDate(party.date)
      }));
    } catch (err) {
      console.error('[PartyFlow] Failed to load parties:', err);
      this.parties = this.getFallbackParties();
    }
  }

  generatePartyImage(party) {
    // Use venue-based images or generate abstract art
    const images = [
      'https://source.unsplash.com/800x600/?nightclub,party',
      'https://source.unsplash.com/800x600/?concert,music',
      'https://source.unsplash.com/800x600/?festival,crowd',
      'https://source.unsplash.com/800x600/?dj,electronic',
      'https://source.unsplash.com/800x600/?gaming,esports'
    ];
    return images[Math.floor(Math.random() * images.length)] + '&' + Date.now();
  }

  generateGradient(index) {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    return gradients[index % gradients.length];
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

  setupContainer() {
    // Find or create container
    this.container = document.getElementById('party-flow-container');
    if (!this.container) {
      const homePanel = document.querySelector('.home-panel');
      if (homePanel) {
        this.container = document.createElement('div');
        this.container.id = 'party-flow-container';
        this.container.className = 'party-flow-container';
        
        // Insert after parties section or at the end
        const partiesSection = homePanel.querySelector('[data-section="parties"]');
        if (partiesSection) {
          partiesSection.insertAdjacentElement('afterend', this.container);
        } else {
          homePanel.appendChild(this.container);
        }
      }
    }
  }

  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="party-flow">
        <div class="party-flow__header">
          <h2 class="party-flow__title">Tonight's Parties</h2>
          <div class="party-flow__controls">
            <button class="party-flow__view-btn ${this.currentView === 'carousel' ? 'is-active' : ''}" data-view="carousel">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect x="2" y="6" width="6" height="8" rx="1"/>
                <rect x="7" y="4" width="6" height="12" rx="1"/>
                <rect x="12" y="6" width="6" height="8" rx="1"/>
              </svg>
            </button>
            <button class="party-flow__view-btn ${this.currentView === 'grid' ? 'is-active' : ''}" data-view="grid">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect x="3" y="3" width="6" height="6" rx="1"/>
                <rect x="11" y="3" width="6" height="6" rx="1"/>
                <rect x="3" y="11" width="6" height="6" rx="1"/>
                <rect x="11" y="11" width="6" height="6" rx="1"/>
              </svg>
            </button>
            <button class="party-flow__view-btn ${this.currentView === 'map' ? 'is-active' : ''}" data-view="map">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2C6.13 2 3 5.13 3 9c0 5.25 7 11 7 11s7-5.75 7-11c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="party-flow__content">
          ${this.renderView()}
        </div>
        
        <div class="party-flow__footer">
          <p class="party-flow__count">${this.parties.length} parties tonight</p>
          <button class="party-flow__filter-btn">
            Filter <span class="badge">${this.savedParties.size}</span>
          </button>
        </div>
      </div>
    `;
  }

  renderView() {
    switch (this.currentView) {
      case 'carousel':
        return this.renderCarousel();
      case 'grid':
        return this.renderGrid();
      case 'map':
        return this.renderMap();
      default:
        return this.renderCarousel();
    }
  }

  renderCarousel() {
    return `
      <div class="party-carousel">
        <div class="party-carousel__track">
          ${this.parties.map((party, index) => this.renderPartyCard(party, index)).join('')}
        </div>
        <div class="party-carousel__dots">
          ${this.parties.map((_, index) => `
            <button class="party-carousel__dot ${index === 0 ? 'is-active' : ''}" data-index="${index}"></button>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderGrid() {
    return `
      <div class="party-grid">
        ${this.parties.map((party, index) => this.renderPartyCard(party, index)).join('')}
      </div>
    `;
  }

  renderMap() {
    return `
      <div class="party-map" id="party-flow-map">
        <div class="party-map__loading">Loading map...</div>
      </div>
    `;
  }

  renderPartyCard(party, index) {
    return `
      <div class="party-carousel__item" data-index="${index}">
        <article class="party-card" data-party-id="${party.id}" style="animation-delay: ${index * 0.05}s">
          <div class="party-card__glass"></div>
          
          <div class="party-card__hero">
            <img src="${party.image}" alt="${party.title}" loading="lazy">
          </div>
          
          <button class="party-card__saved ${party.saved ? 'is-saved' : ''}" data-action="toggle-save">
            <svg viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          
          <div class="party-card__time">${party.timeFormatted}</div>
          
          <div class="party-card__content">
            <h3 class="party-card__title">${party.title}</h3>
            <p class="party-card__venue">${party.venue || 'Secret Location'}</p>
            
            <div class="party-card__actions">
              <button class="party-card__btn" data-action="details">
                Details
              </button>
              <button class="party-card__btn party-card__btn--primary" data-action="rsvp">
                RSVP
              </button>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  bindEvents() {
    if (!this.container) return;
    
    // View switcher
    this.container.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('[data-view]');
      if (viewBtn) {
        this.switchView(viewBtn.dataset.view);
        return;
      }
      
      // Card actions
      const action = e.target.closest('[data-action]');
      if (action) {
        const card = action.closest('.party-card');
        const partyId = card?.dataset.partyId;
        const party = this.parties.find(p => p.id === partyId);
        
        if (!party) return;
        
        switch (action.dataset.action) {
          case 'toggle-save':
            this.toggleSave(party, action);
            break;
          case 'details':
            this.showDetails(party);
            break;
          case 'rsvp':
            this.handleRSVP(party);
            break;
        }
      }
      
      // Carousel dots
      const dot = e.target.closest('.party-carousel__dot');
      if (dot) {
        this.scrollToIndex(parseInt(dot.dataset.index));
      }
    });
    
    // Touch gestures for carousel
    const carousel = this.container.querySelector('.party-carousel__track');
    if (carousel) {
      this.setupCarouselGestures(carousel);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (this.activeDetail) {
        if (e.key === 'Escape') {
          this.closeDetails();
        }
      } else if (this.currentView === 'carousel') {
        if (e.key === 'ArrowLeft') {
          this.navigateCarousel(-1);
        } else if (e.key === 'ArrowRight') {
          this.navigateCarousel(1);
        }
      }
    });
  }

  setupCarouselGestures(carousel) {
    let isScrolling = false;
    
    carousel.addEventListener('scroll', () => {
      if (!isScrolling) {
        window.requestAnimationFrame(() => {
          this.updateCarouselDots(carousel);
          isScrolling = false;
        });
        isScrolling = true;
      }
    }, { passive: true });
    
    // Touch swipe support
    let touchStartX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          this.navigateCarousel(1);
        } else {
          this.navigateCarousel(-1);
        }
      }
    }, { passive: true });
  }

  updateCarouselDots(carousel) {
    const scrollLeft = carousel.scrollLeft;
    const itemWidth = carousel.querySelector('.party-carousel__item')?.offsetWidth || 320;
    const currentIndex = Math.round(scrollLeft / (itemWidth + 20));
    
    this.container.querySelectorAll('.party-carousel__dot').forEach((dot, index) => {
      dot.classList.toggle('is-active', index === currentIndex);
    });
    
    this.currentIndex = currentIndex;
  }

  navigateCarousel(direction) {
    const carousel = this.container.querySelector('.party-carousel__track');
    if (!carousel) return;
    
    const itemWidth = carousel.querySelector('.party-carousel__item')?.offsetWidth || 320;
    const newIndex = Math.max(0, Math.min(this.parties.length - 1, this.currentIndex + direction));
    
    carousel.scrollTo({
      left: newIndex * (itemWidth + 20),
      behavior: 'smooth'
    });
  }

  scrollToIndex(index) {
    const carousel = this.container.querySelector('.party-carousel__track');
    if (!carousel) return;
    
    const itemWidth = carousel.querySelector('.party-carousel__item')?.offsetWidth || 320;
    carousel.scrollTo({
      left: index * (itemWidth + 20),
      behavior: 'smooth'
    });
  }

  switchView(view) {
    this.currentView = view;
    this.render();
    this.bindEvents();
    
    if (view === 'map') {
      setTimeout(() => this.initMap(), 100);
    }
  }

  toggleSave(party, button) {
    party.saved = !party.saved;
    
    if (party.saved) {
      this.savedParties.add(party.id);
      button.classList.add('is-saved');
      this.showToast(`Saved ${party.title}`);
    } else {
      this.savedParties.delete(party.id);
      button.classList.remove('is-saved');
      this.showToast(`Removed ${party.title}`);
    }
    
    localStorage.setItem('saved_parties', JSON.stringify([...this.savedParties]));
    
    // Haptic feedback animation
    button.style.animation = 'pulse 0.3s ease';
    setTimeout(() => button.style.animation = '', 300);
  }

  showDetails(party) {
    const detail = document.createElement('div');
    detail.className = 'party-detail';
    detail.innerHTML = `
      <div class="party-detail__card">
        <button class="party-detail__close" data-action="close">×</button>
        
        <div class="party-detail__hero">
          <img src="${party.image}" alt="${party.title}">
        </div>
        
        <div class="party-detail__content">
          <h2 class="party-detail__title">${party.title}</h2>
          <p class="party-detail__venue">📍 ${party.venue || 'Secret Location'}</p>
          <p class="party-detail__time">🕐 ${party.timeFormatted} · ${party.dateFormatted}</p>
          
          <div class="party-detail__description">
            ${party.description || 'Join us for an unforgettable night at Gamescom 2025.'}
          </div>
          
          <div class="party-detail__actions">
            <button class="party-card__btn" data-action="calendar">
              Add to Calendar
            </button>
            <button class="party-card__btn" data-action="share">
              Share
            </button>
            <button class="party-card__btn party-card__btn--primary" data-action="rsvp">
              RSVP Now
            </button>
          </div>
          
          ${party.lat && party.lng ? `
            <div class="party-detail__map" id="party-detail-map"></div>
          ` : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(detail);
    this.activeDetail = detail;
    
    // Animate in
    requestAnimationFrame(() => {
      detail.classList.add('is-active');
    });
    
    // Bind close
    detail.addEventListener('click', (e) => {
      if (e.target === detail || e.target.closest('[data-action="close"]')) {
        this.closeDetails();
      }
    });
    
    // Init mini map if coords exist
    if (party.lat && party.lng) {
      setTimeout(() => this.initDetailMap(party), 300);
    }
  }

  closeDetails() {
    if (!this.activeDetail) return;
    
    this.activeDetail.classList.remove('is-active');
    setTimeout(() => {
      this.activeDetail.remove();
      this.activeDetail = null;
    }, 300);
  }

  handleRSVP(party) {
    // Simulate RSVP
    this.showToast(`RSVP sent for ${party.title}!`);
    
    // Save to calendar
    const calendarUrl = new URL('https://calendar.google.com/calendar/render');
    calendarUrl.searchParams.set('action', 'TEMPLATE');
    calendarUrl.searchParams.set('text', party.title);
    calendarUrl.searchParams.set('location', party.venue || 'Cologne, Germany');
    calendarUrl.searchParams.set('details', party.description || '');
    
    if (party.start) {
      const startDate = new Date(party.start).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const endDate = new Date(new Date(party.start).getTime() + 3 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      calendarUrl.searchParams.set('dates', `${startDate}/${endDate}`);
    }
    
    window.open(calendarUrl.toString(), '_blank');
  }

  async initMap() {
    const mapEl = document.getElementById('party-flow-map');
    if (!mapEl || !window.google?.maps) return;
    
    this.mapInstance = new google.maps.Map(mapEl, {
      zoom: 12,
      center: { lat: 50.9375, lng: 6.9603 },
      styles: this.getMapStyles(),
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false
    });
    
    // Add markers for parties with coordinates
    this.parties.forEach(party => {
      if (party.lat && party.lng) {
        const marker = new google.maps.Marker({
          position: { lat: party.lat, lng: party.lng },
          map: this.mapInstance,
          title: party.title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#8b5cf6',
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2
          }
        });
        
        marker.addListener('click', () => {
          this.showDetails(party);
        });
      }
    });
  }

  initDetailMap(party) {
    const mapEl = document.getElementById('party-detail-map');
    if (!mapEl || !window.google?.maps) return;
    
    const map = new google.maps.Map(mapEl, {
      zoom: 15,
      center: { lat: party.lat, lng: party.lng },
      styles: this.getMapStyles(),
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false
    });
    
    new google.maps.Marker({
      position: { lat: party.lat, lng: party.lng },
      map: map,
      title: party.title
    });
  }

  getMapStyles() {
    return [
      { elementType: 'geometry', stylers: [{ color: '#1d1d2e' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d2e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#8b8b9a' }] },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#2c2c3e' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#15151f' }]
      }
    ];
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'party-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: rgba(0, 0, 0, 0.9);
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

  startAutoRotate() {
    // Subtle auto-advance for carousel after 10s of inactivity
    let timeout;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (this.currentView === 'carousel' && !this.activeDetail) {
          this.navigateCarousel(1);
          resetTimer();
        }
      }, 10000);
    };
    
    this.container?.addEventListener('touchstart', resetTimer, { passive: true });
    this.container?.addEventListener('mousedown', resetTimer, { passive: true });
    this.container?.addEventListener('scroll', resetTimer, { passive: true });
    
    resetTimer();
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
        lng: 6.9838,
        description: 'The biggest gaming show kickoff event of the year.',
        saved: false
      },
      {
        id: 'xbox-party',
        title: 'Xbox Showcase After Party',
        venue: 'Hyatt Regency Cologne',
        start: '2025-08-19T21:00:00',
        date: '2025-08-19',
        lat: 50.9406,
        lng: 6.9464,
        description: 'Exclusive Xbox party with special announcements.',
        saved: false
      },
      {
        id: 'indie-mixer',
        title: 'Indie Games Mixer',
        venue: 'Belgian Quarter',
        start: '2025-08-20T19:00:00',
        date: '2025-08-20',
        lat: 50.9356,
        lng: 6.9374,
        description: 'Network with indie developers and publishers.',
        saved: false
      }
    ].map((party, index) => ({
      ...party,
      image: this.generatePartyImage(party),
      gradient: this.generateGradient(index),
      timeFormatted: this.formatTime(party.start),
      dateFormatted: this.formatDate(party.date)
    }));
  }
}

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.partyFlow = new PartyFlow();
    window.partyFlow.init();
  });
} else {
  window.partyFlow = new PartyFlow();
  window.partyFlow.init();
}

export default PartyFlow;