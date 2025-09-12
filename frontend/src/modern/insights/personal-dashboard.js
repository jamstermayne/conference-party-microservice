/**
 * Personal Insights Dashboard
 * Generates personalized metrics and insights from conference data
 */

class PersonalDashboard {
  constructor(containerId, options = {}) {
    this.container = typeof containerId === 'string' ? 
      document.getElementById(containerId) : containerId;
    this.options = {
      theme: options.theme || 'dark',
      animated: options.animated !== false,
      interactive: options.interactive !== false,
      showGoals: options.showGoals !== false,
      ...options
    };
    
    this.userId = options.userId || this.getCurrentUserId();
    this.conferenceId = options.conferenceId || this.getCurrentConferenceId();
    
    this.metrics = null;
    this.charts = new Map();
    this.goals = null;
    
    this.initialize();
  }
  
  /**
   * Initialize dashboard
   */
  async initialize() {
    if (!this.container) {
      console.error('[PersonalDashboard] Container not found');
      return;
    }
    
    this.container.innerHTML = this.getLoadingHTML();
    
    try {
      // Load metrics and goals
      await Promise.all([
        this.loadMetrics(),
        this.loadGoals()
      ]);
      
      this.render();
    } catch (error) {
      console.error('[PersonalDashboard] Failed to initialize:', error);
      this.container.innerHTML = this.getErrorHTML(error.message);
    }
  }
  
  /**
   * Load personal metrics
   */
  async loadMetrics() {
    try {
      // Get conference data
      const conferenceData = await this.getConferenceData();
      
      // Calculate comprehensive metrics
      this.metrics = {
        networking: this.calculateNetworkingMetrics(conferenceData),
        engagement: this.calculateEngagementMetrics(conferenceData),
        learning: this.calculateLearningMetrics(conferenceData),
        opportunities: this.calculateOpportunityMetrics(conferenceData),
        efficiency: this.calculateEfficiencyMetrics(conferenceData),
        growth: this.calculateGrowthMetrics(conferenceData)
      };
      
      console.log('[PersonalDashboard] Loaded metrics:', this.metrics);
    } catch (error) {
      throw new Error(`Failed to load metrics: ${error.message}`);
    }
  }
  
  /**
   * Load personal goals
   */
  async loadGoals() {
    try {
      const stored = localStorage.getItem(`conference_goals_${this.conferenceId}`);
      this.goals = stored ? JSON.parse(stored) : this.getDefaultGoals();
    } catch (error) {
      console.warn('[PersonalDashboard] Using default goals:', error);
      this.goals = this.getDefaultGoals();
    }
  }
  
  /**
   * Get conference data for analysis
   */
  async getConferenceData() {
    // Mock data for development - replace with actual API calls
    return {
      connections: [
        { id: 1, name: 'Sarah Johnson', company: 'Epic Games', role: 'Senior Developer', strength: 0.9 },
        { id: 2, name: 'Mike Chen', company: 'Riot Games', role: 'Product Manager', strength: 0.7 },
        { id: 3, name: 'Anna Rodriguez', company: 'Ubisoft', role: 'Art Director', strength: 0.8 }
      ],
      events: [
        { id: 1, title: 'AI in Gaming', attended: true, rating: 5, duration: 60 },
        { id: 2, title: 'Mobile Gaming Trends', attended: true, rating: 4, duration: 90 },
        { id: 3, title: 'VR Development', attended: false, duration: 120 }
      ],
      conversations: [
        { id: 1, connectionId: 1, messages: 15, duration: 25, quality: 'high' },
        { id: 2, connectionId: 2, messages: 8, duration: 12, quality: 'medium' }
      ],
      opportunities: [
        { id: 1, type: 'job', company: 'Epic Games', role: 'Senior Developer', interested: true },
        { id: 2, type: 'partnership', company: 'Indie Studio', project: 'Mobile Game', interested: true }
      ]
    };
  }
  
