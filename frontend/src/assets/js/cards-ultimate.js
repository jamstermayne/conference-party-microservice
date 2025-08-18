/**
 * Ultimate Card System - JavaScript Implementation
 * Beautiful, modern, and feature-complete card components
 */

class UltimateCardSystem {
  constructor() {
    this.cards = new Map();
    this.observers = new Map();
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.setupEventDelegation();
    this.loadCards();
  }

  /**
   * Setup intersection observer for entrance animations
   */
  setupIntersectionObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: '50px'
    };

    this.animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('card-ultimate--enter');
          this.animationObserver.unobserve(entry.target);
        }
      });
    }, options);
  }

  /**
   * Setup global event delegation for card interactions
   */
  setupEventDelegation() {
    document.addEventListener('click', this.handleCardClick.bind(this));
    document.addEventListener('mouseenter', this.handleCardHover.bind(this), true);
    document.addEventListener('mouseleave', this.handleCardLeave.bind(this), true);
  }

  /**
   * Handle card click events
   */
  handleCardClick(e) {
    const card = e.target.closest('.card-ultimate');
    if (!card) return;

    const action = e.target.closest('[data-action]');
    if (action) {
      e.preventDefault();
      e.stopPropagation();
      this.handleAction(card, action.dataset.action, action);
    }
  }

  /**
   * Handle card hover effects
   */
  handleCardHover(e) {
    const card = e.target.closest('.card-ultimate');
    if (!card) return;

    // Add parallax effect on hover
    if (!card.dataset.noParallax) {
      this.addParallaxEffect(card);
    }
  }

  /**
   * Handle card mouse leave
   */
  handleCardLeave(e) {
    const card = e.target.closest('.card-ultimate');
    if (!card) return;

    this.removeParallaxEffect(card);
  }

  /**
   * Add parallax tilt effect
   */
  addParallaxEffect(card) {
    const handleMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateZ(10px)
      `;
    };

    card.addEventListener('mousemove', handleMove);
    card.dataset.parallaxHandler = 'true';
  }

  /**
   * Remove parallax effect
   */
  removeParallaxEffect(card) {
    if (card.dataset.parallaxHandler) {
      card.style.transform = '';
      delete card.dataset.parallaxHandler;
    }
  }

  /**
   * Handle card actions
   */
  async handleAction(card, action, element) {
    switch (action) {
      case 'save':
        await this.saveCard(card);
        break;
      case 'share':
        await this.shareCard(card);
        break;
      case 'calendar':
        await this.addToCalendar(card);
        break;
      case 'map':
        await this.showOnMap(card);
        break;
      case 'rsvp':
        await this.handleRSVP(card);
        break;
      case 'copy-code':
        await this.copyInviteCode(card);
        break;
      case 'copy-link':
        await this.copyInviteLink(card);
        break;
      case 'qr':
        await this.showQRCode(card);
        break;
      case 'sync':
        await this.syncMeeting(card);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  /**
   * Load and render cards
   */
  async loadCards() {
    // This would typically load from API
    const containers = document.querySelectorAll('[data-cards-container]');
    
    containers.forEach(container => {
      const type = container.dataset.cardsContainer;
      this.renderCards(container, type);
    });
  }

  /**
   * Render cards based on type
   */
  renderCards(container, type) {
    let cards = [];
    
    switch (type) {
      case 'parties':
        cards = this.createPartyCards();
        break;
      case 'invites':
        cards = this.createInviteCards();
        break;
      case 'meetings':
        cards = this.createMeetingCards();
        break;
      case 'hotspots':
        cards = this.createHotspotCards();
        break;
    }

    const grid = document.createElement('div');
    grid.className = 'cards-grid cards-grid--auto';
    
    cards.forEach(cardHTML => {
      const cardElement = this.createCardElement(cardHTML);
      grid.appendChild(cardElement);
      
      // Observe for animations
      this.animationObserver.observe(cardElement);
    });

    container.appendChild(grid);
  }

  /**
   * Create card element from HTML
   */
  createCardElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
  }

  /**
   * Create party cards
   */
  createPartyCards() {
    return [
      this.createPartyCard({
        id: 'party-1',
        title: 'Gamescom Opening Night',
        subtitle: 'Official kickoff event',
        date: 'August 20, 2025',
        time: '7:00 PM - 11:00 PM',
        location: 'Koelnmesse Hall 11',
        price: 'Free with badge',
        attendees: 500,
        tags: ['Networking', 'Official', 'Popular'],
        saved: false
      }),
      this.createPartyCard({
        id: 'party-2',
        title: 'Xbox Showcase After-Party',
        subtitle: 'Exclusive industry mixer',
        date: 'August 21, 2025',
        time: '9:00 PM - 2:00 AM',
        location: 'Hyatt Regency Cologne',
        price: '€50',
        attendees: 200,
        tags: ['VIP', 'Industry', 'Limited'],
        saved: true
      })
    ];
  }

  /**
   * Create a party card
   */
  createPartyCard(data) {
    return `
      <div class="card-ultimate card-ultimate--party" data-id="${data.id}">
        ${data.price === 'Free with badge' ? '<div class="card-ultimate__badge card-ultimate__badge--free">Free</div>' : ''}
        
        <div class="card-ultimate__header">
          <div class="card-ultimate__eyebrow">
            <svg class="card-ultimate__eyebrow-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"/>
            </svg>
            <span>${data.date}</span>
          </div>
          <h3 class="card-ultimate__title">${data.title}</h3>
          <p class="card-ultimate__subtitle">${data.subtitle}</p>
        </div>
        
        <div class="card-ultimate__body">
          <div class="card-ultimate__meta-grid">
            <svg class="card-ultimate__meta-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
            </svg>
            <span class="card-ultimate__meta-text">${data.time}</span>
            
            <svg class="card-ultimate__meta-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            <span class="card-ultimate__meta-text">${data.location}</span>
            
            <svg class="card-ultimate__meta-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
            <span class="card-ultimate__meta-text">${data.attendees}+ attending</span>
          </div>
          
          <div class="card-ultimate__tags">
            ${data.tags.map(tag => `
              <span class="card-ultimate__tag card-ultimate__tag--accent">${tag}</span>
            `).join('')}
          </div>
          
          <div class="card-ultimate__progress">
            <div class="card-ultimate__progress-bar" style="width: ${Math.min(data.attendees / 10, 100)}%"></div>
          </div>
        </div>
        
        <div class="card-ultimate__actions">
          <button class="card-ultimate__action card-ultimate__action--primary" data-action="rsvp">
            RSVP Now
          </button>
          <button class="card-ultimate__action card-ultimate__action--secondary" data-action="save">
            ${data.saved ? '✓ Saved' : 'Save'}
          </button>
          <button class="card-ultimate__action card-ultimate__action--icon" data-action="share">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create invite cards
   */
  createInviteCards() {
    return [
      this.createInviteCard({
        id: 'invite-1',
        title: 'Developer Meetup Invitation',
        code: 'DEV2025',
        link: 'https://app.com/i/DEV2025',
        from: 'John Doe',
        event: 'Unity Developer Summit',
        date: 'August 22, 2025',
        status: 'pending',
        uses: 3,
        maxUses: 10
      })
    ];
  }

  /**
   * Create an invite card
   */
  createInviteCard(data) {
    return `
      <div class="card-ultimate card-ultimate--invite" data-id="${data.id}">
        <div class="card-ultimate__badge card-ultimate__badge--success">
          ${data.uses}/${data.maxUses} Used
        </div>
        
        <div class="card-ultimate__header">
          <div class="card-ultimate__eyebrow">
            <svg class="card-ultimate__eyebrow-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 8V6a3 3 0 013-3h8a3 3 0 013 3v2m-14 0v8a3 3 0 003 3h8a3 3 0 003-3V8m-14 0h14"/>
            </svg>
            <span>Invitation Code</span>
          </div>
          <h3 class="card-ultimate__title">${data.title}</h3>
          <p class="card-ultimate__subtitle">From ${data.from}</p>
        </div>
        
        <div class="card-ultimate__body">
          <div class="card-ultimate__meta-grid">
            <svg class="card-ultimate__meta-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 00-1 1v1.323a6.002 6.002 0 106.93 8.677h1.07A8 8 0 1110 2z"/>
            </svg>
            <span class="card-ultimate__meta-text">Code: <strong>${data.code}</strong></span>
            
            <svg class="card-ultimate__meta-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"/>
            </svg>
            <span class="card-ultimate__meta-text">${data.event}</span>
          </div>
          
          <div class="card-ultimate__progress">
            <div class="card-ultimate__progress-bar" style="width: ${(data.uses / data.maxUses) * 100}%"></div>
          </div>
        </div>
        
        <div class="card-ultimate__actions">
          <button class="card-ultimate__action card-ultimate__action--primary" data-action="copy-link">
            Copy Link
          </button>
          <button class="card-ultimate__action card-ultimate__action--secondary" data-action="copy-code">
            Copy Code
          </button>
          <button class="card-ultimate__action card-ultimate__action--icon" data-action="qr">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6z"/>
              <path d="M13 13h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create meeting cards
   */
  createMeetingCards() {
    return [
      this.createMeetingCard({
        id: 'meeting-1',
        title: 'Portfolio Review - Epic Games',
        participants: ['Sarah Chen', 'Mike Johnson'],
        date: 'August 21, 2025',
        time: '2:00 PM - 3:00 PM',
        location: 'Meeting Room B12',
        synced: true,
        type: 'business'
      })
    ];
  }

  /**
   * Create a meeting card
   */
  createMeetingCard(data) {
    const participantAvatars = data.participants.map((name, i) => `
      <div class="card-ultimate__participant" title="${name}">
        ${name.split(' ').map(n => n[0]).join('')}
      </div>
    `).join('');

    return `
      <div class="card-ultimate card-ultimate--meeting ${data.synced ? 'synced' : ''}" data-id="${data.id}">
        <div class="card-ultimate__header">
          <div class="card-ultimate__eyebrow">
            <svg class="card-ultimate__eyebrow-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
            </svg>
            <span>Meet to Match</span>
          </div>
          <h3 class="card-ultimate__title">${data.title}</h3>
        </div>
        
        <div class="card-ultimate__body">
          <div class="card-ultimate__participants">
            ${participantAvatars}
            <div class="card-ultimate__participant card-ultimate__participant--more">
              +${Math.max(0, data.participants.length - 3)}
            </div>
          </div>
          
          <div class="card-ultimate__meta-grid">
            <svg class="card-ultimate__meta-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
            </svg>
            <span class="card-ultimate__meta-text">${data.date}</span>
            
            <svg class="card-ultimate__meta-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
            </svg>
            <span class="card-ultimate__meta-text">${data.time}</span>
            
            <svg class="card-ultimate__meta-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            <span class="card-ultimate__meta-text">${data.location}</span>
          </div>
        </div>
        
        <div class="card-ultimate__actions">
          <button class="card-ultimate__action card-ultimate__action--primary" data-action="calendar">
            Add to Calendar
          </button>
          <button class="card-ultimate__action card-ultimate__action--secondary" data-action="map">
            Show on Map
          </button>
          <button class="card-ultimate__action card-ultimate__action--icon" data-action="sync">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create hotspot cards
   */
  createHotspotCards() {
    return [
      this.createHotspotCard({
        id: 'hotspot-1',
        title: 'Hall 11 - Main Stage',
        subtitle: 'Xbox & PlayStation Booths',
        crowdLevel: 85,
        trending: true,
        waitTime: '45 min',
        activities: ['Demos', 'Meet & Greet', 'Giveaways']
      })
    ];
  }

  /**
   * Create a hotspot card
   */
  createHotspotCard(data) {
    const isHot = data.crowdLevel > 70;
    
    return `
      <div class="card-ultimate card-ultimate--hotspot ${isHot ? 'hot' : ''}" data-id="${data.id}">
        <div class="card-ultimate__header">
          <div class="card-ultimate__eyebrow">
            <svg class="card-ultimate__eyebrow-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>
            </svg>
            <span>${data.trending ? 'Trending Now' : 'Popular Spot'}</span>
          </div>
          <h3 class="card-ultimate__title">${data.title}</h3>
          <p class="card-ultimate__subtitle">${data.subtitle}</p>
        </div>
        
        <div class="card-ultimate__body">
          <div class="card-ultimate__meta-grid">
            <svg class="card-ultimate__meta-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
            <span class="card-ultimate__meta-text">Crowd: ${data.crowdLevel}%</span>
            
            <svg class="card-ultimate__meta-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
            </svg>
            <span class="card-ultimate__meta-text">Wait: ${data.waitTime}</span>
          </div>
          
          <div class="card-ultimate__tags">
            ${data.activities.map(activity => `
              <span class="card-ultimate__tag card-ultimate__tag--warning">${activity}</span>
            `).join('')}
          </div>
          
          <div class="card-ultimate__progress">
            <div class="card-ultimate__progress-bar" style="width: ${data.crowdLevel}%; background: linear-gradient(90deg, #fbbf24, #ef4444);"></div>
          </div>
        </div>
        
        <div class="card-ultimate__actions">
          <button class="card-ultimate__action card-ultimate__action--primary" data-action="map">
            Navigate
          </button>
          <button class="card-ultimate__action card-ultimate__action--secondary" data-action="save">
            Watch Spot
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Save card to favorites
   */
  async saveCard(card) {
    const id = card.dataset.id;
    const button = card.querySelector('[data-action="save"]');
    
    // Toggle save state
    const isSaved = button.textContent.includes('✓');
    
    if (isSaved) {
      button.textContent = 'Save';
      this.showToast('Removed from saved');
    } else {
      button.textContent = '✓ Saved';
      this.showToast('Added to saved');
    }
    
    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('savedCards') || '[]');
    if (isSaved) {
      const index = saved.indexOf(id);
      if (index > -1) saved.splice(index, 1);
    } else {
      saved.push(id);
    }
    localStorage.setItem('savedCards', JSON.stringify(saved));
  }

  /**
   * Share card
   */
  async shareCard(card) {
    const title = card.querySelector('.card-ultimate__title').textContent;
    const url = window.location.href + '#' + card.dataset.id;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out: ${title}`,
          url: url
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      this.showToast('Link copied to clipboard');
    }
  }

  /**
   * Add event to calendar
   */
  async addToCalendar(card) {
    const title = card.querySelector('.card-ultimate__title').textContent;
    const date = card.querySelector('.card-ultimate__meta-text').textContent;
    
    // This would integrate with calendar API
    this.showToast('Opening calendar...');
    
    // Example Google Calendar URL
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=20250820T190000/20250820T230000`;
    window.open(googleCalUrl, '_blank');
  }

  /**
   * Show location on map
   */
  async showOnMap(card) {
    const location = card.querySelector('.card-ultimate__meta-text:nth-of-type(2)').textContent;
    this.showToast(`Opening map for ${location}`);
    
    // This would integrate with map component
    window.dispatchEvent(new CustomEvent('show-on-map', {
      detail: { location, cardId: card.dataset.id }
    }));
  }

  /**
   * Handle RSVP
   */
  async handleRSVP(card) {
    const button = card.querySelector('[data-action="rsvp"]');
    button.textContent = 'Processing...';
    button.disabled = true;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    button.textContent = '✓ RSVP Confirmed';
    button.classList.remove('card-ultimate__action--primary');
    button.classList.add('card-ultimate__action--success');
    
    this.showToast('RSVP confirmed! Check your email for details.');
  }

  /**
   * Copy invite code
   */
  async copyInviteCode(card) {
    const code = card.querySelector('.card-ultimate__meta-text strong').textContent;
    await navigator.clipboard.writeText(code);
    this.showToast(`Code "${code}" copied to clipboard`);
  }

  /**
   * Copy invite link
   */
  async copyInviteLink(card) {
    const code = card.querySelector('.card-ultimate__meta-text strong').textContent;
    const link = `https://app.com/i/${code}`;
    await navigator.clipboard.writeText(link);
    this.showToast('Invite link copied to clipboard');
  }

  /**
   * Show QR code
   */
  async showQRCode(card) {
    const code = card.querySelector('.card-ultimate__meta-text strong').textContent;
    this.showToast('Generating QR code...');
    
    // This would show a QR code modal
    window.dispatchEvent(new CustomEvent('show-qr', {
      detail: { code, cardId: card.dataset.id }
    }));
  }

  /**
   * Sync meeting
   */
  async syncMeeting(card) {
    const button = card.querySelector('[data-action="sync"] svg');
    button.classList.add('spin');
    
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    button.classList.remove('spin');
    card.classList.add('synced');
    this.showToast('Meeting synced to calendar');
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 24px;
      background: ${type === 'success' ? 'linear-gradient(135deg, #34d399, #10b981)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
      color: white;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      animation: slideInUp 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutDown 0.3s ease';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ultimateCardSystem = new UltimateCardSystem();
  });
} else {
  window.ultimateCardSystem = new UltimateCardSystem();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UltimateCardSystem;
}