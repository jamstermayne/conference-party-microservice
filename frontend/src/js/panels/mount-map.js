// mount-map.js - Mount map panel with today's events
import { jsonGET } from '../utils/json-fetch.js';

export async function mountMap(container) {
  const today = new Date().toISOString().slice(0, 10);
  
  container.innerHTML = `
    <div class="map-container" style="position: relative; height: 100%;">
      <div id="map-view" style="width: 100%; height: 100%;"></div>
      <div class="map-controls" style="position: absolute; top: var(--s-3); right: var(--s-3); z-index: 10;">
        <div class="segmented-control">
          <button class="segment active" data-view="markers">Markers</button>
          <button class="segment" data-view="heatmap">Heatmap</button>
        </div>
      </div>
    </div>
  `;
  
  // Initialize map
  await initializeMap(container.querySelector('#map-view'), today);
  
  // Wire up controls
  container.querySelectorAll('.segment').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.segment').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      // Toggle map view mode
      if (btn.dataset.view === 'heatmap' && window.mapInstance) {
        // Enable heatmap view if available
        console.log('Heatmap view selected');
      }
    };
  });
}

async function initializeMap(mapContainer, date) {
  // Lazy load Google Maps if needed
  if (!window.google?.maps) {
    await loadGoogleMaps();
  }
  
  const { Map } = await google.maps.importLibrary('maps');
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
  
  // Create map centered on Cologne
  const map = new Map(mapContainer, {
    center: { lat: 50.938, lng: 6.96 },
    zoom: 12,
    mapId: 'conference-party-map'
  });
  
  window.mapInstance = map;
  
  // Load and display parties for today
  try {
    const params = new URLSearchParams({ conference: 'gamescom2025', day: date });
    const data = await jsonGET(`/api/parties?${params}`);
    const parties = data.data || data.parties || [];
    
    parties.forEach(party => {
      if (party.lat && party.lon) {
        new AdvancedMarkerElement({
          map,
          position: { lat: parseFloat(party.lat), lng: parseFloat(party.lon) },
          title: party.name || party.title
        });
      }
    });
  } catch (err) {
    console.error('Failed to load map markers:', err);
  }
}

async function loadGoogleMaps() {
  if (document.querySelector('script[src*="maps.googleapis.com"]')) {
    // Wait for existing script to load
    await new Promise(resolve => {
      const checkMaps = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkMaps);
          resolve();
        }
      }, 100);
    });
    return;
  }
  
  const script = document.createElement('script');
  script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyD5Zj_Hj31Vda3bcybxX6W4zmDlg8cotgc&v=weekly&loading=async&libraries=marker';
  script.async = true;
  document.head.appendChild(script);
  await new Promise(resolve => script.onload = resolve);
}