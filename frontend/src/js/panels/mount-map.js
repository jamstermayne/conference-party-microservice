// mount-map.js - Mount map panel with today's events
import { jsonGET } from '../utils/json-fetch.js';
import { loadGoogleMaps, getMapsStatus } from '../services/google-maps-loader.js';

export async function mountMap(container) {
  const today = new Date().toISOString().slice(0, 10);
  
  // Initial UI with loading state
  container.innerHTML = `
    <div class="map-container" style="position: relative; height: 100%;">
      <div id="map-view" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
        <div class="map-loading" style="text-align: center;">
          <div style="font-size: 2em; margin-bottom: 0.5em;">🗺️</div>
          <div>Loading map...</div>
        </div>
      </div>
      <div class="map-controls" style="position: absolute; top: var(--s-3); right: var(--s-3); z-index: 10; display: none;">
        <div class="segmented-control">
          <button class="segment active" data-view="markers">Markers</button>
          <button class="segment" data-view="heatmap">Heatmap</button>
        </div>
      </div>
    </div>
  `;
  
  try {
    // Initialize map with error handling
    await initializeMap(container.querySelector('#map-view'), today);
    
    // Show controls after successful load
    const controls = container.querySelector('.map-controls');
    if (controls) controls.style.display = 'block';
    
    // Wire up controls
    container.querySelectorAll('.segment').forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll('.segment').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        // Toggle map view mode
        if (btn.dataset.view === 'heatmap' && window.mapInstance) {
          console.log('Heatmap view selected');
        }
      };
    });
  } catch (error) {
    console.error('[mount-map] Failed to initialize map:', error);
    showMapError(container, error);
  }
}

async function initializeMap(mapContainer, date) {
  // Guard: Check if container is valid
  if (!mapContainer) {
    throw new Error('Map container not found');
  }
  
  // Load Google Maps with robust loader
  let mapsApi;
  try {
    mapsApi = await loadGoogleMaps();
  } catch (error) {
    console.error('[mount-map] Google Maps load failed:', error);
    throw new Error(`Failed to load Google Maps: ${error.message}`);
  }
  
  // Guard: Verify Maps API is loaded
  if (!mapsApi) {
    throw new Error('Google Maps API not available');
  }
  
  // Import required libraries
  const { Map } = await google.maps.importLibrary('maps');
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
  
  // Clear loading state
  mapContainer.innerHTML = '';
  
  // Create map centered on Cologne
  const map = new Map(mapContainer, {
    center: { lat: 50.938, lng: 6.96 },
    zoom: 12,
    mapId: 'conference-party-map',
    gestureHandling: 'cooperative',
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true
  });
  
  window.mapInstance = map;
  
  // Load and display parties for today
  try {
    const params = new URLSearchParams({ conference: 'gamescom2025', day: date });
    const data = await jsonGET(`/api/parties?${params}`);
    const parties = data.data || data.parties || [];
    
    let validMarkers = 0;
    parties.forEach(party => {
      if (party.lat && party.lon) {
        try {
          new AdvancedMarkerElement({
            map,
            position: { lat: parseFloat(party.lat), lng: parseFloat(party.lon) },
            title: party.name || party.title
          });
          validMarkers++;
        } catch (err) {
          console.warn('[mount-map] Failed to create marker:', err);
        }
      }
    });
    
    console.log(`[mount-map] Created ${validMarkers} markers from ${parties.length} events`);
  } catch (err) {
    console.error('[mount-map] Failed to load map markers:', err);
    // Continue without markers - map is still usable
  }
}

function showMapError(container, error) {
  const status = getMapsStatus();
  
  container.innerHTML = `
    <div class="map-error" style="padding: var(--s-4); text-align: center;">
      <div style="font-size: 3em; margin-bottom: 0.5em;">⚠️</div>
      <h3>Unable to load map</h3>
      <p style="color: var(--color-text-secondary); margin: var(--s-2) 0;">
        ${error.message || 'An error occurred while loading the map'}
      </p>
      <details style="margin-top: var(--s-3); text-align: left;">
        <summary style="cursor: pointer;">Technical details</summary>
        <pre style="font-size: 0.85em; margin-top: var(--s-2);">${JSON.stringify(status, null, 2)}</pre>
      </details>
      <button onclick="location.reload()" style="margin-top: var(--s-3); padding: var(--s-2) var(--s-4); background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer;">
        Reload Page
      </button>
    </div>
  `;
}