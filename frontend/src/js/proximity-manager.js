/**
 * 🎯 PROXIMITY INTELLIGENCE SYSTEM
 * Privacy-first professional hotspot detection for networking
 * Aggregated venue-based intelligence without tracking individuals
 */

class ProximityManager {
    constructor() {
        // Privacy settings
        this.privacyLevels = {
            OFF: { id: 'off', label: 'Location Off', description: 'Not sharing location' },
            CITY: { id: 'city', label: 'City Only', description: 'Share city-level presence' },
            AREA: { id: 'area', label: 'Hotel Area', description: 'Share general area (1km radius)' },
            VENUE: { id: 'venue', label: 'Exact Venue', description: 'Share specific venue location' }
        };
        
        this.timeLimits = {
            ONE_HOUR: { id: '1h', label: '1 Hour', minutes: 60 },
            FOUR_HOURS: { id: '4h', label: '4 Hours', minutes: 240 },
            EIGHT_HOURS: { id: '8h', label: '8 Hours', minutes: 480 },
            CONFERENCE: { id: 'conference', label: 'During Conference', minutes: null }
        };
        
        // Venue clusters around Koelnmesse
        this.venueData = this.initializeVenues();
        
        // User settings
        this.userSettings = this.loadUserSettings();
        
        // Current state
        this.isSharing = false;
        this.sharingExpiry = null;
        this.currentVenue = null;
        this.lastUpdate = null;
        
        // Aggregated data cache
        this.hotspotsCache = new Map();
        this.cacheExpiry = 60000; // 1 minute cache
        
        this.init();
    }

    async init() {
        try {
            // Check existing settings
            this.applyUserSettings();
            
            // Create UI components
            this.createProximityUI();
            this.createSettingsModal();
            this.createHotspotsView();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start monitoring if enabled
            if (this.userSettings.enabled) {
                this.startSharing();
            }
            
            // Periodic updates
            this.startUpdateInterval();
            
            console.log('✅ Proximity Manager initialized');
            
        } catch (error) {
            console.error('❌ Proximity Manager initialization failed:', error);
        }
    }

