// Updated PWA App.js - Uses Consolidated API with Performance Optimizations

// Configuration
const CONFIG = {
    API_BASE_URL: 'https://api-x2u6rwndvq-uc.a.run.app', // New consolidated endpoint
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    PAGE_SIZE: 20,
    PERFORMANCE_MONITORING: true
};

// Performance monitoring
const performance = {
    marks: new Map(),
    
    mark(name) {
        if (CONFIG.PERFORMANCE_MONITORING) {
            this.marks.set(name, Date.now());
        }
    },
    
    measure(name, startMark) {
        if (CONFIG.PERFORMANCE_MONITORING && this.marks.has(startMark)) {
            const duration = Date.now() - this.marks.get(startMark);
            console.log(`⚡ ${name}: ${duration}ms`);
            return duration;
        }
        return 0;
    }
};

// Enhanced App state with caching
let appState = {
    currentView: 'swipe',
    currentMode: 'card',
    currentCardIndex: 0,
    parties: [],
    interestedParties: JSON.parse(localStorage.getItem('interestedParties') || '[]'),
    isLoading: false,
    error: null,
    cache: new Map(),
    lastDataFetch: 0,
    totalParties: 0,
    currentPage: 1
};

// DOM elements
const elements = {
    navItems: document.querySelectorAll('.nav-item'),
    viewControls: document.querySelectorAll('.view-btn'),
    mainTitle: document.getElementById('mainTitle'),
    eventCount: document.getElementById('eventCount'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    swipeView: document.getElementById('swipeView'),
    cardView: document.getElementById('cardView'),
    mapView: document.getElementById('mapView'),
    calendarView: document.getElementById('calendarView'),
    swipeCards: document.getElementById('swipeCards'),
    partyList: document.getElementById('partyList'),
    calendarContent: document.getElementById('calendarContent'),
    todayPreview: document.getElementById('todayPreview'),
    hamburgerBtn: document.getElementById('hamburgerBtn'),
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('overlay')
};

class ConferenceApp {
    constructor() {
        this.init();
    }

    async init() {
        performance.mark('app-init-start');
        
        this.setupNavigation();
        this.setupViewControls();
        this.setupMobileMenu();
        this.setupErrorRecovery();
        
        await this.loadParties();
        
        performance.measure('App initialization', 'app-init-start');
    }

    setupErrorRecovery() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showError('Something went wrong. Please try again.');
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });
    }

    setupMobileMenu() {
        elements.hamburgerBtn?.addEventListener('click', () => {
            elements.sidebar.classList.add('open');
            elements.overlay.classList.add('show');
        });

        elements.overlay?.addEventListener('click', () => {
            elements.sidebar.classList.remove('open');
            elements.overlay.classList.remove('show');
        });
    }

    setupNavigation() {
        elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                // Close mobile menu
                elements.sidebar.classList.remove('open');
                elements.overlay.classList.remove('show');
                
                // Update active nav item
                elements.navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Switch view
                const view = item.dataset.view;
                this.switchView(view);
            });
        });
    }

    setupViewControls() {
        elements.viewControls.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.viewControls.forEach(ctrl => ctrl.classList.remove('active'));
                btn.classList.add('active');
                appState.currentMode = btn.dataset.mode;
                
                if (appState.currentView === 'parties') {
                    this.renderPartyList();
                }
            });
        });
    }

    async loadParties(page = 1, forceRefresh = false) {
        if (appState.isLoading) return;
        
        // Check cache first
        const cacheKey = `parties-page-${page}`;
        const now = Date.now();
        const cachedData = appState.cache.get(cacheKey);
        
        if (!forceRefresh && cachedData && (now - cachedData.timestamp) < CONFIG.CACHE_DURATION) {
            console.log('📦 Using cached data');
            this.processPartiesData(cachedData.data);
            return;
        }

        performance.mark('load-parties-start');
        appState.isLoading = true;
        appState.error = null;
        this.showLoading();

        try {
            console.log(`🔄 Fetching parties from API (page ${page})...`);
            
            const url = `${CONFIG.API_BASE_URL}/parties?page=${page}&limit=${CONFIG.PAGE_SIZE}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'PWA-App'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ Loaded ${data.data.length} parties from API`);
            
            // Cache the data
            appState.cache.set(cacheKey, {
                data: data,
                timestamp: now
            });
            
            this.processPartiesData(data);
            performance.measure('Load parties', 'load-parties-start');
            
        } catch (error) {
            console.error('❌ Failed to load parties:', error);
            this.handleLoadError(error);
        } finally {
            appState.isLoading = false;
        }
    }

    processPartiesData(data) {
        if (data.success && data.data) {
            appState.parties = data.data.map(party => ({
                ...party,
                viewed: false,
                interested: appState.interestedParties.some(ip => ip.id === party.id)
            }));
            
            appState.totalParties = data.meta?.total || data.data.length;
            appState.lastDataFetch = Date.now();
            
            this.onDataLoaded();
        } else {
            throw new Error(data.error || 'Invalid response format');
        }
    }

    handleLoadError(error) {
        appState.error = error.message;
        
        // Try to use fallback data
        if (appState.parties.length === 0) {
            this.showError();
        } else {
            // Show error but keep existing data
            console.warn('Using existing data due to error:', error);
            this.showErrorToast('Failed to refresh data. Using cached version.');
        }
    }

    showErrorToast(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--alias-ff4757);
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    showLoading() {
        elements.loadingState?.classList.remove('hidden');
        elements.errorState?.classList.add('hidden');
        this.hideAllViews();
    }

    showError() {
        elements.loadingState?.classList.add('hidden');
        elements.errorState?.classList.remove('hidden');
        this.hideAllViews();
    }

    hideAllViews() {
        elements.swipeView?.classList.add('hidden');
        elements.cardView?.classList.add('hidden');
        elements.mapView?.classList.add('hidden');
        elements.calendarView?.classList.add('hidden');
    }

    onDataLoaded() {
        if (elements.eventCount) {
            elements.eventCount.textContent = appState.totalParties;
        }
        
        elements.loadingState?.classList.add('hidden');
        elements.errorState?.classList.add('hidden');
        
        this.renderTodayPreview();
        this.switchView(appState.currentView);
    }

    renderTodayPreview() {
        if (!elements.todayPreview) return;
        
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        const todayEvents = appState.parties
            .filter(party => {
                const timeStr = party.time || party['Start Time'] || party.startTime || '';
                return timeStr.includes(todayString) || timeStr.includes('Today');
            })
            .slice(0, 3);

        if (todayEvents.length === 0) {
            elements.todayPreview.innerHTML = `
                <div class="nav-section-title">Today's Events</div>
                <div style="padding: 8px 12px; font-size: 13px; color: rgba(255, 255, 255, 0.6);">
                    No events today
                </div>
            `;
            return;
        }

        const previewHTML = todayEvents.map(event => `
            <div class="calendar-item" onclick="app.openPartyDetails('${event.id}')">
                <div class="calendar-time">${this.extractTime(event.time || event['Start Time'] || event.startTime)}</div>
                <div>${this.truncateText(event.title || event['Event Name'] || event.eventTitle, 25)}</div>
                <div class="party-indicator"></div>
            </div>
        `).join('');

        elements.todayPreview.innerHTML = `
            <div class="nav-section-title">Today's Events</div>
            ${previewHTML}
        `;
    }

    extractTime(timeString) {
        if (!timeString) return '';
        
        const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
            return `${timeMatch[1]}:${timeMatch[2]}`;
        }
        
        return timeString.substring(0, 5);
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength) + '...';
    }

    switchView(view) {
        performance.mark('switch-view-start');
        
        appState.currentView = view;
        
        this.hideAllViews();
        
        // Update title
        const titles = {
            swipe: 'New Parties',
            parties: 'All Parties',
            interested: 'Interested Parties',
            calendar: 'My Calendar',
            'heat-map': 'Party Heat Map'
        };
        
        if (elements.mainTitle) {
            elements.mainTitle.textContent = titles[view] || view;
        }
        
        // Show appropriate view
        switch(view) {
            case 'swipe':
                elements.swipeView?.classList.remove('hidden');
                if (appState.currentCardIndex >= appState.parties.length) {
                    this.showNoMoreCards();
                } else {
                    this.renderSwipeCards();
                }
                break;
            case 'parties':
            case 'interested':
                elements.cardView?.classList.remove('hidden');
                this.renderPartyList();
                break;
            case 'calendar':
                elements.calendarView?.classList.remove('hidden');
                this.renderCalendarView();
                break;
            case 'heat-map':
                elements.mapView?.classList.remove('hidden');
                break;
        }
        
        performance.measure('Switch view', 'switch-view-start');
    }

    renderSwipeCards() {
        if (!elements.swipeCards) return;
        
        performance.mark('render-swipe-start');
        elements.swipeCards.innerHTML = '';
        
        // Show up to 3 cards
        for (let i = appState.currentCardIndex; i < Math.min(appState.currentCardIndex + 3, appState.parties.length); i++) {
            const party = appState.parties[i];
            const card = this.createSwipeCard(party, i - appState.currentCardIndex);
            elements.swipeCards.appendChild(card);
        }
        
        this.setupSwipeHandlers();
        performance.measure('Render swipe cards', 'render-swipe-start');
    }

    createSwipeCard(party, zIndex) {
        const card = document.createElement('div');
        card.className = 'party-card';
        card.style.zIndex = 10 - zIndex;
        card.dataset.partyId = party.id;
        
        const title = party.title || party['Event Name'] || party.eventTitle || 'Unknown Event';
        const host = party.host || party['Hosts'] || party.organizer || 'Unknown Host';
        const time = party.time || party['Start Time'] || party.startTime || 'TBD';
        const location = party.location || party['Address'] || party.venue || 'Location TBD';
        const description = party.description || party.details || 'No description available';
        const category = party.category || party['Category'] || party.type || 'Event';
        const price = party.price || party['Price'] || party.cost || 'Free';
        
        card.innerHTML = `
            <div class="card-title">${title}</div>
            <div class="card-host">Hosted by ${host}</div>
            <div class="card-details">
                <div class="card-detail">
                    🕐 ${time}
                </div>
                <div class="card-detail">
                    📍 ${this.truncateText(location, 60)}
                </div>
                <div class="card-detail">
                    🎯 ${category} • ${price}
                </div>
                <div class="card-description">
                    ${description}
                </div>
            </div>
        `;
        
        return card;
    }

    setupSwipeHandlers() {
        const cards = elements.swipeCards?.querySelectorAll('.party-card');
        if (!cards) return;
        
        cards.forEach(card => {
            let startX = 0;
            let currentX = 0;
            let isDragging = false;

            // Touch events
            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
                card.classList.add('dragging');
            }, { passive: true });

            card.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                currentX = e.touches[0].clientX - startX;
                const rotation = currentX * 0.1;
                
                card.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;
                card.style.opacity = Math.max(0.5, 1 - Math.abs(currentX) / 200);
            }, { passive: true });

            card.addEventListener('touchend', () => {
                if (!isDragging) return;
                this.handleSwipeEnd(card, currentX);
                isDragging = false;
                currentX = 0;
            });

            // Mouse events for desktop
            card.addEventListener('mousedown', (e) => {
                startX = e.clientX;
                isDragging = true;
                card.classList.add('dragging');
            });

            card.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                currentX = e.clientX - startX;
                const rotation = currentX * 0.1;
                
                card.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;
                card.style.opacity = Math.max(0.5, 1 - Math.abs(currentX) / 200);
            });

            card.addEventListener('mouseup', () => {
                if (!isDragging) return;
                this.handleSwipeEnd(card, currentX);
                isDragging = false;
                currentX = 0;
            });

            card.addEventListener('mouseleave', () => {
                if (!isDragging) return;
                this.handleSwipeEnd(card, currentX);
                isDragging = false;
                currentX = 0;
            });
        });
    }

    handleSwipeEnd(card, currentX) {
        card.classList.remove('dragging');
        
        if (Math.abs(currentX) > 80) {
            this.swipeCard(card, currentX > 0 ? 'right' : 'left');
        } else {
            // Snap back
            card.style.transform = '';
            card.style.opacity = '';
        }
    }

    async swipeCard(card, direction) {
        performance.mark('swipe-start');
        
        const partyId = card.dataset.partyId;
        const party = appState.parties.find(p => p.id == partyId);
        
        if (direction === 'right') {
            card.classList.add('swipe-right');
            party.interested = true;
            
            // Add to interested parties
            if (!appState.interestedParties.find(ip => ip.id == partyId)) {
                appState.interestedParties.push(party);
                localStorage.setItem('interestedParties', JSON.stringify(appState.interestedParties));
            }
            
            // Track swipe in API (non-blocking)
            this.trackSwipe(partyId, 'like').catch(console.warn);
            
        } else {
            card.classList.add('swipe-left');
            
            // Track swipe in API (non-blocking)
            this.trackSwipe(partyId, 'pass').catch(console.warn);
        }
        
        party.viewed = true;
        
        setTimeout(() => {
            card.remove();
            appState.currentCardIndex++;
            
            if (appState.currentCardIndex < appState.parties.length) {
                this.renderSwipeCards();
            } else {
                this.showNoMoreCards();
            }
            
            performance.measure('Swipe interaction', 'swipe-start');
        }, 300);
    }

    async trackSwipe(partyId, action) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/swipe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'PWA-App'
                },
                body: JSON.stringify({
                    partyId: partyId,
                    action: action,
                    timestamp: new Date().toISOString(),
                    source: 'pwa-app'
                })
            });
            
            if (!response.ok) {
                console.warn('Failed to track swipe:', response.status);
            }
        } catch (error) {
            console.warn('Error tracking swipe:', error);
        }
    }

    showNoMoreCards() {
        if (!elements.swipeCards) return;
        
        elements.swipeCards.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--slack-color-text-secondary);">
                <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">All caught up!</div>
                <div>You've seen all ${appState.parties.length} parties. Check back later for new events.</div>
                <button onclick="app.resetSwipeCards()" style="margin-top: 16px; padding: 8px 16px; background: var(--slack-color-primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Start Over
                </button>
            </div>
        `;
    }

    resetSwipeCards() {
        appState.currentCardIndex = 0;
        appState.parties.forEach(party => party.viewed = false);
        this.renderSwipeCards();
    }

    renderPartyList() {
        if (!elements.partyList) return;
        
        performance.mark('render-list-start');
        
        const partiesToShow = appState.currentView === 'interested' 
            ? appState.interestedParties 
            : appState.parties;
        
        if (partiesToShow.length === 0) {
            const emptyMessage = appState.currentView === 'interested' 
                ? 'No interested parties yet. Start swiping to find parties you like!'
                : 'No parties available.';
                
            elements.partyList.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--slack-color-text-secondary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">
                        ${appState.currentView === 'interested' ? '💝' : '🎪'}
                    </div>
                    <div>${emptyMessage}</div>
                </div>
            `;
            return;
        }
        
        elements.partyList.innerHTML = partiesToShow.map(party => {
            const title = party.title || party['Event Name'] || party.eventTitle || 'Unknown Event';
            const host = party.host || party['Hosts'] || party.organizer || 'Unknown Host';
            const time = party.time || party['Start Time'] || party.startTime || 'TBD';
            const location = party.location || party['Address'] || party.venue || 'Location TBD';
            const description = party.description || party.details || 'No description available';
            const category = party.category || party['Category'] || party.type || 'Event';
            const price = party.price || party['Price'] || party.cost || 'Free';
            
            return `
                <div class="party-list-card" onclick="app.openPartyDetails('${party.id}')">
                    <div class="card-title">${title}</div>
                    <div class="card-host">Hosted by ${host}</div>
                    <div style="margin: 8px 0;">
                        <div class="card-detail">
                            🕐 ${time}
                        </div>
                        <div class="card-detail">
                            📍 ${this.truncateText(location, 50)}
                        </div>
                        <div class="card-detail">
                            🎯 ${category} • ${price}
                        </div>
                    </div>
                    <div style="font-size: 14px; color: var(--slack-color-text-secondary); line-height: 1.4;">
                        ${this.truncateText(description, 120)}
                    </div>
                </div>
            `;
        }).join('');
        
        performance.measure('Render party list', 'render-list-start');
    }

    renderCalendarView() {
        if (!elements.calendarContent) return;
        
        performance.mark('render-calendar-start');
        
        // Group parties by date
        const eventsByDate = new Map();
        
        appState.parties.forEach(party => {
            const timeStr = party.time || party['Start Time'] || party.startTime || '';
            const dateMatch = timeStr.match(/(\w{3})\s+(\w{3})\s+(\d{1,2})/);
            
            let dateKey;
            if (dateMatch) {
                dateKey = `${dateMatch[1]}, ${dateMatch[2]} ${dateMatch[3]}`;
            } else {
                dateKey = 'Date TBD';
            }
            
            if (!eventsByDate.has(dateKey)) {
                eventsByDate.set(dateKey, []);
            }
            eventsByDate.get(dateKey).push(party);
        });
        
        let calendarHTML = '';
        
        for (const [date, events] of eventsByDate) {
            calendarHTML += `
                <div class="calendar-day">
                    <div class="calendar-day-title">${date} - ${events.length} Events</div>
            `;
            
            events
                .sort((a, b) => {
                    const timeA = this.extractTime(a.time || a['Start Time'] || a.startTime);
                    const timeB = this.extractTime(b.time || b['Start Time'] || b.startTime);
                    return timeA.localeCompare(timeB);
                })
                .forEach(event => {
                    const isInterested = appState.interestedParties.some(ip => ip.id == event.id);
                    calendarHTML += `
                        <div class="calendar-event party ${isInterested ? 'interested' : ''}" onclick="app.openPartyDetails('${event.id}')">
                            <div class="event-time">${this.extractTime(event.time || event['Start Time'] || event.startTime)}</div>
                            <div class="event-title">
                                ${event.title || event['Event Name'] || event.eventTitle || 'Unknown Event'}
                                ${isInterested ? ' ❤️' : ''}
                            </div>
                        </div>
                    `;
                });
            
            calendarHTML += '</div>';
        }
        
        if (calendarHTML === '') {
            calendarHTML = `
                <div style="text-align: center; padding: 40px; color: var(--slack-color-text-secondary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">📅</div>
                    <div>No calendar events available</div>
                </div>
            `;
        }
        
        elements.calendarContent.innerHTML = calendarHTML;
        performance.measure('Render calendar', 'render-calendar-start');
    }

    openPartyDetails(partyId) {
        const party = appState.parties.find(p => p.id == partyId);
        if (party && !party.viewed) {
            // Switch to swipe view for unviewed parties
            appState.currentCardIndex = appState.parties.findIndex(p => p.id == partyId);
            this.switchView('swipe');
            this.renderSwipeCards();
            
            // Update nav
            elements.navItems.forEach(nav => nav.classList.remove('active'));
            document.querySelector('[data-view="swipe"]')?.classList.add('active');
        }
    }

    // Manual refresh method
    async refreshData() {
        performance.mark('refresh-start');
        
        // Clear cache
        appState.cache.clear();
        await this.loadParties(1, true);
        
        performance.measure('Manual refresh', 'refresh-start');
        this.showErrorToast('Data refreshed successfully!');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ConferenceApp();
    
    // Add pull-to-refresh functionality
    let startY = 0;
    let pullDistance = 0;
    
    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].pageY;
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (window.scrollY === 0 && startY > 0) {
            pullDistance = e.touches[0].pageY - startY;
            if (pullDistance > 100) {
                // Show pull-to-refresh indicator
            }
        }
    });
    
    document.addEventListener('touchend', (e) => {
        if (pullDistance > 100) {
            window.app.refreshData();
        }
        startY = 0;
        pullDistance = 0;
    });
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}