  /**
   * Calculate networking metrics
   */
  calculateNetworkingMetrics(data) {
    const totalConnections = data.connections.length;
    const highQualityConnections = data.connections.filter(c => c.strength > 0.8).length;
    const averageConnectionStrength = data.connections.reduce((sum, c) => sum + c.strength, 0) / totalConnections;
    
    const companiesRepresented = new Set(data.connections.map(c => c.company)).size;
    const rolesRepresented = new Set(data.connections.map(c => c.role)).size;
    
    return {
      totalConnections,
      highQualityConnections,
      averageConnectionStrength,
      companiesRepresented,
      rolesRepresented,
      networkDiversity: (companiesRepresented + rolesRepresented) / (totalConnections * 2),
      score: Math.min((totalConnections * 10 + highQualityConnections * 20) / 100, 1)
    };
  }
  
  /**
   * Calculate engagement metrics
   */
  calculateEngagementMetrics(data) {
    const eventsAttended = data.events.filter(e => e.attended).length;
    const totalEvents = data.events.length;
    const attendanceRate = eventsAttended / totalEvents;
    
    const averageRating = data.events
      .filter(e => e.attended && e.rating)
      .reduce((sum, e) => sum + e.rating, 0) / eventsAttended || 0;
    
    const totalConversationTime = data.conversations.reduce((sum, c) => sum + c.duration, 0);
    const averageConversationLength = totalConversationTime / data.conversations.length || 0;
    
    const highQualityConversations = data.conversations.filter(c => c.quality === 'high').length;
    
    return {
      eventsAttended,
      attendanceRate,
      averageRating,
      totalConversationTime,
      averageConversationLength,
      highQualityConversations,
      engagementScore: (attendanceRate * 0.4 + (averageRating / 5) * 0.3 + 
                       (highQualityConversations / data.conversations.length) * 0.3)
    };
  }
  
  /**
   * Calculate learning metrics
   */
  calculateLearningMetrics(data) {
    const attendedEvents = data.events.filter(e => e.attended);
    const totalLearningTime = attendedEvents.reduce((sum, e) => sum + e.duration, 0);
    const avgEventRating = attendedEvents.reduce((sum, e) => sum + (e.rating || 0), 0) / attendedEvents.length || 0;
    
    const topicsEngaged = attendedEvents.length;
    const knowledgeGainScore = (avgEventRating / 5) * (totalLearningTime / 300); // Normalized to 5 hours
    
    return {
      totalLearningTime,
      topicsEngaged,
      avgEventRating,
      knowledgeGainScore: Math.min(knowledgeGainScore, 1),
      learningVelocity: totalLearningTime / Math.max(attendedEvents.length, 1)
    };
  }
  
  /**
   * Calculate opportunity metrics
   */
  calculateOpportunityMetrics(data) {
    const totalOpportunities = data.opportunities.length;
    const interestedOpportunities = data.opportunities.filter(o => o.interested).length;
    const interestRate = interestedOpportunities / totalOpportunities || 0;
    
    const jobOpportunities = data.opportunities.filter(o => o.type === 'job').length;
    const partnershipOpportunities = data.opportunities.filter(o => o.type === 'partnership').length;
    
    return {
      totalOpportunities,
      interestedOpportunities,
      interestRate,
      jobOpportunities,
      partnershipOpportunities,
      opportunityScore: interestRate * Math.min(totalOpportunities / 5, 1)
    };
  }
  
  /**
   * Calculate efficiency metrics
   */
  calculateEfficiencyMetrics(data) {
    const timeInvested = data.events.reduce((sum, e) => sum + e.duration, 0) + 
                        data.conversations.reduce((sum, c) => sum + c.duration, 0);
    
    const valueGenerated = data.connections.length * 10 + // Connection value
                          data.opportunities.filter(o => o.interested).length * 50 + // Opportunity value
                          data.conversations.filter(c => c.quality === 'high').length * 20; // Quality conversation value
    
    const roi = valueGenerated / (timeInvested / 60); // Value per hour
    const networkingEfficiency = data.connections.length / (timeInvested / 60); // Connections per hour
    
    return {
      timeInvested,
      valueGenerated,
      roi,
      networkingEfficiency,
      efficiencyScore: Math.min(roi / 50, 1) // Normalized to 50 value per hour
    };
  }
  
