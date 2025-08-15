/**
 * REAL-TIME MONITORING DASHBOARD UI
 * Interactive dashboard with live metrics, alerts, and analytics
 */

class MonitoringDashboard {
  constructor() {
    this.config = {
      refreshInterval: 30000, // 30 seconds
      realTimeInterval: 5000, // 5 seconds for real-time metrics
      maxDataPoints: 100,
      animationDuration: 500
    };
    
    this.charts = new Map();
    this.metrics = new Map();
    this.alerts = [];
    this.websocket = null;
    this.isVisible = true;
    
    this.init();
  }

  /**
   * Initialize dashboard
   */
  async init() {
    try {
      await this.loadDashboard();
      this.setupEventListeners();
      this.startAutoRefresh();
      this.connectWebSocket();
      
      console.log('🎯 Monitoring Dashboard initialized');
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      this.showError('Failed to load monitoring dashboard');
    }
  }

  /**
   * Load dashboard HTML structure
   */
  async loadDashboard() {
    const dashboardHTML = `
      <div class="monitoring-dashboard">
        <!-- Dashboard Header -->
        <div class="dashboard-header">
          <h1>
            <span class="dashboard-icon">📊</span>
            Real-Time Monitoring Dashboard
          </h1>
          <div class="dashboard-controls">
            <select id="timeRange" class="time-range-selector">
              <option value="1h">Last Hour</option>
              <option value="24h" selected>Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button id="refreshBtn" class="refresh-btn">
              <span class="refresh-icon">🔄</span>
              Refresh
            </button>
            <div class="auto-refresh-toggle">
              <input type="checkbox" id="autoRefresh" checked>
              <label for="autoRefresh">Auto-refresh</label>
            </div>
          </div>
        </div>

        <!-- Alert Bar -->
        <div id="alertBar" class="alert-bar" style="display: none;"></div>

        <!-- Dashboard Grid -->
        <div class="dashboard-grid">
          <!-- System Overview Panel -->
          <div class="dashboard-panel system-overview">
            <div class="panel-header">
              <h2>🖥️ System Overview</h2>
              <div class="system-health-indicator" id="systemHealthIndicator">
                <span class="health-status healthy">●</span>
                <span class="health-text">Healthy</span>
              </div>
            </div>
            <div class="panel-content">
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-label">Uptime</div>
                  <div class="metric-value" id="uptimeValue">99.99%</div>
                  <div class="metric-trend positive" id="uptimeTrend">+0.01%</div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Active Users</div>
                  <div class="metric-value" id="activeUsersValue">5,423</div>
                  <div class="metric-trend positive" id="activeUsersTrend">+12.3%</div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Requests/min</div>
                  <div class="metric-value" id="requestsValue">1,234</div>
                  <div class="metric-trend neutral" id="requestsTrend">-2.1%</div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Error Rate</div>
                  <div class="metric-value" id="errorRateValue">0.02%</div>
                  <div class="metric-trend negative" id="errorRateTrend">-0.03%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- API Performance Panel -->
          <div class="dashboard-panel api-performance">
            <div class="panel-header">
              <h2>⚡ API Performance</h2>
            </div>
            <div class="panel-content">
              <div class="chart-container">
                <canvas id="responseTimeChart"></canvas>
              </div>
              <div class="api-stats">
                <div class="api-stat">
                  <span class="stat-label">Avg Response Time</span>
                  <span class="stat-value" id="avgResponseTime">285ms</span>
                </div>
                <div class="api-stat">
                  <span class="stat-label">P95 Response Time</span>
                  <span class="stat-value" id="p95ResponseTime">524ms</span>
                </div>
                <div class="api-stat">
                  <span class="stat-label">Throughput</span>
                  <span class="stat-value" id="throughput">234/sec</span>
                </div>
              </div>
            </div>
          </div>

          <!-- User Analytics Panel -->
          <div class="dashboard-panel user-analytics">
            <div class="panel-header">
              <h2>👥 User Analytics</h2>
            </div>
            <div class="panel-content">
              <div class="analytics-row">
                <div class="chart-container small">
                  <canvas id="userGrowthChart"></canvas>
                </div>
                <div class="chart-container small">
                  <canvas id="userDistributionChart"></canvas>
                </div>
              </div>
              <div class="user-metrics">
                <div class="user-metric">
                  <span class="metric-icon">🆕</span>
                  <div>
                    <div class="metric-value">+342</div>
                    <div class="metric-label">New Users Today</div>
                  </div>
                </div>
                <div class="user-metric">
                  <span class="metric-icon">📱</span>
                  <div>
                    <div class="metric-value">72%</div>
                    <div class="metric-label">Mobile Users</div>
                  </div>
                </div>
                <div class="user-metric">
                  <span class="metric-icon">🌍</span>
                  <div>
                    <div class="metric-value">23</div>
                    <div class="metric-label">Countries</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Security Monitoring Panel -->
          <div class="dashboard-panel security-monitoring">
            <div class="panel-header">
              <h2>🔒 Security Monitoring</h2>
              <div class="threat-level" id="threatLevel">
                <span class="threat-indicator low">●</span>
                <span class="threat-text">Low Risk</span>
              </div>
            </div>
            <div class="panel-content">
              <div class="security-metrics">
                <div class="security-metric">
                  <div class="metric-icon">🚨</div>
                  <div class="metric-info">
                    <div class="metric-value" id="securityEvents">0</div>
                    <div class="metric-label">Security Events</div>
                  </div>
                </div>
                <div class="security-metric">
                  <div class="metric-icon">🔐</div>
                  <div class="metric-info">
                    <div class="metric-value" id="failedLogins">12</div>
                    <div class="metric-label">Failed Logins</div>
                  </div>
                </div>
                <div class="security-metric">
                  <div class="metric-icon">🛡️</div>
                  <div class="metric-info">
                    <div class="metric-value" id="blockedRequests">89</div>
                    <div class="metric-label">Blocked Requests</div>
                  </div>
                </div>
              </div>
              <div class="recent-incidents">
                <h4>Recent Security Incidents</h4>
                <div id="recentIncidents" class="incidents-list">
                  <!-- Dynamic content -->
                </div>
              </div>
            </div>
          </div>

          <!-- Infrastructure Panel -->
          <div class="dashboard-panel infrastructure">
            <div class="panel-header">
              <h2>🏗️ Infrastructure</h2>
            </div>
            <div class="panel-content">
              <div class="resource-meters">
                <div class="resource-meter">
                  <div class="meter-label">CPU Usage</div>
                  <div class="meter-bar">
                    <div class="meter-fill" id="cpuMeter" style="width: 45%;"></div>
                  </div>
                  <div class="meter-value">45%</div>
                </div>
                <div class="resource-meter">
                  <div class="meter-label">Memory Usage</div>
                  <div class="meter-bar">
                    <div class="meter-fill" id="memoryMeter" style="width: 62%;"></div>
                  </div>
                  <div class="meter-value">62%</div>
                </div>
                <div class="resource-meter">
                  <div class="meter-label">Disk Usage</div>
                  <div class="meter-bar">
                    <div class="meter-fill" id="diskMeter" style="width: 34%;"></div>
                  </div>
                  <div class="meter-value">34%</div>
                </div>
              </div>
              <div class="service-status">
                <h4>Service Status</h4>
                <div class="services-grid" id="servicesGrid">
                  <!-- Dynamic content -->
                </div>
              </div>
            </div>
          </div>

          <!-- Database Health Panel -->
          <div class="dashboard-panel database-health">
            <div class="panel-header">
              <h2>🗄️ Database Health</h2>
            </div>
            <div class="panel-content">
              <div class="db-metrics">
                <div class="db-metric">
                  <div class="metric-icon">🔌</div>
                  <div>
                    <div class="metric-value" id="dbConnections">45/100</div>
                    <div class="metric-label">Connections</div>
                  </div>
                </div>
                <div class="db-metric">
                  <div class="metric-icon">⚡</div>
                  <div>
                    <div class="metric-value" id="avgQueryTime">12ms</div>
                    <div class="metric-label">Avg Query Time</div>
                  </div>
                </div>
                <div class="db-metric">
                  <div class="metric-icon">🐌</div>
                  <div>
                    <div class="metric-value" id="slowQueries">3</div>
                    <div class="metric-label">Slow Queries</div>
                  </div>
                </div>
              </div>
              <div class="slow-queries">
                <h4>Slowest Queries</h4>
                <div id="slowQueriesList" class="queries-list">
                  <!-- Dynamic content -->
                </div>
              </div>
            </div>
          </div>

          <!-- Business Metrics Panel -->
          <div class="dashboard-panel business-metrics">
            <div class="panel-header">
              <h2>📈 Business Metrics</h2>
            </div>
            <div class="panel-content">
              <div class="kpi-grid">
                <div class="kpi-card">
                  <div class="kpi-label">Daily Active Users</div>
                  <div class="kpi-value">5,420</div>
                  <div class="kpi-target">Target: 6,000</div>
                  <div class="kpi-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: 90%;"></div>
                    </div>
                  </div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">User Retention (30d)</div>
                  <div class="kpi-value">72%</div>
                  <div class="kpi-target">Target: 80%</div>
                  <div class="kpi-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: 90%;"></div>
                    </div>
                  </div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Feature Adoption</div>
                  <div class="kpi-value">73%</div>
                  <div class="kpi-target">Target: 75%</div>
                  <div class="kpi-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: 97%;"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Alerts Panel -->
          <div class="dashboard-panel alerts-panel">
            <div class="panel-header">
              <h2>🚨 Active Alerts</h2>
              <div class="alert-summary" id="alertSummary">
                <span class="alert-count critical">0</span>
                <span class="alert-count warning">2</span>
                <span class="alert-count info">1</span>
              </div>
            </div>
            <div class="panel-content">
              <div id="alertsList" class="alerts-list">
                <!-- Dynamic content -->
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div id="loadingOverlay" class="loading-overlay">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading dashboard data...</div>
        </div>
      </div>
    `;

    // Inject dashboard HTML
    document.body.insertAdjacentHTML('beforeend', dashboardHTML);
    
    // Load dashboard styles
    await this.loadStyles();
    
    // Initialize charts
    await this.initializeCharts();
  }

