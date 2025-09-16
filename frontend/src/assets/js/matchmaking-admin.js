/**
 * Matchmaking Admin Dashboard
 * Integrates visualizations and handles data processing
 */

import { renderHeatmap, buildCapNeedMatrix, addHeatmapInteractivity } from '/assets/js/viz-heatmap.js';
import { renderMatchGraph, addGraphInteractivity, graphFromMatches } from '/assets/js/viz-graph.js';
import { firebaseService } from '/assets/js/firebase-integration.js';

// Data stores
let allActors = [];
let allMatches = [];
let uploadedFile = null;
let realtimeEnabled = false;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeUpload();
  initializeKPIs();
  initializeFirebase();
  initializeRealtimeToggle();

  // Auto-load sample data for demo
  loadSampleData();
});

// Tab switching
function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;

      // Update active states
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(targetId).classList.add('active');

      // Render visualizations when tabs are activated
      if (targetId === 'heatmap') {
        renderHeatmapVisualization();
      } else if (targetId === 'graph') {
        renderGraphVisualization();
      } else if (targetId === 'matches') {
        renderMatchList();
      }
    });
  });
}

// File upload handling
function initializeUpload() {
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const processBtn = document.getElementById('processBtn');
  const dryRunBtn = document.getElementById('dryRunBtn');
  const downloadBtn = document.getElementById('downloadTemplate');

  // Click to browse
  uploadZone.addEventListener('click', () => fileInput.click());

  // Drag and drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  // File selection
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  // Process buttons
  processBtn.addEventListener('click', () => processUpload(false));
  dryRunBtn.addEventListener('click', () => processUpload(true));

  // Download template
  downloadBtn.addEventListener('click', () => {
    window.location.href = '/data/attendees_minimal_template.csv';
  });
}

