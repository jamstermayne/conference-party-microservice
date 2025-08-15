// Enhanced Google Maps Integration for Gamescom Party Discovery
class GamescomMapsApp {
    constructor() {
        this.map = null;
        this.markers = [];
        this.events = [];
        this.filteredEvents = [];
        this.infoWindow = null;
        this.markerClusterer = null;
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        // Map configuration
        this.mapConfig = {
            center: { lat: 50.9429, lng: 6.9581 }, // Cologne, Germany
            zoom: 13,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
        };
        
        // Add mapId if available (cloud styling takes precedence)
        const MAP_ID = 'conference_party_map';
        if (MAP_ID) {
            this.mapConfig.mapId = MAP_ID; // Cloud styling source of truth
        } else {
            // Only use inline styles if no mapId
            this.mapConfig.styles = this.getMapStyles();
        }
    }

    async init() {
        console.log('🗺️ Initializing Gamescom Maps v2.0...');
        
        try {
            // Initialize theme
            this.initTheme();
            
            // Load events data
            await this.loadEvents();
            
            // Setup UI components
            this.setupUI();
            
            console.log(`✅ Maps loaded with ${this.events.length} events`);
            
        } catch (error) {
            console.error('❌ Maps initialization failed:', error);
            this.showError();
        }
    }

    async loadEvents() {
        try {
            this.events = await window.api.getEvents();
            this.filteredEvents = [...this.events];
            
            // Update stats
            this.updateStats();
            
        } catch (error) {
            console.error('❌ Failed to load events:', error);
            throw error;
        }
    }

    initMap() {
        // Hide loading state
        document.getElementById('mapLoading').classList.add('hidden');
        
        try {
            // Create map
            this.map = new google.maps.Map(document.getElementById('map'), this.mapConfig);
            
            // Create info window
            this.infoWindow = new google.maps.InfoWindow({
                maxWidth: 350
            });
            
            // Add markers
            this.addMarkers();
            
            // Initialize clustering
            this.initMarkerClustering();
            
            // Check for event parameter in URL
            this.handleEventParameter();
            
        } catch (error) {
            console.error('❌ Map initialization failed:', error);
            this.showError();
        }
    }

    addMarkers() {
        this.markers = [];
        
        this.filteredEvents.forEach(event => {
            // Get coordinates
            const coords = this.getEventCoordinates(event);
            if (!coords) return;
            
            // Create marker
            const marker = new google.maps.Marker({
                position: coords,
                map: this.map,
                title: event.name || event['Event Name'],
                icon: this.getMarkerIcon(event),
                animation: google.maps.Animation.DROP
            });
            
            // Add click listener
            marker.addListener('click', () => {
                this.showEventInfo(event, marker);
            });
            
            // Store event data
            marker.eventData = event;
            this.markers.push(marker);
        });
    }

    getEventCoordinates(event) {
        // Try different coordinate field names
        if (event.coordinates) {
            return event.coordinates;
        }
        if (event.lat && event.lng) {
            return { lat: parseFloat(event.lat), lng: parseFloat(event.lng) };
        }
        if (event.latitude && event.longitude) {
            return { lat: parseFloat(event.latitude), lng: parseFloat(event.longitude) };
        }
        
        // Fallback to venue-based coordinates (simplified)
        return this.getVenueCoordinates(event.venue || event.Address);
    }

    getVenueCoordinates(venue) {
        // Simplified venue mapping for major Gamescom venues
        const venueMap = {
            'Koelnmesse': { lat: 50.9429, lng: 6.9581 },
            'Cologne': { lat: 50.9375, lng: 6.9603 },
            'Maritim Hotel': { lat: 50.9559, lng: 6.9587 },
            'Hyatt Regency': { lat: 50.9449, lng: 6.9583 },
            'Excelsior Hotel': { lat: 50.9425, lng: 6.9512 },
            'Dom Hotel': { lat: 50.9413, lng: 6.9581 }
        };
        
        const venueLower = venue ? venue.toLowerCase() : '';
        for (const [key, coords] of Object.entries(venueMap)) {
            if (venueLower.includes(key.toLowerCase())) {
                return coords;
            }
        }
        
        // Default to Koelnmesse with slight random offset
        return {
            lat: 50.9429 + (Math.random() - 0.5) * 0.01,
            lng: 6.9581 + (Math.random() - 0.5) * 0.01
        };
    }