  /**
   * Load dashboard styles
   */
  async loadStyles() {
    const styles = `
      .monitoring-dashboard {
        background: var(--alias-f8f9fa);
        min-height: 100vh;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        margin-bottom: 20px;
      }

      .dashboard-header h1 {
        margin: 0;
        color: var(--neutral-200);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .dashboard-icon {
        font-size: 28px;
      }

      .dashboard-controls {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .time-range-selector, .refresh-btn {
        padding: 8px 16px;
        border: 1px solid var(--alias-ddd);
        border-radius: 6px;
        font-size: 14px;
      }

      .refresh-btn {
        background: var(--alias-3498db);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .refresh-btn:hover {
        background: var(--neutral-200);
      }

      .auto-refresh-toggle {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .alert-bar {
        background: var(--alias-e74c3c);
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
      }

      .dashboard-panel {
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        overflow: hidden;
      }

      .panel-header {
        padding: 15px 20px;
        border-bottom: 1px solid var(--alias-eee);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--alias-f8f9fa);
      }

      .panel-header h2 {
        margin: 0;
        font-size: 16px;
        color: var(--neutral-200);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .panel-content {
        padding: 20px;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
      }

      .metric-card {
        text-align: center;
        padding: 15px;
        border: 1px solid var(--alias-eee);
        border-radius: 6px;
        background: var(--alias-f8f9fa);
      }

      .metric-label {
        font-size: 12px;
        color: var(--alias-7f8c8d);
        margin-bottom: 5px;
      }

      .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: var(--neutral-200);
        margin-bottom: 5px;
      }

      .metric-trend {
        font-size: 12px;
        font-weight: 500;
      }

      .metric-trend.positive { color: var(--neutral-200); }
      .metric-trend.negative { color: var(--alias-e74c3c); }
      .metric-trend.neutral { color: var(--alias-7f8c8d); }

      .system-health-indicator {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .health-status {
        font-size: 16px;
      }

      .health-status.healthy { color: var(--neutral-200); }
      .health-status.warning { color: var(--alias-f39c12); }
      .health-status.critical { color: var(--alias-e74c3c); }

      .chart-container {
        height: 200px;
        margin-bottom: 15px;
      }

      .chart-container.small {
        height: 150px;
        flex: 1;
      }

      .analytics-row {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
      }

      .user-metrics {
        display: flex;
        justify-content: space-around;
      }

      .user-metric {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .metric-icon {
        font-size: 20px;
      }

      .threat-level {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .threat-indicator {
        font-size: 12px;
      }

      .threat-indicator.low { color: var(--neutral-200); }
      .threat-indicator.medium { color: var(--alias-f39c12); }
      .threat-indicator.high { color: var(--alias-e74c3c); }

      .security-metrics {
        display: flex;
        justify-content: space-around;
        margin-bottom: 20px;
      }

      .security-metric {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }

      .resource-meter {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
      }

      .meter-label {
        flex: 0 0 100px;
        font-size: 12px;
        color: var(--alias-7f8c8d);
      }

      .meter-bar {
        flex: 1;
        height: 8px;
        background: var(--alias-ecf0f1);
        border-radius: 4px;
        overflow: hidden;
      }

      .meter-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--neutral-200), var(--alias-f39c12), var(--alias-e74c3c));
        transition: width 0.3s ease;
      }

      .meter-value {
        flex: 0 0 40px;
        text-align: right;
        font-size: 12px;
        font-weight: 500;
      }

      .services-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .service-status-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: var(--alias-f8f9fa);
        border-radius: 4px;
      }

      .service-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .service-indicator.healthy { background: var(--neutral-200); }
      .service-indicator.warning { background: var(--alias-f39c12); }
      .service-indicator.critical { background: var(--alias-e74c3c); }

      .kpi-grid {
        display: grid;
        gap: 15px;
      }

      .kpi-card {
        padding: 15px;
        border: 1px solid var(--alias-eee);
        border-radius: 6px;
        background: var(--alias-f8f9fa);
      }

      .kpi-value {
        font-size: 24px;
        font-weight: bold;
        color: var(--neutral-200);
        margin: 5px 0;
      }

      .kpi-target {
        font-size: 12px;
        color: var(--alias-7f8c8d);
        margin-bottom: 10px;
      }

      .progress-bar {
        height: 6px;
        background: var(--alias-ecf0f1);
        border-radius: 3px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--alias-3498db);
        transition: width 0.3s ease;
      }

      .alerts-list {
        max-height: 300px;
        overflow-y: auto;
      }

      .alert-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border-left: 4px solid;
        margin-bottom: 10px;
        background: var(--alias-f8f9fa);
        border-radius: 0 4px 4px 0;
      }

      .alert-item.critical { border-left-color: var(--alias-e74c3c); }
      .alert-item.warning { border-left-color: var(--alias-f39c12); }
      .alert-item.info { border-left-color: var(--alias-3498db); }

      .alert-summary {
        display: flex;
        gap: 10px;
      }

      .alert-count {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        color: white;
      }

      .alert-count.critical { background: var(--alias-e74c3c); }
      .alert-count.warning { background: var(--alias-f39c12); }
      .alert-count.info { background: var(--alias-3498db); }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--alias-f3f3f3);
        border-top: 3px solid var(--alias-3498db);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 15px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-text {
        color: var(--alias-7f8c8d);
        font-size: 14px;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
        
        .dashboard-header {
          flex-direction: column;
          gap: 15px;
        }
        
        .metrics-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  /**
   * Initialize charts using Chart.js
   */
  async initializeCharts() {
    // Load Chart.js if not already loaded
    if (typeof Chart === 'undefined') {
      await this.loadScript('https://cdn.jsdelivr.net/npm/chart.js?v=b023');
    }

    // Response Time Chart
    this.charts.set('responseTime', new Chart(
      document.getElementById('responseTimeChart').getContext('2d'),
      {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Response Time (ms)',
            data: [],
            borderColor: 'var(--alias-3498db)',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'var(--alias-f0f0f0)' }
            },
            x: {
              grid: { color: 'var(--alias-f0f0f0)' }
            }
          }
        }
      }
    ));

    // User Growth Chart
    this.charts.set('userGrowth', new Chart(
      document.getElementById('userGrowthChart').getContext('2d'),
      {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Active Users',
            data: [],
            borderColor: 'var(--neutral-200)',
            backgroundColor: 'rgba(39, 174, 96, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'var(--alias-f0f0f0)' }
            },
            x: {
              grid: { color: 'var(--alias-f0f0f0)' }
            }
          }
        }
      }
    ));

    // User Distribution Chart (Pie)
    this.charts.set('userDistribution', new Chart(
      document.getElementById('userDistributionChart').getContext('2d'),
      {
        type: 'doughnut',
        data: {
          labels: ['Mobile', 'Desktop', 'Tablet'],
          datasets: [{
            data: [72, 25, 3],
            backgroundColor: ['var(--alias-3498db)', 'var(--alias-9b59b6)', 'var(--alias-e67e22)']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { fontSize: 12 }
            }
          }
        }
      }
    ));
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.refreshDashboard();
    });

    // Auto-refresh toggle
    document.getElementById('autoRefresh').addEventListener('change', (e) => {
      if (e.target.checked) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    });

    // Time range selector
    document.getElementById('timeRange').addEventListener('change', (e) => {
      this.updateTimeRange(e.target.value);
    });

    // Visibility change detection
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      if (this.isVisible) {
        this.refreshDashboard();
      }
    });
  }

  /**
   * Start auto-refresh
   */
  startAutoRefresh() {
    this.stopAutoRefresh(); // Clear existing interval
    
    this.refreshInterval = setInterval(() => {
      if (this.isVisible) {
        this.refreshDashboard();
      }
    }, this.config.refreshInterval);

    console.log('Auto-refresh started');
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Connect WebSocket for real-time updates
   */
  connectWebSocket() {
    // In a real implementation, this would connect to a WebSocket endpoint
    // For demo purposes, we'll simulate real-time updates
    this.simulateRealTimeUpdates();
  }

  /**
   * Simulate real-time updates
   */
  simulateRealTimeUpdates() {
    setInterval(() => {
      if (this.isVisible) {
        this.updateRealTimeMetrics();
      }
    }, this.config.realTimeInterval);
  }

  /**
   * Update real-time metrics
   */
  updateRealTimeMetrics() {
    // Simulate metric updates
    const activeUsers = Math.floor(Math.random() * 100) + 5300;
    const responseTime = Math.floor(Math.random() * 50) + 250;
    const errorRate = (Math.random() * 0.1).toFixed(3);

    // Update DOM elements
    const activeUsersElement = document.getElementById('activeUsersValue');
    if (activeUsersElement) {
      activeUsersElement.textContent = activeUsers.toLocaleString();
    }

    const avgResponseTimeElement = document.getElementById('avgResponseTime');
    if (avgResponseTimeElement) {
      avgResponseTimeElement.textContent = `${responseTime}ms`;
    }

    const errorRateElement = document.getElementById('errorRateValue');
    if (errorRateElement) {
      errorRateElement.textContent = `${errorRate}%`;
    }

    // Update charts
    this.updateCharts();
  }

  /**
   * Update charts with new data
   */
  updateCharts() {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString();

    // Update response time chart
    const responseTimeChart = this.charts.get('responseTime');
    if (responseTimeChart) {
      const responseTime = Math.floor(Math.random() * 100) + 200;
      
      responseTimeChart.data.labels.push(timeLabel);
      responseTimeChart.data.datasets[0].data.push(responseTime);

      // Keep only last 20 data points
      if (responseTimeChart.data.labels.length > 20) {
        responseTimeChart.data.labels.shift();
        responseTimeChart.data.datasets[0].data.shift();
      }

      responseTimeChart.update('none');
    }

    // Update user growth chart
    const userGrowthChart = this.charts.get('userGrowth');
    if (userGrowthChart) {
      const activeUsers = Math.floor(Math.random() * 100) + 5300;
      
      userGrowthChart.data.labels.push(timeLabel);
      userGrowthChart.data.datasets[0].data.push(activeUsers);

      // Keep only last 20 data points
      if (userGrowthChart.data.labels.length > 20) {
        userGrowthChart.data.labels.shift();
        userGrowthChart.data.datasets[0].data.shift();
      }

      userGrowthChart.update('none');
    }
  }

  /**
   * Refresh dashboard data
   */
  async refreshDashboard() {
    try {
      this.showLoading(true);
      
      // Fetch dashboard data from API
      const timeRange = document.getElementById('timeRange').value;
      const dashboardData = await this.fetchDashboardData(timeRange);
      
      // Update all panels
      this.updateSystemOverview(dashboardData.system_overview);
      this.updateApiPerformance(dashboardData.api_performance);
      this.updateUserAnalytics(dashboardData.user_analytics);
      this.updateSecurityMonitoring(dashboardData.security_monitoring);
      this.updateDatabaseHealth(dashboardData.database_health);
      this.updateInfrastructure(dashboardData.infrastructure);
      this.updateBusinessMetrics(dashboardData.business_metrics);
      this.updateAlerts(dashboardData.alerts);
      
      console.log('Dashboard refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      this.showError('Failed to refresh dashboard data');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Fetch dashboard data from API
   */
  async fetchDashboardData(timeRange) {
    const response = await fetch(`/api/monitoring/dashboard?timeRange=${timeRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    return await response.json();
  }

  /**
   * Update system overview panel
   */
  updateSystemOverview(data) {
    // Update health indicator
    const healthIndicator = document.getElementById('systemHealthIndicator');
    const healthStatus = healthIndicator.querySelector('.health-status');
    const healthText = healthIndicator.querySelector('.health-text');
    
    healthStatus.className = `health-status ${data.system_health}`;
    healthText.textContent = data.system_health.charAt(0).toUpperCase() + data.system_health.slice(1);
    
    // Update metrics
    this.updateMetricCard('uptime', data.uptime);
    this.updateMetricCard('activeUsers', data.active_users);
    this.updateMetricCard('requests', data.total_requests);
    this.updateMetricCard('errorRate', data.error_rate);
  }

  /**
   * Update metric card
   */
  updateMetricCard(metricId, metricData) {
    const valueElement = document.getElementById(`${metricId}Value`);
    const trendElement = document.getElementById(`${metricId}Trend`);
    
    if (valueElement && metricData) {
      valueElement.textContent = this.formatMetricValue(metricData.current_value, metricData.unit);
      
      if (trendElement) {
        const changeText = metricData.change_percentage > 0 ? '+' : '';
        trendElement.textContent = `${changeText}${metricData.change_percentage.toFixed(1)}%`;
        trendElement.className = `metric-trend ${metricData.trend}`;
      }
    }
  }

  /**
   * Format metric value
   */
  formatMetricValue(value, unit) {
    switch (unit) {
      case '%':
        return `${value.toFixed(2)}%`;
      case 'ms':
        return `${value.toFixed(0)}ms`;
      case 'count':
        return value.toLocaleString();
      case 'bytes':
        return this.formatBytes(value);
      case 'USD':
        return `$${value.toLocaleString()}`;
      default:
        return value.toString();
    }
  }

  /**
   * Format bytes
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Show loading state
   */
  showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const alertBar = document.getElementById('alertBar');
    if (alertBar) {
      alertBar.innerHTML = `<span>⚠️</span><span>${message}</span>`;
      alertBar.style.display = 'flex';
      
      setTimeout(() => {
        alertBar.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Load external script
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Update time range
   */
  updateTimeRange(range) {
    console.log(`Time range changed to: ${range}`);
    this.refreshDashboard();
  }

  // Additional update methods for other panels...
  updateApiPerformance(data) { /* Implementation */ }
  updateUserAnalytics(data) { /* Implementation */ }
  updateSecurityMonitoring(data) { /* Implementation */ }
  updateDatabaseHealth(data) { /* Implementation */ }
  updateInfrastructure(data) { /* Implementation */ }
  updateBusinessMetrics(data) { /* Implementation */ }
  updateAlerts(alerts) { /* Implementation */ }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.monitoringDashboard = new MonitoringDashboard();
});

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MonitoringDashboard;
}