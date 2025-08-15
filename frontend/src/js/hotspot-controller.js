/**
 * Hotspot Controller - Two-panel layout with heat map and venue list
 */

const API_BASE = window.__ENV?.BACKEND_BASE || '/api';

export async function renderHotspots(mount) {
  if (!mount) return;

  mount.innerHTML = `
    <div class="hotspots-container">
      <div class="grid-2">
        <div class="panel panel-map">
          <div class="panel-header">
            <h3>Heat Map</h3>
            <span class="live-badge">LIVE</span>
          </div>
          <div class="heat-map-wrapper">
            <canvas id="heat-canvas" width="800" height="600"></canvas>
          </div>
        </div>
        
        <div class="panel panel-venues">
          <div class="panel-header">
            <h3>Top Venues</h3>
            <span class="count">0 active</span>
          </div>
          <ul class="venue-list rank" id="venue-list">
            <li class="loading">Loading venues...</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  try {
    const response = await fetch(`${API_BASE}/hotspots`);
    const data = await response.json();
    
    if (data.success && data.data) {
      renderHeatMap(data.data);
      renderVenueList(data.data);
    }
  } catch (error) {
    console.error('Failed to load hotspots:', error);
    mount.querySelector('#venue-list').innerHTML = '<li class="error">Failed to load venues</li>';
  }
}

function renderHeatMap(venues) {
  const canvas = document.getElementById('heat-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  // Set proper canvas dimensions
  canvas.width = 800 * dpr;
  canvas.height = 600 * dpr;
  ctx.scale(dpr, dpr);
  
  // Clear canvas
  ctx.fillStyle = 'var(--neutral-100)';
  ctx.fillRect(0, 0, 800, 600);
  
  // Draw heat points for each venue
  venues.forEach(venue => {
    if (venue.coordinates) {
      const x = (venue.coordinates.lng + 7) * 100; // Normalize longitude
      const y = (51 - venue.coordinates.lat) * 100; // Normalize latitude
      const intensity = venue.crowdCount / 100;
      
      // Draw heat gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 50);
      gradient.addColorStop(0, `rgba(255, 107, 255, ${intensity})`);
      gradient.addColorStop(0.5, `rgba(107, 123, 255, ${intensity * 0.5})`);
      gradient.addColorStop(1, 'rgba(107, 123, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 50, y - 50, 100, 100);
    }
  });
}

function renderVenueList(venues) {
  const list = document.getElementById('venue-list');
  const count = document.querySelector('.panel-venues .count');
  
  if (!list) return;
  
  // Sort by crowd count
  const sorted = [...venues].sort((a, b) => b.crowdCount - a.crowdCount);
  
  list.innerHTML = sorted.map((venue, idx) => `
    <li class="${idx === 0 ? 'pulse' : ''}">
      <div class="venue-info">
        <span class="venue-name">${venue.name}</span>
        <span class="venue-meta">${venue.type || 'Venue'}</span>
      </div>
      <div class="venue-stats">
        <span class="crowd-count">${venue.crowdCount}</span>
        <button class="btn-icon" onclick="window.open('https://maps.google.com/?q=${encodeURIComponent(venue.name + ' Cologne')}', '_blank')">
          📍
        </button>
      </div>
    </li>
  `).join('');
  
  if (count) {
    count.textContent = `${sorted.filter(v => v.crowdCount > 0).length} active`;
  }
}

// Auto-refresh every 60 seconds
let refreshTimer;
export function startAutoRefresh() {
  clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    if (document.querySelector('#hotspots-root:not(.hidden)')) {
      renderHotspots(document.querySelector('#hotspots-root'));
    }
  }, 60000);
}

export function stopAutoRefresh() {
  clearInterval(refreshTimer);
}

// Start auto-refresh when visible
document.addEventListener('route:change', (e) => {
  if (e.detail?.name === 'hotspots') {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});

export default { renderHotspots };