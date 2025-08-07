/**
 * 🧭 NAVIGATION STRUCTURE & WORKING DARK MODE
 * Professional navigation with functional theme switching
 * Fixes routing and persistent dark mode
 */

class NavigationManager {
    constructor() {
        this.currentPage = 'events';
        this.theme = this.getStoredTheme();
        this.isMobileMenuOpen = false;
        this.pages = {
            'events': {
                title: 'Events',
                icon: '🎮',
                description: 'Discover gaming industry events'
            },
            'map': {
                title: 'Map',
                icon: '🗺️',
                description: 'Find events near you'
            },
            'calendar': {
                title: 'Calendar',
                icon: '📅',
                description: 'Your personal event calendar'
            },
            'referral': {
                title: 'Invite',
                icon: '🎉',
                description: 'Share and earn rewards'
            },
            'analytics': {
                title: 'Analytics',
                icon: '📊',
                description: 'Track your referral performance'
            }
        };
        
        this.init();
    }

    async init() {
        try {
            this.applyTheme();
            this.createNavigation();
            this.setupEventListeners();
            this.handleInitialRoute();
            console.log('✅ Navigation Manager initialized');
        } catch (error) {
            console.error('❌ Navigation initialization failed:', error);
        }
    }

    /**
     * Create the navigation structure
     */
    createNavigation() {
        // Remove existing navigation if present
        const existingNav = document.querySelector('.navigation-system');
        if (existingNav) {
            existingNav.remove();
        }

        const nav = document.createElement('nav');
        nav.className = 'navigation-system nav';
        nav.innerHTML = `
            <div class="nav-container">
                <div class="nav-brand">
                    <a href="/" class="brand-link">
                        <span class="brand-icon">🎮</span>
                        <div class="brand-text">
                            <span class="brand-name">Gamescom 2025</span>
                            <span class="brand-subtitle">Party Discovery</span>
                        </div>
                    </a>
                </div>

                <div class="nav-center">
                    <div class="nav-links" id="navLinks">
                        ${Object.entries(this.pages).map(([key, page]) => `
                            <a href="#${key}" class="nav-link ${key === this.currentPage ? 'active' : ''}" data-page="${key}">
                                <span class="nav-icon">${page.icon}</span>
                                <span class="nav-text">${page.title}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>

                <div class="nav-actions">
                    <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
                        <span class="theme-icon">${this.theme === 'dark' ? '☀️' : '🌙'}</span>
                        <span class="theme-text">${this.theme === 'dark' ? 'Light' : 'Dark'}</span>
                    </button>
                    
                    <button class="nav-toggle" id="navToggle" aria-label="Toggle menu">
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    </button>
                </div>
            </div>

            <!-- Mobile menu overlay -->
            <div class="mobile-menu-overlay" id="mobileMenuOverlay"></div>
        `;

        // Insert at the beginning of body
        document.body.insertBefore(nav, document.body.firstChild);

        // Ensure main content has proper top spacing
        this.adjustMainContentSpacing();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Theme toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('#themeToggle')) {
                this.toggleTheme();
            }
        });

        // Mobile menu toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('#navToggle')) {
                this.toggleMobileMenu();
            }
            
            // Close mobile menu when clicking overlay
            if (e.target.closest('#mobileMenuOverlay')) {
                this.closeMobileMenu();
            }
        });

        // Navigation links
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const page = navLink.dataset.page;
                this.navigateToPage(page);
                this.closeMobileMenu();
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || this.getPageFromHash();
            this.navigateToPage(page, false);
        });

        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const page = this.getPageFromHash();
            this.navigateToPage(page, false);
        });

        // Close mobile menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });

        // Close mobile menu on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    /**
     * Theme management
     */
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.updateThemeButton();
        this.storeTheme();
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.theme }
        }));
        
        console.log(`🎨 Theme switched to ${this.theme} mode`);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Update meta theme-color for mobile browsers
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', this.theme === 'dark' ? '#0f172a' : '#7c3aed');
        }
    }

    updateThemeButton() {
        const themeButton = document.getElementById('themeToggle');
        if (themeButton) {
            const icon = themeButton.querySelector('.theme-icon');
            const text = themeButton.querySelector('.theme-text');
            
            if (icon) icon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
            if (text) text.textContent = this.theme === 'dark' ? 'Light' : 'Dark';
        }
    }

    getStoredTheme() {
        try {
            const stored = localStorage.getItem('gamescom_theme');
            if (stored && ['light', 'dark'].includes(stored)) {
                return stored;
            }
        } catch (error) {
            console.warn('Failed to get stored theme:', error);
        }

        // Default to system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    storeTheme() {
        try {
            localStorage.setItem('gamescom_theme', this.theme);
        } catch (error) {
            console.warn('Failed to store theme:', error);
        }
    }

    /**
     * Mobile menu management
     */
    toggleMobileMenu() {
        if (this.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        const navLinks = document.getElementById('navLinks');
        const overlay = document.getElementById('mobileMenuOverlay');
        const toggle = document.getElementById('navToggle');

        if (navLinks) navLinks.classList.add('active');
        if (overlay) overlay.classList.add('active');
        if (toggle) toggle.classList.add('active');

        document.body.style.overflow = 'hidden';
        this.isMobileMenuOpen = true;
    }

    closeMobileMenu() {
        const navLinks = document.getElementById('navLinks');
        const overlay = document.getElementById('mobileMenuOverlay');
        const toggle = document.getElementById('navToggle');

        if (navLinks) navLinks.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (toggle) toggle.classList.remove('active');

        document.body.style.overflow = '';
        this.isMobileMenuOpen = false;
    }

    /**
     * Page navigation
     */
    navigateToPage(page, updateHistory = true) {
        if (!page || !this.pages[page]) {
            page = 'events'; // Default fallback
        }

        // Update current page
        this.currentPage = page;

        // Update active nav link
        this.updateActiveNavLink();

        // Update page content
        this.loadPageContent(page);

        // Update URL and history
        if (updateHistory) {
            const url = page === 'events' ? '/' : `/#${page}`;
            window.history.pushState({ page }, this.pages[page].title, url);
        }

