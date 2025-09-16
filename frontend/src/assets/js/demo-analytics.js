/**
 * Demo Analytics Tracker
 * Tracks demo interactions for follow-up and optimization
 */

class DemoAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.events = [];
    this.featureViews = new Map();
    this.interactions = 0;

    this.init();
  }

  init() {
    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      this.track('visibility_change', {
        visible: !document.hidden,
        duration: Date.now() - this.startTime
      });
    });

    // Track demo activation method
    this.trackActivationMethod();

    // Send analytics every 30 seconds
    setInterval(() => this.sendAnalytics(), 30000);

    // Send on page unload
    window.addEventListener('beforeunload', () => {
      this.sendAnalytics(true);
    });
  }

  generateSessionId() {
    return 'demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  track(eventName, data = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      event: eventName,
      data: {
        ...data,
        url: window.location.href,
        referrer: document.referrer,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: navigator.userAgent
      }
    };

    this.events.push(event);
    this.interactions++;

    // Log to console in dev mode
    if (window.location.hostname === 'localhost') {
      console.log('📊 Demo Analytics:', eventName, data);
    }

    // Track feature views
    if (eventName.includes('view_')) {
      const feature = eventName.replace('view_', '');
      this.featureViews.set(feature, (this.featureViews.get(feature) || 0) + 1);
    }

    return event;
  }

  trackActivationMethod() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('demo') === 'true') {
      this.track('demo_activation', { method: 'url_parameter' });
    } else if (urlParams.get('enterprise') === 'true') {
      this.track('demo_activation', { method: 'enterprise_url' });
    }
  }

  // Track specific demo features
  trackFeatureView(feature, details = {}) {
    this.track(`view_${feature}`, {
      feature,
      ...details,
      viewCount: this.featureViews.get(feature) || 1
    });
  }

  trackInteraction(action, target, value = null) {
    this.track('interaction', {
      action,
      target,
      value,
      interactionNumber: this.interactions
    });
  }

  trackError(error, context = '') {
    this.track('demo_error', {
      error: error.message || error,
      stack: error.stack,
      context
    });
  }

  calculateEngagement() {
    const duration = (Date.now() - this.startTime) / 1000; // seconds
    const avgTimePerFeature = this.featureViews.size > 0 ?
      duration / this.featureViews.size : 0;

    return {
      sessionDuration: duration,
      featuresViewed: this.featureViews.size,
      totalInteractions: this.interactions,
      avgTimePerFeature,
      engagementScore: this.calculateEngagementScore()
    };
  }

  calculateEngagementScore() {
    // Score based on various factors
    let score = 0;

    // Time spent (max 30 points)
    const minutes = (Date.now() - this.startTime) / 60000;
    score += Math.min(minutes * 2, 30);

    // Features viewed (max 40 points)
    score += Math.min(this.featureViews.size * 10, 40);

    // Interactions (max 30 points)
    score += Math.min(this.interactions * 2, 30);

    return Math.round(score);
  }

  async sendAnalytics(final = false) {
    const payload = {
      sessionId: this.sessionId,
      events: this.events,
      engagement: this.calculateEngagement(),
      final,
      summary: {
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: (Date.now() - this.startTime) / 1000,
        featuresViewed: Array.from(this.featureViews.keys()),
        topFeatures: this.getTopFeatures(),
        device: this.getDeviceInfo()
      }
    };

    try {
      // Send to analytics endpoint
      const response = await fetch('/api/demo-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        this.events = []; // Clear sent events
        console.log('✅ Analytics sent successfully');
      }
    } catch (error) {
      console.error('Failed to send analytics:', error);
      // Store locally as fallback
      this.storeLocally(payload);
    }
  }

  getTopFeatures() {
    return Array.from(this.featureViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([feature, views]) => ({ feature, views }));
  }

  getDeviceInfo() {
    return {
      type: this.getDeviceType(),
      browser: this.getBrowserName(),
      os: this.getOSName(),
      screen: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };
  }

  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  getBrowserName() {
    const agent = navigator.userAgent;
    if (agent.includes('Chrome')) return 'Chrome';
    if (agent.includes('Safari')) return 'Safari';
    if (agent.includes('Firefox')) return 'Firefox';
    if (agent.includes('Edge')) return 'Edge';
    return 'Other';
  }

  getOSName() {
    const platform = navigator.platform;
    if (platform.includes('Win')) return 'Windows';
    if (platform.includes('Mac')) return 'macOS';
    if (platform.includes('Linux')) return 'Linux';
    if (/Android|iPhone|iPad/.test(navigator.userAgent)) {
      return /Android/.test(navigator.userAgent) ? 'Android' : 'iOS';
    }
    return 'Unknown';
  }

  storeLocally(data) {
    try {
      const stored = JSON.parse(localStorage.getItem('demoAnalytics') || '[]');
      stored.push(data);
      localStorage.setItem('demoAnalytics', JSON.stringify(stored));
    } catch (e) {
      console.error('Failed to store analytics locally:', e);
    }
  }

  // Generate analytics report
  generateReport() {
    const engagement = this.calculateEngagement();
    const report = {
      title: 'Demo Session Report',
      sessionId: this.sessionId,
      date: new Date().toISOString(),
      metrics: {
        duration: `${Math.round(engagement.sessionDuration)} seconds`,
        featuresViewed: engagement.featuresViewed,
        interactions: engagement.totalInteractions,
        engagementScore: engagement.engagementScore + '/100'
      },
      featuresAccessed: Array.from(this.featureViews.keys()),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recs = [];
    const engagement = this.calculateEngagement();

    if (engagement.featuresViewed < 3) {
      recs.push('Low feature exploration - consider guided demo');
    }
    if (engagement.sessionDuration < 300) {
      recs.push('Short session - follow up quickly');
    }
    if (this.featureViews.has('executive_dashboard')) {
      recs.push('High interest in ROI metrics - prepare financial details');
    }
    if (this.featureViews.has('white_label')) {
      recs.push('Interested in white-label - discuss customization options');
    }
    if (engagement.engagementScore > 70) {
      recs.push('Highly engaged - schedule follow-up immediately');
    }

    return recs;
  }
}

// Initialize analytics
window.demoAnalytics = new DemoAnalytics();

// Expose tracking methods globally
window.trackDemo = (event, data) => window.demoAnalytics.track(event, data);
window.trackFeature = (feature, details) => window.demoAnalytics.trackFeatureView(feature, details);

export default DemoAnalytics;