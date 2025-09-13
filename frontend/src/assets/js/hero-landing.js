/**
 * Hero Landing Controller
 * Elegant app initialization with progressive disclosure
 */

import { getIcon } from './icon-gallery.js';

class HeroLanding {
  constructor() {
    this.heroContainer = document.getElementById('hero-landing');
    this.appContainer = document.getElementById('app');
    this.hasSeenHero = sessionStorage.getItem('hero_seen') === 'true';
    this.isFirstVisit = !localStorage.getItem('user_id');
    this.features = new Map();
    
    this.init();
  }

  init() {
    // Skip hero for returning users in same session
    if (this.hasSeenHero && !this.isFirstVisit) {
      this.skipHero();
      return;
    }

    this.setupFeatures();
    this.attachEventHandlers();
    this.renderIcons();
    this.animateEntrance();
  }

  setupFeatures() {
    // Feature definitions for progressive disclosure
    this.features.set('events', {
      title: 'Event Discovery',
      icon: 'target',
      description: 'Find the perfect events for your interests',
      tutorial: [
        'Browse 50+ exclusive gaming industry parties',
        'Get AI-powered recommendations',
        'Save events to your personal calendar',
        'Never miss important networking opportunities'
      ]
    });

    this.features.set('network', {
      title: 'Professional Networking',
      icon: 'handshake',
      description: 'Build meaningful industry connections',
      tutorial: [
        'Connect with developers, publishers, and investors',
        'Proximity-based networking at venues',
        'Exchange contact info with QR codes',
        'Track your professional relationships'
      ]
    });

    this.features.set('offline', {
      title: 'Offline Access',
      icon: 'wifiOff',
      description: 'Everything works without internet',
      tutorial: [
        'Download event data for offline viewing',
        'Access your saved events anytime',
        'Sync when connection returns',
        'Install as a mobile app'
      ]
    });
  }

  attachEventHandlers() {
    // Global functions for onclick handlers
    window.startApp = () => this.startApp();
    window.exploreDemo = () => this.exploreDemo();
    window.showFeature = (feature) => this.showFeature(feature);
    window.heroLanding = this;
  }

  renderIcons() {
    // Render professional SVG icons
    const iconElements = document.querySelectorAll('[data-icon]');
    iconElements.forEach(element => {
      const iconName = element.dataset.icon;
      const iconSvg = getIcon(iconName, 48, 'hero-icon-svg');
      if (iconSvg) {
        element.innerHTML = iconSvg;
      }
    });
  }

  animateEntrance() {
    // Stagger feature card animations
    const features = document.querySelectorAll('.hero-feature');
    features.forEach((feature, index) => {
      feature.style.animationDelay = `${600 + (index * 100)}ms`;
    });
  }

  async startApp() {
    // Mark hero as seen
    sessionStorage.setItem('hero_seen', 'true');
    
    // Smooth transition
    this.heroContainer.style.transition = 'opacity 500ms ease-out';
    this.heroContainer.style.opacity = '0';
    
    setTimeout(() => {
      this.heroContainer.style.display = 'none';
      this.appContainer.style.display = 'block';
      this.appContainer.style.animation = 'fadeIn 500ms ease-out';
      
      // Trigger app initialization event
      window.dispatchEvent(new Event('app-ready'));
      
      // DISABLED - Show FTUE for first-time users
      // if (this.isFirstVisit) {
      //   setTimeout(() => this.showOnboarding(), 1000);
      // }
    }, 500);
  }

  exploreDemo() {
    // Launch the beautiful feature showcase with Jobs/Ive magic
    if (window.featureShowcase) {
      window.featureShowcase.open();
      
      // Add a subtle pulse to draw attention
      setTimeout(() => {
        const panel = document.querySelector('.showcase-panel');
        if (panel) {
          panel.style.animation = 'pulseGlow 2s ease-in-out';
        }
      }, 100);
    }
  }