    getMarkerIcon(event) {
        const isUGC = event.isUGC || event.collection === 'ugc-events';
        const category = event.category || event.Category || 'networking';
        
        const colors = {
            networking: '#4A154B',
            afterparty: '#FF6B35',
            mixer: '#0084FF',
            launch: '#00C851'
        };
        
        const color = colors[category] || colors.networking;
        const symbol = isUGC ? '👥' : this.getCategoryIcon(category);
        
        return {
            url: this.createMarkerSVG(color, symbol),
            size: new google.maps.Size(40, 50),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 50),
            scaledSize: new google.maps.Size(40, 50)
        };
    }

    createMarkerSVG(color, symbol) {
        const svg = `
            <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" 
                      fill="${color}" stroke="white" stroke-width="2"/>
                <text x="20" y="25" text-anchor="middle" font-size="14" fill="white">${symbol}</text>
            </svg>
        `;
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }

    getCategoryIcon(category) {
        const icons = {
            networking: '🤝',
            afterparty: '🎉',
            mixer: '🍸',
            launch: '🚀'
        };
        return icons[category] || '🎮';
    }

    showEventInfo(event, marker) {
        const eventName = event.name || event['Event Name'];
        const eventDate = event.date || event.Date;
        const eventTime = event.startTime || event['Start Time'];
        const eventVenue = event.venue || event.Address;
        const eventHosts = event.hosts || event.Hosts || event.creator;
        const eventDescription = event.description || event.Description;
        const isUGC = event.isUGC || event.collection === 'ugc-events';

        const content = `
            <div class="map-info-window">
                <div class="info-header">
                    <h3>${eventName}</h3>
                    ${isUGC ? '<span class="ugc-badge">👥 Community</span>' : ''}
                </div>
                
                <div class="info-details">
                    <div class="info-item">
                        <span class="info-icon">👤</span>
                        <span>${eventHosts}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">📅</span>
                        <span>${this.formatDate(eventDate)} at ${eventTime}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">📍</span>
                        <span>${eventVenue}</span>
                    </div>
                </div>
                
                ${eventDescription ? `<p class="info-description">${this.truncateText(eventDescription, 100)}</p>` : ''}
                
                <div class="info-actions">
                    <button onclick="mapApp.addToCalendar('${event.id}')" class="info-btn">
                        📅 Add to Calendar
                    </button>
                    <button onclick="mapApp.showInSidebar('${event.id}')" class="info-btn">
                        👁️ View Details
                    </button>
                </div>
            </div>
        `;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    }

    initMarkerClustering() {
        if (typeof MarkerClusterer !== 'undefined' && this.markers.length > 0) {
            this.markerClusterer = new MarkerClusterer(this.map, this.markers, {
                imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
                gridSize: 60,
                maxZoom: 15
            });
        }
    }

    setupUI() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Search functionality
        document.getElementById('mapSearchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Filter buttons
        document.getElementById('showAllEvents').addEventListener('click', () => {
            this.setFilter('all');
        });
        document.getElementById('showUGCOnly').addEventListener('click', () => {
            this.setFilter('ugc');
        });
        document.getElementById('showCuratedOnly').addEventListener('click', () => {
            this.setFilter('curated');
        });

        // Category filter
        document.getElementById('mapCategoryFilter').addEventListener('change', (e) => {
            this.setCategoryFilter(e.target.value);
        });

        // Recenter button
        document.getElementById('recenterMap').addEventListener('click', () => {
            this.recenterMap();
        });

        // Sidebar controls
        document.getElementById('closeSidebar').addEventListener('click', () => {
            this.closeSidebar();
        });

        // Toggle list view
        document.getElementById('toggleListView').addEventListener('click', () => {
            this.toggleListView();
        });
        document.getElementById('closeListPanel').addEventListener('click', () => {
            this.closeListPanel();
        });
    }

    handleSearch(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.filterAndUpdateMap();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update button states
        document.querySelectorAll('.filter-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`show${filter.charAt(0).toUpperCase() + filter.slice(1)}${filter === 'all' ? 'Events' : filter === 'ugc' ? 'Only' : 'Only'}`).classList.add('active');
        
        this.filterAndUpdateMap();
    }

    setCategoryFilter(category) {
        this.categoryFilter = category;
        this.filterAndUpdateMap();
    }

    filterAndUpdateMap() {
        let filtered = [...this.events];
        
        // Apply type filter
        if (this.currentFilter === 'ugc') {
            filtered = filtered.filter(e => e.isUGC || e.collection === 'ugc-events');
        } else if (this.currentFilter === 'curated') {
            filtered = filtered.filter(e => !e.isUGC && e.collection !== 'ugc-events');
        }
        
        // Apply category filter
        if (this.categoryFilter && this.categoryFilter !== 'all') {
            filtered = filtered.filter(e => 
                (e.category || e.Category || '').toLowerCase() === this.categoryFilter
            );
        }
        
        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(e => {
                const searchFields = [
                    e.name || e['Event Name'],
                    e.venue || e.Address,
                    e.hosts || e.Hosts || e.creator,
                    e.description || e.Description
                ].join(' ').toLowerCase();
                
                return searchFields.includes(this.searchQuery);
            });
        }
        
        this.filteredEvents = filtered;
        this.updateMapMarkers();
        this.updateStats();
    }

    updateMapMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        
        // Clear clusterer
        if (this.markerClusterer) {
            this.markerClusterer.clearMarkers();
        }
        
        // Add new markers
        this.addMarkers();
        
        // Re-initialize clustering
        this.initMarkerClustering();
    }

    updateStats() {
        const count = this.filteredEvents.length;
        const statsElement = document.getElementById('visibleEventsCount');
        statsElement.textContent = `${count} event${count !== 1 ? 's' : ''} visible`;
    }

    recenterMap() {
        if (this.map) {
            this.map.setCenter(this.mapConfig.center);
            this.map.setZoom(this.mapConfig.zoom);
        }
    }

    showInSidebar(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const sidebar = document.getElementById('eventSidebar');
        const content = document.getElementById('sidebarContent');
        
        const eventName = event.name || event['Event Name'];
        const eventDate = event.date || event.Date;
        const eventTime = event.startTime || event['Start Time'];
        const eventVenue = event.venue || event.Address;
        const eventHosts = event.hosts || event.Hosts || event.creator;
        const eventDescription = event.description || event.Description;
        const isUGC = event.isUGC || event.collection === 'ugc-events';

        content.innerHTML = `
            <div class="sidebar-event-details">
                <div class="sidebar-event-header">
                    <h4>${eventName}</h4>
                    ${isUGC ? '<span class="ugc-badge">👥 Community Event</span>' : ''}
                </div>
                
                <div class="sidebar-event-meta">
                    <div class="meta-item">
                        <strong>👤 Host:</strong> ${eventHosts}
                    </div>
                    <div class="meta-item">
                        <strong>📅 Date:</strong> ${this.formatDate(eventDate)}
                    </div>
                    <div class="meta-item">
                        <strong>🕐 Time:</strong> ${eventTime}
                    </div>
                    <div class="meta-item">
                        <strong>📍 Venue:</strong> ${eventVenue}
                    </div>
                </div>
                
                ${eventDescription ? `
                    <div class="sidebar-event-description">
                        <strong>About this event:</strong>
                        <p>${eventDescription}</p>
                    </div>
                ` : ''}
                
                <div class="sidebar-event-actions">
                    <button onclick="mapApp.addToCalendar('${event.id}')" class="btn-primary">
                        📅 Add to Calendar
                    </button>
                    <button onclick="mapApp.shareEvent('${event.id}')" class="btn-secondary">
                        📤 Share
                    </button>
                    <button onclick="mapApp.getDirections('${event.id}')" class="btn-secondary">
                        🧭 Directions
                    </button>
                </div>
            </div>
        `;
        
        sidebar.classList.remove('hidden');
    }

    closeSidebar() {
        document.getElementById('eventSidebar').classList.add('hidden');
    }

    toggleListView() {
        const panel = document.getElementById('eventListPanel');
        const isVisible = !panel.classList.contains('hidden');
        
        if (isVisible) {
            this.closeListPanel();
        } else {
            this.showListView();
        }
    }

    showListView() {
        const panel = document.getElementById('eventListPanel');
        const listContainer = document.getElementById('eventList');
        
        // Generate list HTML
        const listHTML = this.filteredEvents.map(event => {
            const eventName = event.name || event['Event Name'];
            const eventDate = event.date || event.Date;
            const eventTime = event.startTime || event['Start Time'];
            const eventVenue = event.venue || event.Address;
            const isUGC = event.isUGC || event.collection === 'ugc-events';
            
            return `
                <div class="list-event-item" onclick="mapApp.focusOnEvent('${event.id}')">
                    <div class="list-event-header">
                        <h4>${eventName}</h4>
                        ${isUGC ? '<span class="list-ugc-badge">👥</span>' : ''}
                    </div>
                    <div class="list-event-meta">
                        <span>📅 ${this.formatDate(eventDate)}</span>
                        <span>🕐 ${eventTime}</span>
                        <span>📍 ${this.truncateText(eventVenue, 30)}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        listContainer.innerHTML = listHTML || '<p class="empty-list">No events match your current filters.</p>';
        panel.classList.remove('hidden');
    }

    closeListPanel() {
        document.getElementById('eventListPanel').classList.add('hidden');
    }

    focusOnEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        const marker = this.markers.find(m => m.eventData && m.eventData.id === eventId);
        
        if (event && marker) {
            const coords = this.getEventCoordinates(event);
            this.map.setCenter(coords);
            this.map.setZoom(16);
            
            // Trigger marker click
            google.maps.event.trigger(marker, 'click');
        }
        
        this.closeListPanel();
    }

    handleEventParameter() {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('event');
        
        if (eventId) {
            setTimeout(() => {
                this.focusOnEvent(eventId);
            }, 1000);
        }
    }

    addToCalendar(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event && window.api) {
            const url = window.api.generateCalendarURL(event);
            window.open(url, '_blank');
        }
    }

    shareEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const eventName = event.name || event['Event Name'];
        const shareData = {
            title: eventName,
            text: `Check out "${eventName}" at Gamescom 2025!`,
            url: `${window.location.origin}/maps.html?event=${eventId}`
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            alert('Event link copied to clipboard!');
        }
    }

    getDirections(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const coords = this.getEventCoordinates(event);
        const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
        window.open(url, '_blank');
    }

    retryMapLoad() {
        document.getElementById('mapError').classList.add('hidden');
        document.getElementById('mapLoading').classList.remove('hidden');
        
        setTimeout(() => {
            this.initMap();
        }, 1000);
    }

    showError() {
        document.getElementById('mapLoading').classList.add('hidden');
        document.getElementById('mapError').classList.remove('hidden');
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
        
        // Update map styles if map exists
        if (this.map) {
            // Don't set styles when using mapId (cloud styling)
            if (!this.mapConfig.mapId) {
                this.map.setOptions({ styles: this.getMapStyles() });
            }
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        const themeToggle = document.getElementById('themeToggle');
        const currentTheme = html.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            html.setAttribute('data-theme', 'light');
            themeToggle.innerHTML = '🌙 Dark Mode';
            localStorage.setItem('theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '☀️ Light Mode';
            localStorage.setItem('theme', 'dark');
        }
        
        // Update map styles
        if (this.map) {
            // Don't set styles when using mapId (cloud styling)
            if (!this.mapConfig.mapId) {
                this.map.setOptions({ styles: this.getMapStyles() });
            }
        }
    }

    getMapStyles() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        if (isDark) {
            // Dark mode map styles
            return [
                { elementType: 'geometry', stylers: [{ color: 'var(--neutral-200)' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: 'var(--neutral-200)' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: 'var(--alias-746855)' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ color: 'var(--alias-38414e)' }] },
                { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: 'var(--neutral-200)' }] },
                { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: 'var(--alias-9ca5b3)' }] },
                { featureType: 'water', elementType: 'geometry', stylers: [{ color: 'var(--neutral-100)' }] },
                { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: 'var(--alias-515c6d)' }] },
                { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: 'var(--neutral-100)' }] }
            ];
        }
        
        // Default light mode (no custom styles)
        return [];
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const dayDiff = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 0) return 'Today';
        if (dayDiff === 1) return 'Tomorrow';
        if (dayDiff === -1) return 'Yesterday';
        
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short', 
            day: 'numeric'
        });
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength).trim() + '...';
    }
}

// Global map initialization function (required by Google Maps API)
function initMap() {
    if (window.mapApp) {
        window.mapApp.initMap();
    }
}

// Initialize the maps app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mapApp = new GamescomMapsApp();
    window.mapApp.init().catch(error => {
        console.error('Failed to initialize maps app:', error);
    });
});