function handleFiles(files) {
  if (files.length === 0) return;

  const file = files[0];
  const validTypes = ['text/csv', 'application/vnd.ms-excel',
                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    showStatus('Please upload a CSV or Excel file', 'error');
    return;
  }

  uploadedFile = file;
  document.getElementById('processBtn').disabled = false;
  document.getElementById('dryRunBtn').disabled = false;

  showStatus(`File loaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, 'info');
}

async function processUpload(dryRun) {
  if (!uploadedFile) return;

  showStatus(`${dryRun ? 'Dry run' : 'Processing'} upload...`, 'info');

  // Read file content
  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = e.target.result;

    // Parse CSV (simplified - in production use Papa Parse)
    const rows = parseCSV(content);

    // Transform rows to attendees
    const attendees = rows.map(row => ({
      email: row.email,
      fullName: row.fullName || 'Unknown',
      org: row.org,
      role: (row.role || '').split('|').filter(Boolean),
      interests: (row.interests || '').split('|').filter(Boolean),
      capabilities: (row.capabilities || '').split('|').filter(Boolean),
      needs: (row.needs || '').split('|').filter(Boolean),
      platforms: (row.platforms || '').split('|').filter(Boolean),
      markets: (row.markets || '').split('|').filter(Boolean),
      tags: (row.tags || '').split('|').filter(Boolean),
      consent: {
        matchmaking: row['consent.matchmaking'] === 'true',
        marketing: row['consent.marketing'] === 'true',
        showPublicCard: row['consent.showPublicCard'] === 'true'
      }
    }));

    // Upload via Firebase
    const result = await firebaseService.uploadAttendees(attendees, {
      dryRun,
      source: 'admin-csv-upload'
    });

    if (result.success) {
      // Update KPIs
      updatePipelineKPIs(result.data);

      // Reload actors if not dry run
      if (!dryRun) {
        await loadFirebaseData();
      }

      showStatus(
        `Successfully ${dryRun ? 'validated' : 'processed'} ${result.data.created} records`,
        'success'
      );
    } else {
      showStatus(`Upload failed: ${result.error}`, 'error');
      if (result.details) {
        logErrors(result.details);
      }
    }
  };

  reader.readAsText(uploadedFile);
}

function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split(',').map(v => v.trim());
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row);
  }

  return rows;
}

async function processAttendees(rows, dryRun) {
  const result = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    matchesCreated: 0,
    matchesUpdated: 0
  };

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];

      // Transform row to attendee/actor format
      const actor = {
        id: `a-${Date.now()}-${i}`,
        actorType: 'attendee',
        name: row.fullName || 'Unknown',
        org: row.org,
        role: (row.role || '').split('|').filter(Boolean),
        interests: (row.interests || '').split('|').filter(Boolean),
        capabilities: (row.capabilities || '').split('|').filter(Boolean),
        needs: (row.needs || '').split('|').filter(Boolean),
        platforms: (row.platforms || '').split('|').filter(Boolean),
        markets: (row.markets || '').split('|').filter(Boolean),
        tags: (row.tags || '').split('|').filter(Boolean),
        consent: {
          matchmaking: row['consent.matchmaking'] === 'true',
          marketing: row['consent.marketing'] === 'true',
          showPublicCard: row['consent.showPublicCard'] === 'true'
        }
      };

      // Check for out-of-taxonomy data
      const validRoles = ['Developer', 'Publisher', 'Investor', 'Tooling', 'Brand'];
      const validInterests = ['Backend', 'Analytics', 'XR', 'UA', 'Publishing', 'Funding'];

      const invalidRoles = actor.role.filter(r => !validRoles.includes(r));
      const invalidInterests = actor.interests.filter(i => !validInterests.includes(i));

      if (invalidRoles.length > 0 || invalidInterests.length > 0) {
        result.errors.push({
          row: i + 1,
          error: `Out-of-taxonomy data: roles=${invalidRoles.join(',')} interests=${invalidInterests.join(',')}`
        });
        result.skipped++;
        continue;
      }

      // Skip if no consent for matchmaking
      if (!actor.consent.matchmaking) {
        result.skipped++;
        addLog(`Row ${i + 1}: Skipped - no matchmaking consent`);
        continue;
      }

      if (!dryRun) {
        // Add to actors array (in production, save to Firebase)
        allActors.push(actor);
        result.created++;

        // Generate sample matches
        generateSampleMatches(actor);
        result.matchesCreated += Math.floor(Math.random() * 5) + 1;
      } else {
        result.created++;
      }

    } catch (error) {
      result.errors.push({ row: i + 1, error: error.message });
    }
  }

  return result;
}

// Generate sample matches for demo
function generateSampleMatches(newActor) {
  // Match with existing actors
  allActors.slice(0, -1).forEach(existingActor => {
    // Simple scoring based on overlaps
    let score = 0;
    let reasons = [];

    // Platform overlap
    const platformOverlap = newActor.platforms.filter(p =>
      existingActor.platforms?.includes(p)
    ).length;
    if (platformOverlap > 0) {
      score += platformOverlap * 0.2;
      reasons.push(`Platform alignment (${platformOverlap} common)`);
    }

    // Capability-need match
    const capNeedMatch = newActor.capabilities.filter(c =>
      existingActor.needs?.includes(c)
    ).length;
    if (capNeedMatch > 0) {
      score += capNeedMatch * 0.3;
      reasons.push(`Capability-need fit (${capNeedMatch} matches)`);
    }

    // Role synergy
    if (newActor.role.includes('Developer') && existingActor.role?.includes('Publisher')) {
      score += 0.3;
      reasons.push('Developer-Publisher synergy');
    }

    if (score > 0.3) {
      allMatches.push({
        a: newActor.id,
        b: existingActor.id,
        score: Math.min(score, 1),
        reasons
      });
    }
  });
}

// KPI animation
function updatePipelineKPIs(data) {
  const kpis = {
    created: data.created || 0,
    updated: data.updated || 0,
    skipped: data.skipped || 0,
    errors: data.errors?.length || 0,
    matchesCreated: data.matchesCreated || 0,
    matchesUpdated: data.matchesUpdated || 0,
    totalActors: allActors.length,
    avgScore: allMatches.length > 0
      ? (allMatches.reduce((sum, m) => sum + m.score, 0) / allMatches.length).toFixed(2)
      : '0.00'
  };

  Object.entries(kpis).forEach(([key, value]) => {
    const element = document.querySelector(`[data-kpi="${key}"]`);
    if (!element) return;

    const current = parseFloat(element.dataset.val || '0');
    const target = parseFloat(value);

    if (current === target) return;

    element.classList.add('updating');

    // Animate number change
    const steps = 20;
    const increment = (target - current) / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const newValue = current + (increment * step);

      if (step >= steps) {
        element.dataset.val = target;
        element.textContent = key === 'avgScore'
          ? target.toFixed(2)
          : Math.round(target).toLocaleString();
        element.classList.remove('updating');
        clearInterval(interval);
      } else {
        element.textContent = key === 'avgScore'
          ? newValue.toFixed(2)
          : Math.round(newValue).toLocaleString();
      }
    }, 30);
  });
}

// Initialize KPIs
function initializeKPIs() {
  updatePipelineKPIs({
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    matchesCreated: 0,
    matchesUpdated: 0
  });
}

// Render heatmap
function renderHeatmapVisualization() {
  if (allActors.length === 0) {
    showStatus('No data available. Please upload attendees first.', 'info');
    return;
  }

  const { matrix, rows, cols } = buildCapNeedMatrix(allActors);
  renderHeatmap({
    mountId: 'heatmapCanvas',
    matrix,
    rows,
    cols
  });

  // Add interactivity
  const canvas = document.getElementById('heatmapCanvas');
  addHeatmapInteractivity(canvas, matrix, rows, cols);
}

// Render graph
function renderGraphVisualization() {
  if (allMatches.length === 0) {
    showStatus('No matches available. Process attendees first.', 'info');
    return;
  }

  const { nodes, edges } = graphFromMatches(allActors, allMatches, 0.3);

  const graphControl = renderMatchGraph({
    mountId: 'matchGraph',
    nodes,
    edges
  });

  // Add interactivity
  const canvas = document.getElementById('matchGraph');
  addGraphInteractivity(canvas, nodes, edges);
}

// Render match list
function renderMatchList() {
  const matchList = document.getElementById('matchList');

  if (allMatches.length === 0) {
    matchList.innerHTML = '<p class="muted">No matches found yet.</p>';
    return;
  }

  const topMatches = allMatches
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const html = topMatches.map(match => {
    const actorA = allActors.find(a => a.id === match.a);
    const actorB = allActors.find(a => a.id === match.b);

    return `
      <div style="padding: 12px; margin: 8px 0; background: #0d0e1a; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${actorA?.name || match.a}</strong> ↔ <strong>${actorB?.name || match.b}</strong>
          </div>
          <div style="color: #6aa2ff; font-weight: bold;">
            ${(match.score * 100).toFixed(0)}%
          </div>
        </div>
        <div style="color: #a8b0c3; font-size: 12px; margin-top: 4px;">
          ${match.reasons.join(' • ')}
        </div>
      </div>
    `;
  }).join('');

  matchList.innerHTML = html;
}

// Logging
function addLog(message) {
  const logContent = document.getElementById('logContent');
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `<div>[${timestamp}] ${message}</div>`;
  logContent.insertAdjacentHTML('beforeend', logEntry);
  logContent.scrollTop = logContent.scrollHeight;
}

function logErrors(errors) {
  errors.forEach(error => {
    addLog(`<span style="color:#ff6b6b">ERROR Row ${error.row}:</span> ${error.error}`);
  });
}

// Status messages
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('statusMessage');
  statusEl.className = `status ${type}`;
  statusEl.textContent = message;
  statusEl.style.display = 'block';

  if (type !== 'error') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
  }
}

// Initialize Firebase connection
async function initializeFirebase() {
  addLog('Connecting to Firebase...');

  try {
    // Load initial data
    await loadFirebaseData();

    // Get statistics
    const stats = await firebaseService.getStatistics();
    if (stats) {
      updatePipelineKPIs({
        created: stats.totalActors,
        matchesCreated: stats.totalMatches,
        totalActors: stats.totalActors,
        avgScore: stats.avgScore
      });

      addLog(`Firebase connected: ${stats.totalActors} actors, ${stats.totalMatches} matches`);
    }
  } catch (error) {
    console.error('[Admin] Firebase initialization error:', error);
    addLog(`<span style="color:#ff6b6b">Firebase connection failed. Using demo data.</span>`);
    loadDemoData();
  }
}

// Load data from Firebase
async function loadFirebaseData() {
  try {
    // Load actors and matches in parallel
    const [actors, matches] = await Promise.all([
      firebaseService.getActors({ hasConsent: true }),
      firebaseService.getMatches(null, { limit: 500 })
    ]);

    allActors = actors;
    allMatches = matches;

    addLog(`Loaded ${actors.length} actors and ${matches.length} matches from Firebase`);

    // Refresh current visualization if active
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    if (activeTab === 'heatmap') {
      renderHeatmapVisualization();
    } else if (activeTab === 'graph') {
      renderGraphVisualization();
    } else if (activeTab === 'matches') {
      renderMatchList();
    }
  } catch (error) {
    console.error('[Admin] Error loading Firebase data:', error);
    addLog(`<span style="color:#ff6b6b">Error loading data: ${error.message}</span>`);
  }
}

// Initialize real-time updates toggle
function initializeRealtimeToggle() {
  // Add toggle button to header
  const container = document.querySelector('.container');
  const toggleHtml = `
    <div style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
      <button id="realtimeToggle" class="btn btn-secondary">
        <span id="realtimeStatus">🔴</span> Real-time Updates
      </button>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', toggleHtml);

  const toggleBtn = document.getElementById('realtimeToggle');
  toggleBtn.addEventListener('click', toggleRealtime);
}

// Toggle real-time updates
function toggleRealtime() {
  realtimeEnabled = !realtimeEnabled;
  const statusIcon = document.getElementById('realtimeStatus');

  if (realtimeEnabled) {
    statusIcon.textContent = '🟢';
    enableRealtimeUpdates();
    showStatus('Real-time updates enabled', 'success');
  } else {
    statusIcon.textContent = '🔴';
    disableRealtimeUpdates();
    showStatus('Real-time updates disabled', 'info');
  }
}

// Enable real-time updates
function enableRealtimeUpdates() {
  // Subscribe to actor updates
  firebaseService.subscribeToActors((actors, changes) => {
    allActors = actors;

    // Log changes
    if (changes.added.length > 0) {
      addLog(`${changes.added.length} new actors added`);
    }
    if (changes.modified.length > 0) {
      addLog(`${changes.modified.length} actors updated`);
    }

    // Update KPIs
    updatePipelineKPIs({
      totalActors: actors.length,
      created: changes.added.length,
      updated: changes.modified.length
    });

    // Refresh visualization if needed
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    if (activeTab === 'heatmap' || activeTab === 'graph') {
      setTimeout(() => {
        if (activeTab === 'heatmap') renderHeatmapVisualization();
        else renderGraphVisualization();
      }, 500);
    }
  });

  // Subscribe to match updates
  firebaseService.subscribeToMatches((matches, changes) => {
    allMatches = matches;

    // Log changes
    if (changes.added.length > 0) {
      addLog(`${changes.added.length} new matches created`);
      updatePipelineKPIs({
        matchesCreated: changes.added.length
      });
    }

    // Refresh match list if active
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    if (activeTab === 'matches') {
      renderMatchList();
    } else if (activeTab === 'graph') {
      renderGraphVisualization();
    }
  });

  addLog('Real-time subscriptions active');
}

// Disable real-time updates
function disableRealtimeUpdates() {
  firebaseService.cleanup();
  addLog('Real-time subscriptions disabled');
}

// Load demo data fallback
function loadDemoData() {
  // Add some sample companies/sponsors for demo
  allActors = [
    {
      id: 'c-techgames',
      actorType: 'company',
      name: 'TechGames Studio',
      capabilities: ['Game Development', 'Mobile Gaming', 'Unity'],
      needs: ['Publishing', 'Marketing', 'Investment'],
      platforms: ['Mobile', 'PC'],
      markets: ['NA', 'EU']
    },
    {
      id: 's-megapublisher',
      actorType: 'sponsor',
      name: 'MegaPublisher Corp',
      capabilities: ['Publishing', 'Marketing', 'Distribution'],
      needs: ['Innovative Games', 'Mobile Titles'],
      platforms: ['Mobile', 'Console'],
      markets: ['Global']
    },
    {
      id: 'c-indiedev',
      actorType: 'company',
      name: 'Indie Innovators',
      capabilities: ['Creative Design', 'Narrative', 'Art'],
      needs: ['Funding', 'Technical Support', 'QA'],
      platforms: ['PC'],
      markets: ['NA']
    }
  ];

  // Generate initial matches
  allActors.forEach((actorA, i) => {
    allActors.slice(i + 1).forEach(actorB => {
      const score = Math.random() * 0.6 + 0.3;
      allMatches.push({
        a: actorA.id,
        b: actorB.id,
        score,
        reasons: ['Platform overlap', 'Complementary needs']
      });
    });
  });

  addLog('Demo data loaded: 3 companies/sponsors');
  updatePipelineKPIs({ created: 3, matchesCreated: 3 });
}

// Load sample data automatically for demo
async function loadSampleData() {
  addLog('Loading sample data for demo...', 'info');

  try {
    // Fetch the sample CSV
    const response = await fetch('/data/attendees_minimal_template.csv');
    const csvText = await response.text();

    // Parse CSV - handle complex format with pipes for multi-values
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    allActors = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      // Simple CSV parsing (won't handle quoted commas perfectly but ok for demo)
      const values = lines[i].split(',').map(v => v.trim());
      const actor = {};
      headers.forEach((header, idx) => {
        actor[header] = values[idx] || '';
      });

      // Use email as ID if no ID field
      actor.id = actor.email || actor['source.badgeId'] || `actor_${i}`;
      actor.name = actor.fullName || actor.name || `Actor ${i}`;

      // Parse capabilities (pipe-separated)
      if (actor.capabilities) {
        actor.capabilities = actor.capabilities.split('|').map(c => c.trim()).filter(Boolean);
      } else {
        actor.capabilities = [];
      }

      // Parse needs (pipe-separated)
      if (actor.needs) {
        actor.needs = actor.needs.split('|').map(n => n.trim()).filter(Boolean);
      } else {
        actor.needs = [];
      }

      // Parse interests (pipe-separated)
      if (actor.interests) {
        actor.interests = actor.interests.split('|').map(i => i.trim()).filter(Boolean);
      }

      // Store org and role for display
      actor.company = actor.org || actor.company || '';
      actor.role = actor.role || actor.title || '';

      allActors.push(actor);
    }

    // Generate matches
    generateMatches();

    addLog(`Sample data loaded: ${allActors.length} actors`, 'success');
    updatePipelineKPIs({
      created: allActors.length,
      matchesCreated: allMatches.length
    });

    // Auto-switch to heatmap tab to show data
    setTimeout(() => {
      const heatmapTab = document.querySelector('[data-tab="heatmap"]');
      if (heatmapTab) {
        heatmapTab.click();
      }
    }, 500);

  } catch (error) {
    console.error('Failed to load sample data:', error);
    addLog('Failed to load sample data', 'error');

    // Fall back to demo data
    loadDemoData();
  }
}

