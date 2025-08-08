/**
 * MAPS PERFORMANCE OPTIMIZATIONS
 * Handles efficient rendering of 72+ event markers with clustering and virtualization
 */

class MapsPerformanceManager {
    constructor(map) {
        this.map = map;
        this.markers = [];
        this.markerClusterer = null;
        this.visibleMarkers = new Set();
        this.markerPool = [];
        
        // Performance settings
        this.maxMarkersWithoutClustering = 30;
        this.clusterGridSize = 40;
        this.renderBatchSize = 10;
        this.renderDelay = 16; // ~60fps
        
        // Viewport management
        this.viewportBounds = null;
        this.lastZoomLevel = 0;
        
        this.initializePerformanceFeatures();
    }
    
    initializePerformanceFeatures() {
        // Enable cluster management for 72+ markers
        this.setupMarkerClustering();
        
        // Listen for map changes
        if (this.map) {
            this.map.addListener('bounds_changed', () => this.updateViewport());
            this.map.addListener('zoom_changed', () => this.handleZoomChange());
        }
    }
    
    setupMarkerClustering() {
        // MarkerClusterer for handling 72+ markers efficiently
        if (typeof MarkerClusterer !== 'undefined') {
            this.markerClusterer = new MarkerClusterer(this.map, [], {
                gridSize: this.clusterGridSize,
                maxZoom: 15,
                styles: [{
                    textColor: 'white',
                    url: 'data:image/svg+xml;base64,' + btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                            <circle cx="20" cy="20" r="18" fill="#FF6B35" stroke="#fff" stroke-width="2"/>
                            <text x="20" y="25" text-anchor="middle" fill="white" font-size="12" font-weight="bold">TEXT</text>
                        </svg>
                    `),
                    height: 40,
                    width: 40,
                    anchorText: [0, 0],
                    anchorIcon: [20, 20]
                }]
            });
        } else {
            console.warn('⚠️ MarkerClusterer not available, using basic marker management');
        }
    }
    
    async addMarkers(events, batchRender = true) {
        console.log(`🎯 Adding ${events.length} markers with performance optimization`);
        
        if (batchRender && events.length > this.renderBatchSize) {
            return this.batchRenderMarkers(events);
        } else {
            return this.renderMarkersSync(events);
        }
    }
    
    async batchRenderMarkers(events) {
        const startTime = performance.now();
        let processedCount = 0;
        
        for (let i = 0; i < events.length; i += this.renderBatchSize) {
            const batch = events.slice(i, i + this.renderBatchSize);
            
            // Process batch
            for (const event of batch) {
                if (this.shouldRenderMarker(event)) {
                    const marker = this.createOptimizedMarker(event);
                    if (marker) {
                        this.markers.push(marker);
                        processedCount++;
                    }
                }
            }
            
            // Add to clusterer if available
            if (this.markerClusterer) {
                const newMarkers = this.markers.slice(-batch.length);
                this.markerClusterer.addMarkers(newMarkers.filter(m => m));
            }
            
            // Yield control to prevent blocking
            if (i + this.renderBatchSize < events.length) {
                await new Promise(resolve => setTimeout(resolve, this.renderDelay));
            }
        }
        
        const renderTime = performance.now() - startTime;
        console.log(`✅ Rendered ${processedCount} markers in ${renderTime.toFixed(2)}ms`);
        
        return {
            total: events.length,
            rendered: processedCount,
            renderTime: renderTime,
            clustered: !!this.markerClusterer
        };
    }
    
    renderMarkersSync(events) {
        let processedCount = 0;
        
        for (const event of events) {
            if (this.shouldRenderMarker(event)) {
                const marker = this.createOptimizedMarker(event);
                if (marker) {
                    this.markers.push(marker);
                    processedCount++;
                }
            }
        }
        
        if (this.markerClusterer) {
            this.markerClusterer.addMarkers(this.markers);
        }
        
        return {
            total: events.length,
            rendered: processedCount,
            clustered: !!this.markerClusterer
        };
    }
    
    shouldRenderMarker(event) {
        // Skip events without coordinates
        if (!event.coordinates && !event.geocoding) {
            return false;
        }
        
        // Viewport culling (if viewport is known)
        if (this.viewportBounds && this.isOutsideViewport(event)) {
            return false;
        }
        
        return true;
    }
    
    createOptimizedMarker(event) {
        try {
            const coordinates = this.extractCoordinates(event);
            if (!coordinates) return null;
            
            const marker = new google.maps.Marker({
                position: coordinates,
                map: this.markerClusterer ? null : this.map, // Let clusterer manage
                title: event.name || event['Event Name'] || 'Event',
                icon: this.getOptimizedIcon(event),
                optimized: true, // Enable marker optimization
                zIndex: this.calculateZIndex(event)
            });
            
            // Add click handler with event delegation
            marker.addListener('click', () => {
                this.handleMarkerClick(event, marker);
            });
            
            // Store event data reference
            marker.eventData = event;
            
            return marker;
            
        } catch (error) {
            console.warn('Failed to create marker for event:', event.id, error);
            return null;
        }
    }
    
    extractCoordinates(event) {
        // Multiple coordinate sources
        if (event.coordinates && event.coordinates.lat && event.coordinates.lng) {
            return event.coordinates;
        }
        
        if (event.geocoding && event.geocoding.lat && event.geocoding.lng) {
            return { lat: event.geocoding.lat, lng: event.geocoding.lng };
        }
        
        // Tool #7 search index format
        if (event.location && event.location.coordinates) {
            return {
                lat: event.location.coordinates.lat,
                lng: event.location.coordinates.lng
            };
        }
        
        return null;
    }
    
    getOptimizedIcon(event) {
        // Simple, efficient marker icons
        const category = event.category || event['Category'] || 'default';
        const colors = {
            'networking': '#FF6B35',
            'mixer': '#4ECDC4', 
            'social': '#45B7D1',
            'meetings': '#96CEB4',
            'default': '#667292'
        };
        
        return {
            url: `data:image/svg+xml;base64,${btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" fill="${colors[category.toLowerCase()] || colors.default}" stroke="#fff" stroke-width="2"/>
                    <circle cx="12" cy="12" r="4" fill="#fff" opacity="0.8"/>
                </svg>
            `)}`,
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12)
        };
    }
    
    calculateZIndex(event) {
        // Higher priority events on top
        const priorities = {
            'networking': 1000,
            'mixer': 900,
            'social': 800,
            'meetings': 700
        };
        
        const category = (event.category || event['Category'] || 'default').toLowerCase();
        return priorities[category] || 500;
    }
    
    handleMarkerClick(event, marker) {
        // Dispatch event for maps integration to handle
        window.dispatchEvent(new CustomEvent('markerClicked', {
            detail: { event, marker }
        }));
    }
    
    updateViewport() {
        if (!this.map) return;
        
        this.viewportBounds = this.map.getBounds();
        
        // Viewport-based optimization could be added here
        // For now, clustering handles the heavy lifting
    }
    
    handleZoomChange() {
        const currentZoom = this.map.getZoom();
        const zoomDelta = Math.abs(currentZoom - this.lastZoomLevel);
        
        // Significant zoom change - might need marker adjustment
        if (zoomDelta > 2) {
            this.optimizeForZoomLevel(currentZoom);
        }
        
        this.lastZoomLevel = currentZoom;
    }
    
    optimizeForZoomLevel(zoomLevel) {
        // Adjust marker visibility/clustering based on zoom
        if (this.markerClusterer) {
            // Clustering handles this automatically
            return;
        }
        
        // Manual optimization if needed
        if (zoomLevel < 12) {
            // High-level view - show fewer markers or increase clustering
            this.setMarkerVisibility(false, 'minor');
        } else {
            // Detailed view - show all markers
            this.setMarkerVisibility(true, 'all');
        }
    }
    
    setMarkerVisibility(visible, category = 'all') {
        this.markers.forEach(marker => {
            if (!marker || !marker.eventData) return;
            
            const eventCategory = (marker.eventData.category || 'default').toLowerCase();
            
            if (category === 'all' || 
                (category === 'minor' && ['meetings', 'default'].includes(eventCategory))) {
                marker.setVisible(visible);
            }
        });
    }
    
    clearMarkers() {
        // Clear all markers efficiently
        if (this.markerClusterer) {
            this.markerClusterer.clearMarkers();
        }
        
        this.markers.forEach(marker => {
            if (marker) {
                marker.setMap(null);
            }
        });
        
        this.markers = [];
        this.visibleMarkers.clear();
    }
    
    getPerformanceStats() {
        return {
            totalMarkers: this.markers.length,
            visibleMarkers: this.visibleMarkers.size,
            clusteringEnabled: !!this.markerClusterer,
            clusteredMarkers: this.markerClusterer ? this.markerClusterer.getTotalMarkers() : 0,
            clusters: this.markerClusterer ? this.markerClusterer.getClusters().length : 0,
            viewportBounds: this.viewportBounds,
            lastZoom: this.lastZoomLevel
        };
    }
}

// Global availability
window.MapsPerformanceManager = MapsPerformanceManager;