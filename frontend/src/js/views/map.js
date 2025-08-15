/**
 * Unified Map View
 * Shows party markers on Google Maps
 */

import { groupPartiesByDay } from '../services/parties-utils.js?v=b037';
import { renderSidebarDays, buildMonSatFallback, syncActiveDay } from '../ui/sidebar-days.js?v=b037';
import { MtmMapSource, createMtmMapToggle } from '../map-mtm.js';

const API_BASE = window.__ENV?.API_BASE || '/api';
const COLOGNE_CENTER = { lat: 50.9375, lng: 6.9603 }; // Cologne city center

// Store map instance and markers
let mapInstance = null;
let markers = [];
let markersVisible = true;
let mtmSource = null;

/**
 * Wait for Google Maps to be loaded
 * Maps script is loaded in index.html with libraries=marker
 */
async function loadGoogleMaps() {
  // Check if already loaded
  if (window.google?.maps?.marker?.AdvancedMarkerElement) {
    return true;
  }

  // Wait for script load event or check if it's already loading
  return new Promise((resolve, reject) => {
    // Find the Maps script tag
    const mapScript = document.querySelector('script[src*="maps.googleapis.com"]');
    
    if (!mapScript) {
      reject(new Error('Google Maps script not found. Please check index.html'));
      return;
    }
    
    // Set up load handler
    const checkLoaded = () => {
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        resolve(true);
      } else {
        // Wait a bit more for the library to fully initialize
        setTimeout(() => {
          if (window.google?.maps?.marker?.AdvancedMarkerElement) {
            resolve(true);
          } else {
            reject(new Error('Google Maps loaded but marker library not available'));
          }
        }, 500);
      }
    };
    
    // If script is already loaded, check immediately
    if (mapScript.loaded || window.google?.maps) {
      checkLoaded();
    } else {
      // Wait for script to load
      mapScript.addEventListener('load', checkLoaded);
      mapScript.addEventListener('error', () => {
        reject(new Error('Failed to load Google Maps script'));
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Google Maps loading timeout'));
      }, 10000);
    }
  });
}

/**
 * Extract ISO date from hash (e.g., #/map/2025-08-22)
 */