// Generate matches from loaded actors
function generateMatches() {
  allMatches = [];

  for (let i = 0; i < allActors.length; i++) {
    for (let j = i + 1; j < allActors.length; j++) {
      const actorA = allActors[i];
      const actorB = allActors[j];

      // Calculate match score based on capability/need overlap
      let score = 0;
      const reasons = [];

      // Check if A's capabilities match B's needs
      actorA.capabilities?.forEach(cap => {
        if (actorB.needs?.includes(cap)) {
          score += 20;
          reasons.push(`${actorA.name} provides ${cap}`);
        }
      });

      // Check if B's capabilities match A's needs
      actorB.capabilities?.forEach(cap => {
        if (actorA.needs?.includes(cap)) {
          score += 20;
          reasons.push(`${actorB.name} provides ${cap}`);
        }
      });

      // Add some randomness for demo
      score += Math.random() * 30;

      if (score > 25) {
        allMatches.push({
          a: actorA.id || actorA.name,
          b: actorB.id || actorB.name,
          score: Math.min(score, 100),
          reasons: reasons.length > 0 ? reasons : ['Potential synergy']
        });
      }
    }
  }

  // Sort matches by score
  allMatches.sort((a, b) => b.score - a.score);
}

// Export for debugging
window.debugMatchmaking = {
  actors: () => allActors,
  matches: () => allMatches,
  renderHeatmap: renderHeatmapVisualization,
  renderGraph: renderGraphVisualization,
  loadSample: loadSampleData
};