    /**
     * Initialize venue database
     */
    initializeVenues() {
        return {
            // Conference venues
            conference: [
                {
                    id: 'koelnmesse-main',
                    name: 'Koelnmesse Main Halls',
                    type: 'conference',
                    coordinates: { lat: 50.9473, lng: 6.9831 },
                    areas: ['Hall 1-4', 'Hall 5-9', 'Hall 10-11', 'Congress Centre']
                },
                {
                    id: 'koelnmesse-north',
                    name: 'Koelnmesse North',
                    type: 'conference',
                    coordinates: { lat: 50.9493, lng: 6.9851 }
                },
                {
                    id: 'koelnmesse-south',
                    name: 'Koelnmesse South',
                    type: 'conference',
                    coordinates: { lat: 50.9453, lng: 6.9811 }
                }
            ],
            
            // Major hotels
            hotels: [
                {
                    id: 'marriott',
                    name: 'Cologne Marriott Hotel',
                    type: 'hotel',
                    tier: 'premium',
                    coordinates: { lat: 50.9477, lng: 6.9599 },
                    areas: ['Lobby', 'Bar', 'Restaurant', 'Conference Rooms']
                },
                {
                    id: 'dorint',
                    name: 'Dorint Hotel am Heumarkt',
                    type: 'hotel',
                    tier: 'premium',
                    coordinates: { lat: 50.9364, lng: 6.9603 },
                    areas: ['Lobby', 'Bar', 'Terrace']
                },
                {
                    id: 'radisson-blu',
                    name: 'Radisson Blu Hotel',
                    type: 'hotel',
                    tier: 'premium',
                    coordinates: { lat: 50.9481, lng: 6.9696 },
                    areas: ['Lobby', 'Bar', 'Restaurant']
                },
                {
                    id: 'savoy',
                    name: 'Savoy Hotel',
                    type: 'hotel',
                    tier: 'luxury',
                    coordinates: { lat: 50.9386, lng: 6.9476 },
                    areas: ['Lobby', 'Lounge']
                },
                {
                    id: 'hyatt-regency',
                    name: 'Hyatt Regency Cologne',
                    type: 'hotel',
                    tier: 'luxury',
                    coordinates: { lat: 50.9411, lng: 6.9731 },
                    areas: ['Lobby', 'Bar', 'Terrace', 'Restaurant']
                },
                {
                    id: 'pullman',
                    name: 'Pullman Cologne',
                    type: 'hotel',
                    tier: 'business',
                    coordinates: { lat: 50.9458, lng: 6.9441 },
                    areas: ['Lobby', 'Bar']
                }
            ],
            
            // Networking spots
            networking: [
                {
                    id: 'imhoff-museum',
                    name: 'Imhoff Chocolate Museum',
                    type: 'venue',
                    coordinates: { lat: 50.9318, lng: 6.9643 },
                    popular: true
                },
                {
                    id: 'lanxess-arena',
                    name: 'LANXESS Arena',
                    type: 'venue',
                    coordinates: { lat: 50.9382, lng: 6.9831 },
                    popular: true
                },
                {
                    id: 'rheinpark',
                    name: 'Rheinpark',
                    type: 'outdoor',
                    coordinates: { lat: 50.9488, lng: 6.9881 }
                },
                {
                    id: 'altstadt',
                    name: 'Cologne Old Town',
                    type: 'area',
                    coordinates: { lat: 50.9384, lng: 6.9592 },
                    subAreas: ['Heumarkt', 'Alter Markt', 'Fish Market']
                }
            ],
            
            // Restaurant clusters
            restaurants: [
                {
                    id: 'belgian-quarter',
                    name: 'Belgian Quarter',
                    type: 'area',
                    coordinates: { lat: 50.9352, lng: 6.9381 },
                    description: 'Trendy restaurants and bars'
                },
                {
                    id: 'friesenplatz',
                    name: 'Friesenplatz Area',
                    type: 'area',
                    coordinates: { lat: 50.9403, lng: 6.9391 },
                    description: 'Popular nightlife district'
                }
            ]
        };
    }

    /**
     * Load user privacy settings
     */
    loadUserSettings() {
        try {
            const stored = localStorage.getItem('gamescom_proximity_settings');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load proximity settings:', error);
        }
        
        // Default settings - privacy first
        return {
            enabled: false,
            privacyLevel: this.privacyLevels.OFF.id,
            timeLimit: this.timeLimits.FOUR_HOURS.id,
            allowNotifications: false,
            sharePersona: true, // Share professional persona type
            minimumAggregation: 3 // Minimum people to show location
        };
    }

    saveUserSettings() {
        localStorage.setItem('gamescom_proximity_settings', JSON.stringify(this.userSettings));
    }

    /**
     * Create proximity UI in navigation
     */
    createProximityUI() {
        // Add proximity toggle to nav
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;
        
        // Create proximity button
        const proximityBtn = document.createElement('button');
        proximityBtn.id = 'proximityToggle';
        proximityBtn.className = 'proximity-toggle';
        proximityBtn.innerHTML = `
            <span class="proximity-icon">${this.isSharing ? '📍' : '📍'}</span>
            <span class="proximity-status">${this.isSharing ? 'ON' : 'OFF'}</span>
        `;
        
        if (!this.isSharing) {
            proximityBtn.classList.add('disabled');
        }
        
        // Insert before invite button
        const inviteBtn = document.getElementById('navInviteBtn');
        if (inviteBtn) {
            navActions.insertBefore(proximityBtn, inviteBtn);
        } else {
            navActions.appendChild(proximityBtn);
        }
    }

    /**
     * Create settings modal
     */
    createSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'proximitySettingsModal';
        modal.className = 'proximity-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="proximity-modal-overlay">
                <div class="proximity-modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">📍 Location Sharing Settings</h2>
                        <button class="modal-close" id="closeProximitySettings">&times;</button>
                    </div>
                    