function isoFromHash() {
  const m = location.hash.match(/^#\/map\/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/**
 * Convert various date formats to ISO date string
 */
function toISO(x) {
  if (!x) return null;
  const d = new Date(x);
  if (isNaN(d)) return null;
  // normalize to local day
  const local = new Date(d.getTime() - d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,10);
}

/**
 * Fetch party data from API and filter by day if specified
 */
async function fetchParties() {
  try {
    const dayISO = isoFromHash();
    const conf = (window.APP && APP.conference) || 'gamescom2025';
    
    const response = await fetch(`${API_BASE}/parties?conference=${encodeURIComponent(conf)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const rows = data?.data || [];
    
    // Filter by day if specified in URL
    if (dayISO) {
      console.log(`Filtering parties for day: ${dayISO}`);
      return rows.filter(e => {
        const eventDate = e.date || toISO(e.start || e.startsAt || e.startTime || e.when);
        return eventDate === dayISO;
      });
    }
    
    return rows;
  } catch (error) {
    console.error('Failed to fetch parties:', error);
    return [];
  }
}

/**
 * Geocode venue to coordinates (simple mapping for known venues)
 */
function geocodeVenue(venue) {
  const knownVenues = {
    'Kölnmesse Confex': { lat: 50.9473, lng: 6.9830 },
    'Bootshaus': { lat: 50.9322, lng: 6.9642 },
    'Gamescom City Hub': { lat: 50.9413, lng: 6.9583 },
    'Friesenplatz': { lat: 50.9404, lng: 6.9396 },
    'Lanxess Arena': { lat: 50.9384, lng: 6.9830 },
    'Koln Triangle': { lat: 50.9413, lng: 6.9719 },
    'Hohenzollernring': { lat: 50.9384, lng: 6.9396 },
    'Koelnmesse': { lat: 50.9473, lng: 6.9830 },
    'Cologne Cathedral': { lat: 50.9413, lng: 6.9583 },
    'MediaPark': { lat: 50.9486, lng: 6.9442 }
  };
  
  // Check for exact match or partial match
  for (const [name, coords] of Object.entries(knownVenues)) {
    if (venue && (venue.includes(name) || name.includes(venue))) {
      return coords;
    }
  }
  
  // Generate pseudo-random position near Cologne for unknown venues
  if (venue) {
    const hash = venue.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offsetLat = (hash % 100 - 50) * 0.001;
    const offsetLng = ((hash >> 8) % 100 - 50) * 0.001;
    return {
      lat: COLOGNE_CENTER.lat + offsetLat,
      lng: COLOGNE_CENTER.lng + offsetLng
    };
  }
  
  return COLOGNE_CENTER;
}

/**
 * Create info window content for marker
 */
function createInfoContent(party) {
  return `
    <div style="font-family: system-ui; max-width: 250px;">
      <h3 style="margin: 0 0 8px; color: #1a1a1a;">${party.title || 'Event'}</h3>
      <p style="margin: 4px 0; color: #666;">
        📍 ${party.venue || 'TBA'}<br>
        📅 ${party.date || ''} ${party.time || ''}<br>
        ${party.price ? `💰 ${party.price}` : ''}
      </p>
      ${party.description ? `<p style="margin: 8px 0 0; color: #666; font-size: 13px;">${party.description}</p>` : ''}
    </div>
  `;
}

/**
 * Initialize map with markers
 */
async function initializeMap(container, parties) {
  // Build map options (focus will be handled after markers are created)
  const mapOptions = {
    center: COLOGNE_CENTER,
    zoom: 13
  };
  
  // Use mapId for cloud-styled map (no inline styles when mapId is present)
  const MAP_ID = 'conference_party_map';
  if (MAP_ID) {
    mapOptions.mapId = MAP_ID; // Cloud styling source of truth
  }
  
  // Create map with mapId for AdvancedMarkerElement
  mapInstance = new google.maps.Map(container, mapOptions);
  
  // Prepare data for markers
  const infoWindow = new google.maps.InfoWindow();
  
  parties.forEach(party => {
    const position = geocodeVenue(party.venue);
    
    // Create custom marker content
    const markerContent = document.createElement('div');
    markerContent.style.cssText = `
      width: 24px;
      height: 24px;
      background: #8a6bff;
      border: 2px solid #ffffff;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s;
    `;
    markerContent.title = party.title;
    
    // Add hover effect
    markerContent.addEventListener('mouseenter', () => {
      markerContent.style.transform = 'scale(1.2)';
    });
    markerContent.addEventListener('mouseleave', () => {
      markerContent.style.transform = 'scale(1)';
    });
    
    // Create AdvancedMarkerElement
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position,
      map: mapInstance,
      content: markerContent,
      title: party.title
    });
    
    // Store party ID with marker for lookup
    marker.partyId = party.id;
    marker.partyData = party;
    
    // Add click listener for info window
    marker.addListener('click', () => {
      infoWindow.setContent(createInfoContent(party));
      infoWindow.open({
        anchor: marker,
        map: mapInstance
      });
    });
    
    markers.push(marker);
  });
  
  // After all markers are created, handle focus from URL params
  handleMapFocus(mapInstance, markers, infoWindow);
}

/**
 * Handle map focus from URL parameters
 */
function handleMapFocus(map, markers, infoWindow) {
  // Parse URL parameters
  const params = new URLSearchParams((location.hash.split('?')[1] || ''));
  const focusId = params.get('focus');
  const lat = parseFloat(params.get('lat'));
  const lng = parseFloat(params.get('lng')) || parseFloat(params.get('lon')); // Support both lng and lon
  const venue = params.get('venue');
  
  if (focusId) {
    // Find marker by party ID
    const targetMarker = markers.find(m => m.partyId === focusId);
    if (targetMarker) {
      // Pan to marker position
      setTimeout(() => {
        map.panTo(targetMarker.position);
        map.setZoom(16); // Zoom in for focused view
        
        // Highlight the marker
        if (targetMarker.content) {
          targetMarker.content.style.background = '#ef4444'; // Red for focused
          targetMarker.content.style.width = '32px';
          targetMarker.content.style.height = '32px';
          targetMarker.content.style.border = '3px solid #ffffff';
          targetMarker.content.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.6)';
        }
        
        // Open info window
        infoWindow.setContent(createInfoContent(targetMarker.partyData));
        infoWindow.open({
          anchor: targetMarker,
          map: map
        });
        
        // Add bounce animation to highlight
        addBounceAnimation(targetMarker);
      }, 500); // Small delay to ensure map is ready
    }
  } else if (!isNaN(lat) && !isNaN(lng)) {
    // Pan to coordinates if no specific party ID
    setTimeout(() => {
      map.panTo({ lat, lng });
      map.setZoom(16);
      
      // Create a temporary marker at the location
      const markerContent = document.createElement('div');
      markerContent.style.cssText = `
        width: 24px;
        height: 24px;
        background: #ef4444;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      `;
      
      new google.maps.marker.AdvancedMarkerElement({
        position: { lat, lng },
        map: map,
        content: markerContent,
        title: 'Selected Location'
      });
    }, 500);
  } else if (venue) {
    // Search for marker by venue name
    setTimeout(() => {
      const targetMarker = markers.find(m => 
        m.partyData?.venue?.toLowerCase().includes(venue.toLowerCase())
      );
      
      if (targetMarker) {
        map.panTo(targetMarker.position);
        map.setZoom(16);
        
        // Highlight the marker
        if (targetMarker.content) {
          targetMarker.content.style.background = '#ef4444';
          targetMarker.content.style.width = '32px';
          targetMarker.content.style.height = '32px';
        }
        
        // Open info window
        infoWindow.setContent(createInfoContent(targetMarker.partyData));
        infoWindow.open({
          anchor: targetMarker,
          map: map
        });
      }
    }, 500);
  }
}

/**
 * Add bounce animation to marker
 */
function addBounceAnimation(marker) {
  if (!marker.content) return;
  
  // Add CSS animation
  marker.content.style.animation = 'markerBounce 0.5s ease-out 3';
  
  // Remove animation after it completes
  setTimeout(() => {
    if (marker.content) {
      marker.content.style.animation = '';
    }
  }, 1500);
}

/**
 * Toggle markers visibility
 */
function toggleMarkers(visible) {
  markersVisible = visible;
  markers.forEach(marker => {
    // AdvancedMarkerElement uses map property instead of setMap
    marker.map = visible ? mapInstance : null;
  });
}

/**
 * Create map controls
 */
function createControls(selectedDate) {
  const controls = document.createElement('div');
  controls.className = 'map-controls';
  controls.innerHTML = `
    <label class="map-control">
      <input type="checkbox" id="toggle-markers" checked>
      <span>Markers</span>
    </label>
  `;
  
  // Add MTM toggle if user is authenticated
  if (window.Auth?.current?.()) {
    controls.appendChild(createMtmMapToggle());
    
    // Initialize MTM toggle listener
    controls.querySelector('#mtm-map-toggle')?.addEventListener('change', (e) => {
      if (mtmSource) {
        mtmSource.toggle(e.target.checked);
        if (e.target.checked) {
          // Re-add markers when enabled
          mtmSource.addMarkersToMap(mapInstance, selectedDate);
        } else {
          // Clear markers when disabled
          mtmSource.clearMarkers();
        }
      }
    });
  }
  
  // Add event listeners
  controls.querySelector('#toggle-markers').addEventListener('change', (e) => {
    toggleMarkers(e.target.checked);
  });
  
  return controls;
}

/**
 * Show error state
 */
function showError(container, message, retryFn) {
  container.innerHTML = `
    <div class="map-error">
      <div class="error-icon">⚠️</div>
      <h3>Unable to load map</h3>
      <p>${message}</p>
      <button class="btn-retry">Retry</button>
    </div>
  `;
  
  container.querySelector('.btn-retry')?.addEventListener('click', () => {
    container.innerHTML = '<div class="map-loading">Loading map...</div>';
    retryFn();
  });
}

/**
 * Main render function
 */
export async function renderMap(mount) {
  if (!mount) return;
  
  // Parse day param from hash: #/map/:day
  const hashParts = (location.hash || '').split('/');
  const dayParam = hashParts[2] || null; // 'YYYY-MM-DD' or null
  
  // Reset previous instance
  mapInstance = null;
  markers = [];
  markersVisible = true;
  
  // Clean up previous MTM source
  if (mtmSource) {
    mtmSource.destroy();
    mtmSource = null;
  }
  
  // Create container structure with day indicator
  const dayISO = isoFromHash();
  const dayLabel = dayISO ? ` for ${new Date(dayISO + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}` : '';
  
  mount.innerHTML = `
    <div class="map-container">
      <div class="map-loading">Loading map${dayLabel}...</div>
    </div>
  `;
  
  // Add styles
  if (!document.querySelector('#map-styles')) {
    const style = document.createElement('style');
    style.id = 'map-styles';
    style.textContent = `
      .map-container {
        position: relative;
        width: 100%;
        height: 100vh;
        background: #0b0f17;
      }
      
      .map-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #9aa7bf;
        font-size: 16px;
      }
      
      .map-error {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #e8ecff;
      }
      
      .map-error .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .map-error h3 {
        margin: 0 0 8px;
        color: #e8ecff;
      }
      
      .map-error p {
        margin: 0 0 16px;
        color: #9aa7bf;
      }
      
      .btn-retry {
        padding: 8px 24px;
        background: linear-gradient(135deg, #6b8cff, #8a6bff);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: transform 0.2s;
      }
      
      .btn-retry:hover {
        transform: scale(1.05);
      }
      
      .map-controls {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(26, 33, 52, 0.95);
        border: 1px solid rgba(139, 129, 255, 0.3);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 100;
      }
      
      .map-control {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #e8ecff;
        font-size: 14px;
        cursor: pointer;
      }
      
      .map-control input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      
      .map-control span {
        user-select: none;
      }
      
      @keyframes markerBounce {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-10px); }
        50% { transform: translateY(0); }
        75% { transform: translateY(-5px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  const container = mount.querySelector('.map-container');
  
  async function loadMap() {
    try {
      // Load Google Maps
      await loadGoogleMaps();
      
      // 1) Fetch all parties
      const allParties = await fetchParties();
      
      if (!allParties.length) {
        showError(container, 'No event data available', loadMap);
        return;
      }
      
      // 2) Group parties by day
      const { days, byDay } = groupPartiesByDay(allParties);
      
      // 3) Render nested days under Map in sidebar
      const fallbackWeek = buildMonSatFallback(days[0]); // stable Mon..Sat if no data yet
      renderSidebarDays(days, { fallbackWeek });
      
      // 4) Pick the set to show based on day param
      const partiesToShow = (dayParam && byDay.get(dayParam)) ? byDay.get(dayParam) : allParties;
      
      // Clear loading state
      container.innerHTML = '';
      
      // Add day filter indicator if filtering
      const dayISO = isoFromHash();
      if (dayISO) {
        const dayIndicator = document.createElement('div');
        dayIndicator.style.cssText = `
          position: absolute;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(110, 94, 246, 0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        const dayDate = new Date(dayISO + 'T00:00:00');
        dayIndicator.textContent = `Showing: ${dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
        container.appendChild(dayIndicator);
      }
      
      // Create map div
      const mapDiv = document.createElement('div');
      mapDiv.style.width = '100%';
      mapDiv.style.height = '100%';
      container.appendChild(mapDiv);
      
      // Initialize map with filtered data
      await initializeMap(mapDiv, partiesToShow);
      
      // Parse selected date from dayParam
      const selectedDate = dayParam ? new Date(dayParam + 'T12:00:00') : null;
      
      // Add controls with selected date for MTM filtering
      container.appendChild(createControls(selectedDate));
      
      // Initialize MTM markers if user is authenticated
      if (window.Auth?.current?.()) {
        try {
          // Wait for Auth to be ready
          await window.Auth.init();
          const user = window.Auth.current();
          
          if (user) {
            // Initialize MTM source
            mtmSource = new MtmMapSource();
            await mtmSource.init(user.uid);
            
            // Add MTM markers to the map
            if (mtmSource.enabled) {
              mtmSource.addMarkersToMap(mapInstance, selectedDate);
            }
            
            // Set up listener for MTM events changes
            mtmSource.onEventsChange = (events) => {
              // Clear and re-add markers when events change
              mtmSource.clearMarkers();
              if (events.length > 0 && mtmSource.enabled) {
                mtmSource.addMarkersToMap(mapInstance, selectedDate);
              }
            };
          }
        } catch (error) {
          console.warn('MTM map integration not available:', error);
        }
      }
      
      // 5) Keep left rail selection in sync on navigation
      syncActiveDay();
      window.addEventListener('hashchange', syncActiveDay, { once: true });
      
    } catch (error) {
      console.error('Map initialization failed:', error);
      showError(container, error.message || 'Failed to load map', loadMap);
    }
  }
  
  // Start loading
  loadMap();
}

export default { renderMap };