  showFeatureShowcase() {
    console.log('[HeroLanding] Showing feature showcase');
    
    // Create a beautiful feature showcase modal
    const showcase = document.createElement('div');
    showcase.className = 'feature-showcase-modal';
    showcase.innerHTML = `
      <div class="showcase-backdrop" onclick="window.heroLanding.closeShowcase()"></div>
      <div class="showcase-content">
        <button class="showcase-close" onclick="window.heroLanding.closeShowcase()">
          ${getIcon('x', 24)}
        </button>
        
        <div class="showcase-header">
          <h2>Powerful Features for Professional Networking</h2>
          <p>Everything you need to make the most of Gamescom 2025</p>
        </div>
        
        <div class="showcase-features">
          <!-- Smart Networking -->
          <div class="showcase-feature clickable" onclick="window.heroLanding.featureAction('smart-networking')">
            <div class="feature-icon-wrapper">
              ${getIcon('users', 32)}
            </div>
            <h3>Smart Networking</h3>
            <p>AI-powered matching finds your perfect connections based on business goals, industry focus, and availability.</p>
            <ul class="feature-benefits">
              <li>Intelligent profile matching</li>
              <li>Calendar integration</li>
              <li>Proximity-based discovery</li>
            </ul>
          </div>
          
          <!-- Event Discovery -->
          <div class="showcase-feature clickable" onclick="window.heroLanding.featureAction('event-discovery')">
            <div class="feature-icon-wrapper">
              ${getIcon('calendar', 32)}
            </div>
            <h3>Event Discovery</h3>
            <p>Never miss important parties and networking events with our curated database of 50+ exclusive gatherings.</p>
            <ul class="feature-benefits">
              <li>Personalized recommendations</li>
              <li>Real-time updates</li>
              <li>Calendar sync</li>
            </ul>
          </div>
          
          <!-- Professional Messaging -->
          <div class="showcase-feature clickable" onclick="window.heroLanding.featureAction('messaging')">
            <div class="feature-icon-wrapper">
              ${getIcon('messageCircle', 32)}
            </div>
            <h3>In-App Messaging</h3>
            <p>Connect instantly with matches through our built-in messaging system. No phone numbers needed.</p>
            <ul class="feature-benefits">
              <li>Secure conversations</li>
              <li>Meeting scheduling</li>
              <li>Contact exchange</li>
            </ul>
          </div>
          
          <!-- Offline Mode -->
          <div class="showcase-feature">
            <div class="feature-icon-wrapper">
              ${getIcon('wifiOff', 32)}
            </div>
            <h3>Works Offline</h3>
            <p>Access everything even in crowded venues with poor connectivity. Your data syncs when you're back online.</p>
            <ul class="feature-benefits">
              <li>Offline event access</li>
              <li>Saved connections</li>
              <li>Background sync</li>
            </ul>
          </div>
          
          <!-- Analytics -->
          <div class="showcase-feature clickable" onclick="window.heroLanding.featureAction('analytics')">
            <div class="feature-icon-wrapper">
              ${getIcon('trendingUp', 32)}
            </div>
            <h3>Networking Analytics</h3>
            <p>Track your networking success with insights on connections made, meetings scheduled, and goals achieved.</p>
            <ul class="feature-benefits">
              <li>Connection tracking</li>
              <li>ROI measurement</li>
              <li>Follow-up reminders</li>
            </ul>
          </div>
          
          <!-- Security -->
          <div class="showcase-feature">
            <div class="feature-icon-wrapper">
              ${getIcon('shield', 32)}
            </div>
            <h3>Privacy First</h3>
            <p>Your data stays yours. Share only what you want, when you want, with granular privacy controls.</p>
            <ul class="feature-benefits">
              <li>Selective sharing</li>
              <li>Data encryption</li>
              <li>GDPR compliant</li>
            </ul>
          </div>
        </div>
        
        <div class="showcase-cta">
          <button class="btn-get-started" onclick="window.heroLanding.startFromShowcase()">
            <span>Get Started Now</span>
            ${getIcon('arrowRight', 20)}
          </button>
          <p class="cta-subtext">Join thousands of gaming professionals already networking smarter</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(showcase);
    
    // Animate in
    requestAnimationFrame(() => {
      showcase.classList.add('active');
      
      // Stagger feature animations
      const features = showcase.querySelectorAll('.showcase-feature');
      features.forEach((feature, index) => {
        setTimeout(() => {
          feature.style.animation = 'slideInUp 0.5s ease-out forwards';
        }, index * 50);
      });
    });
    
    // Add styles if not already present
    if (!document.querySelector('#showcase-styles')) {
      const styles = document.createElement('style');
      styles.id = 'showcase-styles';
      styles.textContent = `
        .feature-showcase-modal {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .feature-showcase-modal.active {
          opacity: 1;
        }
        
        .showcase-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
        }
        
        .showcase-content {
          position: relative;
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          overflow-y: auto;
          background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
          border-radius: 24px;
          padding: 48px;
          transform: scale(0.9);
          transition: transform 0.3s ease;
        }
        
        .feature-showcase-modal.active .showcase-content {
          transform: scale(1);
        }
        
        .showcase-close {
          position: absolute;
          top: 24px;
          right: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .showcase-close:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }
        
        .showcase-header {
          text-align: center;
          margin-bottom: 48px;
        }
        
        .showcase-header h2 {
          font-size: 36px;
          font-weight: 700;
          background: linear-gradient(135deg, #007aff, #5856d6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
        }
        
        .showcase-header p {
          font-size: 18px;
          color: #9ca3af;
        }
        
        .showcase-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 32px;
          margin-bottom: 48px;
        }
        
        .showcase-feature {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 32px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s ease;
        }
        
        .showcase-feature.clickable {
          cursor: pointer;
        }
        
        .showcase-feature.clickable:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--color-accent, #7c3aed);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(124, 58, 237, 0.2);
        }
        
