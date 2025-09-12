/**
 * Executive Dashboard
 * Comprehensive dashboard for executive-level insights and ROI analysis
 */

class ExecutiveDashboard {
  constructor(containerId, options = {}) {
    this.container = typeof containerId === 'string' ? 
      document.getElementById(containerId) : containerId;
    this.options = {
      theme: options.theme || 'executive',
      timeframe: options.timeframe || '3days',
      refreshInterval: options.refreshInterval || 300000, // 5 minutes
      includeTeamData: options.includeTeamData !== false,
      includeBenchmarks: options.includeBenchmarks !== false,
      currency: options.currency || 'USD',
      ...options
    };
    
    this.executiveData = null;
    this.charts = new Map();
    this.refreshTimer = null;
    this.benchmarkData = null;
    
    this.initialize();
  }
  
  /**
   * Initialize executive dashboard
   */
  async initialize() {
    if (!this.container) {
      console.error('[ExecutiveDashboard] Container not found');
      return;
    }
    
    this.container.innerHTML = this.getLoadingHTML();
    
    try {
      // Load executive data and benchmarks
      await Promise.all([
        this.loadExecutiveData(),
        this.loadBenchmarkData()
      ]);
      
      this.render();
      this.startAutoRefresh();
      
      console.log('[ExecutiveDashboard] Initialized successfully');
    } catch (error) {
      console.error('[ExecutiveDashboard] Failed to initialize:', error);
      this.container.innerHTML = this.getErrorHTML(error.message);
    }
  }
  
  /**
   * Load executive data
   */
  async loadExecutiveData() {
    try {
      // Simulate API call - replace with actual data source
      this.executiveData = {
        overview: {
          totalInvestment: 125000,
          projectedROI: 285000,
          roiMultiplier: 2.28,
          paybackPeriod: 8.5, // months
          confidenceLevel: 85,
          timeframe: '12 months'
        },
        
        teamMetrics: {
          attendees: 12,
          totalConnections: 156,
          qualifiedLeads: 43,
          hotProspects: 18,
          partnershipsInitiated: 7,
          avgConnectionsPerPerson: 13,
          topPerformer: { name: 'Sarah Johnson', connections: 28, score: 95 }
        },
        
        opportunityPipeline: {
          total: 2400000,
          byStage: {
            discovery: { value: 850000, count: 15 },
            qualification: { value: 720000, count: 12 },
            proposal: { value: 480000, count: 8 },
            negotiation: { value: 350000, count: 5 }
          },
          conversionRates: {
            discoveryToQualification: 0.72,
            qualificationToProposal: 0.58,
            proposalToNegotiation: 0.45,
            negotiationToClosure: 0.78
          },
          avgDealSize: 62500,
          expectedClosures: 14,
          timeline: '6-18 months'
        },
        
        marketIntelligence: {
          competitorEncounters: 23,
          marketTrends: [
            { trend: 'AI Integration', mentions: 45, sentiment: 0.8 },
            { trend: 'Sustainability Focus', mentions: 32, sentiment: 0.75 },
            { trend: 'Remote Solutions', mentions: 28, sentiment: 0.65 }
          ],
          industryInsights: [
            'Gaming industry shifting toward cloud-native solutions',
            'Increased demand for cross-platform development tools',
            'Growing emphasis on developer experience and productivity'
          ],
          partnershipOpportunities: 8,
          acquisitionTargets: 3
        },
        
        teamPerformance: [
          { name: 'Sarah Johnson', role: 'VP Sales', connections: 28, meetings: 15, score: 95, roi: 145000 },
          { name: 'Michael Chen', role: 'CTO', connections: 22, meetings: 12, score: 88, roi: 98000 },
          { name: 'Emma Davis', role: 'Head of BD', connections: 25, meetings: 18, score: 92, roi: 126000 },
          { name: 'Alex Rivera', role: 'Product Lead', connections: 19, meetings: 10, score: 82, roi: 75000 }
        ],
        
        brandMetrics: {
          totalReach: 45000,
          impressions: 125000,
          engagementRate: 0.067,
          brandMentions: 89,
          sentimentScore: 0.82,
          shareOfVoice: 0.23,
          thoughtLeadershipScore: 78
        },
        
        knowledgeCapture: {
          sessionsAttended: 48,
          keyInsights: 127,
          technicalLearnings: 34,
          strategicIntelligence: 22,
          competitiveIntel: 15,
          knowledgeTransferRate: 0.85,
          implementationPlan: 'Q4 2025'
        }
      };
      
    } catch (error) {
      throw new Error(`Failed to load executive data: ${error.message}`);
    }
  }
  
  /**
   * Load benchmark data
   */
  async loadBenchmarkData() {
    if (!this.options.includeBenchmarks) return;
    
    try {
      this.benchmarkData = {
        industryAverages: {
          roiMultiplier: 1.85,
          connectionsPerAttendee: 8.5,
          conversionRate: 0.12,
          paybackPeriod: 14.2,
          brandEngagement: 0.045
        },
        topQuartile: {
          roiMultiplier: 2.8,
          connectionsPerAttendee: 15.2,
          conversionRate: 0.28,
          paybackPeriod: 6.8,
          brandEngagement: 0.089
        }
      };
    } catch (error) {
      console.warn('[ExecutiveDashboard] Benchmark data unavailable:', error);
    }
  }
  
  /**
   * Render dashboard
   */
  render() {
    this.container.innerHTML = this.getDashboardHTML();
    this.attachEventListeners();
    this.renderCharts();
    this.updateMetrics();
  }
  
  /**
   * Generate dashboard HTML
   */
  getDashboardHTML() {
    return `
      <div class="executive-dashboard" data-theme="${this.options.theme}">
        <div class="dashboard-header">
          <div class="header-content">
            <h1 class="dashboard-title">Executive Intelligence Dashboard</h1>
            <div class="header-meta">
              <span class="conference-name">${this.getConferenceName()}</span>
              <span class="update-time">Last updated: ${this.getUpdateTime()}</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="action-btn" onclick="executiveDashboard.exportReport()">Export Report</button>
            <button class="action-btn primary" onclick="executiveDashboard.presentResults()">Present Results</button>
          </div>
        </div>
        
        ${this.getKPIOverviewHTML()}
        ${this.getROIAnalysisHTML()}
        ${this.getOpportunityPipelineHTML()}
        ${this.getTeamPerformanceHTML()}
        ${this.getMarketIntelligenceHTML()}
        ${this.getBrandMetricsHTML()}
        ${this.getKnowledgeCaptureHTML()}
        
        <div class="dashboard-footer">
          <div class="confidence-indicator">
            <span class="confidence-label">Data Confidence:</span>
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${this.executiveData.overview.confidenceLevel}%"></div>
            </div>
            <span class="confidence-value">${this.executiveData.overview.confidenceLevel}%</span>
          </div>
        </div>
      </div>
      
      ${this.getStylesHTML()}
    `;
  }
  
