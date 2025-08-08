/**
 * Enhanced Party Details Modal with Google Maps Integration
 * Features: Embedded maps, transportation options, directions, walking times
 */

class PartyMapsModal {
    constructor() {
        this.modal = null;
        this.map = null;
        this.marker = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.currentEvent = null;
        
        // Koelnmesse coordinates (main conference center)
        this.koelnmesse = { lat: 50.9429, lng: 6.9832 };
        
        this.initModal();
        this.bindEvents();
    }

    initModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="partyDetailsModal" class="party-modal">
                <div class="party-modal-overlay"></div>
                <div class="party-modal-content">
                    <div class="party-modal-header">
                        <h2 id="partyModalTitle" class="party-modal-title"></h2>
                        <button id="closePartyModal" class="party-modal-close">&times;</button>
                    </div>
                    
                    <div class="party-modal-body">
                        <div class="party-info-section">
                            <div id="partyBasicInfo" class="party-basic-info"></div>
                        </div>
                        
                        <div class="party-maps-section">
                            <div class="maps-header">
                                <h3>📍 Location & Directions</h3>
                                <div class="maps-controls">
                                    <button id="showDirections" class="maps-btn">
                                        🧭 Get Directions
                                    </button>
                                    <button id="toggleMapView" class="maps-btn">
                                        🗺️ Toggle View
                                    </button>
                                </div>
                            </div>
                            
                            <div id="partyMap" class="party-map-container">
                                <div id="mapLoadingSpinner" class="map-loading">
                                    <div class="spinner"></div>
                                    <p>Loading map...</p>
                                </div>
                                <div id="mapError" class="map-error hidden">
                                    <p>Failed to load map</p>
                                    <button onclick="partyMapsModal.retryMap()" class="retry-btn">Retry</button>
                                </div>
                            </div>
                            
                            <div class="walking-info">
                                <div id="walkingTime" class="walking-time"></div>
                            </div>
                        </div>
                        
                        <div class="transportation-section">
                            <h3>🚀 Transportation Options</h3>
                            <div class="transport-buttons">
                                <button id="uberButton" class="transport-btn uber-btn">
                                    <span class="transport-icon">🚗</span>
                                    <span>Request Uber</span>
                                </button>
                                
                                <button id="googleMapsBtn" class="transport-btn maps-btn">
                                    <span class="transport-icon">🗺️</span>
                                    <span>Google Maps</span>
                                </button>
                                
                                <button id="appleMapsBtn" class="transport-btn apple-btn">
                                    <span class="transport-icon">🍎</span>
                                    <span>Apple Maps</span>
                                </button>
                                
