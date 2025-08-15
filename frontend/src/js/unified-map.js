/**
 * Unified Map & Hotspots Controller
 * Combines map view with hotspot heatmap visualization
 */

import { emptyState } from '/js/ui-feedback.js?v=b030';

const API_BASE = (window.__ENV && window.__ENV.API_BASE) || '/api';

// Venue coordinates for Cologne/Gamescom area
const VENUE_COORDS = {
  'Kölnmesse Confex': { lat: 50.9473, lng: 6.9830, x: 520, y: 240 },
  'Bootshaus': { lat: 50.9322, lng: 6.9642, x: 530, y: 320 },
  'Gamescom City Hub': { lat: 50.9413, lng: 6.9583, x: 480, y: 220 },
  'Friesenplatz': { lat: 50.9404, lng: 6.9396, x: 460, y: 210 },
  'Lanxess Arena': { lat: 50.9384, lng: 6.9830, x: 600, y: 260 },
  'Koln Triangle': { lat: 50.9413, lng: 6.9719, x: 580, y: 220 },
  'Hohenzollernring': { lat: 50.9384, lng: 6.9396, x: 440, y: 230 },
};

// Hash function for unknown venues
function hash(s) { 
  let h = 0; 
  for(let i = 0; i < s.length; i++) { 
    h = (h << 5) - h + s.charCodeAt(i); 
    h |= 0; 
  } 
  return h; 
}

// Get position for venue
function getVenuePosition(name) {
  if (VENUE_COORDS[name]) {
    return { 
      x: VENUE_COORDS[name].x, 
      y: VENUE_COORDS[name].y,
      lat: VENUE_COORDS[name].lat,
      lng: VENUE_COORDS[name].lng
    };
  }
  // Generate pseudo-random position for unknown venues
  const h = Math.abs(hash(name)) % 1000;
  return {
    x: 120 + (h % 560),
    y: 120 + ((h >> 3) % 260),
    lat: null,
    lng: null
  };
}

// Create SVG heatmap
function createHeatmapSVG(venues) {
  const w = 800, h = 500;
  
  const dots = venues.map(v => {
    const pos = getVenuePosition(v.name);
    const radius = 10 + Math.min(30, v.weight * 4);
    const opacity = Math.min(0.75, 0.25 + v.weight * 0.08);
    
    return `
      <g class="venue-dot" data-venue="${v.name}" data-count="${v.weight}">
        <circle cx="${pos.x}" cy="${pos.y}" r="${radius}" 
                fill="url(#heatGradient)" opacity="${opacity}" 
                class="heat-circle">
          <animate attributeName="r" 
                   values="${radius};${radius + 5};${radius}" 
                   dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="${pos.x}" y="${pos.y - radius - 5}" 
              text-anchor="middle" fill="#e8ecff" font-size="12" opacity="0" 
              class="venue-label">
          ${v.name} (${v.weight})
        </text>
      </g>`;
  }).join('');
  
  return `
    <svg viewBox="0 0 ${w} ${h}" class="map-svg" role="img" aria-label="Venue Hotspots">
      <defs>
        <radialGradient id="heatGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#8a6bff" stop-opacity="1"/>
          <stop offset="50%" stop-color="#6b7bff" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#2c2f7a" stop-opacity="0"/>
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="${w}" height="${h}" rx="16" ry="16" 
            fill="rgba(14,19,32,0.95)" stroke="rgba(139,129,255,0.2)"/>
      <text x="${w/2}" y="30" text-anchor="middle" 
            fill="#9aa7bf" font-size="14" opacity="0.8">
        Gamescom 2025 Venue Activity
      </text>
      ${dots}
    </svg>`;
}

