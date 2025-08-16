/**
 * 🎉 PROFESSIONAL INTELLIGENCE PLATFORM - PARTIES PAGE
 * Tonight's exclusive networking events and industry parties
 */

export class PartiesPage {
  constructor() {
    this.parties = [];
    this.filteredParties = [];
    this.currentFilter = 'all';
    this.currentSort = 'time';
    this.searchQuery = '';
  }

  /**
   * Render parties page
   */
  async render() {
    return `
      <div class="parties-page">
        <!-- Page Header -->
        <header class="page-header">
          <div class="header-content">
            <div class="header-title">
              <h1>Tonight's Parties</h1>
              <p class="header-subtitle">Exclusive gaming industry networking events</p>
            </div>
            <div class="header-stats" id="parties-stats">
              <div class="stat-item">
                <span class="stat-value">0</span>
                <span class="stat-label">Events</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">0</span>
                <span class="stat-label">Attending</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Search and Filters -->
        <div class="page-controls">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input 
              type="text" 
              placeholder="Search events, venues, or hosts..." 
              id="parties-search"
              class="search-input"
            >
          </div>

          <div class="filter-controls">
            <select id="parties-filter" class="filter-select">
              <option value="all">All Events</option>
              <option value="attending">Attending</option>
              <option value="interested">Interested</option>
              <option value="available">Available</option>
            </select>

            <select id="parties-sort" class="sort-select">
              <option value="time">By Time</option>
              <option value="venue">By Venue</option>
              <option value="popularity">By Popularity</option>
            </select>
          </div>
        </div>

        <!-- Parties Grid -->
        <div class="parties-container">
          <div id="parties-grid" class="parties-grid">
            <!-- Party cards will be rendered here -->
          </div>
          
          <div id="parties-empty" class="empty-state hidden">
            <div class="empty-icon">🎭</div>
            <h3>No events found</h3>
            <p>Try adjusting your search or filters to find more events.</p>
          </div>
          
          <div id="parties-loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading exclusive events...</p>
          </div>
        </div>

        <!-- Floating Action Button -->
        <button id="parties-refresh" class="fab" title="Refresh events">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * Initialize parties page
   */
  async initialize() {
    console.log('🎉 Initializing parties page...');

    try {
      await this.loadParties();
      this.setupEventListeners();
      this.renderParties();
      this.updateStats();
    } catch (error) {
      console.error('❌ Parties page initialization failed:', error);
      this.showError('Failed to load parties data');
    }
  }

  /**
   * Load parties data
   */
  async loadParties() {
    const loadingEl = document.getElementById('parties-loading');
    if (loadingEl) loadingEl.classList.remove('hidden');

    try {
      // Get API instance from global app
      const api = window.app?.getAPI();
      if (!api) {
        throw new Error('API not available');
      }

      this.parties = await api.getParties();
      this.filteredParties = [...this.parties];

      console.log(`📊 Loaded ${this.parties.length} parties`);
    } catch (error) {
      console.error('❌ Failed to load parties:', error);
      // Try to load from cache or show error
      this.parties = JSON.parse(localStorage.getItem('cached_parties') || '[]');
      this.filteredParties = [...this.parties];
    } finally {
      if (loadingEl) loadingEl.classList.add('hidden');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('parties-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce((e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.filterAndRenderParties();
      }, 300));
    }

    // Filter select
    const filterSelect = document.getElementById('parties-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.filterAndRenderParties();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('parties-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.filterAndRenderParties();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('parties-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await this.refreshParties();
      });
    }
  }

  /**
   * Filter and render parties
   */
  filterAndRenderParties() {
    this.filteredParties = this.parties.filter(party => {
      // Apply search filter
      if (this.searchQuery) {
        const searchableText = `${party.name} ${party.venue} ${party.host || ''} ${party.description || ''}`.toLowerCase();
        if (!searchableText.includes(this.searchQuery)) {
          return false;
        }
      }

      // Apply status filter
      switch (this.currentFilter) {
        case 'attending':
          return party.isAttending;
        case 'interested':
          return party.isInterested && !party.isAttending;
        case 'available':
          return !party.isAttending && !party.isInterested;
        default:
          return true;
      }
    });

    // Apply sorting
    this.sortParties();
    this.renderParties();
    this.updateStats();
  }

  /**
   * Sort parties
   */
  sortParties() {
    switch (this.currentSort) {
      case 'time':
        this.filteredParties.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        break;
      case 'venue':
        this.filteredParties.sort((a, b) => (a.venue || '').localeCompare(b.venue || ''));
        break;
      case 'popularity':
        this.filteredParties.sort((a, b) => (b.attendeeCount || 0) - (a.attendeeCount || 0));
        break;
    }
  }

  /**
   * Render parties grid
   */
  renderParties() {
    const gridEl = document.getElementById('parties-grid');
    const emptyEl = document.getElementById('parties-empty');

    if (!gridEl) return;

    if (this.filteredParties.length === 0) {
      gridEl.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    const partiesHtml = this.filteredParties.map(party => this.renderPartyCard(party)).join('');
    gridEl.innerHTML = partiesHtml;

    // Setup party card interactions
    this.setupPartyCardListeners();
  }

  /**
   * Render individual party card
   */
  renderPartyCard(party) {
    const datetime = new Date(party.datetime);
    const timeString = datetime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    const statusClass = party.isAttending ? 'attending' : (party.isInterested ? 'interested' : '');
    const attendeeCount = party.attendeeCount || 0;
    
    return `
      <div class="party-card glass-card ${statusClass}" data-party-id="${party.id}">
        <div class="party-header">
          <div class="party-time">
            <div class="time">${timeString}</div>
            <div class="date">${datetime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          </div>
          <div class="party-status">
            ${party.isAttending ? '<span class="status-badge attending">Attending</span>' : ''}
            ${party.isInterested && !party.isAttending ? '<span class="status-badge interested">Interested</span>' : ''}
          </div>
        </div>

        <div class="party-content">
          <h3 class="party-name">${this.escapeHtml(party.name)}</h3>
          
          <div class="party-venue">
            <svg class="venue-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${this.escapeHtml(party.venue || 'Venue TBA')}</span>
          </div>

          ${party.host ? `
            <div class="party-host">
              <svg class="host-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Hosted by ${this.escapeHtml(party.host)}</span>
            </div>
          ` : ''}

          ${party.description ? `
            <p class="party-description">${this.escapeHtml(party.description)}</p>
          ` : ''}

          <div class="party-stats">
            <div class="stat-item">
              <span class="stat-value">${attendeeCount}</span>
              <span class="stat-label">attending</span>
            </div>
            ${party.maxCapacity ? `
              <div class="stat-item">
                <span class="stat-value">${party.maxCapacity}</span>
                <span class="stat-label">capacity</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="party-actions">
          <button class="btn btn-ghost party-interest-btn" data-action="interest">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            ${party.isInterested ? 'Interested' : 'Interest'}
          </button>
          
          <button class="btn ${party.isAttending ? 'btn-glass' : 'btn-primary'} party-attend-btn" data-action="attend">
            ${party.isAttending ? 'Attending ✓' : 'RSVP'}
          </button>

          <button class="btn btn-ghost party-share-btn" data-action="share" title="Share event">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m22 2-7 20-4-9-9-4Z"></path>
              <path d="M22 2 11 13"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Setup party card interactions
   */
  setupPartyCardListeners() {
    const partyCards = document.querySelectorAll('.party-card');
    
    partyCards.forEach(card => {
      const partyId = card.dataset.partyId;
      
      // Interest button
      const interestBtn = card.querySelector('.party-interest-btn');
      if (interestBtn) {
        interestBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleInterest(partyId);
        });
      }

      // Attend button
      const attendBtn = card.querySelector('.party-attend-btn');
      if (attendBtn) {
        attendBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleAttendance(partyId);
        });
      }

      // Share button
      const shareBtn = card.querySelector('.party-share-btn');
      if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.shareParty(partyId);
        });
      }

      // Card click for details
      card.addEventListener('click', () => {
        this.showPartyDetails(partyId);
      });
    });
  }

  /**
   * Toggle party interest
   */
  async toggleInterest(partyId) {
    const party = this.parties.find(p => p.id === partyId);
    if (!party) return;

    party.isInterested = !party.isInterested;
    
    try {
      // Update UI immediately
      this.renderParties();
      this.updateStats();

      // Sync with API
      const api = window.app?.getAPI();
      if (api) {
        await api.rsvpToParty(partyId, party.isInterested ? 'interested' : 'none');
      }

      // Show feedback
      const ui = window.app?.getUI();
      if (ui) {
        ui.showToast(
          party.isInterested ? 'Added to interested events' : 'Removed from interested events',
          'success'
        );
      }
    } catch (error) {
      console.error('❌ Interest toggle failed:', error);
      // Revert on error
      party.isInterested = !party.isInterested;
      this.renderParties();
    }
  }

  /**
   * Toggle party attendance
   */
  async toggleAttendance(partyId) {
    const party = this.parties.find(p => p.id === partyId);
    if (!party) return;

    party.isAttending = !party.isAttending;
    if (party.isAttending) {
      party.isInterested = false; // Can't be both
    }
    
    try {
      // Update UI immediately
      this.renderParties();
      this.updateStats();

      // Sync with API
      const api = window.app?.getAPI();
      if (api) {
        await api.rsvpToParty(partyId, party.isAttending ? 'attending' : 'none');
      }

      // Show feedback
      const ui = window.app?.getUI();
      if (ui) {
        ui.showToast(
          party.isAttending ? 'RSVP confirmed!' : 'RSVP cancelled',
          'success'
        );
      }
    } catch (error) {
      console.error('❌ Attendance toggle failed:', error);
      // Revert on error
      party.isAttending = !party.isAttending;
      this.renderParties();
    }
  }

  /**
   * Share party
   */
  async shareParty(partyId) {
    const party = this.parties.find(p => p.id === partyId);
    if (!party) return;

    const shareData = {
      title: party.name,
      text: `Join me at ${party.name} at ${party.venue}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareData.title} - ${shareData.url}`);
        
        const ui = window.app?.getUI();
        if (ui) {
          ui.showToast('Event link copied to clipboard', 'success');
        }
      }
    } catch (error) {
      console.error('❌ Share failed:', error);
    }
  }

  /**
   * Show party details modal
   */
  showPartyDetails(partyId) {
    const party = this.parties.find(p => p.id === partyId);
    if (!party) return;

    const ui = window.app?.getUI();
    if (!ui) return;

    const detailsHtml = `
      <div class="party-details">
        <div class="party-details-header">
          <h2>${this.escapeHtml(party.name)}</h2>
          <div class="party-details-time">
            ${new Date(party.datetime).toLocaleString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </div>
        </div>

        <div class="party-details-content">
          ${party.description ? `<p>${this.escapeHtml(party.description)}</p>` : ''}
          
          <div class="party-details-info">
            <div class="info-item">
              <strong>Venue:</strong> ${this.escapeHtml(party.venue || 'TBA')}
            </div>
            ${party.host ? `
              <div class="info-item">
                <strong>Host:</strong> ${this.escapeHtml(party.host)}
              </div>
            ` : ''}
            <div class="info-item">
              <strong>Expected Attendance:</strong> ${party.attendeeCount || 'Unknown'}
            </div>
          </div>
        </div>

        <div class="party-details-actions">
          <button class="btn btn-ghost" onclick="window.app.getUI().closeModal()">Close</button>
          <button class="btn btn-primary" onclick="window.partiesPage.toggleAttendance('${partyId}'); window.app.getUI().closeModal();">
            ${party.isAttending ? 'Cancel RSVP' : 'RSVP Now'}
          </button>
        </div>
      </div>
    `;

    ui.showModal(detailsHtml, {
      title: null,
      size: 'medium',
      closable: true
    });

    // Make this instance accessible for modal callbacks
    window.partiesPage = this;
  }

  /**
   * Refresh parties data
   */
  async refreshParties() {
    const refreshBtn = document.getElementById('parties-refresh');
    if (refreshBtn) {
      refreshBtn.classList.add('loading');
    }

    try {
      await this.loadParties();
      this.filterAndRenderParties();

      const ui = window.app?.getUI();
      if (ui) {
        ui.showToast('Events refreshed', 'success');
      }
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      const ui = window.app?.getUI();
      if (ui) {
        ui.showToast('Failed to refresh events', 'error');
      }
    } finally {
      if (refreshBtn) {
        refreshBtn.classList.remove('loading');
      }
    }
  }

  /**
   * Update stats display
   */
  updateStats() {
    const statsEl = document.getElementById('parties-stats');
    if (!statsEl) return;

    const totalEvents = this.parties.length;
    const attendingCount = this.parties.filter(p => p.isAttending).length;

    const statValues = statsEl.querySelectorAll('.stat-value');
    if (statValues.length >= 2) {
      statValues[0].textContent = totalEvents;
      statValues[1].textContent = attendingCount;
    }
  }

  /**
   * Show error state
   */
  showError(message) {
    const gridEl = document.getElementById('parties-grid');
    if (gridEl) {
      gridEl.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Something went wrong</h3>
          <p>${this.escapeHtml(message)}</p>
          <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  /**
   * Utility: Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Utility: Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}