                    <div class="privacy-notice">
                        <div class="notice-icon">🔒</div>
                        <div class="notice-text">
                            <strong>Your Privacy is Protected</strong>
                            <p>We only show aggregated numbers, never individual locations. Minimum 3 people required to display any venue.</p>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3 class="section-title">Sharing Level</h3>
                        <div class="privacy-options">
                            ${Object.values(this.privacyLevels).map(level => `
                                <label class="privacy-option ${level.id === this.userSettings.privacyLevel ? 'selected' : ''}">
                                    <input type="radio" name="privacyLevel" value="${level.id}" 
                                           ${level.id === this.userSettings.privacyLevel ? 'checked' : ''}>
                                    <div class="option-content">
                                        <div class="option-title">${level.label}</div>
                                        <div class="option-description">${level.description}</div>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3 class="section-title">Time Limit</h3>
                        <div class="time-options">
                            ${Object.values(this.timeLimits).map(limit => `
                                <button class="time-option ${limit.id === this.userSettings.timeLimit ? 'selected' : ''}" 
                                        data-time="${limit.id}">
                                    ${limit.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3 class="section-title">Additional Options</h3>
                        <div class="toggle-options">
                            <label class="toggle-option">
                                <input type="checkbox" id="sharePersona" 
                                       ${this.userSettings.sharePersona ? 'checked' : ''}>
                                <span>Share my professional role (${this.getUserPersona()})</span>
                            </label>
                            <label class="toggle-option">
                                <input type="checkbox" id="allowNotifications" 
                                       ${this.userSettings.allowNotifications ? 'checked' : ''}>
                                <span>Notify me of nearby networking opportunities</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="current-venue-section" id="currentVenueDisplay" style="display: none;">
                        <h3 class="section-title">Currently At</h3>
                        <div class="current-venue-info">
                            <span class="venue-name" id="currentVenueName">-</span>
                            <button class="change-venue-btn" id="changeVenueBtn">Change</button>
                        </div>
                    </div>
                    
                    <div class="settings-actions">
                        <button class="btn btn-secondary" id="cancelProximitySettings">Cancel</button>
                        <button class="btn btn-primary" id="saveProximitySettings">Save Settings</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Create hotspots view
     */
    createHotspotsView() {
        const container = document.createElement('div');
        container.id = 'hotspotsContainer';
        container.className = 'hotspots-container';
        container.style.display = 'none';
        container.innerHTML = `
            <div class="hotspots-header">
                <h2 class="hotspots-title">🔥 Professional Hotspots</h2>
                <button class="hotspots-close" id="closeHotspots">&times;</button>
            </div>
            
            <div class="hotspots-time">
                <span class="time-label">Last updated:</span>
                <span class="time-value" id="hotspotsUpdateTime">Just now</span>
                <button class="refresh-btn" id="refreshHotspots">🔄</button>
            </div>
            
            <div class="hotspots-filter">
                <button class="filter-chip active" data-filter="all">All</button>
                <button class="filter-chip" data-filter="hotels">Hotels</button>
                <button class="filter-chip" data-filter="conference">Conference</button>
                <button class="filter-chip" data-filter="networking">Networking</button>
            </div>
            
            <div class="hotspots-list" id="hotspotsList">
                <!-- Dynamically populated -->
            </div>
            
            <div class="hotspots-map-toggle">
                <button class="btn btn-secondary" id="toggleHotspotsMap">
                    🗺️ View on Map
                </button>
            </div>
        `;
        
        document.body.appendChild(container);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Proximity toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('#proximityToggle')) {
                this.handleProximityToggle();
            }
        });
        
        // Settings modal
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeProximitySettings' || 
                e.target.id === 'cancelProximitySettings') {
                this.hideSettingsModal();
            }
            