// Create venue list item
function createVenueItem(venue, index, maxWeight) {
  const percentage = Math.max(6, Math.round((venue.weight / maxWeight) * 100));
  const pos = getVenuePosition(venue.name);
  
  const item = document.createElement('div');
  item.className = 'venue-item';
  item.innerHTML = `
    <div class="venue-rank">${index + 1}</div>
    <div class="venue-info">
      <div class="venue-name">${venue.name}</div>
      <div class="venue-meta">
        <span class="venue-count">${venue.weight} events</span>
        ${pos.lat ? `<button class="venue-action" data-venue="${venue.name}" data-lat="${pos.lat}" data-lng="${pos.lng}">
          📍 Map
        </button>` : ''}
      </div>
    </div>
    <div class="venue-bar">
      <div class="venue-fill" style="width: ${percentage}%"></div>
    </div>
  `;
  
  // Add map action handler
  const mapBtn = item.querySelector('.venue-action');
  if (mapBtn) {
    mapBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const lat = e.target.dataset.lat;
      const lng = e.target.dataset.lng;
      const name = e.target.dataset.venue;
      
      // Open in Google Maps
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`, '_blank');
    });
  }
  
  return item;
}

// Main render function
export async function renderUnifiedMap(mount) {
  if (!mount) return;
  
  // Create layout
  mount.innerHTML = `
    <div class="unified-map-container">
      <div class="map-header">
        <h2>Map & Hotspots</h2>
        <div class="map-controls">
          <button class="map-toggle active" data-view="heat">Heat Map</button>
          <button class="map-toggle" data-view="list">List View</button>
          <span class="live-badge">LIVE</span>
        </div>
      </div>
      <div class="map-content">
        <div class="map-view active" data-view="heat">
          <div class="heatmap-container"></div>
        </div>
        <div class="map-view" data-view="list">
          <div class="venue-list"></div>
        </div>
      </div>
    </div>
  `;
  
  // Add styles if not present
  if (!document.querySelector('#unified-map-styles')) {
    const style = document.createElement('style');
    style.id = 'unified-map-styles';
    style.textContent = `
      .unified-map-container {
        padding: 24px;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .map-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .map-header h2 {
        color: #e8ecff;
        margin: 0;
      }
      .map-controls {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .map-toggle {
        padding: 8px 16px;
        background: rgba(139,129,255,0.1);
        border: 1px solid rgba(139,129,255,0.3);
        color: #9aa7bf;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .map-toggle.active {
        background: linear-gradient(135deg, #6b8cff, #8a6bff);
        color: white;
        border-color: transparent;
      }
      .live-badge {
        padding: 4px 12px;
        background: rgba(255,92,92,0.2);
        color: #ff5c5c;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      .map-content {
        flex: 1;
        position: relative;
        background: rgba(14,19,32,0.5);
        border-radius: 16px;
        border: 1px solid rgba(139,129,255,0.2);
        overflow: hidden;
      }
      .map-view {
        position: absolute;
        inset: 0;
        padding: 24px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s, visibility 0.3s;
      }
      .map-view.active {
        opacity: 1;
        visibility: visible;
      }
      .heatmap-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .map-svg {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
      }
      .venue-dot:hover .venue-label {
        opacity: 1 !important;
      }
      .venue-dot:hover .heat-circle {
        filter: url(#glow);
        cursor: pointer;
      }
      .venue-list {
        height: 100%;
        overflow-y: auto;
      }
      .venue-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px;
        background: rgba(139,129,255,0.05);
        border: 1px solid rgba(139,129,255,0.2);
        border-radius: 12px;
        margin-bottom: 8px;
        transition: all 0.2s;
      }
      .venue-item:hover {
        background: rgba(139,129,255,0.1);
        transform: translateX(4px);
      }
      .venue-rank {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #6b8cff, #8a6bff);
        border-radius: 8px;
        font-weight: 600;
        color: white;
      }
      .venue-info {
        flex: 1;
      }
      .venue-name {
        color: #e8ecff;
        font-weight: 500;
        margin-bottom: 4px;
      }
      .venue-meta {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .venue-count {
        color: #9aa7bf;
        font-size: 14px;
      }
      .venue-action {
        padding: 4px 8px;
        background: rgba(139,129,255,0.2);
        border: 1px solid rgba(139,129,255,0.3);
        color: #8a6bff;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .venue-action:hover {
        background: rgba(139,129,255,0.3);
      }
      .venue-bar {
        width: 100px;
        height: 8px;
        background: rgba(139,129,255,0.1);
        border-radius: 4px;
        overflow: hidden;
      }
      .venue-fill {
        height: 100%;
        background: linear-gradient(90deg, #6b8cff, #8a6bff);
        border-radius: 4px;
        transition: width 0.5s ease;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Load data
  let venues = [];
  try {
    const response = await fetch(`${API_BASE}/parties?conference=gamescom2025`);
    const json = await response.json();
    const events = Array.isArray(json?.data) ? json.data : [];
    
    // Aggregate by venue
    const venueMap = new Map();
    events.forEach(event => {
      const venueName = (event.venue || 'Unknown').trim();
      venueMap.set(venueName, (venueMap.get(venueName) || 0) + 1);
    });
    
    // Convert to array and sort by weight
    venues = Array.from(venueMap.entries())
      .map(([name, weight]) => ({ name, weight }))
      .sort((a, b) => b.weight - a.weight);
      
  } catch (error) {
    console.error('Failed to load venue data:', error);
  }
  
  if (!venues.length) {
    mount.querySelector('.heatmap-container').appendChild(emptyState('No venue data available'));
    mount.querySelector('.venue-list').appendChild(emptyState('No venues to display'));
    return;
  }
  
  const maxWeight = venues[0].weight;
  
  // Render heatmap
  mount.querySelector('.heatmap-container').innerHTML = createHeatmapSVG(venues);
  
  // Render venue list
  const venueList = mount.querySelector('.venue-list');
  venues.slice(0, 20).forEach((venue, index) => {
    venueList.appendChild(createVenueItem(venue, index, maxWeight));
  });
  
  // Handle view toggle
  mount.querySelectorAll('.map-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.target.dataset.view;
      
      // Update toggle buttons
      mount.querySelectorAll('.map-toggle').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // Update views
      mount.querySelectorAll('.map-view').forEach(v => {
        v.classList.toggle('active', v.dataset.view === view);
      });
    });
  });
  
  // Auto-refresh every 60 seconds
  const refreshInterval = setInterval(() => {
    if (!document.contains(mount)) {
      clearInterval(refreshInterval);
      return;
    }
    renderUnifiedMap(mount);
  }, 60000);
}

// Export for router
export default { renderUnifiedMap };