  /**
   * Get KPI overview HTML
   */
  getKPIOverviewHTML() {
    const data = this.executiveData.overview;
    
    return `
      <div class="section kpi-overview">
        <h2 class="section-title">Executive Overview</h2>
        <div class="kpi-grid">
          <div class="kpi-card primary">
            <div class="kpi-icon">💰</div>
            <div class="kpi-content">
              <div class="kpi-value">${this.formatCurrency(data.projectedROI)}</div>
              <div class="kpi-label">Projected ROI</div>
              <div class="kpi-meta">${data.roiMultiplier}x Investment</div>
            </div>
            <div class="kpi-trend positive">+${Math.round((data.roiMultiplier - 1) * 100)}%</div>
          </div>
          
          <div class="kpi-card">
            <div class="kpi-icon">⏱️</div>
            <div class="kpi-content">
              <div class="kpi-value">${data.paybackPeriod}</div>
              <div class="kpi-label">Payback Period</div>
              <div class="kpi-meta">Months</div>
            </div>
            <div class="kpi-benchmark">${this.getBenchmarkIndicator('paybackPeriod', data.paybackPeriod)}</div>
          </div>
          
          <div class="kpi-card">
            <div class="kpi-icon">🎯</div>
            <div class="kpi-content">
              <div class="kpi-value">${this.executiveData.teamMetrics.qualifiedLeads}</div>
              <div class="kpi-label">Qualified Leads</div>
              <div class="kpi-meta">${this.executiveData.teamMetrics.hotProspects} Hot Prospects</div>
            </div>
          </div>
          
          <div class="kpi-card">
            <div class="kpi-icon">🤝</div>
            <div class="kpi-content">
              <div class="kpi-value">${this.executiveData.teamMetrics.partnershipsInitiated}</div>
              <div class="kpi-label">New Partnerships</div>
              <div class="kpi-meta">Strategic Alliances</div>
            </div>
          </div>
          
          <div class="kpi-card">
            <div class="kpi-icon">📊</div>
            <div class="kpi-content">
              <div class="kpi-value">${this.formatCurrency(this.executiveData.opportunityPipeline.total)}</div>
              <div class="kpi-label">Pipeline Value</div>
              <div class="kpi-meta">${this.executiveData.opportunityPipeline.expectedClosures} Expected Deals</div>
            </div>
          </div>
          
          <div class="kpi-card">
            <div class="kpi-icon">🚀</div>
            <div class="kpi-content">
              <div class="kpi-value">${Math.round(this.executiveData.brandMetrics.engagementRate * 1000) / 10}%</div>
              <div class="kpi-label">Brand Engagement</div>
              <div class="kpi-meta">${this.formatNumber(this.executiveData.brandMetrics.totalReach)} Reach</div>
            </div>
            <div class="kpi-benchmark">${this.getBenchmarkIndicator('brandEngagement', this.executiveData.brandMetrics.engagementRate)}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get ROI analysis HTML
   */
  getROIAnalysisHTML() {
    return `
      <div class="section roi-analysis">
        <h2 class="section-title">ROI Analysis</h2>
        <div class="roi-grid">
          <div class="roi-chart-container">
            <h3 class="chart-title">Investment Breakdown</h3>
            <canvas id="roiInvestmentChart" width="400" height="300"></canvas>
          </div>
          
          <div class="roi-metrics">
            <h3 class="chart-title">Financial Impact</h3>
            <div class="roi-metric-item">
              <span class="metric-label">Total Investment</span>
              <span class="metric-value">${this.formatCurrency(this.executiveData.overview.totalInvestment)}</span>
            </div>
            <div class="roi-metric-item">
              <span class="metric-label">Projected Return</span>
              <span class="metric-value positive">${this.formatCurrency(this.executiveData.overview.projectedROI)}</span>
            </div>
            <div class="roi-metric-item">
              <span class="metric-label">Net Benefit</span>
              <span class="metric-value positive">${this.formatCurrency(this.executiveData.overview.projectedROI - this.executiveData.overview.totalInvestment)}</span>
            </div>
            <div class="roi-metric-item">
              <span class="metric-label">ROI Multiple</span>
              <span class="metric-value">${this.executiveData.overview.roiMultiplier}x</span>
            </div>
            
            ${this.getBenchmarkComparison()}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get opportunity pipeline HTML
   */
  getOpportunityPipelineHTML() {
    const pipeline = this.executiveData.opportunityPipeline;
    
    return `
      <div class="section opportunity-pipeline">
        <h2 class="section-title">Opportunity Pipeline</h2>
        <div class="pipeline-overview">
          <div class="pipeline-summary">
            <div class="summary-metric">
              <div class="summary-value">${this.formatCurrency(pipeline.total)}</div>
              <div class="summary-label">Total Pipeline Value</div>
            </div>
            <div class="summary-metric">
              <div class="summary-value">${this.formatCurrency(pipeline.avgDealSize)}</div>
              <div class="summary-label">Average Deal Size</div>
            </div>
            <div class="summary-metric">
              <div class="summary-value">${pipeline.expectedClosures}</div>
              <div class="summary-label">Expected Closures</div>
            </div>
          </div>
          
          <div class="pipeline-stages">
            ${this.getPipelineStagesHTML()}
          </div>
          
          <div class="conversion-funnel">
            <h3 class="chart-title">Conversion Rates</h3>
            <canvas id="conversionFunnelChart" width="600" height="300"></canvas>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get pipeline stages HTML
   */
  getPipelineStagesHTML() {
    const stages = this.executiveData.opportunityPipeline.byStage;
    const stageOrder = ['discovery', 'qualification', 'proposal', 'negotiation'];
    
    return stageOrder.map(stage => {
      const stageData = stages[stage];
      const percentage = (stageData.value / this.executiveData.opportunityPipeline.total) * 100;
      
      return `
        <div class="pipeline-stage">
          <div class="stage-header">
            <span class="stage-name">${this.formatStageName(stage)}</span>
            <span class="stage-count">${stageData.count} deals</span>
          </div>
          <div class="stage-value">${this.formatCurrency(stageData.value)}</div>
          <div class="stage-bar">
            <div class="stage-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="stage-percentage">${Math.round(percentage)}%</div>
        </div>
      `;
    }).join('');
  }
  
  /**
   * Get team performance HTML
   */
  getTeamPerformanceHTML() {
    return `
      <div class="section team-performance">
        <h2 class="section-title">Team Performance</h2>
        <div class="team-overview">
          <div class="team-stats">
            <div class="team-stat">
              <div class="stat-value">${this.executiveData.teamMetrics.attendees}</div>
              <div class="stat-label">Team Members</div>
            </div>
            <div class="team-stat">
              <div class="stat-value">${this.executiveData.teamMetrics.totalConnections}</div>
              <div class="stat-label">Total Connections</div>
            </div>
            <div class="team-stat">
              <div class="stat-value">${this.executiveData.teamMetrics.avgConnectionsPerPerson}</div>
              <div class="stat-label">Avg per Person</div>
            </div>
          </div>
          
          <div class="team-leaderboard">
            <h3 class="leaderboard-title">Team Leaderboard</h3>
            ${this.getTeamLeaderboardHTML()}
          </div>
          
          <div class="performance-chart">
            <h3 class="chart-title">Individual Performance</h3>
            <canvas id="teamPerformanceChart" width="600" height="400"></canvas>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get team leaderboard HTML
   */
  getTeamLeaderboardHTML() {
    const sortedTeam = [...this.executiveData.teamPerformance]
      .sort((a, b) => b.score - a.score);
    
    return sortedTeam.map((member, index) => `
      <div class="leaderboard-item ${index === 0 ? 'top-performer' : ''}">
        <div class="member-rank">#${index + 1}</div>
        <div class="member-info">
          <div class="member-name">${member.name}</div>
          <div class="member-role">${member.role}</div>
        </div>
        <div class="member-metrics">
          <div class="metric">
            <span class="metric-value">${member.connections}</span>
            <span class="metric-unit">connections</span>
          </div>
          <div class="metric">
            <span class="metric-value">${this.formatCurrency(member.roi)}</span>
            <span class="metric-unit">projected ROI</span>
          </div>
        </div>
        <div class="member-score">${member.score}</div>
      </div>
    `).join('');
  }
  
  /**
   * Get market intelligence HTML
   */
  getMarketIntelligenceHTML() {
    return `
      <div class="section market-intelligence">
        <h2 class="section-title">Market Intelligence</h2>
        <div class="intelligence-grid">
          <div class="trend-analysis">
            <h3 class="subsection-title">Market Trends</h3>
            ${this.getMarketTrendsHTML()}
          </div>
          
          <div class="competitive-landscape">
            <h3 class="subsection-title">Competitive Intelligence</h3>
            <div class="competitive-metrics">
              <div class="competitive-metric">
                <span class="metric-label">Competitor Encounters</span>
                <span class="metric-value">${this.executiveData.marketIntelligence.competitorEncounters}</span>
              </div>
              <div class="competitive-metric">
                <span class="metric-label">Partnership Opportunities</span>
                <span class="metric-value">${this.executiveData.marketIntelligence.partnershipOpportunities}</span>
              </div>
              <div class="competitive-metric">
                <span class="metric-label">Acquisition Targets</span>
                <span class="metric-value">${this.executiveData.marketIntelligence.acquisitionTargets}</span>
              </div>
            </div>
          </div>
          
          <div class="industry-insights">
            <h3 class="subsection-title">Key Insights</h3>
            <ul class="insights-list">
              ${this.executiveData.marketIntelligence.industryInsights.map(insight => 
                `<li class="insight-item">${insight}</li>`
              ).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get market trends HTML
   */
  getMarketTrendsHTML() {
    return this.executiveData.marketIntelligence.marketTrends.map(trend => `
      <div class="trend-item">
        <div class="trend-header">
          <span class="trend-name">${trend.trend}</span>
          <span class="trend-mentions">${trend.mentions} mentions</span>
        </div>
        <div class="sentiment-bar">
          <div class="sentiment-fill" style="width: ${trend.sentiment * 100}%"></div>
        </div>
        <div class="sentiment-score">${Math.round(trend.sentiment * 100)}% positive</div>
      </div>
    `).join('');
  }
  
  /**
   * Get brand metrics HTML
   */
  getBrandMetricsHTML() {
    const brand = this.executiveData.brandMetrics;
    
    return `
      <div class="section brand-metrics">
        <h2 class="section-title">Brand Impact</h2>
        <div class="brand-grid">
          <div class="brand-reach">
            <h3 class="chart-title">Brand Reach & Engagement</h3>
            <canvas id="brandReachChart" width="400" height="300"></canvas>
          </div>
          
          <div class="brand-stats">
            <div class="brand-stat-grid">
              <div class="brand-stat">
                <div class="stat-icon">👁️</div>
                <div class="stat-content">
                  <div class="stat-value">${this.formatNumber(brand.totalReach)}</div>
                  <div class="stat-label">Total Reach</div>
                </div>
              </div>
              
              <div class="brand-stat">
                <div class="stat-icon">💬</div>
                <div class="stat-content">
                  <div class="stat-value">${brand.brandMentions}</div>
                  <div class="stat-label">Brand Mentions</div>
                </div>
              </div>
              
              <div class="brand-stat">
                <div class="stat-icon">💝</div>
                <div class="stat-content">
                  <div class="stat-value">${Math.round(brand.sentimentScore * 100)}%</div>
                  <div class="stat-label">Sentiment Score</div>
                </div>
              </div>
              
              <div class="brand-stat">
                <div class="stat-icon">🎯</div>
                <div class="stat-content">
                  <div class="stat-value">${Math.round(brand.shareOfVoice * 100)}%</div>
                  <div class="stat-label">Share of Voice</div>
                </div>
              </div>
              
              <div class="brand-stat">
                <div class="stat-icon">🧠</div>
                <div class="stat-content">
                  <div class="stat-value">${brand.thoughtLeadershipScore}</div>
                  <div class="stat-label">Thought Leadership</div>
                </div>
              </div>
              
              <div class="brand-stat">
                <div class="stat-icon">📈</div>
                <div class="stat-content">
                  <div class="stat-value">${Math.round(brand.engagementRate * 1000) / 10}%</div>
                  <div class="stat-label">Engagement Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get knowledge capture HTML
   */
  getKnowledgeCaptureHTML() {
    const knowledge = this.executiveData.knowledgeCapture;
    
    return `
      <div class="section knowledge-capture">
        <h2 class="section-title">Knowledge Capture & Transfer</h2>
        <div class="knowledge-grid">
          <div class="knowledge-stats">
            <div class="knowledge-stat-item">
              <div class="stat-circle">
                <div class="circle-progress" data-percent="${Math.round(knowledge.knowledgeTransferRate * 100)}">
                  <span>${Math.round(knowledge.knowledgeTransferRate * 100)}%</span>
                </div>
              </div>
              <div class="stat-info">
                <div class="stat-label">Knowledge Transfer Rate</div>
                <div class="stat-meta">Organizational Learning</div>
              </div>
            </div>
            
            <div class="knowledge-breakdown">
              <div class="breakdown-item">
                <span class="breakdown-label">Sessions Attended</span>
                <span class="breakdown-value">${knowledge.sessionsAttended}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">Key Insights Captured</span>
                <span class="breakdown-value">${knowledge.keyInsights}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">Technical Learnings</span>
                <span class="breakdown-value">${knowledge.technicalLearnings}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">Strategic Intelligence</span>
                <span class="breakdown-value">${knowledge.strategicIntelligence}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">Competitive Intel</span>
                <span class="breakdown-value">${knowledge.competitiveIntel}</span>
              </div>
            </div>
          </div>
          
          <div class="implementation-timeline">
            <h3 class="chart-title">Implementation Plan</h3>
            <div class="timeline-item active">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-title">Knowledge Consolidation</div>
                <div class="timeline-date">Week 1-2</div>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-title">Strategic Planning Integration</div>
                <div class="timeline-date">Week 3-4</div>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-content">
                <div class="timeline-title">Implementation & Training</div>
                <div class="timeline-date">${knowledge.implementationPlan}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get benchmark comparison HTML
   */
  getBenchmarkComparison() {
    if (!this.benchmarkData) return '';
    
    const our = this.executiveData.overview.roiMultiplier;
    const industry = this.benchmarkData.industryAverages.roiMultiplier;
    const topQuartile = this.benchmarkData.topQuartile.roiMultiplier;
    
    return `
      <div class="benchmark-comparison">
        <div class="benchmark-title">Industry Benchmarks</div>
        <div class="benchmark-item">
          <span class="benchmark-label">Our Performance</span>
          <span class="benchmark-value our">${our}x</span>
        </div>
        <div class="benchmark-item">
          <span class="benchmark-label">Industry Average</span>
          <span class="benchmark-value">${industry}x</span>
        </div>
        <div class="benchmark-item">
          <span class="benchmark-label">Top Quartile</span>
          <span class="benchmark-value">${topQuartile}x</span>
        </div>
      </div>
    `;
  }
  
  /**
   * Render charts
   */
  renderCharts() {
    this.renderROIChart();
    this.renderConversionFunnel();
    this.renderTeamPerformance();
    this.renderBrandReach();
  }
  
  /**
   * Render ROI investment chart
   */
  renderROIChart() {
    const canvas = document.getElementById('roiInvestmentChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Mock investment breakdown data
    const data = [
      { label: 'Registration & Events', value: 45000, color: '#6366f1' },
      { label: 'Travel & Accommodation', value: 35000, color: '#3b82f6' },
      { label: 'Team Time', value: 30000, color: '#10b981' },
      { label: 'Materials & Setup', value: 15000, color: '#f59e0b' }
    ];
    
    this.drawDonutChart(ctx, width, height, data);
    this.charts.set('roi', canvas);
  }
  
  /**
   * Render conversion funnel
   */
  renderConversionFunnel() {
    const canvas = document.getElementById('conversionFunnelChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const pipeline = this.executiveData.opportunityPipeline;
    
    const stages = [
      { name: 'Discovery', value: pipeline.byStage.discovery.count, color: '#6366f1' },
      { name: 'Qualification', value: pipeline.byStage.qualification.count, color: '#3b82f6' },
      { name: 'Proposal', value: pipeline.byStage.proposal.count, color: '#10b981' },
      { name: 'Negotiation', value: pipeline.byStage.negotiation.count, color: '#f59e0b' }
    ];
    
    this.drawFunnelChart(ctx, canvas.width, canvas.height, stages);
    this.charts.set('funnel', canvas);
  }
  
  /**
   * Render team performance chart
   */
  renderTeamPerformance() {
    const canvas = document.getElementById('teamPerformanceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const teamData = this.executiveData.teamPerformance;
    
    this.drawBarChart(ctx, canvas.width, canvas.height, teamData);
    this.charts.set('team', canvas);
  }
  
  /**
   * Render brand reach chart
   */
  renderBrandReach() {
    const canvas = document.getElementById('brandReachChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const brand = this.executiveData.brandMetrics;
    
    const data = [
      { label: 'Direct Reach', value: brand.totalReach * 0.4, color: '#6366f1' },
      { label: 'Social Amplification', value: brand.totalReach * 0.35, color: '#10b981' },
      { label: 'Media Coverage', value: brand.totalReach * 0.25, color: '#f59e0b' }
    ];
    
    this.drawAreaChart(ctx, canvas.width, canvas.height, data);
    this.charts.set('brand', canvas);
  }
  
  /**
   * Draw donut chart
   */
  drawDonutChart(ctx, width, height, data) {
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 3;
    const innerRadius = outerRadius * 0.5;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;
    
    // Draw segments
    data.forEach(item => {
      const segmentAngle = (item.value / total) * 2 * Math.PI;
      
      // Draw outer arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + segmentAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + segmentAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      
      currentAngle += segmentAngle;
    });
    
    // Draw center text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Investment', centerX, centerY - 5);
    ctx.font = '14px system-ui';
    ctx.fillText(this.formatCurrency(total), centerX, centerY + 15);
  }
  
  /**
   * Draw funnel chart
   */
  drawFunnelChart(ctx, width, height, stages) {
    ctx.clearRect(0, 0, width, height);
    
    const maxValue = Math.max(...stages.map(s => s.value));
    const stageHeight = (height - 40) / stages.length;
    const maxWidth = width - 100;
    
    stages.forEach((stage, index) => {
      const stageWidth = (stage.value / maxValue) * maxWidth;
      const x = (width - stageWidth) / 2;
      const y = 20 + index * stageHeight;
      
      // Draw stage bar
      ctx.fillStyle = stage.color;
      ctx.fillRect(x, y, stageWidth, stageHeight - 10);
      
      // Draw stage label and value
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`${stage.name}: ${stage.value}`, x, y + stageHeight - 15);
    });
  }
  
  /**
   * Draw bar chart
   */
  drawBarChart(ctx, width, height, teamData) {
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = (width - 80) / teamData.length;
    const maxScore = 100;
    const chartHeight = height - 60;
    
    teamData.forEach((member, index) => {
      const barHeight = (member.score / maxScore) * chartHeight;
      const x = 40 + index * barWidth;
      const y = height - 30 - barHeight;
      
      // Draw bar
      ctx.fillStyle = member.score >= 90 ? '#10b981' : member.score >= 80 ? '#3b82f6' : '#6b7280';
      ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
      
      // Draw name and score
      ctx.fillStyle = '#1f2937';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x + barWidth/2, height - 10);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(member.name.split(' ')[0], 0, 0);
      ctx.restore();
      
      ctx.font = 'bold 12px system-ui';
      ctx.fillText(member.score, x + barWidth/2, y - 5);
    });
  }
  
  /**
   * Draw area chart
   */
  drawAreaChart(ctx, width, height, data) {
    ctx.clearRect(0, 0, width, height);
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const chartHeight = height - 60;
    let currentY = 30;
    
    data.forEach(item => {
      const segmentHeight = (item.value / total) * chartHeight;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, currentY, width, currentY + segmentHeight);
      gradient.addColorStop(0, item.color + '40');
      gradient.addColorStop(1, item.color + '20');
      
      // Draw area
      ctx.fillStyle = gradient;
      ctx.fillRect(20, currentY, width - 40, segmentHeight);
      
      // Draw border
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(20, currentY, width - 40, segmentHeight);
      
      // Draw label
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.label}: ${this.formatNumber(item.value)}`, 30, currentY + segmentHeight/2 + 5);
      
      currentY += segmentHeight;
    });
  }
  