        @keyframes slideInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .feature-icon-wrapper {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: white;
        }
        
        .showcase-feature h3 {
          font-size: 20px;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
        }
        
        .showcase-feature p {
          color: #9ca3af;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        
        .feature-benefits {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .feature-benefits li {
          color: #e5e7eb;
          padding: 8px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .feature-benefits li::before {
          content: "✓";
          color: #10b981;
          font-weight: bold;
        }
        
        .showcase-cta {
          text-align: center;
        }
        
        .btn-get-started {
          padding: 16px 48px;
          background: linear-gradient(135deg, #007aff, #5856d6);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
        }
        
        .btn-get-started:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 122, 255, 0.3);
        }
        
        .cta-subtext {
          margin-top: 16px;
          color: #9ca3af;
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .showcase-content {
            padding: 32px 20px;
          }
          
          .showcase-header h2 {
            font-size: 28px;
          }
          
          .showcase-features {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }
  
  closeShowcase() {
    const showcase = document.querySelector('.feature-showcase-modal');
    if (showcase) {
      showcase.classList.remove('active');
      setTimeout(() => showcase.remove(), 300);
    }
  }
  
  startFromShowcase() {
    this.closeShowcase();
    this.startApp();
  }

  featureAction(feature) {
    console.log('[HeroLanding] Feature clicked:', feature);
    
    switch(feature) {
      case 'smart-networking':
        // Start account setup / onboarding
        this.closeShowcase();
        if (window.smartOnboarding) {
          window.smartOnboarding.show();
          // Hide hero after a brief delay
          setTimeout(() => {
            const hero = document.getElementById('hero-landing');
            if (hero) {
              hero.style.transition = 'opacity 500ms ease';
              hero.style.opacity = '0';
              setTimeout(() => {
                hero.style.display = 'none';
              }, 500);
            }
          }, 300);
        }
        break;
        
      case 'event-discovery':
        // Go to events page
        this.closeShowcase();
        this.startApp();
        // Navigate to events after app loads
        setTimeout(() => {
          if (window.location.hash !== '#events') {
            window.location.hash = '#events';
          }
        }, 500);
        break;
        
      case 'messaging':
        // Start smart matchmaking flow
        this.closeShowcase();
        this.startApp();
        setTimeout(() => {
          if (window.proximityNetworking) {
            window.proximityNetworking.open();
            window.proximityNetworking.showToast('Let\'s make your first connection!');
          }
        }, 500);
        break;
        
      case 'analytics':
        // Show after-conference report
        this.closeShowcase();
        this.showAnalyticsReport();
        break;
        
      default:
        console.log('[HeroLanding] No action for feature:', feature);
    }
  }
  
  showAnalyticsReport() {
    const report = document.createElement('div');
    report.className = 'analytics-report-modal';
    report.innerHTML = `
      <div class="report-backdrop" onclick="window.heroLanding.closeReport()"></div>
      <div class="report-content">
        <button class="report-close" onclick="window.heroLanding.closeReport()">
          ${getIcon('x', 24)}
        </button>
        
        <div class="report-header">
          <div class="report-logo">MAU 2025</div>
          <h2>Your Conference Analytics Report</h2>
          <p>Marketing Automation Universe • March 15-18, 2025</p>
        </div>
        
        <div class="report-stats">
          <div class="stat-card primary">
            <div class="stat-value">47</div>
            <div class="stat-label">Connections Made</div>
            <div class="stat-change">+235% vs avg attendee</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">12</div>
            <div class="stat-label">Meetings Scheduled</div>
            <div class="stat-change">8 completed, 4 follow-ups</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">89%</div>
            <div class="stat-label">Match Quality</div>
            <div class="stat-change">Top 5% of attendees</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">$2.3M</div>
            <div class="stat-label">Pipeline Generated</div>
            <div class="stat-change">From 6 qualified leads</div>
          </div>
        </div>
        
        <div class="report-sections">
          <div class="report-section">
            <h3>Top Connections by Category</h3>
            <div class="connection-list">
              <div class="connection-item">
                <span class="connection-category">CDP Integration</span>
                <span class="connection-count">15 contacts</span>
                <div class="connection-bar" style="width: 100%"></div>
              </div>
              <div class="connection-item">
                <span class="connection-category">Marketing Automation</span>
                <span class="connection-count">12 contacts</span>
                <div class="connection-bar" style="width: 80%"></div>
              </div>
              <div class="connection-item">
                <span class="connection-category">Attribution & Analytics</span>
                <span class="connection-count">10 contacts</span>
                <div class="connection-bar" style="width: 67%"></div>
              </div>
              <div class="connection-item">
                <span class="connection-category">ABM Platforms</span>
                <span class="connection-count">8 contacts</span>
                <div class="connection-bar" style="width: 53%"></div>
              </div>
              <div class="connection-item">
                <span class="connection-category">Integration (iPaaS)</span>
                <span class="connection-count">2 contacts</span>
                <div class="connection-bar" style="width: 13%"></div>
              </div>
            </div>
          </div>
          
          <div class="report-section">
            <h3>Key Achievements</h3>
            <div class="achievements">
              <div class="achievement">
                <span class="achievement-icon">🏆</span>
                <div>
                  <strong>Super Connector</strong>
                  <p>Made 40+ meaningful connections</p>
                </div>
              </div>
              <div class="achievement">
                <span class="achievement-icon">🎯</span>
                <div>
                  <strong>Perfect Match</strong>
                  <p>95%+ compatibility score achieved</p>
                </div>
              </div>
              <div class="achievement">
                <span class="achievement-icon">⚡</span>
                <div>
                  <strong>Early Bird</strong>
                  <p>First 100 to check in Day 1</p>
                </div>
              </div>
              <div class="achievement">
                <span class="achievement-icon">💎</span>
                <div>
                  <strong>VIP Networker</strong>
                  <p>Connected with 5+ C-level executives</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="report-section">
            <h3>Follow-Up Actions</h3>
            <div class="followup-list">
              <div class="followup-item">
                <input type="checkbox" checked>
                <label>Schedule demo with Salesforce CDP team (Sarah Chen)</label>
              </div>
              <div class="followup-item">
                <input type="checkbox" checked>
                <label>Send integration specs to HubSpot (Marcus Johnson)</label>
              </div>
              <div class="followup-item">
                <input type="checkbox">
                <label>Review Segment pricing proposal (Emma Wilson)</label>
              </div>
              <div class="followup-item">
                <input type="checkbox">
                <label>Attend 6sense webinar on intent data (Next Tuesday)</label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="report-footer">
          <button class="btn-export" onclick="window.heroLanding.exportReport()">
            ${getIcon('download', 20)}
            <span>Export Report (PDF)</span>
          </button>
          <button class="btn-share" onclick="window.heroLanding.shareReport()">
            ${getIcon('share2', 20)}
            <span>Share with Team</span>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(report);
    
    // Animate in
    requestAnimationFrame(() => {
      report.classList.add('active');
    });
    
    // Add styles if not present
    this.injectReportStyles();
  }
  
  closeReport() {
    const report = document.querySelector('.analytics-report-modal');
    if (report) {
      report.classList.remove('active');
      setTimeout(() => report.remove(), 300);
    }
  }
  
  exportReport() {
    this.showToast('Report exported to Downloads folder');
  }
  
  shareReport() {
    this.showToast('Report link copied to clipboard');
  }
  
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'hero-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-accent, #7c3aed);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 600;
      z-index: 10002;
      animation: slideUp 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
  
  injectReportStyles() {
    if (!document.querySelector('#report-styles')) {
      const styles = document.createElement('style');
      styles.id = 'report-styles';
      styles.textContent = `
        .analytics-report-modal {
          position: fixed;
          inset: 0;
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .analytics-report-modal.active {
          opacity: 1;
        }
        
        .report-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
        }
        
        .report-content {
          position: relative;
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
          border-radius: 24px;
          padding: 48px;
        }
        
        .report-close {
          position: absolute;
          top: 24px;
          right: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        
        .report-header {
          text-align: center;
          margin-bottom: 48px;
        }
        
        .report-logo {
          display: inline-block;
          padding: 8px 16px;
          background: var(--color-accent, #7c3aed);
          color: white;
          font-weight: 700;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        
        .report-header h2 {
          font-size: 32px;
          margin-bottom: 8px;
        }
        
        .report-header p {
          color: #9ca3af;
        }
        
        .report-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
        }
        
        .stat-card.primary {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(16, 185, 129, 0.2));
          border-color: var(--color-accent, #7c3aed);
        }
        
        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #9ca3af;
          margin-bottom: 8px;
        }
        
        .stat-change {
          font-size: 12px;
          color: #10b981;
        }
        
        .report-section {
          margin-bottom: 48px;
        }
        
        .report-section h3 {
          font-size: 20px;
          margin-bottom: 24px;
        }
        
        .connection-list {
          space-y: 16px;
        }
        
        .connection-item {
          position: relative;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .connection-category {
          display: inline-block;
          font-weight: 600;
        }
        
        .connection-count {
          float: right;
          color: #9ca3af;
        }
        
        .connection-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: var(--color-accent, #7c3aed);
        }
        
        .achievements {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .achievement {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }
        
        .achievement-icon {
          font-size: 32px;
        }
        
        .followup-list {
          space-y: 12px;
        }
        
        .followup-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }
        
        .followup-item input[type="checkbox"] {
          width: 20px;
          height: 20px;
        }
        
        .report-footer {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 48px;
        }
        
        .btn-export, .btn-share {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: var(--color-accent, #7c3aed);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }
        
        .btn-share {
          background: transparent;
          border: 2px solid var(--color-accent, #7c3aed);
        }
      `;
      document.head.appendChild(styles);
    }
  }

  showFeature(featureName) {
    console.log('[Hero] Feature clicked:', featureName);
    
    // For Smart Discovery, show the comprehensive onboarding flow
    if (featureName === 'discovery') {
      // Check if user has already completed onboarding
      const profileExists = localStorage.getItem('smartProfile');
      
      if (!profileExists) {
        // Show smart onboarding for new users
        if (window.smartOnboarding) {
          window.smartOnboarding.show();
          // Hide hero after a brief delay
          setTimeout(() => {
            const hero = document.getElementById('hero-landing');
            if (hero) {
              hero.style.transition = 'opacity 500ms ease';
              hero.style.opacity = '0';
              setTimeout(() => {
                hero.style.display = 'none';
              }, 500);
            }
          }, 300);
        }
      } else {
        // Existing user - go directly to smart networking
        this.startApp();
        setTimeout(() => {
          if (window.proximityNetworking) {
            window.proximityNetworking.open();
          }
        }, 500);
      }
      return;
    }
    
    // For other features, go directly to the app
    this.startApp();
    return;

    // Simple modal - no fancy animations to avoid issues
    const modalHTML = `
      <div class="hero-feature-modal-simple" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      " onclick="if(event.target === this) window.heroLanding.closeSimpleModal()">
        <div style="
          background: #1a1a2e;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        " onclick="event.stopPropagation()">
          <button onclick="window.heroLanding.closeSimpleModal()" style="
            position: absolute;
            top: 16px;
            right: 16px;
            background: transparent;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
          ">×</button>
          
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #007aff 0%, #5856d6 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              ${getIcon(feature.icon, 32, 'modal-icon-svg')}
            </div>
            <h2 style="color: white; margin: 0; font-size: 24px;">${feature.title}</h2>
          </div>
          
          <p style="color: #9ca3af; margin-bottom: 24px;">${feature.description}</p>
          
          <ul style="list-style: none; padding: 0; margin-bottom: 24px;">
            ${feature.tutorial.map(item => `
              <li style="display: flex; align-items: center; gap: 12px; padding: 8px 0; color: #e5e7eb;">
                <span style="color: #10b981;">✓</span>
                <span>${item}</span>
              </li>
            `).join('')}
          </ul>
          
          <div style="display: flex; gap: 12px;">
            <button onclick="window.heroLanding.startAppFromModal()" style="
              flex: 1;
              padding: 12px;
              background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
              border: none;
              border-radius: 8px;
              color: white;
              font-weight: 600;
              cursor: pointer;
            ">Get Started</button>
            <button onclick="window.heroLanding.closeSimpleModal()" style="
              flex: 1;
              padding: 12px;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 8px;
              color: white;
              font-weight: 600;
              cursor: pointer;
            ">Close</button>
          </div>
        </div>
      </div>
    `;

    // Create and insert modal
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    const modal = modalContainer.firstElementChild;
    document.body.appendChild(modal);

    // Store reference for cleanup
    this.currentModal = modal;

    // ESC key handler
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeSimpleModal();
      }
    };
    this.currentEscHandler = escHandler;
    document.addEventListener('keydown', escHandler);

    console.log('[Hero] Modal created and displayed');
  }

  closeSimpleModal() {
    console.log('[Hero] Closing simple modal');
    
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
    
    if (this.currentEscHandler) {
      document.removeEventListener('keydown', this.currentEscHandler);
      this.currentEscHandler = null;
    }
    
    // Clear auto-cleanup timer
    if (this.autoCleanupTimer) {
      clearTimeout(this.autoCleanupTimer);
      this.autoCleanupTimer = null;
    }
    
    // Final cleanup - remove any lingering modals
    document.querySelectorAll('.hero-feature-modal-simple, .hero-feature-modal').forEach(el => el.remove());
    
    // Reset body state to ensure page is clickable
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
  }

  closeFeatureModal(modal) {
    if (modal && modal.classList.contains('hero-feature-modal')) {
      // Immediately disable interaction
      modal.style.pointerEvents = 'none';
      modal.classList.remove('active');
      
      // Clean up event listener
      if (modal._escHandler) {
        document.removeEventListener('keydown', modal._escHandler);
        delete modal._escHandler;
      }
      
      // Clear failsafe timeout
      if (modal._cleanupTimeout) {
        clearTimeout(modal._cleanupTimeout);
        delete modal._cleanupTimeout;
      }
      
      // Wait for animation to complete before removing
      setTimeout(() => {
        if (modal && modal.parentNode) {
          modal.remove();
        }
        
        // Double-check cleanup of any orphaned elements
        const orphans = document.querySelectorAll('.hero-feature-modal-backdrop, .hero-feature-modal');
        orphans.forEach(el => {
          el.style.pointerEvents = 'none';
          el.remove();
        });
      }, 300);
    }
  }

  startAppFromModal() {
    console.log('[Hero] Starting app from modal');
    
    // Close the simple modal first using our cleanup method
    this.closeSimpleModal();
    
    // Also remove any other modals that might exist
    document.querySelectorAll('.hero-feature-modal-simple, .hero-feature-modal, .hero-feature-modal-backdrop').forEach(modal => {
      console.log('[Hero] Removing modal:', modal.className);
      modal.remove();
    });
    
    // Clear any stored references
    this.currentModal = null;
    this.currentEscHandler = null;
    
    // Small delay to ensure cleanup completes
    setTimeout(() => {
      console.log('[Hero] Starting app after cleanup');
      this.startApp();
    }, 100);
  }

  startAppFromCarousel() {
    // Close the carousel first
    const carousel = document.querySelector('.hero-carousel');
    if (carousel) {
      carousel.remove();
    }
    // Then start the app
    this.startApp();
  }

  showFeatureCarousel() {
    // Create interactive carousel of all features
    const carousel = document.createElement('div');
    carousel.className = 'hero-carousel';
    carousel.innerHTML = `
      <div class="hero-carousel-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="hero-carousel-container">
        <div class="hero-carousel-header">
          <h2>Discover Premium Features</h2>
          <button class="hero-carousel-close" onclick="this.closest('.hero-carousel').remove()">×</button>
        </div>
        <div class="hero-carousel-track">
          ${Array.from(this.features.entries()).map(([key, feature], index) => `
            <div class="hero-carousel-slide ${index === 0 ? 'active' : ''}" data-feature="${key}">
              <div class="hero-carousel-icon">${feature.icon}</div>
              <h3>${feature.title}</h3>
              <p>${feature.description}</p>
              <ul class="hero-carousel-features">
                ${feature.tutorial.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        <div class="hero-carousel-nav">
          <button class="hero-carousel-prev" onclick="window.heroCarouselPrev()">←</button>
          <div class="hero-carousel-dots">
            ${Array.from(this.features.keys()).map((_, index) => `
              <span class="hero-carousel-dot ${index === 0 ? 'active' : ''}" 
                    data-index="${index}" 
                    onclick="window.heroCarouselGoTo(${index})"></span>
            `).join('')}
          </div>
          <button class="hero-carousel-next" onclick="window.heroCarouselNext()">→</button>
        </div>
        <div class="hero-carousel-actions">
          <button class="hero-btn hero-btn-primary" onclick="window.heroLanding.startAppFromCarousel()">
            Start Using App
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(carousel);
    
    // Setup carousel navigation
    let currentSlide = 0;
    const slides = carousel.querySelectorAll('.hero-carousel-slide');
    const dots = carousel.querySelectorAll('.hero-carousel-dot');
    
    window.heroCarouselNext = () => {
      currentSlide = (currentSlide + 1) % slides.length;
      this.updateCarousel(slides, dots, currentSlide);
    };
    
    window.heroCarouselPrev = () => {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      this.updateCarousel(slides, dots, currentSlide);
    };
    
    window.heroCarouselGoTo = (index) => {
      currentSlide = index;
      this.updateCarousel(slides, dots, currentSlide);
    };
  }

  updateCarousel(slides, dots, index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  showOnboarding() {
    // Progressive onboarding for first-time users
    const onboarding = document.createElement('div');
    onboarding.className = 'hero-onboarding';
    onboarding.innerHTML = `
      <div class="hero-onboarding-overlay"></div>
      <div class="hero-onboarding-tooltip" data-step="1">
        <div class="hero-onboarding-arrow"></div>
        <div class="hero-onboarding-content">
          <h3>Welcome! Let's get you started</h3>
          <p>This is your event discovery feed. Swipe through exclusive gaming industry parties.</p>
          <div class="hero-onboarding-actions">
            <button class="hero-btn-text" onclick="window.skipOnboarding()">Skip</button>
            <button class="hero-btn hero-btn-primary" onclick="window.nextOnboardingStep()">
              Next →
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(onboarding);
    
    // Setup onboarding flow
    window.currentOnboardingStep = 1;
    window.onboardingSteps = [
      {
        target: '.party-card:first-child',
        title: 'Save Events',
        text: 'Tap the bookmark to save events to your personal collection'
      },
      {
        target: '.nav-item[data-section="people"]',
        title: 'Network with Professionals',
        text: 'Connect with developers, publishers, and industry leaders'
      },
      {
        target: '.nav-item[data-section="calendar"]',
        title: 'Sync Your Calendar',
        text: 'Export events directly to Google Calendar or Apple Calendar'
      }
    ];
    
    window.nextOnboardingStep = () => {
      if (window.currentOnboardingStep < window.onboardingSteps.length) {
        window.currentOnboardingStep++;
        this.updateOnboardingStep(onboarding);
      } else {
        this.completeOnboarding(onboarding);
      }
    };
    
    window.skipOnboarding = () => {
      this.completeOnboarding(onboarding);
    };
  }

  updateOnboardingStep(container) {
    const step = window.onboardingSteps[window.currentOnboardingStep - 1];
    const tooltip = container.querySelector('.hero-onboarding-tooltip');
    const target = document.querySelector(step.target);
    
    if (target) {
      const rect = target.getBoundingClientRect();
      tooltip.style.top = `${rect.bottom + 10}px`;
      tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
      tooltip.style.transform = 'translateX(-50%)';
    }
    
    tooltip.querySelector('h3').textContent = step.title;
    tooltip.querySelector('p').textContent = step.text;
    
    if (window.currentOnboardingStep === window.onboardingSteps.length) {
      tooltip.querySelector('.hero-btn').textContent = 'Finish';
    }
  }

  completeOnboarding(container) {
    container.style.animation = 'fadeOut 300ms ease-out';
    setTimeout(() => container.remove(), 300);
    localStorage.setItem('onboarding_completed', 'true');
    
    // Show success toast
    this.showToast('Welcome aboard! You\'re all set up 🎉');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'hero-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideUp 300ms ease-out';
    }, 10);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 300ms ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  skipHero() {
    this.heroContainer.style.display = 'none';
    this.appContainer.style.display = 'block';
    
    // Trigger app initialization
    window.dispatchEvent(new Event('app-ready'));
  }
}

// Initialize on DOM ready and expose globally
let heroLandingInstance = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    heroLandingInstance = new HeroLanding();
    window.heroLanding = heroLandingInstance;
  });
} else {
  heroLandingInstance = new HeroLanding();
  window.heroLanding = heroLandingInstance;
}

// Listen for app-ready event to initialize the main app
window.addEventListener('app-ready', () => {
  // Import and initialize the app dynamically
  import('./app-unified.js').then(module => {
    console.log('[App] Initializing main application');
  }).catch(err => {
    console.error('[App] Failed to load:', err);
    // Fallback: just show the content
    document.getElementById('app').style.display = 'block';
  });
});

// Add required styles for modals and overlays
const style = document.createElement('style');
style.textContent = `
  /* Feature Modal */
  .hero-feature-modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--hero-space-4);
    opacity: 0;
    pointer-events: none;
    transition: opacity 300ms ease-out;
  }
  
  .hero-feature-modal.active {
    opacity: 1;
    pointer-events: auto;
  }
  
  .hero-feature-modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: opacity 300ms ease-out;
  }
  
  .hero-feature-modal-content {
    position: relative;
    background: var(--hero-gray-900);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--hero-radius-xl);
    padding: var(--hero-space-6);
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    transform: scale(0.9) translateY(20px);
    transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .hero-feature-modal.active .hero-feature-modal-content {
    transform: scale(1) translateY(0);
  }
  
  .hero-feature-modal-header {
    display: flex;
    align-items: center;
    gap: var(--hero-space-4);
    margin-bottom: var(--hero-space-5);
  }
  
  .hero-feature-modal-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, var(--hero-accent) 0%, var(--hero-purple) 100%);
    border-radius: var(--hero-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
  }
  
  .hero-feature-modal-title {
    font-size: var(--hero-text-2xl);
    font-weight: 600;
    color: var(--hero-white);
  }
  
  .hero-feature-modal-description {
    color: var(--hero-gray-400);
    margin-bottom: var(--hero-space-5);
    line-height: 1.6;
  }
  
  .hero-feature-modal-list {
    list-style: none;
    margin-bottom: var(--hero-space-6);
  }
  
  .hero-feature-modal-item {
    display: flex;
    align-items: center;
    gap: var(--hero-space-3);
    padding: var(--hero-space-3) 0;
    color: var(--hero-gray-300);
  }
  
  .hero-feature-modal-check {
    color: var(--hero-green);
    font-weight: 600;
  }
  
  .hero-feature-modal-actions {
    display: flex;
    gap: var(--hero-space-3);
  }
  
  /* Carousel */
  .hero-carousel {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--hero-space-4);
  }
  
  .hero-carousel-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(20px);
    cursor: pointer;
  }
  
  .hero-carousel-container {
    position: relative;
    background: var(--hero-gray-900);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--hero-radius-xl);
    padding: var(--hero-space-8);
    max-width: 800px;
    width: 100%;
    max-height: 80vh;
  }
  
  .hero-carousel-track {
    position: relative;
    height: 400px;
    margin: var(--hero-space-6) 0;
  }
  
  .hero-carousel-slide {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    opacity: 0;
    transform: translateX(100%);
    transition: all 500ms var(--hero-easing);
  }
  
  .hero-carousel-slide.active {
    opacity: 1;
    transform: translateX(0);
  }
  
  /* Onboarding */
  .hero-onboarding-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 999;
  }
  
  .hero-onboarding-tooltip {
    position: fixed;
    background: var(--hero-gray-900);
    border: 2px solid var(--hero-accent);
    border-radius: var(--hero-radius-lg);
    padding: var(--hero-space-5);
    max-width: 400px;
    z-index: 1000;
    box-shadow: 0 20px 40px rgba(0, 122, 255, 0.3);
  }
  
  /* Toast */
  .hero-toast {
    position: fixed;
    bottom: var(--hero-space-6);
    left: 50%;
    transform: translateX(-50%);
    background: var(--hero-gray-900);
    color: var(--hero-white);
    padding: var(--hero-space-4) var(--hero-space-6);
    border-radius: var(--hero-radius-full);
    box-shadow: var(--hero-shadow-xl);
    z-index: 1001;
    animation: slideUp 300ms var(--hero-easing);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
document.head.appendChild(style);