                                <button id="walkingDirections" class="transport-btn walking-btn">
                                    <span class="transport-icon">🚶</span>
                                    <span>Walking Route</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="party-actions-section">
                            <button id="addToCalendarBtn" class="action-btn primary">
                                📅 Add to Calendar
                            </button>
                            <button id="shareEventBtn" class="action-btn secondary">
                                📤 Share Event
                            </button>
                            <button id="viewOnMainMap" class="action-btn secondary">
                                🗺️ View on Main Map
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('partyDetailsModal');
    }

    bindEvents() {
        // Close modal events
        document.getElementById('closePartyModal').addEventListener('click', () => this.close());
        document.querySelector('.party-modal-overlay').addEventListener('click', () => this.close());
        
        // Map controls
        document.getElementById('showDirections').addEventListener('click', () => this.showDirections());
        document.getElementById('toggleMapView').addEventListener('click', () => this.toggleMapView());
        
        // Transportation buttons
        document.getElementById('uberButton').addEventListener('click', () => this.openUber());
        document.getElementById('googleMapsBtn').addEventListener('click', () => this.openGoogleMaps());
        document.getElementById('appleMapsBtn').addEventListener('click', () => this.openAppleMaps());
        document.getElementById('walkingDirections').addEventListener('click', () => this.showWalkingRoute());
        
        // Action buttons
        document.getElementById('addToCalendarBtn').addEventListener('click', () => this.addToCalendar());
        document.getElementById('shareEventBtn').addEventListener('click', () => this.shareEvent());
        document.getElementById('viewOnMainMap').addEventListener('click', () => this.viewOnMainMap());
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.close();
            }
        });
    }

    show(event) {
        this.currentEvent = event;
        this.updateModalContent();
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Initialize map after modal is visible
        setTimeout(() => this.initEventMap(), 100);
    }

    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Clean up map
        if (this.map) {
            this.map = null;
        }
    }

    updateModalContent() {
        const event = this.currentEvent;
        const eventName = event.name || event['Event Name'];
        const eventDate = event.date || event.Date;
        const eventTime = event.startTime || event['Start Time'];
        const eventVenue = event.venue || event.Address;
        const eventHosts = event.hosts || event.Hosts || event.creator;
        const eventDescription = event.description || event.Description;
        const isUGC = event.isUGC || event.collection === 'ugc-events';

        // Update title
        document.getElementById('partyModalTitle').textContent = eventName;

        // Update basic info
        const basicInfoHTML = `
            <div class="party-header">
                ${isUGC ? '<span class="ugc-badge">👥 Community Event</span>' : ''}
                <div class="party-category">${event.category || event.Category || 'Networking'}</div>
            </div>
            
            <div class="party-details">
                <div class="detail-item">
                    <span class="detail-icon">👤</span>
                    <span class="detail-label">Hosted by:</span>
                    <span class="detail-value">${eventHosts}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-icon">📅</span>
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${this.formatDate(eventDate)}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-icon">🕐</span>
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${eventTime}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-icon">📍</span>
                    <span class="detail-label">Venue:</span>
                    <span class="detail-value">${eventVenue}</span>
                </div>
                
                ${eventDescription ? `
                    <div class="detail-item description">
                        <span class="detail-icon">📝</span>
                        <span class="detail-label">About:</span>
                        <span class="detail-value">${eventDescription}</span>
                    </div>
                ` : ''}
            </div>
        `;

        document.getElementById('partyBasicInfo').innerHTML = basicInfoHTML;
    }

    async initEventMap() {
        const mapContainer = document.getElementById('partyMap');
        const loadingSpinner = document.getElementById('mapLoadingSpinner');
        const mapError = document.getElementById('mapError');
        
        try {
            // Show loading
            loadingSpinner.classList.remove('hidden');
            mapError.classList.add('hidden');

            // Get event coordinates
            const eventCoords = this.getEventCoordinates(this.currentEvent);
            
            // Create map
            this.map = new google.maps.Map(mapContainer, {
                center: eventCoords,
                zoom: 15,
                styles: this.getMapStyles(),
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
                zoomControl: true
            });

            // Add event marker
            this.marker = new google.maps.Marker({
                position: eventCoords,
                map: this.map,
                title: this.currentEvent.name || this.currentEvent['Event Name'],
                icon: this.createEventMarker(),
                animation: google.maps.Animation.DROP
            });

            // Add info window
            const infoWindow = new google.maps.InfoWindow({
                content: this.createInfoWindowContent()
            });

            this.marker.addListener('click', () => {
                infoWindow.open(this.map, this.marker);
            });

            // Initialize directions service
            this.directionsService = new google.maps.DirectionsService();
            this.directionsRenderer = new google.maps.DirectionsRenderer({
                map: this.map,
                suppressMarkers: true // Keep our custom marker
            });

            // Calculate walking time from Koelnmesse
            await this.calculateWalkingTime();

            // Hide loading
            loadingSpinner.classList.add('hidden');
            
        } catch (error) {
            console.error('Failed to initialize map:', error);
            loadingSpinner.classList.add('hidden');
            mapError.classList.remove('hidden');
        }
    }

    getEventCoordinates(event) {
        // Try different coordinate field names
        if (event.lat && event.lng) {
            return { lat: parseFloat(event.lat), lng: parseFloat(event.lng) };
        }
        
        if (event.geocoded && event.geocoded.lat && event.geocoded.lng) {
            return { lat: parseFloat(event.geocoded.lat), lng: parseFloat(event.geocoded.lng) };
        }
        
        // Fallback to venue-based coordinates
        return this.getVenueCoordinates(event.venue || event.Address);
    }

    getVenueCoordinates(venue) {
        const venueMap = {
            'koelnmesse': { lat: 50.9429, lng: 6.9581 },
            'cologne': { lat: 50.9375, lng: 6.9603 },
            'maritim hotel': { lat: 50.9559, lng: 6.9587 },
            'hyatt regency': { lat: 50.9449, lng: 6.9583 },
            'excelsior hotel': { lat: 50.9425, lng: 6.9512 },
            'dom hotel': { lat: 50.9413, lng: 6.9581 },
            'marriott': { lat: 50.9449, lng: 6.9583 }
        };
        
        const venueLower = venue ? venue.toLowerCase() : '';
        for (const [key, coords] of Object.entries(venueMap)) {
            if (venueLower.includes(key)) {
                return coords;
            }
        }
        
        // Default to Koelnmesse with slight offset
        return {
            lat: 50.9429 + (Math.random() - 0.5) * 0.01,
            lng: 6.9581 + (Math.random() - 0.5) * 0.01
        };
    }

    createEventMarker() {
        const color = '#FF6B35';
        const symbol = '🎉';
        
        const svg = `
            <svg width="50" height="60" viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
                <path d="M25 0C11.19 0 0 11.19 0 25c0 18.75 25 35 25 35s25-16.25 25-35C50 11.19 38.81 0 25 0z" 
                      fill="${color}" stroke="white" stroke-width="3"/>
                <text x="25" y="32" text-anchor="middle" font-size="18" fill="white">${symbol}</text>
            </svg>
        `;
        
        return {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
            size: new google.maps.Size(50, 60),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(25, 60),
            scaledSize: new google.maps.Size(50, 60)
        };
    }

    createInfoWindowContent() {
        const event = this.currentEvent;
        const eventName = event.name || event['Event Name'];
        const eventTime = event.startTime || event['Start Time'];
        const eventVenue = event.venue || event.Address;
        
        return `
            <div class="map-info-content">
                <h4>${eventName}</h4>
                <p><strong>🕐 ${eventTime}</strong></p>
                <p>📍 ${eventVenue}</p>
            </div>
        `;
    }

    async calculateWalkingTime() {
        if (!this.directionsService) return;
        
        const eventCoords = this.getEventCoordinates(this.currentEvent);
        
        try {
            const result = await new Promise((resolve, reject) => {
                this.directionsService.route({
                    origin: this.koelnmesse,
                    destination: eventCoords,
                    travelMode: google.maps.TravelMode.WALKING
                }, (result, status) => {
                    if (status === 'OK') resolve(result);
                    else reject(status);
                });
            });
            
            const duration = result.routes[0].legs[0].duration.text;
            const distance = result.routes[0].legs[0].distance.text;
            
            document.getElementById('walkingTime').innerHTML = `
                <div class="walking-info-content">
                    <span class="walking-icon">🚶‍♂️</span>
                    <span class="walking-text">${duration} walk (${distance}) from Koelnmesse</span>
                </div>
            `;
            
        } catch (error) {
            console.error('Failed to calculate walking time:', error);
            document.getElementById('walkingTime').innerHTML = `
                <div class="walking-info-content">
                    <span class="walking-icon">📍</span>
                    <span class="walking-text">Location near Cologne city center</span>
                </div>
            `;
        }
    }

    showDirections() {
        if (!this.directionsService || !this.directionsRenderer) return;
        
        const eventCoords = this.getEventCoordinates(this.currentEvent);
        
        this.directionsService.route({
            origin: this.koelnmesse,
            destination: eventCoords,
            travelMode: google.maps.TravelMode.WALKING
        }, (result, status) => {
            if (status === 'OK') {
                this.directionsRenderer.setDirections(result);
            }
        });
    }

    toggleMapView() {
        if (!this.map) return;
        
        const currentType = this.map.getMapTypeId();
        const newType = currentType === 'roadmap' ? 'hybrid' : 'roadmap';
        this.map.setMapTypeId(newType);
    }

    openUber() {
        const eventCoords = this.getEventCoordinates(this.currentEvent);
        const eventName = this.currentEvent.name || this.currentEvent['Event Name'];
        
        // Uber deep link
        const uberUrl = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${eventCoords.lat}&dropoff[longitude]=${eventCoords.lng}&dropoff[nickname]=${encodeURIComponent(eventName)}`;
        
        // Fallback to web if app not installed
        const uberWeb = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${eventCoords.lat}&dropoff[longitude]=${eventCoords.lng}&dropoff[nickname]=${encodeURIComponent(eventName)}`;
        
        // Try app first, fallback to web
        const link = document.createElement('a');
        link.href = uberUrl;
        link.target = '_blank';
        link.click();
        
        // Fallback after short delay
        setTimeout(() => {
            window.open(uberWeb, '_blank');
        }, 1000);
    }

    openGoogleMaps() {
        const eventCoords = this.getEventCoordinates(this.currentEvent);
        const url = `https://www.google.com/maps/dir/?api=1&destination=${eventCoords.lat},${eventCoords.lng}`;
        window.open(url, '_blank');
    }

    openAppleMaps() {
        const eventCoords = this.getEventCoordinates(this.currentEvent);
        const url = `https://maps.apple.com/?daddr=${eventCoords.lat},${eventCoords.lng}`;
        window.open(url, '_blank');
    }

    showWalkingRoute() {
        this.showDirections();
        
        // Zoom out to show full route
        if (this.map) {
            this.map.setZoom(13);
        }
    }

    addToCalendar() {
        const event = this.currentEvent;
        if (window.api) {
            const url = window.api.generateCalendarURL(event);
            window.open(url, '_blank');
        }
    }

    shareEvent() {
        const event = this.currentEvent;
        const eventName = event.name || event['Event Name'];
        const shareData = {
            title: eventName,
            text: `Check out "${eventName}" at Gamescom 2025!`,
            url: `${window.location.origin}/?event=${event.id}`
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            this.showToast('Event link copied to clipboard!');
        }
    }

    viewOnMainMap() {
        window.location.href = `/maps.html?event=${this.currentEvent.id}`;
    }

    retryMap() {
        this.initEventMap();
    }

    getMapStyles() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        if (isDark) {
            return [
                { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
                { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
                { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
                { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] }
            ];
        }
        
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

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the maps modal
window.partyMapsModal = new PartyMapsModal();