  /**
   * Update metrics with animation
   */
  updateMetrics() {
    // Animate KPI values
    const kpiValues = document.querySelectorAll('.kpi-value');
    kpiValues.forEach(element => {
      this.animateValue(element);
    });
    
    // Update progress bars
    const progressBars = document.querySelectorAll('.stage-fill, .confidence-fill, .sentiment-fill');
    progressBars.forEach(bar => {
      const targetWidth = bar.style.width;
      bar.style.width = '0%';
      bar.style.transition = 'width 2s ease-out';
      
      setTimeout(() => {
        bar.style.width = targetWidth;
      }, 100);
    });
    
    // Animate circular progress
    this.animateCircularProgress();
  }
  
  /**
   * Animate value counting
   */
  animateValue(element) {
    const text = element.textContent.replace(/[^0-9.-]/g, '');
    const finalValue = parseFloat(text) || 0;
    
    if (finalValue === 0) return;
    
    let currentValue = 0;
    const increment = finalValue / 60; // 1 second animation
    const isDecimal = finalValue < 1;
    const isCurrency = element.textContent.includes('$');
    
    const animate = () => {
      currentValue += increment;
      if (currentValue < finalValue) {
        if (isCurrency) {
          element.textContent = this.formatCurrency(currentValue);
        } else if (isDecimal) {
          element.textContent = currentValue.toFixed(1);
        } else {
          element.textContent = Math.floor(currentValue).toString();
        }
        requestAnimationFrame(animate);
      } else {
        if (isCurrency) {
          element.textContent = this.formatCurrency(finalValue);
        } else {
          element.textContent = finalValue.toString();
        }
      }
    };
    
    element.textContent = '0';
    setTimeout(() => requestAnimationFrame(animate), Math.random() * 500);
  }
  
