/**
 * Demo Activation Script for Events Company
 * Enables all enterprise features for demonstration
 */

class DemoActivation {
  constructor() {
    this.isDemoMode = false;
    this.demoFeatures = new Set();
    this.keySequence = [];
    this.secretCode = ['d', 'e', 'm', 'o']; // Type "demo" to activate

    this.init();
  }

  init() {
    // Check URL params for demo mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true' || urlParams.get('enterprise') === 'true') {
      this.activateDemoMode();
    }

    // Listen for secret key sequence
    this.setupKeyListener();

    // Add demo button for easier access
    if (window.location.hostname === 'localhost' || urlParams.get('showDemo')) {
      this.addDemoButton();
    }
  }

  setupKeyListener() {
    document.addEventListener('keypress', (e) => {
      this.keySequence.push(e.key.toLowerCase());
      if (this.keySequence.length > 4) {
        this.keySequence.shift();
      }

      if (this.keySequence.join('') === this.secretCode.join('')) {
        this.activateDemoMode();
        this.keySequence = [];
      }
    });

    // Also listen for Ctrl+Shift+D
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.activateDemoMode();
      }
    });
  }

  activateDemoMode() {
    if (this.isDemoMode) return;

    this.isDemoMode = true;
    document.body.classList.add('demo-mode');

    console.log('🎯 Demo Mode Activated!');

    // Enable all feature flags
    this.enableAllFeatures();

    // Add admin navigation
    this.injectAdminNav();

    // Load enterprise modules
    this.loadEnterpriseModules();

    // Show notification
    this.showActivationNotification();

    // Track demo activation
    this.trackDemoActivation();
  }

  enableAllFeatures() {
    if (window.FeatureFlags) {
      const demoFlags = {
        'demo_mode': true,
        'admin_panel': true,
        'executive_dashboard': true,
        'ai_intelligence': true,
        'white_label_preview': true,
        'team_management': true,
        'real_time_chat': true,
        'gathering_engine': true,
        'analytics_suite': true,
        'monitoring_dashboard': true,
        'kpi_dashboard': true,
        'company_analytics': true,
        'report_generation': true,
        'ml_predictions': true,
        'enterprise_api': true
      };

      Object.entries(demoFlags).forEach(([flag, value]) => {
        window.FeatureFlags.flags[flag] = value;
        this.demoFeatures.add(flag);
      });
    }
  }

  injectAdminNav() {
    const adminNav = document.createElement('div');
    adminNav.id = 'demo-admin-nav';
    adminNav.className = 'demo-admin-nav';
    adminNav.innerHTML = `
      <div class="demo-header">
        <h3>🎯 Enterprise Demo Mode</h3>
        <button class="demo-close" onclick="demoActivation.hideDemoNav()">×</button>
      </div>
      <div class="demo-nav-grid">
        <button class="demo-nav-item" onclick="demoActivation.showExecutiveDashboard()">
          <span class="demo-icon">📊</span>
          <span class="demo-label">Executive Dashboard</span>
          <span class="demo-desc">ROI & Analytics</span>
        </button>
        <button class="demo-nav-item" onclick="demoActivation.showAIIntelligence()">
          <span class="demo-icon">🤖</span>
          <span class="demo-label">AI Intelligence</span>
          <span class="demo-desc">ML Predictions</span>
        </button>
        <button class="demo-nav-item" onclick="demoActivation.showTeamManagement()">
          <span class="demo-icon">👥</span>
          <span class="demo-label">Team Management</span>
          <span class="demo-desc">Multi-user Control</span>
        </button>
        <button class="demo-nav-item" onclick="demoActivation.showWhiteLabel()">
          <span class="demo-icon">🎨</span>
          <span class="demo-label">White Label</span>
          <span class="demo-desc">Custom Branding</span>
        </button>
        <button class="demo-nav-item" onclick="demoActivation.showAnalytics()">
          <span class="demo-icon">📈</span>
          <span class="demo-label">Analytics Suite</span>
          <span class="demo-desc">KPIs & Metrics</span>
        </button>
        <button class="demo-nav-item" onclick="demoActivation.showGatherings()">
          <span class="demo-icon">🎪</span>
          <span class="demo-label">Smart Gatherings</span>
          <span class="demo-desc">AI Matchmaking</span>
        </button>
        <button class="demo-nav-item" onclick="demoActivation.showMonitoring()">
          <span class="demo-icon">🔍</span>
          <span class="demo-label">Monitoring</span>
          <span class="demo-desc">Real-time Status</span>
        </button>
        <button class="demo-nav-item" onclick="demoActivation.showReports()">
          <span class="demo-icon">📄</span>
          <span class="demo-label">Reports</span>
          <span class="demo-desc">PDF Export</span>
        </button>
      </div>
      <div class="demo-stats">
        <div class="demo-stat">
          <span class="stat-value">15,847</span>
          <span class="stat-label">Active Users</span>
        </div>
        <div class="demo-stat">
          <span class="stat-value">$4.2M</span>
          <span class="stat-label">Pipeline</span>
        </div>
        <div class="demo-stat">
          <span class="stat-value">3.2x</span>
          <span class="stat-label">ROI</span>
        </div>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .demo-admin-nav {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 320px;
        background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3f 100%);
        box-shadow: 4px 0 24px rgba(0,0,0,0.3);
        z-index: 10000;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
      }

      .demo-mode .demo-admin-nav {
        transform: translateX(0);
      }

      .demo-header {
        padding: 20px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .demo-header h3 {
        margin: 0;
        color: #fff;
        font-size: 18px;
      }

      .demo-close {
        background: none;
        border: none;
        color: #fff;
        font-size: 24px;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;
      }

      .demo-close:hover {
        opacity: 1;
      }

      .demo-nav-grid {
        flex: 1;
        padding: 20px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        overflow-y: auto;
      }

      .demo-nav-item {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 12px;
        text-align: left;
      }

      .demo-nav-item:hover {
        background: rgba(255,255,255,0.1);
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(99,102,241,0.2);
      }

      .demo-icon {
        font-size: 24px;
      }

      .demo-label {
        color: #fff;
        font-weight: 600;
        font-size: 14px;
        display: block;
      }

      .demo-desc {
        color: rgba(255,255,255,0.6);
        font-size: 11px;
        display: block;
      }

      .demo-stats {
        padding: 20px;
        border-top: 1px solid rgba(255,255,255,0.1);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .demo-stat {
        text-align: center;
      }

      .stat-value {
        display: block;
        color: #6366f1;
        font-size: 20px;
        font-weight: bold;
      }

      .stat-label {
        display: block;
        color: rgba(255,255,255,0.6);
        font-size: 10px;
        text-transform: uppercase;
        margin-top: 4px;
      }

      .demo-mode #app {
        margin-left: 320px;
        transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .demo-activation-notice {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(99,102,241,0.3);
        z-index: 10001;
        animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;

    document.head.appendChild(styles);
    document.body.appendChild(adminNav);
  }

  async loadEnterpriseModules() {
    const modules = [
      '/modern/executive/executive-dashboard.js',
      '/modern/ai/advanced-intelligence.js',
      '/modern/enterprise/team-dashboard.js',
      '/modern/white-label/customization-engine.js',
      '/modern/analytics/kpi-dashboard.js',
      '/modern/gatherings/gathering-engine.js'
    ];

    for (const module of modules) {
      try {
        await import(module);
        console.log(`✅ Loaded: ${module}`);
      } catch (e) {
        console.log(`⚠️ Module not found: ${module}`);
      }
    }
  }

  showActivationNotification() {
    const notice = document.createElement('div');
    notice.className = 'demo-activation-notice';
    notice.innerHTML = `
      <strong>🎯 Enterprise Demo Mode Active</strong><br>
      <small>All premium features unlocked</small>
    `;
    document.body.appendChild(notice);

    setTimeout(() => {
      notice.style.opacity = '0';
      setTimeout(() => notice.remove(), 400);
    }, 3000);
  }

  // Feature demonstration methods
  async showExecutiveDashboard() {
    const container = document.getElementById('app');
    container.innerHTML = '<div id="executive-dashboard">Loading Executive Dashboard...</div>';

    try {
      const { default: ExecutiveDashboard } = await import('/modern/executive/executive-dashboard.js');
      new ExecutiveDashboard('executive-dashboard', {
        demoMode: true,
        companyName: 'Your Event Company'
      });
    } catch (e) {
      container.innerHTML = this.getMockExecutiveDashboard();
    }
  }

  async showAIIntelligence() {
    const container = document.getElementById('app');
    container.innerHTML = '<div id="ai-demo">Loading AI Intelligence...</div>';

    try {
      const { default: AIEngine } = await import('/modern/ai/advanced-intelligence.js');
      // Show AI demo
      container.innerHTML = this.getMockAIDemo();
    } catch (e) {
      container.innerHTML = this.getMockAIDemo();
    }
  }

  async showTeamManagement() {
    const container = document.getElementById('app');
    try {
      const { default: TeamDashboard } = await import('/modern/enterprise/team-dashboard.js');
      new TeamDashboard(container);
    } catch (e) {
      container.innerHTML = this.getMockTeamDashboard();
    }
  }

  async showWhiteLabel() {
    const container = document.getElementById('app');
    container.innerHTML = this.getWhiteLabelDemo();
  }

  async showAnalytics() {
    const container = document.getElementById('app');
    try {
      const { default: KPIDashboard } = await import('/modern/analytics/kpi-dashboard.js');
      new KPIDashboard(container);
    } catch (e) {
      container.innerHTML = this.getMockAnalytics();
    }
  }

  async showGatherings() {
    const container = document.getElementById('app');
    try {
      const { SmartGatheringEngine } = await import('/modern/gatherings/gathering-engine.js');
      const engine = new SmartGatheringEngine();
      container.innerHTML = this.getMockGatherings();
    } catch (e) {
      container.innerHTML = this.getMockGatherings();
    }
  }

  async showMonitoring() {
    const container = document.getElementById('app');
    container.innerHTML = this.getMockMonitoring();
  }

  async showReports() {
    const container = document.getElementById('app');
    container.innerHTML = this.getMockReports();
  }

  // Mock dashboards for demo (fallbacks)
  getMockExecutiveDashboard() {
    return `
      <div class="executive-dashboard-mock">
        <h1>Executive Dashboard</h1>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">$4.2M</div>
            <div class="metric-label">Pipeline Generated</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">3.2x</div>
            <div class="metric-label">ROI</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">847</div>
            <div class="metric-label">Qualified Leads</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">15,847</div>
            <div class="metric-label">Total Attendees</div>
          </div>
        </div>
      </div>
    `;
  }

  getMockAIDemo() {
    return `
      <div class="ai-demo-mock">
        <h1>AI Intelligence Engine</h1>
        <div class="ai-features">
          <div class="ai-feature">
            <h3>🧠 NLP Analysis</h3>
            <p>Analyzing 10,000+ conversations in real-time</p>
          </div>
          <div class="ai-feature">
            <h3>📈 Predictive Analytics</h3>
            <p>92% accuracy in lead scoring</p>
          </div>
          <div class="ai-feature">
            <h3>🎯 Smart Matching</h3>
            <p>AI-powered connection recommendations</p>
          </div>
        </div>
      </div>
    `;
  }

  getMockTeamDashboard() {
    return `
      <div class="team-dashboard-mock">
        <h1>Team Performance</h1>
        <table class="team-table">
          <thead>
            <tr>
              <th>Team Member</th>
              <th>Connections</th>
              <th>Meetings</th>
              <th>Pipeline</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sarah Chen</td>
              <td>127</td>
              <td>23</td>
              <td>$1.2M</td>
              <td>95%</td>
            </tr>
            <tr>
              <td>Mike Ross</td>
              <td>89</td>
              <td>18</td>
              <td>$800K</td>
              <td>87%</td>
            </tr>
            <tr>
              <td>Elena Vasquez</td>
              <td>156</td>
              <td>31</td>
              <td>$1.5M</td>
              <td>98%</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  getWhiteLabelDemo() {
    return `
      <div class="white-label-demo">
        <h1>White Label Customization</h1>
        <div class="theme-switcher">
          <button onclick="demoActivation.applyTheme('default')">Default Theme</button>
          <button onclick="demoActivation.applyTheme('corporate')">Corporate Blue</button>
          <button onclick="demoActivation.applyTheme('vibrant')">Vibrant</button>
          <button onclick="demoActivation.applyTheme('custom')">Your Brand</button>
        </div>
        <div class="customization-preview">
          <h3>Live Preview</h3>
          <p>See your brand come to life instantly</p>
        </div>
      </div>
    `;
  }

  getMockAnalytics() {
    return `
      <div class="analytics-mock">
        <h1>Analytics Suite</h1>
        <div class="chart-placeholder">
          <canvas id="analytics-chart"></canvas>
        </div>
        <div class="kpi-grid">
          <div class="kpi">User Engagement: 87%</div>
          <div class="kpi">Session Duration: 34 min</div>
          <div class="kpi">Conversion Rate: 23%</div>
          <div class="kpi">NPS Score: 72</div>
        </div>
      </div>
    `;
  }

  getMockGatherings() {
    return `
      <div class="gatherings-mock">
        <h1>Smart Gatherings</h1>
        <div class="gathering-list">
          <div class="gathering-card">
            <h3>☕ Coffee with VCs</h3>
            <p>AI matched you with 3 investors interested in your sector</p>
            <button>Join Gathering</button>
          </div>
          <div class="gathering-card">
            <h3>🎮 Indie Dev Meetup</h3>
            <p>8 developers working on similar projects</p>
            <button>Join Gathering</button>
          </div>
        </div>
      </div>
    `;
  }

  getMockMonitoring() {
    return `
      <div class="monitoring-mock">
        <h1>System Monitoring</h1>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-indicator green"></span>
            API Status: Operational
          </div>
          <div class="status-item">
            <span class="status-indicator green"></span>
            Database: 23ms response
          </div>
          <div class="status-item">
            <span class="status-indicator green"></span>
            CDN: 99.9% uptime
          </div>
        </div>
      </div>
    `;
  }

  getMockReports() {
    return `
      <div class="reports-mock">
        <h1>Report Generation</h1>
        <div class="report-options">
          <button class="report-btn">📊 Generate Executive Report</button>
          <button class="report-btn">📈 Export Analytics PDF</button>
          <button class="report-btn">👥 Team Performance Report</button>
          <button class="report-btn">💰 ROI Analysis</button>
        </div>
      </div>
    `;
  }

  applyTheme(theme) {
    const themes = {
      default: { primary: '#6366f1', secondary: '#8b5cf6' },
      corporate: { primary: '#0066cc', secondary: '#0052a3' },
      vibrant: { primary: '#ff6b6b', secondary: '#ff5252' },
      custom: { primary: '#00d084', secondary: '#00b574' }
    };

    const selected = themes[theme];
    document.documentElement.style.setProperty('--color-accent', selected.primary);
    document.documentElement.style.setProperty('--color-accent-dark', selected.secondary);
  }

  hideDemoNav() {
    document.body.classList.remove('demo-mode');
  }

  addDemoButton() {
    const btn = document.createElement('button');
    btn.innerHTML = '🎯 Activate Demo';
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 24px;
      cursor: pointer;
      z-index: 9999;
      font-weight: 600;
      box-shadow: 0 4px 20px rgba(99,102,241,0.3);
    `;
    btn.onclick = () => this.activateDemoMode();
    document.body.appendChild(btn);
  }

  trackDemoActivation() {
    // Track demo activation for analytics
    if (window.analytics) {
      window.analytics.track('Demo Activated', {
        features: Array.from(this.demoFeatures),
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Initialize and expose globally
window.demoActivation = new DemoActivation();

// Auto-activate for demo URLs
if (window.location.hash === '#demo' || window.location.pathname.includes('demo')) {
  setTimeout(() => window.demoActivation.activateDemoMode(), 1000);
}

export default DemoActivation;