  /**
   * Calculate growth metrics
   */
  calculateGrowthMetrics(data) {
    // Mock growth calculation - would compare with previous conferences
    const skillsAcquired = data.events.filter(e => e.attended).length;
    const networkGrowth = data.connections.length;
    const careerProgression = data.opportunities.filter(o => o.type === 'job' && o.interested).length;
    
    return {
      skillsAcquired,
      networkGrowth,
      careerProgression,
      overallGrowth: (skillsAcquired * 10 + networkGrowth * 15 + careerProgression * 25) / 100
    };
  }
  
  /**
   * Get default goals
   */
  getDefaultGoals() {
    return {
      connections: { target: 10, priority: 'high' },
      events: { target: 5, priority: 'medium' },
      opportunities: { target: 3, priority: 'high' },
      learningHours: { target: 8, priority: 'medium' }
    };
  }
  
  /**
   * Render dashboard
   */
  render() {
    this.container.innerHTML = this.getDashboardHTML();
    this.attachEventListeners();
    this.renderCharts();
    
    if (this.options.animated) {
      this.animateMetrics();
    }
  }
  
  /**
   * Generate dashboard HTML
   */
  getDashboardHTML() {
    return `
      <div class="personal-dashboard" data-theme="${this.options.theme}">
        <div class="dashboard-header">
          <h2 class="dashboard-title">Your Conference Insights</h2>
          <div class="dashboard-summary">
            <div class="summary-card">
              <div class="summary-value">${this.metrics.networking.totalConnections}</div>
              <div class="summary-label">New Connections</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${this.metrics.engagement.eventsAttended}</div>
              <div class="summary-label">Events Attended</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${this.metrics.opportunities.interestedOpportunities}</div>
              <div class="summary-label">Opportunities</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${Math.round(this.metrics.learning.totalLearningTime / 60)}h</div>
              <div class="summary-label">Learning Time</div>
            </div>
          </div>
        </div>
        
        <div class="dashboard-grid">
          ${this.getNetworkingCardHTML()}
          ${this.getEngagementCardHTML()}
          ${this.getLearningCardHTML()}
          ${this.getOpportunitiesCardHTML()}
          ${this.getEfficiencyCardHTML()}
          ${this.getGrowthCardHTML()}
        </div>
        
        ${this.options.showGoals ? this.getGoalsHTML() : ''}
        
        <div class="dashboard-actions">
          <button class="action-btn primary" onclick="personalDashboard.exportReport()">
            Export Report
          </button>
          <button class="action-btn" onclick="personalDashboard.shareInsights()">
            Share Insights
          </button>
          <button class="action-btn" onclick="personalDashboard.setGoals()">
            Update Goals
          </button>
        </div>
      </div>
      
      ${this.getStylesHTML()}
    `;
  }
  