            if (e.target.id === 'saveProximitySettings') {
                this.saveSettings();
            }
        });
        
        // Privacy level selection
        document.addEventListener('change', (e) => {
            if (e.target.name === 'privacyLevel') {
                this.updatePrivacyLevel(e.target.value);
            }
        });
        
        // Time limit selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('time-option')) {
                this.updateTimeLimit(e.target.dataset.time);
            }
        });
        
        // Hotspots view
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeHotspots') {
                this.hideHotspotsView();
            }
            
            if (e.target.id === 'refreshHotspots') {
                this.refreshHotspots();
            }
        });
        
        // Filter chips
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-chip')) {
                this.filterHotspots(e.target.dataset.filter);
            }
        });
        
        // Change venue
        document.addEventListener('click', (e) => {
            if (e.target.id === 'changeVenueBtn') {
                this.showVenueSelector();
            }
        });
    }

    /**
     * Handle proximity toggle
     */
    handleProximityToggle() {
        if (!this.isSharing) {
            // Show settings modal for first-time setup
            this.showSettingsModal();
        } else {
            // Quick toggle off
            this.stopSharing();
        }
    }

    /**
     * Show settings modal
     */
    showSettingsModal() {
        const modal = document.getElementById('proximitySettingsModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Update current venue display if sharing
            if (this.isSharing && this.currentVenue) {
                const venueDisplay = document.getElementById('currentVenueDisplay');
                const venueName = document.getElementById('currentVenueName');
                if (venueDisplay && venueName) {
                    venueDisplay.style.display = 'block';
                    venueName.textContent = this.getVenueName(this.currentVenue);
                }
            }
        }
    }

    hideSettingsModal() {
        const modal = document.getElementById('proximitySettingsModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * Save settings from modal
     */
    saveSettings() {
        // Get selected privacy level
        const privacyInput = document.querySelector('input[name="privacyLevel"]:checked');
        if (privacyInput) {
            this.userSettings.privacyLevel = privacyInput.value;
        }
        
        // Get selected time limit
        const selectedTime = document.querySelector('.time-option.selected');
        if (selectedTime) {
            this.userSettings.timeLimit = selectedTime.dataset.time;
        }
        
        // Get checkbox options
        this.userSettings.sharePersona = document.getElementById('sharePersona')?.checked || false;
        this.userSettings.allowNotifications = document.getElementById('allowNotifications')?.checked || false;
        
        // Enable if privacy level is not OFF
        this.userSettings.enabled = this.userSettings.privacyLevel !== 'off';
        
        // Save and apply
        this.saveUserSettings();
        this.applyUserSettings();
        
        // Start or stop sharing based on settings
        if (this.userSettings.enabled) {
            this.startSharing();
        } else {
            this.stopSharing();
        }
        
        this.hideSettingsModal();
        
        // Show confirmation
        this.showToast('✅ Location settings updated', 'success');
    }

    /**
     * Apply user settings
     */
    applyUserSettings() {
        // Update UI based on settings
        const toggle = document.getElementById('proximityToggle');
        if (toggle) {
            const icon = toggle.querySelector('.proximity-icon');
            const status = toggle.querySelector('.proximity-status');
            
            if (this.userSettings.enabled) {
                toggle.classList.remove('disabled');
                status.textContent = 'ON';
            } else {
                toggle.classList.add('disabled');
                status.textContent = 'OFF';
            }
        }
    }

    /**
     * Start location sharing
     */
    async startSharing() {
        this.isSharing = true;
        
        // Set expiry based on time limit
        const limit = this.timeLimits[this.userSettings.timeLimit];
        if (limit && limit.minutes) {
            this.sharingExpiry = Date.now() + (limit.minutes * 60000);
        } else {
            // Conference duration - set to end of Gamescom
            this.sharingExpiry = new Date('2025-08-24T23:59:59').getTime();
        }
        
        // Detect current venue (mock for now)
        this.detectCurrentVenue();
        
        // Update UI
        this.updateProximityUI(true);
        
        // Start sending updates
        this.sendLocationUpdate();
        
        console.log('📍 Location sharing started');
    }

    /**
     * Stop location sharing
     */
    stopSharing() {
        this.isSharing = false;
        this.currentVenue = null;
        this.sharingExpiry = null;
        
        // Update UI
        this.updateProximityUI(false);
        
        // Clear from backend (when implemented)
        this.clearLocationUpdate();
        
        console.log('📍 Location sharing stopped');
    }

    /**
     * Detect current venue (simplified - would use real geolocation in production)
     */
    detectCurrentVenue() {
        // For demo, randomly select a venue
        const allVenues = [
            ...this.venueData.hotels,
            ...this.venueData.conference,
            ...this.venueData.networking
        ];
        
        // In production, this would use actual geolocation
        this.currentVenue = allVenues[Math.floor(Math.random() * allVenues.length)].id;
    }

    /**
     * Show venue selector
     */
    showVenueSelector() {
        const selector = document.createElement('div');
        selector.className = 'venue-selector-modal';
        selector.innerHTML = `
            <div class="venue-selector-overlay">
                <div class="venue-selector-content">
                    <h3>Select Your Current Venue</h3>
                    <div class="venue-categories">
                        <div class="venue-category">
                            <h4>Conference Venues</h4>
                            ${this.venueData.conference.map(v => `
                                <button class="venue-option" data-venue="${v.id}">${v.name}</button>
                            `).join('')}
                        </div>
                        <div class="venue-category">
                            <h4>Hotels</h4>
                            ${this.venueData.hotels.map(v => `
                                <button class="venue-option" data-venue="${v.id}">${v.name}</button>
                            `).join('')}
                        </div>
                        <div class="venue-category">
                            <h4>Networking Spots</h4>
                            ${this.venueData.networking.map(v => `
                                <button class="venue-option" data-venue="${v.id}">${v.name}</button>
                            `).join('')}
                        </div>
                    </div>
                    <button class="btn btn-secondary close-selector">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(selector);
        
        // Add event listeners
        selector.addEventListener('click', (e) => {
            if (e.target.classList.contains('venue-option')) {
                this.currentVenue = e.target.dataset.venue;
                this.sendLocationUpdate();
                selector.remove();
                this.showToast(`📍 Location updated to ${e.target.textContent}`, 'success');
            }
            
            if (e.target.classList.contains('close-selector') || 
                e.target.classList.contains('venue-selector-overlay')) {
                selector.remove();
            }
        });
    }

    /**
     * Get aggregated hotspot data
     */
    async getHotspots(filter = 'all') {
        // Check cache first
        const cacheKey = `hotspots_${filter}`;
        const cached = this.hotspotsCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.data;
        }
        
        // Generate mock data for demo
        const hotspots = this.generateMockHotspots(filter);
        
        // Cache the result
        this.hotspotsCache.set(cacheKey, {
            data: hotspots,
            timestamp: Date.now()
        });
        
        return hotspots;
    }

    /**
     * Generate mock hotspot data
     */
    generateMockHotspots(filter) {
        const hotspots = [];
        const personas = ['developer', 'publishing', 'investor', 'service'];
        
        // Add hotels
        if (filter === 'all' || filter === 'hotels') {
            this.venueData.hotels.forEach(hotel => {
                const count = Math.floor(Math.random() * 20) + 3; // 3-22 people
                if (count >= this.userSettings.minimumAggregation) {
                    const breakdown = this.generatePersonaBreakdown(count, personas);
                    hotspots.push({
                        venue: hotel,
                        totalCount: count,
                        breakdown,
                        trending: Math.random() > 0.7,
                        peak: Math.random() > 0.5
                    });
                }
            });
        }
        
        // Add conference venues
        if (filter === 'all' || filter === 'conference') {
            this.venueData.conference.forEach(venue => {
                const count = Math.floor(Math.random() * 50) + 10; // 10-59 people
                const breakdown = this.generatePersonaBreakdown(count, personas);
                hotspots.push({
                    venue,
                    totalCount: count,
                    breakdown,
                    trending: Math.random() > 0.6,
                    peak: true
                });
            });
        }
        
        // Sort by count
        return hotspots.sort((a, b) => b.totalCount - a.totalCount);
    }

    /**
     * Generate persona breakdown for a venue
     */
    generatePersonaBreakdown(total, personas) {
        const breakdown = {};
        let remaining = total;
        
        // Distribute among personas
        personas.forEach((persona, index) => {
            if (index === personas.length - 1) {
                breakdown[persona] = remaining;
            } else {
                const count = Math.floor(Math.random() * remaining * 0.5);
                breakdown[persona] = count;
                remaining -= count;
            }
        });
        
        return breakdown;
    }

    /**
     * Show hotspots view
     */
    async showHotspotsView() {
        const container = document.getElementById('hotspotsContainer');
        if (!container) return;
        
        container.style.display = 'block';
        await this.refreshHotspots();
    }

    hideHotspotsView() {
        const container = document.getElementById('hotspotsContainer');
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * Refresh hotspots display
     */
    async refreshHotspots(filter = 'all') {
        const hotspots = await this.getHotspots(filter);
        const list = document.getElementById('hotspotsList');
        
        if (!list) return;
        
        if (hotspots.length === 0) {
            list.innerHTML = `
                <div class="empty-hotspots">
                    <span class="empty-icon">🌙</span>
                    <p>No active hotspots right now</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = hotspots.map(hotspot => `
            <div class="hotspot-item ${hotspot.trending ? 'trending' : ''}">
                <div class="hotspot-header">
                    <div class="hotspot-venue">
                        <span class="venue-name">${hotspot.venue.name}</span>
                        ${hotspot.trending ? '<span class="trending-badge">🔥 Trending</span>' : ''}
                        ${hotspot.peak ? '<span class="peak-badge">⚡ Peak Time</span>' : ''}
                    </div>
                    <div class="hotspot-count">
                        <span class="count-number">${hotspot.totalCount}</span>
                        <span class="count-label">professionals</span>
                    </div>
                </div>
                
                ${this.userSettings.sharePersona && hotspot.breakdown ? `
                    <div class="persona-breakdown">
                        ${Object.entries(hotspot.breakdown)
                            .filter(([_, count]) => count > 0)
                            .map(([persona, count]) => `
                                <span class="persona-chip">
                                    ${this.getPersonaIcon(persona)} ${count} ${this.getPersonaLabel(persona)}
                                </span>
                            `).join('')}
                    </div>
                ` : ''}
                
                ${hotspot.venue.areas ? `
                    <div class="venue-areas">
                        <span class="areas-label">Active areas:</span>
                        ${hotspot.venue.areas.slice(0, 3).map(area => `
                            <span class="area-chip">${area}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        // Update timestamp
        document.getElementById('hotspotsUpdateTime').textContent = 'Just now';
    }

    /**
     * Filter hotspots
     */
    filterHotspots(filter) {
        // Update active filter chip
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.filter === filter);
        });
        
        // Refresh with filter
        this.refreshHotspots(filter);
    }

    /**
     * Update proximity UI
     */
    updateProximityUI(isSharing) {
        const toggle = document.getElementById('proximityToggle');
        if (!toggle) return;
        
        const status = toggle.querySelector('.proximity-status');
        if (isSharing) {
            toggle.classList.remove('disabled');
            toggle.classList.add('active');
            status.textContent = 'ON';
        } else {
            toggle.classList.add('disabled');
            toggle.classList.remove('active');
            status.textContent = 'OFF';
        }
    }

    /**
     * Send location update to backend
     */
    async sendLocationUpdate() {
        if (!this.isSharing || !this.currentVenue) return;
        
        // Check if sharing has expired
        if (this.sharingExpiry && Date.now() > this.sharingExpiry) {
            this.stopSharing();
            this.showToast('⏰ Location sharing expired', 'info');
            return;
        }
        
        const update = {
            userId: this.getUserId(),
            venue: this.currentVenue,
            privacyLevel: this.userSettings.privacyLevel,
            persona: this.userSettings.sharePersona ? this.getUserPersona() : null,
            timestamp: Date.now()
        };
        
        // TODO: Send to Firebase when backend is ready
        console.log('📍 Location update:', update);
        
        this.lastUpdate = Date.now();
    }

    /**
     * Clear location from backend
     */
    async clearLocationUpdate() {
        const clear = {
            userId: this.getUserId(),
            timestamp: Date.now()
        };
        
        // TODO: Clear from Firebase when backend is ready
        console.log('📍 Location cleared:', clear);
    }

    /**
     * Start periodic updates
     */
    startUpdateInterval() {
        // Update location every 5 minutes if sharing
        setInterval(() => {
            if (this.isSharing) {
                this.sendLocationUpdate();
            }
        }, 300000); // 5 minutes
        
        // Refresh hotspots every minute if view is open
        setInterval(() => {
            const container = document.getElementById('hotspotsContainer');
            if (container && container.style.display !== 'none') {
                this.refreshHotspots();
            }
        }, 60000); // 1 minute
    }

    /**
     * Update privacy level
     */
    updatePrivacyLevel(level) {
        document.querySelectorAll('.privacy-option').forEach(option => {
            option.classList.toggle('selected', 
                option.querySelector('input').value === level);
        });
    }

    /**
     * Update time limit
     */
    updateTimeLimit(timeId) {
        document.querySelectorAll('.time-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.time === timeId);
        });
    }

    /**
     * Utility methods
     */
    getUserId() {
        return localStorage.getItem('gamescom_user_id') || 'anonymous';
    }

    getUserPersona() {
        return localStorage.getItem('gamescom_user_persona') || 'professional';
    }

    getVenueName(venueId) {
        // Search all venue categories
        const allVenues = [
            ...this.venueData.hotels,
            ...this.venueData.conference,
            ...this.venueData.networking,
            ...this.venueData.restaurants
        ];
        
        const venue = allVenues.find(v => v.id === venueId);
        return venue ? venue.name : 'Unknown Venue';
    }

    getPersonaIcon(persona) {
        const icons = {
            developer: '👨‍💻',
            publishing: '📢',
            investor: '💼',
            service: '🛠️'
        };
        return icons[persona] || '👤';
    }

    getPersonaLabel(persona) {
        const labels = {
            developer: 'developers',
            publishing: 'publishers',
            investor: 'investors',
            service: 'service providers'
        };
        return labels[persona] || 'professionals';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `proximity-toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Check for nearby opportunities
     */
    async checkNearbyOpportunities() {
        if (!this.userSettings.allowNotifications || !this.currentVenue) return;
        
        const hotspots = await this.getHotspots();
        const currentHotspot = hotspots.find(h => h.venue.id === this.currentVenue);
        
        if (currentHotspot && currentHotspot.trending) {
            this.showNotification(
                '🔥 Trending Location',
                `${currentHotspot.totalCount} professionals are networking at your venue!`
            );
        }
    }

    showNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '🎮',
                badge: '📍'
            });
        } else {
            this.showToast(`${title}: ${message}`, 'info');
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.proximityManager = new ProximityManager();
    
    // Add hotspots button to navigation or quick actions
    const quickActions = document.querySelector('.quick-actions');
    if (quickActions) {
        const hotspotsBtn = document.createElement('button');
        hotspotsBtn.className = 'quick-action-btn';
        hotspotsBtn.title = 'Professional Hotspots';
        hotspotsBtn.innerHTML = '🔥';
        hotspotsBtn.onclick = () => window.proximityManager.showHotspotsView();
        quickActions.appendChild(hotspotsBtn);
    }
});

// Export for external use
window.ProximityManager = ProximityManager;