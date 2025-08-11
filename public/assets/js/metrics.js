/**
 * GPT-5 METRICS SYSTEM
 * Critical event tracking for enterprise analytics
 */

class MetricsSystem {
  constructor() {
    this.queue = [];
    this.endpoint = '/api/metrics';
    this.maxBatchSize = 20;
    this.flushInterval = 5000; // 5 seconds
    this.sessionId = this.generateSessionId();
    this.userId = localStorage.getItem('userId') || this.generateUserId();
    
    // Start automatic flushing
    this.startAutoFlush();
    
    // Flush on page unload
    this.bindUnloadEvents();
    
    // Track app boot
    this.track('app_boot', {
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer
    });
  }

  track(event, properties = {}) {
    const metric = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };
    
    this.queue.push(metric);
    console.log(`📊 Metric tracked: ${event}`, properties);
    
    // Auto-flush if batch size reached
    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    }
    
    return metric;
  }

  async flush() {
    if (this.queue.length === 0) return;
    
    const batch = [...this.queue];
    this.queue = [];
    
    try {
      // Use sendBeacon for reliability on page unload
      if (navigator.sendBeacon) {
        const data = new Blob([JSON.stringify({ metrics: batch })], {
          type: 'application/json'
        });
        navigator.sendBeacon(this.endpoint, data);
      } else {
        // Fallback to fetch
        await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics: batch })
        });
      }
      
      console.log(`📤 Flushed ${batch.length} metrics`);
    } catch (error) {
      console.error('Metrics flush failed:', error);
      // Re-queue failed metrics
      this.queue.unshift(...batch);
    }
  }

  startAutoFlush() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  bindUnloadEvents() {
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
    window.addEventListener('pagehide', () => this.flush());
    
    // Flush on visibility change (mobile background)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateUserId() {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
    return userId;
  }

  // Critical event helpers
  trackPartySaved(partyId) {
    return this.track('party_saved', { id: partyId });
  }

  trackPartyUnsaved(partyId) {
    return this.track('party_unsaved', { id: partyId });
  }

  trackCalendarConnected(provider) {
    return this.track('calendar_connected', { 
      provider // 'google' | 'ics' | 'm2m'
    });
  }

  trackInstallPromptShown() {
    return this.track('install_prompt_shown', {});
  }

  trackInstallAccepted() {
    return this.track('install_accepted', {});
  }

  trackInstallDismissed() {
    return this.track('install_dismissed', {});
  }

  trackInviteRedeemed(code) {
    return this.track('invite_redeemed', { 
      codePrefix: code ? code.split('-')[0] : 'unknown'
    });
  }

  trackLinkedInConnected() {
    return this.track('linkedin_connected', {});
  }

  trackError(error, context) {
    return this.track('error_occurred', {
      error: error.message || error,
      stack: error.stack,
      context
    });
  }

  trackPerformance(metric, value) {
    return this.track('performance_metric', {
      metric,
      value
    });
  }
}

// Initialize global metrics instance
window.Metrics = new MetricsSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetricsSystem;
}