  /**
   * Generate networking card HTML
   */
  getNetworkingCardHTML() {
    const metrics = this.metrics.networking;
    const scorePercentage = Math.round(metrics.score * 100);
    
    return `
      <div class="metric-card networking">
        <div class="card-header">
          <h3 class="card-title">Networking</h3>
          <div class="score-badge score-${this.getScoreClass(metrics.score)}">${scorePercentage}%</div>
        </div>
        <div class="card-content">
          <div class="metric-chart">
            <canvas id="networking-chart" width="200" height="120"></canvas>
          </div>
          <div class="metric-details">
            <div class="metric-row">
              <span class="metric-label">Total Connections</span>
              <span class="metric-value">${metrics.totalConnections}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">High Quality</span>
              <span class="metric-value">${metrics.highQualityConnections}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Companies</span>
              <span class="metric-value">${metrics.companiesRepresented}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Network Diversity</span>
              <span class="metric-value">${Math.round(metrics.networkDiversity * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Generate engagement card HTML
   */
  getEngagementCardHTML() {
    const metrics = this.metrics.engagement;
    const scorePercentage = Math.round(metrics.engagementScore * 100);
    
    return `
      <div class="metric-card engagement">
        <div class="card-header">
          <h3 class="card-title">Engagement</h3>
          <div class="score-badge score-${this.getScoreClass(metrics.engagementScore)}">${scorePercentage}%</div>
        </div>
        <div class="card-content">
          <div class="metric-chart">
            <canvas id="engagement-chart" width="200" height="120"></canvas>
          </div>
          <div class="metric-details">
            <div class="metric-row">
              <span class="metric-label">Attendance Rate</span>
              <span class="metric-value">${Math.round(metrics.attendanceRate * 100)}%</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Avg Rating</span>
              <span class="metric-value">${metrics.averageRating.toFixed(1)}/5</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Conversation Time</span>
              <span class="metric-value">${metrics.totalConversationTime}m</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Quality Conversations</span>
              <span class="metric-value">${metrics.highQualityConversations}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Generate learning card HTML
   */
  getLearningCardHTML() {
    const metrics = this.metrics.learning;
    const scorePercentage = Math.round(metrics.knowledgeGainScore * 100);
    
    return `
      <div class="metric-card learning">
        <div class="card-header">
          <h3 class="card-title">Learning</h3>
          <div class="score-badge score-${this.getScoreClass(metrics.knowledgeGainScore)}">${scorePercentage}%</div>
        </div>
        <div class="card-content">
          <div class="metric-chart">
            <canvas id="learning-chart" width="200" height="120"></canvas>
          </div>
          <div class="metric-details">
            <div class="metric-row">
              <span class="metric-label">Learning Time</span>
              <span class="metric-value">${Math.round(metrics.totalLearningTime / 60)}h</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Topics Engaged</span>
              <span class="metric-value">${metrics.topicsEngaged}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Avg Rating</span>
              <span class="metric-value">${metrics.avgEventRating.toFixed(1)}/5</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Learning Velocity</span>
              <span class="metric-value">${Math.round(metrics.learningVelocity)}m/topic</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Generate opportunities card HTML
   */
  getOpportunitiesCardHTML() {
    const metrics = this.metrics.opportunities;
    const scorePercentage = Math.round(metrics.opportunityScore * 100);
    
    return `
      <div class="metric-card opportunities">
        <div class="card-header">
          <h3 class="card-title">Opportunities</h3>
          <div class="score-badge score-${this.getScoreClass(metrics.opportunityScore)}">${scorePercentage}%</div>
        </div>
        <div class="card-content">
          <div class="metric-chart">
            <canvas id="opportunities-chart" width="200" height="120"></canvas>
          </div>
          <div class="metric-details">
            <div class="metric-row">
              <span class="metric-label">Total Opportunities</span>
              <span class="metric-value">${metrics.totalOpportunities}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Interested In</span>
              <span class="metric-value">${metrics.interestedOpportunities}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Job Opportunities</span>
              <span class="metric-value">${metrics.jobOpportunities}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Partnerships</span>
              <span class="metric-value">${metrics.partnershipOpportunities}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Generate efficiency card HTML
   */
  getEfficiencyCardHTML() {
    const metrics = this.metrics.efficiency;
    const scorePercentage = Math.round(metrics.efficiencyScore * 100);
    
    return `
      <div class="metric-card efficiency">
        <div class="card-header">
          <h3 class="card-title">Efficiency</h3>
          <div class="score-badge score-${this.getScoreClass(metrics.efficiencyScore)}">${scorePercentage}%</div>
        </div>
        <div class="card-content">
          <div class="metric-chart">
            <canvas id="efficiency-chart" width="200" height="120"></canvas>
          </div>
          <div class="metric-details">
            <div class="metric-row">
              <span class="metric-label">Time Invested</span>
              <span class="metric-value">${Math.round(metrics.timeInvested / 60)}h</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Value Generated</span>
              <span class="metric-value">${metrics.valueGenerated}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">ROI</span>
              <span class="metric-value">${metrics.roi.toFixed(1)}/h</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Networking Rate</span>
              <span class="metric-value">${metrics.networkingEfficiency.toFixed(1)}/h</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Generate growth card HTML
   */
  getGrowthCardHTML() {
    const metrics = this.metrics.growth;
    const scorePercentage = Math.round(metrics.overallGrowth);
    
    return `
      <div class="metric-card growth">
        <div class="card-header">
          <h3 class="card-title">Growth</h3>
          <div class="score-badge score-${this.getScoreClass(metrics.overallGrowth / 100)}">${scorePercentage}%</div>
        </div>
        <div class="card-content">
          <div class="metric-chart">
            <canvas id="growth-chart" width="200" height="120"></canvas>
          </div>
          <div class="metric-details">
            <div class="metric-row">
              <span class="metric-label">Skills Acquired</span>
              <span class="metric-value">${metrics.skillsAcquired}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Network Growth</span>
              <span class="metric-value">${metrics.networkGrowth}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Career Opportunities</span>
              <span class="metric-value">${metrics.careerProgression}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Overall Progress</span>
              <span class="metric-value">${scorePercentage}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Generate goals HTML
   */
  getGoalsHTML() {
    return `
      <div class="goals-section">
        <h3 class="section-title">Your Goals Progress</h3>
        <div class="goals-grid">
          <div class="goal-card">
            <div class="goal-header">
              <span class="goal-title">Connections</span>
              <span class="goal-progress">${this.metrics.networking.totalConnections}/${this.goals.connections.target}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(this.metrics.networking.totalConnections / this.goals.connections.target * 100, 100)}%"></div>
            </div>
          </div>
          
          <div class="goal-card">
            <div class="goal-header">
              <span class="goal-title">Events</span>
              <span class="goal-progress">${this.metrics.engagement.eventsAttended}/${this.goals.events.target}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(this.metrics.engagement.eventsAttended / this.goals.events.target * 100, 100)}%"></div>
            </div>
          </div>
          
          <div class="goal-card">
            <div class="goal-header">
              <span class="goal-title">Opportunities</span>
              <span class="goal-progress">${this.metrics.opportunities.interestedOpportunities}/${this.goals.opportunities.target}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(this.metrics.opportunities.interestedOpportunities / this.goals.opportunities.target * 100, 100)}%"></div>
            </div>
          </div>
          
          <div class="goal-card">
            <div class="goal-header">
              <span class="goal-title">Learning Hours</span>
              <span class="goal-progress">${Math.round(this.metrics.learning.totalLearningTime / 60)}h/${this.goals.learningHours.target}h</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min((this.metrics.learning.totalLearningTime / 60) / this.goals.learningHours.target * 100, 100)}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get score class for styling
   */
  getScoreClass(score) {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'needs-improvement';
  }
  
  /**
   * Get loading HTML
   */
  getLoadingHTML() {
    return `
      <div class="dashboard-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Analyzing your conference data...</div>
      </div>
    `;
  }
  
  /**
   * Get error HTML
   */
  getErrorHTML(message) {
    return `
      <div class="dashboard-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">Failed to load dashboard: ${message}</div>
        <button class="retry-btn" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
  
  /**
   * Get dashboard styles
   */
  getStylesHTML() {
    return `
      <style>
        .personal-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .personal-dashboard[data-theme="dark"] {
          background: #0b0f14;
          color: #e1e5ea;
        }
        
        .dashboard-header {
          margin-bottom: 32px;
        }
        
        .dashboard-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 24px 0;
          color: #6366f1;
        }
        
        .dashboard-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .summary-card {
          background: #1a1f26;
          border: 1px solid #2a3038;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        
        .summary-value {
          font-size: 32px;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 8px;
        }
        
        .summary-label {
          font-size: 14px;
          color: #9ca3af;
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        
        .metric-card {
          background: #1a1f26;
          border: 1px solid #2a3038;
          border-radius: 12px;
          padding: 24px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .card-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        
        .score-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .score-excellent { background: #065f46; color: #10b981; }
        .score-good { background: #1e40af; color: #3b82f6; }
        .score-fair { background: #b45309; color: #f59e0b; }
        .score-needs-improvement { background: #991b1b; color: #ef4444; }
        
        .card-content {
          display: flex;
          gap: 20px;
        }
        
        .metric-chart {
          flex: 0 0 200px;
        }
        
        .metric-details {
          flex: 1;
        }
        
        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #2a3038;
        }
        
        .metric-row:last-child {
          border-bottom: none;
        }
        
        .metric-label {
          font-size: 14px;
          color: #9ca3af;
        }
        
        .metric-value {
          font-weight: 600;
          color: #e1e5ea;
        }
        
        .goals-section {
          background: #1a1f26;
          border: 1px solid #2a3038;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 20px 0;
          color: #6366f1;
        }
        
        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        
        .goal-card {
          background: #0f1419;
          border: 1px solid #2a3038;
          border-radius: 8px;
          padding: 16px;
        }
        
        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .goal-title {
          font-weight: 500;
        }
        
        .goal-progress {
          font-size: 14px;
          color: #9ca3af;
        }
        
        .progress-bar {
          height: 8px;
          background: #2a3038;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #10b981);
          transition: width 1s ease-in-out;
        }
        
        .dashboard-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .action-btn {
          padding: 12px 24px;
          border: 1px solid #2a3038;
          border-radius: 8px;
          background: #1a1f26;
          color: #e1e5ea;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .action-btn:hover {
          background: #2a3038;
          transform: translateY(-1px);
        }
        
        .action-btn.primary {
          background: #6366f1;
          border-color: #6366f1;
          color: white;
        }
        
        .action-btn.primary:hover {
          background: #5855eb;
        }
        
        .dashboard-loading,
        .dashboard-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #2a3038;
          border-top: 3px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-text {
          color: #9ca3af;
          font-size: 16px;
        }
        
        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .error-message {
          color: #ef4444;
          font-size: 16px;
          margin-bottom: 24px;
        }
        
        .retry-btn {
          padding: 12px 24px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }
        
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .card-content {
            flex-direction: column;
          }
          
          .metric-chart {
            flex: none;
          }
          
          .dashboard-actions {
            flex-direction: column;
          }
        }
      </style>
    `;
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Make dashboard instance globally accessible for button clicks
    window.personalDashboard = this;
  }
  
  /**
   * Render charts
   */
  renderCharts() {
    // Simple canvas-based charts
    this.renderChart('networking-chart', this.metrics.networking);
    this.renderChart('engagement-chart', this.metrics.engagement);
    this.renderChart('learning-chart', this.metrics.learning);
    this.renderChart('opportunities-chart', this.metrics.opportunities);
    this.renderChart('efficiency-chart', this.metrics.efficiency);
    this.renderChart('growth-chart', this.metrics.growth);
  }
  
  /**
   * Render individual chart
   */
  renderChart(canvasId, metrics) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Simple bar chart based on metric type
    const values = Object.values(metrics).filter(v => typeof v === 'number').slice(0, 4);
    const maxValue = Math.max(...values) || 1;
    
    values.forEach((value, i) => {
      const barHeight = (value / maxValue) * (height - 20);
      const barWidth = (width - 40) / values.length - 10;
      const x = 20 + i * (barWidth + 10);
      const y = height - 10 - barHeight;
      
      // Draw bar
      ctx.fillStyle = `hsl(${240 + i * 30}, 70%, 60%)`;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw value label
      ctx.fillStyle = '#e1e5ea';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(value.toFixed(1), x + barWidth/2, y - 5);
    });
  }
  
  /**
   * Animate metrics
   */
  animateMetrics() {
    // Animate progress bars
    requestAnimationFrame(() => {
      const progressBars = document.querySelectorAll('.progress-fill');
      progressBars.forEach(bar => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        bar.style.transition = 'width 2s ease-out';
        
        requestAnimationFrame(() => {
          bar.style.width = targetWidth;
        });
      });
    });
    
    // Animate metric values
    const valueElements = document.querySelectorAll('.summary-value, .metric-value');
    valueElements.forEach(element => {
      const finalValue = parseFloat(element.textContent) || 0;
      let currentValue = 0;
      const increment = finalValue / 60; // 1 second animation at 60fps
      
      const animate = () => {
        currentValue += increment;
        if (currentValue < finalValue) {
          element.textContent = Math.floor(currentValue).toString();
          requestAnimationFrame(animate);
        } else {
          element.textContent = finalValue.toString();
        }
      };
      
      element.textContent = '0';
      setTimeout(animate, Math.random() * 500); // Stagger animations
    });
  }
  
  /**
   * Get current user ID
   */
  getCurrentUserId() {
    return localStorage.getItem('userId') || 'user_' + Date.now();
  }
  
  /**
   * Get current conference ID
   */
  getCurrentConferenceId() {
    return localStorage.getItem('currentConference') || 'gamescom_2025';
  }
  
  /**
   * Export report
   */
  async exportReport() {
    try {
      console.log('[PersonalDashboard] Exporting report...');
      
      // Generate report data
      const reportData = {
        metadata: {
          userId: this.userId,
          conferenceId: this.conferenceId,
          generatedAt: new Date().toISOString(),
          type: 'personal_dashboard'
        },
        metrics: this.metrics,
        goals: this.goals
      };
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `conference_insights_${this.conferenceId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('[PersonalDashboard] Report exported successfully');
    } catch (error) {
      console.error('[PersonalDashboard] Export failed:', error);
      alert('Failed to export report. Please try again.');
    }
  }
  
  /**
   * Share insights
   */
  shareInsights() {
    const insights = [
      `🎯 Made ${this.metrics.networking.totalConnections} meaningful connections at the conference`,
      `📚 Attended ${this.metrics.engagement.eventsAttended} sessions and gained valuable insights`,
      `⚡ Achieved ${Math.round(this.metrics.efficiency.roi * 10) / 10} value per hour invested`,
      `🚀 Identified ${this.metrics.opportunities.interestedOpportunities} promising opportunities`
    ];
    
    const shareText = insights.join('\n\n') + '\n\n#Conference #Networking #ProfessionalGrowth';
    
    if (navigator.share) {
      navigator.share({
        title: 'My Conference Insights',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Insights copied to clipboard!');
      });
    }
  }
  
  /**
   * Set goals
   */
  setGoals() {
    // Simple prompt-based goal setting
    const connections = prompt('Connection goal:', this.goals.connections.target);
    const events = prompt('Events goal:', this.goals.events.target);
    const opportunities = prompt('Opportunities goal:', this.goals.opportunities.target);
    const learningHours = prompt('Learning hours goal:', this.goals.learningHours.target);
    
    if (connections) this.goals.connections.target = parseInt(connections);
    if (events) this.goals.events.target = parseInt(events);
    if (opportunities) this.goals.opportunities.target = parseInt(opportunities);
    if (learningHours) this.goals.learningHours.target = parseInt(learningHours);
    
    // Save updated goals
    localStorage.setItem(`conference_goals_${this.conferenceId}`, JSON.stringify(this.goals));
    
    // Re-render dashboard
    this.render();
  }
  
  /**
   * Update dashboard with new data
   */
  async refresh() {
    await this.initialize();
  }
  
  /**
   * Clean up
   */
  destroy() {
    this.charts.clear();
    if (window.personalDashboard === this) {
      delete window.personalDashboard;
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PersonalDashboard;
}

// Global access
window.PersonalDashboard = PersonalDashboard;