        // Update document title
        document.title = `${this.pages[page].title} - Gamescom 2025 Party Discovery`;

        console.log(`📍 Navigated to ${page} page`);
    }

    updateActiveNavLink() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const isActive = link.dataset.page === this.currentPage;
            link.classList.toggle('active', isActive);
        });
    }

    async loadPageContent(page) {
        const mainContent = document.querySelector('.main-content') || document.querySelector('main');
        if (!mainContent) {
            console.error('Main content container not found');
            return;
        }

        // Show loading state
        mainContent.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <span>Loading ${this.pages[page]?.title || 'page'}...</span>
            </div>
        `;

        try {
            switch (page) {
                case 'events':
                    await this.loadEventsPage(mainContent);
                    break;
                case 'map':
                    await this.loadMapPage(mainContent);
                    break;
                case 'calendar':
                    await this.loadCalendarPage(mainContent);
                    break;
                case 'referral':
                    await this.loadReferralPage(mainContent);
                    break;
                case 'analytics':
                    await this.loadAnalyticsPage(mainContent);
                    break;
                default:
                    await this.loadEventsPage(mainContent);
            }
        } catch (error) {
            console.error(`Failed to load ${page} page:`, error);
            this.loadErrorPage(mainContent, page);
        }
    }

    async loadEventsPage(container) {
        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">🎮 Gamescom 2025 Events</h1>
                <p class="page-description">Discover the best gaming industry networking events and parties</p>
            </div>

            <!-- Search & Filters -->
            <div class="search-section card">
                <div class="card-body">
                    <div class="search-container">
                        <div class="form-group">
                            <div class="search-input-wrapper">
                                <input type="text" id="searchInput" class="form-input" placeholder="Search events, venues, hosts...">
                                <button id="clearSearch" class="btn btn-ghost btn-sm hidden">✕</button>
                            </div>
                        </div>
                        
                        <div class="filters-container">
                            <div class="filter-chips" id="categoryFilters">
                                <button class="btn btn-ghost btn-sm filter-chip active" data-category="all">All Events</button>
                                <button class="btn btn-ghost btn-sm filter-chip" data-category="networking">🤝 Networking</button>
                                <button class="btn btn-ghost btn-sm filter-chip" data-category="afterparty">🎉 Afterparty</button>
                                <button class="btn btn-ghost btn-sm filter-chip" data-category="mixer">🍸 Mixer</button>
                                <button class="btn btn-ghost btn-sm filter-chip" data-category="launch">🚀 Launch</button>
                            </div>
                        </div>
                        
                        <div class="search-stats">
                            <span id="searchResultsCount" class="text-muted">Loading events...</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Events Grid -->
            <div id="eventsContainer" class="events-container">
                <div class="loading">
                    <div class="spinner"></div>
                    <span>Loading amazing events...</span>
                </div>
            </div>

            <!-- Create Event Button -->
            <div class="floating-actions">
                <button id="createEventBtn" class="btn btn-primary btn-lg">
                    ✨ Host Your Event
                </button>
            </div>
        `;

        // Initialize search manager if available
        if (window.searchManager && window.searchManager.setupSearchUI) {
            setTimeout(() => window.searchManager.setupSearchUI(), 100);
        }
    }

    async loadMapPage(container) {
        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">🗺️ Event Map</h1>
                <p class="page-description">Find events near you in Cologne</p>
            </div>

            <div class="map-container card">
                <div class="card-body">
                    <div class="map-placeholder">
                        <div class="map-loading">
                            <div class="spinner"></div>
                            <span>Loading interactive map...</span>
                        </div>
                        <div id="eventMap" style="min-height: 400px; background: var(--surface); border-radius: var(--radius-md);"></div>
                    </div>
                </div>
            </div>

            <div class="map-legend card">
                <div class="card-body">
                    <h3 class="mb-md">Legend</h3>
                    <div class="legend-items flex gap-lg">
                        <div class="legend-item flex items-center gap-sm">
                            <span class="legend-marker" style="background: var(--primary);">🎮</span>
                            <span>Official Events</span>
                        </div>
                        <div class="legend-item flex items-center gap-sm">
                            <span class="legend-marker" style="background: var(--success);">👥</span>
                            <span>Community Events</span>
                        </div>
                        <div class="legend-item flex items-center gap-sm">
                            <span class="legend-marker" style="background: var(--warning);">📍</span>
                            <span>Venues</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize map if maps functionality is available
        if (window.mapsManager) {
            setTimeout(() => window.mapsManager.initializeMap('eventMap'), 100);
        }
    }

    async loadCalendarPage(container) {
        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">📅 My Calendar</h1>
                <p class="page-description">Manage your Gamescom schedule</p>
            </div>

            <div class="calendar-actions mb-lg">
                <div class="flex gap-md">
                    <button class="btn btn-primary" id="exportCalendar">
                        📥 Export All Events
                    </button>
                    <button class="btn btn-outline" id="syncGoogleCalendar">
                        🔄 Sync with Google Calendar
                    </button>
                </div>
            </div>

            <div class="calendar-container card">
                <div class="card-body">
                    <div class="calendar-placeholder">
                        <div class="text-center p-xl">
                            <div class="calendar-icon mb-md" style="font-size: 4rem;">📅</div>
                            <h3 class="mb-sm">Calendar View Coming Soon</h3>
                            <p class="text-muted mb-lg">Your personal event calendar will be displayed here</p>
                            <button class="btn btn-primary" onclick="window.navigationManager.navigateToPage('events')">
                                Browse Events
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="saved-events card">
                <div class="card-header">
                    <h3>Saved Events</h3>
                </div>
                <div class="card-body">
                    <div id="savedEventsList" class="saved-events-list">
                        <div class="text-center text-muted">
                            No saved events yet. Start exploring to save events!
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load saved events if available
        this.loadSavedEvents();
    }

    async loadReferralPage(container) {
        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">🎉 Invite & Earn</h1>
                <p class="page-description">Share events and build your professional network</p>
            </div>

            <div class="referral-stats-grid grid grid-auto-sm mb-lg">
                <div class="stat-card card">
                    <div class="card-body text-center">
                        <div class="stat-value text-primary mb-sm" id="totalShares">0</div>
                        <div class="stat-label text-muted">Events Shared</div>
                    </div>
                </div>
                <div class="stat-card card">
                    <div class="card-body text-center">
                        <div class="stat-value text-success mb-sm" id="totalClicks">0</div>
                        <div class="stat-label text-muted">Link Clicks</div>
                    </div>
                </div>
                <div class="stat-card card">
                    <div class="card-body text-center">
                        <div class="stat-value text-warning mb-sm" id="conversionRate">0%</div>
                        <div class="stat-label text-muted">Conversion Rate</div>
                    </div>
                </div>
            </div>

            <div class="referral-actions card mb-lg">
                <div class="card-header">
                    <h3>Quick Actions</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2 gap-md">
                        <button class="btn btn-primary" onclick="window.navigationManager.navigateToPage('events')">
                            📤 Share Events
                        </button>
                        <button class="btn btn-outline" onclick="window.navigationManager.navigateToPage('analytics')">
                            📊 View Analytics
                        </button>
                    </div>
                </div>
            </div>

            <div class="viral-info card">
                <div class="card-body">
                    <div class="flex items-center gap-md mb-md">
                        <span style="font-size: 2rem;">🎯</span>
                        <div>
                            <h4 class="mb-0">Professional Network Growth</h4>
                            <p class="text-muted mb-0">Every share helps grow the gaming community at Gamescom 2025</p>
                        </div>
                    </div>
                    <div class="viral-benefits">
                        <h5 class="mb-sm">Benefits of Sharing:</h5>
                        <ul class="text-sm text-muted">
                            <li>📈 Track your influence in the gaming industry</li>
                            <li>🤝 Connect more professionals to valuable events</li>
                            <li>🎮 Build your reputation as a gaming industry connector</li>
                            <li>📊 Gain insights into community engagement</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Load referral stats if available
        this.loadReferralStats();
    }

    async loadAnalyticsPage(container) {
        // Check if user has referral data
        const hasReferralData = await this.checkReferralData();
        
        if (!hasReferralData) {
            container.innerHTML = `
                <div class="page-header">
                    <h1 class="page-title">📊 Analytics Dashboard</h1>
                    <p class="page-description">Track your sharing performance and network growth</p>
                </div>

                <div class="analytics-empty card">
                    <div class="card-body text-center">
                        <div class="empty-icon mb-lg" style="font-size: 4rem;">📈</div>
                        <h3 class="mb-md">Start Sharing to See Analytics</h3>
                        <p class="text-muted mb-lg">Your sharing metrics and referral analytics will appear here once you start sharing events.</p>
                        <button class="btn btn-primary" onclick="window.navigationManager.navigateToPage('events')">
                            📤 Share Your First Event
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Load the referral dashboard
        try {
            const response = await fetch('/referral-dashboard.html');
            if (response.ok) {
                const dashboardHTML = await response.text();
                container.innerHTML = dashboardHTML;
                
                // Initialize referral dashboard if available
                if (window.ReferralDashboard) {
                    new window.ReferralDashboard();
                }
            } else {
                throw new Error('Dashboard not found');
            }
        } catch (error) {
            console.error('Failed to load analytics dashboard:', error);
            container.innerHTML = `
                <div class="analytics-error card">
                    <div class="card-body text-center">
                        <div class="error-icon mb-lg" style="font-size: 4rem;">⚠️</div>
                        <h3 class="mb-md">Analytics Dashboard Unavailable</h3>
                        <p class="text-muted mb-lg">Unable to load the analytics dashboard at this time.</p>
                        <button class="btn btn-primary" onclick="location.reload()">🔄 Retry</button>
                    </div>
                </div>
            `;
        }
    }

    loadErrorPage(container, page) {
        container.innerHTML = `
            <div class="error-page card">
                <div class="card-body text-center">
                    <div class="error-icon mb-lg" style="font-size: 4rem;">⚠️</div>
                    <h2 class="mb-md">Failed to Load ${this.pages[page]?.title || 'Page'}</h2>
                    <p class="text-muted mb-lg">We encountered an error while loading this page. Please try again.</p>
                    <div class="flex gap-md justify-center">
                        <button class="btn btn-primary" onclick="location.reload()">🔄 Retry</button>
                        <button class="btn btn-outline" onclick="window.navigationManager.navigateToPage('events')">🏠 Go Home</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Utility methods
     */
    handleInitialRoute() {
        const page = this.getPageFromHash() || this.getPageFromQueryParams();
        this.navigateToPage(page, false);
    }

    getPageFromHash() {
        const hash = window.location.hash.substring(1);
        return this.pages[hash] ? hash : null;
    }

    getPageFromQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const page = params.get('page');
        return this.pages[page] ? page : null;
    }

    adjustMainContentSpacing() {
        const mainContent = document.querySelector('.main-content') || document.querySelector('main');
        if (mainContent) {
            mainContent.style.paddingTop = 'var(--space-lg)';
        }
    }

    async checkReferralData() {
        try {
            const userId = this.getUserId();
            const response = await fetch(`/api/referral/stats/${userId}`);
            const data = await response.json();
            return data.success && data.stats.totalShares > 0;
        } catch (error) {
            return false;
        }
    }

    async loadReferralStats() {
        try {
            const userId = this.getUserId();
            const response = await fetch(`/api/referral/stats/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('totalShares').textContent = data.stats.totalShares;
                document.getElementById('totalClicks').textContent = data.stats.clicks;
                document.getElementById('conversionRate').textContent = data.stats.conversionRate;
            }
        } catch (error) {
            console.error('Failed to load referral stats:', error);
        }
    }

    loadSavedEvents() {
        try {
            const saved = JSON.parse(localStorage.getItem('gamescom_saved_events') || '[]');
            const container = document.getElementById('savedEventsList');
            
            if (saved.length === 0 || !container) {
                return;
            }

            container.innerHTML = saved.map(event => `
                <div class="saved-event-item flex justify-between items-center p-md border-bottom">
                    <div>
                        <h5 class="mb-0">${event.name}</h5>
                        <p class="text-muted text-sm mb-0">${event.date} at ${event.venue}</p>
                    </div>
                    <button class="btn btn-sm btn-outline" onclick="window.navigationManager.removeSavedEvent('${event.id}')">
                        Remove
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load saved events:', error);
        }
    }

    removeSavedEvent(eventId) {
        try {
            let saved = JSON.parse(localStorage.getItem('gamescom_saved_events') || '[]');
            saved = saved.filter(event => event.id !== eventId);
            localStorage.setItem('gamescom_saved_events', JSON.stringify(saved));
            this.loadSavedEvents();
        } catch (error) {
            console.error('Failed to remove saved event:', error);
        }
    }

    getUserId() {
        let userId = localStorage.getItem('gamescom_user_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('gamescom_user_id', userId);
        }
        return userId;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});

// Expose globally
window.NavigationManager = NavigationManager;