  /**
   * Animate circular progress
   */
  animateCircularProgress() {
    const progressElements = document.querySelectorAll('.circle-progress');
    progressElements.forEach(element => {
      const percent = parseInt(element.dataset.percent);
      const circumference = 2 * Math.PI * 40; // radius = 40
      
      // Create SVG if it doesn't exist
      if (!element.querySelector('svg')) {
        element.innerHTML = `
          <svg width="100" height="100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="8"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" stroke-width="8" 
                    stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
                    style="transition: stroke-dashoffset 2s ease-out;" class="progress-circle"/>
          </svg>
          <span class="progress-text">${percent}%</span>
        `;
        
        setTimeout(() => {
          const circle = element.querySelector('.progress-circle');
          const offset = circumference - (percent / 100) * circumference;
          circle.style.strokeDashoffset = offset;
        }, 100);
      }
    });
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Make instance globally accessible
    window.executiveDashboard = this;
    
    // Add hover effects for KPI cards
    document.querySelectorAll('.kpi-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
      });
    });
  }
  
  /**
   * Start auto-refresh
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.refresh();
    }, this.options.refreshInterval);
  }
  
  /**
   * Refresh dashboard data
   */
  async refresh() {
    try {
      await this.loadExecutiveData();
      this.updateMetrics();
      console.log('[ExecutiveDashboard] Data refreshed');
    } catch (error) {
      console.warn('[ExecutiveDashboard] Refresh failed:', error);
    }
  }
  
  /**
   * Export executive report
   */
  async exportReport() {
    try {
      console.log('[ExecutiveDashboard] Exporting report...');
      
      // Create comprehensive report data
      const reportData = {
        metadata: {
          title: 'Executive Conference Intelligence Report',
          conferenceName: this.getConferenceName(),
          generatedAt: new Date().toISOString(),
          timeframe: this.options.timeframe,
          confidenceLevel: this.executiveData.overview.confidenceLevel
        },
        executiveData: this.executiveData,
        benchmarkData: this.benchmarkData
      };
      
      // Use PDF generator if available
      if (window.PDFGenerator) {
        const pdfGenerator = new PDFGenerator();
        await pdfGenerator.generateAndDownload('executive', reportData, 'executive_report.pdf');
      } else {
        // Fallback to JSON export
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'executive_intelligence_report.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      console.log('[ExecutiveDashboard] Report exported successfully');
    } catch (error) {
      console.error('[ExecutiveDashboard] Export failed:', error);
      alert('Failed to export report. Please try again.');
    }
  }
  
  /**
   * Present results (opens presentation mode)
   */
  presentResults() {
    // Create presentation overlay
    const overlay = document.createElement('div');
    overlay.className = 'presentation-overlay';
    overlay.innerHTML = `
      <div class="presentation-container">
        <div class="presentation-header">
          <h1>Executive Conference Results</h1>
          <button class="close-presentation" onclick="this.closest('.presentation-overlay').remove()">✕</button>
        </div>
        <div class="presentation-content">
          ${this.getPresentationSlides()}
        </div>
        <div class="presentation-controls">
          <button class="prev-slide">Previous</button>
          <span class="slide-counter">1 / 5</span>
          <button class="next-slide">Next</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.initializePresentationControls(overlay);
  }
  
  /**
   * Get presentation slides HTML
   */
  getPresentationSlides() {
    return `
      <div class="slide active">
        <h2>ROI Overview</h2>
        <div class="slide-content">
          <div class="big-metric">${this.executiveData.overview.roiMultiplier}x</div>
          <div class="metric-label">Return on Investment</div>
          <div class="slide-details">
            Investment: ${this.formatCurrency(this.executiveData.overview.totalInvestment)}<br>
            Projected Return: ${this.formatCurrency(this.executiveData.overview.projectedROI)}<br>
            Payback Period: ${this.executiveData.overview.paybackPeriod} months
          </div>
        </div>
      </div>
      
      <div class="slide">
        <h2>Pipeline Impact</h2>
        <div class="slide-content">
          <div class="big-metric">${this.formatCurrency(this.executiveData.opportunityPipeline.total)}</div>
          <div class="metric-label">Total Pipeline Value</div>
          <div class="slide-details">
            Expected Closures: ${this.executiveData.opportunityPipeline.expectedClosures}<br>
            Average Deal Size: ${this.formatCurrency(this.executiveData.opportunityPipeline.avgDealSize)}<br>
            Timeline: ${this.executiveData.opportunityPipeline.timeline}
          </div>
        </div>
      </div>
      
      <div class="slide">
        <h2>Team Performance</h2>
        <div class="slide-content">
          <div class="big-metric">${this.executiveData.teamMetrics.totalConnections}</div>
          <div class="metric-label">Total Connections Made</div>
          <div class="slide-details">
            Team Members: ${this.executiveData.teamMetrics.attendees}<br>
            Qualified Leads: ${this.executiveData.teamMetrics.qualifiedLeads}<br>
            Avg per Person: ${this.executiveData.teamMetrics.avgConnectionsPerPerson}
          </div>
        </div>
      </div>
      
      <div class="slide">
        <h2>Brand Impact</h2>
        <div class="slide-content">
          <div class="big-metric">${this.formatNumber(this.executiveData.brandMetrics.totalReach)}</div>
          <div class="metric-label">Total Brand Reach</div>
          <div class="slide-details">
            Engagement Rate: ${Math.round(this.executiveData.brandMetrics.engagementRate * 1000) / 10}%<br>
            Brand Mentions: ${this.executiveData.brandMetrics.brandMentions}<br>
            Sentiment Score: ${Math.round(this.executiveData.brandMetrics.sentimentScore * 100)}%
          </div>
        </div>
      </div>
      
      <div class="slide">
        <h2>Next Steps</h2>
        <div class="slide-content">
          <ul class="next-steps-list">
            <li>Follow up on ${this.executiveData.teamMetrics.hotProspects} hot prospects within 48 hours</li>
            <li>Schedule partnership discussions with ${this.executiveData.marketIntelligence.partnershipOpportunities} potential partners</li>
            <li>Implement knowledge transfer sessions by ${this.executiveData.knowledgeCapture.implementationPlan}</li>
            <li>Prepare detailed proposals for top ${this.executiveData.opportunityPipeline.expectedClosures} opportunities</li>
          </ul>
        </div>
      </div>
    `;
  }
  
  /**
   * Initialize presentation controls
   */
  initializePresentationControls(overlay) {
    const slides = overlay.querySelectorAll('.slide');
    const prevBtn = overlay.querySelector('.prev-slide');
    const nextBtn = overlay.querySelector('.next-slide');
    const counter = overlay.querySelector('.slide-counter');
    
    let currentSlide = 0;
    
    const updateSlide = () => {
      slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlide);
      });
      counter.textContent = `${currentSlide + 1} / ${slides.length}`;
      prevBtn.disabled = currentSlide === 0;
      nextBtn.disabled = currentSlide === slides.length - 1;
    };
    
    prevBtn.addEventListener('click', () => {
      if (currentSlide > 0) {
        currentSlide--;
        updateSlide();
      }
    });
    
    nextBtn.addEventListener('click', () => {
      if (currentSlide < slides.length - 1) {
        currentSlide++;
        updateSlide();
      }
    });
    
    updateSlide();
  }
  
  /**
   * Helper functions
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.options.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  
  formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
  }
  
  formatStageName(stage) {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  }
  
  getBenchmarkIndicator(metric, value) {
    if (!this.benchmarkData) return '';
    
    const industry = this.benchmarkData.industryAverages[metric];
    const topQuartile = this.benchmarkData.topQuartile[metric];
    
    if (!industry) return '';
    
    let status, color;
    if (value <= topQuartile * 0.8) {
      status = '🏆';
      color = '#10b981';
    } else if (value <= industry * 1.2) {
      status = '👍';
      color = '#3b82f6';
    } else {
      status = '⚠️';
      color = '#f59e0b';
    }
    
    return `<span class="benchmark-indicator" style="color: ${color}">${status}</span>`;
  }
  
  getConferenceName() {
    return 'Gamescom 2025'; // Replace with dynamic value
  }
  
  getUpdateTime() {
    return new Date().toLocaleTimeString();
  }
  
  getLoadingHTML() {
    return `
      <div class="dashboard-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading executive intelligence...</div>
      </div>
    `;
  }
  
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
   * Get executive dashboard styles
   */
  getStylesHTML() {
    return `
      <style>
        .executive-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
          background: #f8fafc;
          min-height: 100vh;
        }
        
        .executive-dashboard[data-theme="executive"] {
          background: #0f172a;
          color: #e2e8f0;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .executive-dashboard[data-theme="executive"] .dashboard-header {
          background: #1e293b;
          color: #e2e8f0;
        }
        
        .dashboard-title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1e293b;
        }
        
        .executive-dashboard[data-theme="executive"] .dashboard-title {
          color: #f1f5f9;
        }
        
        .header-meta {
          display: flex;
          gap: 24px;
          font-size: 14px;
          color: #64748b;
        }
        
        .header-actions {
          display: flex;
          gap: 12px;
        }
        
        .action-btn {
          padding: 10px 20px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          color: #334155;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .action-btn:hover {
          background: #f8fafc;
          transform: translateY(-1px);
        }
        
        .action-btn.primary {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }
        
        .action-btn.primary:hover {
          background: #2563eb;
        }
        
        .section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .executive-dashboard[data-theme="executive"] .section {
          background: #1e293b;
          border: 1px solid #334155;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 20px 0;
          color: #1e293b;
        }
        
        .executive-dashboard[data-theme="executive"] .section-title {
          color: #f1f5f9;
        }
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .kpi-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          position: relative;
          transition: all 0.3s;
        }
        
        .executive-dashboard[data-theme="executive"] .kpi-card {
          background: #334155;
          border-color: #475569;
        }
        
        .kpi-card.primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border-color: #3b82f6;
        }
        
        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .kpi-icon {
          font-size: 24px;
          margin-bottom: 12px;
        }
        
        .kpi-value {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #1e293b;
        }
        
        .executive-dashboard[data-theme="executive"] .kpi-value {
          color: #f1f5f9;
        }
        
        .kpi-card.primary .kpi-value {
          color: white;
        }
        
        .kpi-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .kpi-card.primary .kpi-label {
          color: rgba(255,255,255,0.9);
        }
        
        .kpi-meta {
          font-size: 12px;
          color: #94a3b8;
        }
        
        .kpi-card.primary .kpi-meta {
          color: rgba(255,255,255,0.7);
        }
        
        .kpi-trend {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .kpi-trend.positive {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        
        .kpi-benchmark {
          position: absolute;
          top: 16px;
          right: 16px;
          font-size: 16px;
        }
        
        .roi-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        
        .roi-chart-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .chart-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #374151;
        }
        
        .executive-dashboard[data-theme="executive"] .chart-title {
          color: #d1d5db;
        }
        
        .roi-metrics {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .roi-metric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .executive-dashboard[data-theme="executive"] .roi-metric-item {
          border-color: #374151;
        }
        
        .metric-label {
          font-weight: 500;
          color: #374151;
        }
        
        .executive-dashboard[data-theme="executive"] .metric-label {
          color: #d1d5db;
        }
        
        .metric-value {
          font-weight: 600;
          color: #1f2937;
        }
        
        .executive-dashboard[data-theme="executive"] .metric-value {
          color: #f9fafb;
        }
        
        .metric-value.positive {
          color: #10b981;
        }
        
        .pipeline-overview {
          display: grid;
          gap: 24px;
        }
        
        .pipeline-summary {
          display: flex;
          justify-content: space-around;
          margin-bottom: 24px;
        }
        
        .summary-metric {
          text-align: center;
        }
        
        .summary-value {
          font-size: 24px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 4px;
        }
        
        .summary-label {
          font-size: 14px;
          color: #64748b;
        }
        
        .pipeline-stages {
          display: grid;
          gap: 16px;
        }
        
        .pipeline-stage {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }
        
        .executive-dashboard[data-theme="executive"] .pipeline-stage {
          background: #334155;
          border-color: #475569;
        }
        
        .stage-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .stage-name {
          font-weight: 600;
          color: #374151;
        }
        
        .executive-dashboard[data-theme="executive"] .stage-name {
          color: #e2e8f0;
        }
        
        .stage-count {
          font-size: 14px;
          color: #64748b;
        }
        
        .stage-value {
          font-size: 18px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 8px;
        }
        
        .stage-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 4px;
        }
        
        .executive-dashboard[data-theme="executive"] .stage-bar {
          background: #475569;
        }
        
        .stage-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 1.5s ease-out;
        }
        
        .stage-percentage {
          font-size: 12px;
          color: #64748b;
          text-align: right;
        }
        
        .team-overview {
          display: grid;
          grid-template-columns: 200px 1fr 1fr;
          gap: 24px;
        }
        
        .team-stats {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .team-stat {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        
        .executive-dashboard[data-theme="executive"] .team-stat {
          background: #334155;
          border-color: #475569;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 12px;
          color: #64748b;
        }
        
        .leaderboard-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #374151;
        }
        
        .executive-dashboard[data-theme="executive"] .leaderboard-title {
          color: #d1d5db;
        }
        
        .leaderboard-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        
        .executive-dashboard[data-theme="executive"] .leaderboard-item {
          background: #334155;
          border-color: #475569;
        }
        
        .leaderboard-item.top-performer {
          background: linear-gradient(135deg, #fef3c7, #fbbf24);
          border-color: #f59e0b;
        }
        
        .member-rank {
          font-weight: 700;
          color: #64748b;
          min-width: 24px;
        }
        
        .member-info {
          flex: 1;
        }
        
        .member-name {
          font-weight: 600;
          color: #374151;
        }
        
        .executive-dashboard[data-theme="executive"] .member-name {
          color: #e2e8f0;
        }
        
        .member-role {
          font-size: 12px;
          color: #64748b;
        }
        
        .member-metrics {
          display: flex;
          gap: 16px;
        }
        
        .metric {
          text-align: center;
        }
        
        .metric-value {
          font-weight: 600;
          color: #374151;
        }
        
        .metric-unit {
          font-size: 10px;
          color: #64748b;
          display: block;
        }
        
        .member-score {
          font-size: 20px;
          font-weight: 700;
          color: #10b981;
          min-width: 40px;
          text-align: center;
        }
        
        .intelligence-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
        }
        
        .subsection-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #374151;
        }
        
        .executive-dashboard[data-theme="executive"] .subsection-title {
          color: #d1d5db;
        }
        
        .trend-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
        }
        
        .executive-dashboard[data-theme="executive"] .trend-item {
          background: #334155;
          border-color: #475569;
        }
        
        .trend-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .trend-name {
          font-weight: 500;
          color: #374151;
        }
        
        .executive-dashboard[data-theme="executive"] .trend-name {
          color: #e2e8f0;
        }
        
        .trend-mentions {
          font-size: 12px;
          color: #64748b;
        }
        
        .sentiment-bar {
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 4px;
        }
        
        .sentiment-fill {
          height: 100%;
          background: #10b981;
          transition: width 1s ease-out;
        }
        
        .sentiment-score {
          font-size: 12px;
          color: #10b981;
        }
        
        .competitive-metrics {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .competitive-metric {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .executive-dashboard[data-theme="executive"] .competitive-metric {
          border-color: #374151;
        }
        
        .insights-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .insight-item {
          padding: 8px 0;
          color: #4b5563;
          border-left: 3px solid #3b82f6;
          padding-left: 12px;
          margin-bottom: 8px;
        }
        
        .executive-dashboard[data-theme="executive"] .insight-item {
          color: #d1d5db;
        }
        
        .brand-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        
        .brand-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }
        
        .brand-stat {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }
        
        .executive-dashboard[data-theme="executive"] .brand-stat {
          background: #334155;
          border-color: #475569;
        }
        
        .stat-icon {
          font-size: 24px;
        }
        
        .stat-content {
          flex: 1;
        }
        
        .knowledge-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        
        .knowledge-stat-item {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .stat-circle {
          position: relative;
          width: 100px;
          height: 100px;
        }
        
        .circle-progress {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .progress-text {
          font-size: 18px;
          font-weight: 700;
          color: #10b981;
        }
        
        .knowledge-breakdown {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .executive-dashboard[data-theme="executive"] .breakdown-item {
          border-color: #374151;
        }
        
        .breakdown-label {
          color: #64748b;
        }
        
        .breakdown-value {
          font-weight: 600;
          color: #374151;
        }
        
        .executive-dashboard[data-theme="executive"] .breakdown-value {
          color: #e2e8f0;
        }
        
        .implementation-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .timeline-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }
        
        .executive-dashboard[data-theme="executive"] .timeline-item {
          background: #334155;
          border-color: #475569;
        }
        
        .timeline-item.active {
          background: #dbeafe;
          border-color: #3b82f6;
        }
        
        .timeline-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #94a3b8;
        }
        
        .timeline-item.active .timeline-dot {
          background: #3b82f6;
        }
        
        .timeline-title {
          font-weight: 500;
          color: #374151;
        }
        
        .executive-dashboard[data-theme="executive"] .timeline-title {
          color: #e2e8f0;
        }
        
        .timeline-date {
          font-size: 12px;
          color: #64748b;
        }
        
        .dashboard-footer {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-top: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .executive-dashboard[data-theme="executive"] .dashboard-footer {
          background: #1e293b;
          border: 1px solid #334155;
        }
        
        .confidence-indicator {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .confidence-label {
          font-weight: 500;
          color: #374151;
        }
        
        .executive-dashboard[data-theme="executive"] .confidence-label {
          color: #d1d5db;
        }
        
        .confidence-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .executive-dashboard[data-theme="executive"] .confidence-bar {
          background: #475569;
        }
        
        .confidence-fill {
          height: 100%;
          background: #10b981;
          transition: width 2s ease-out;
        }
        
        .confidence-value {
          font-weight: 600;
          color: #10b981;
        }
        
        .benchmark-comparison {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        .executive-dashboard[data-theme="executive"] .benchmark-comparison {
          border-color: #374151;
        }
        
        .benchmark-title {
          font-weight: 600;
          margin-bottom: 12px;
          color: #374151;
        }
        
        .executive-dashboard[data-theme="executive"] .benchmark-title {
          color: #d1d5db;
        }
        
        .benchmark-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }
        
        .benchmark-value {
          font-weight: 600;
          color: #64748b;
        }
        
        .benchmark-value.our {
          color: #10b981;
        }
        
        .benchmark-indicator {
          font-size: 16px;
        }
        
        .presentation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .presentation-container {
          width: 90%;
          max-width: 800px;
          height: 90%;
          background: white;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
        }
        
        .presentation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .close-presentation {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #64748b;
        }
        
        .presentation-content {
          flex: 1;
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .slide {
          display: none;
          text-align: center;
          width: 100%;
        }
        
        .slide.active {
          display: block;
        }
        
        .slide h2 {
          font-size: 36px;
          margin-bottom: 40px;
          color: #1e293b;
        }
        
        .big-metric {
          font-size: 72px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 16px;
        }
        
        .slide-details {
          font-size: 18px;
          color: #64748b;
          line-height: 1.6;
        }
        
        .next-steps-list {
          text-align: left;
          font-size: 18px;
          line-height: 1.8;
        }
        
        .next-steps-list li {
          margin-bottom: 12px;
        }
        
        .presentation-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        .prev-slide,
        .next-slide {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        
        .prev-slide:disabled,
        .next-slide:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
        
        .slide-counter {
          font-weight: 500;
          color: #64748b;
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
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-text {
          color: #64748b;
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
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }
        
        @media (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          }
          
          .roi-grid {
            grid-template-columns: 1fr;
          }
          
          .team-overview {
            grid-template-columns: 1fr;
          }
          
          .intelligence-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .executive-dashboard {
            padding: 16px;
          }
          
          .dashboard-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
          
          .kpi-grid {
            grid-template-columns: 1fr;
          }
          
          .brand-grid,
          .knowledge-grid {
            grid-template-columns: 1fr;
          }
          
          .pipeline-summary {
            flex-direction: column;
            gap: 16px;
          }
        }
      </style>
    `;
  }
  
  /**
   * Clean up
   */
  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.charts.clear();
    
    if (window.executiveDashboard === this) {
      delete window.executiveDashboard;
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExecutiveDashboard;
}

// Global access
window.ExecutiveDashboard = ExecutiveDashboard;