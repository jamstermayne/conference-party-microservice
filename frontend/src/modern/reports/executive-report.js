/**
 * Executive Report Interface
 * Comprehensive conference ROI reporting with viral sharing capabilities
 */

import { ConferenceReportGenerator } from './report-generator.js';
import { PDFGenerator } from './pdf-generator.js';
import { SocialShareManager } from './social-share.js';

class ExecutiveReportInterface {
  constructor() {
    this.reportGenerator = new ConferenceReportGenerator();
    this.pdfGenerator = new PDFGenerator();
    this.socialShare = new SocialShareManager();
    this.currentReport = null;
    this.shareStats = { views: 0, shares: 0, conversions: 0 };
    this.reportId = null;
  }

  async init(reportId) {
    this.reportId = reportId;
    
    // Track view
    await this.trackView();
    
    // Load report data
    await this.loadReport();
    
    // Render interface
    this.render();
    
    // Set up event listeners
    this.attachEventListeners();
    
    // Start real-time stats updates
    this.startStatsPolling();
  }

  async loadReport() {
    try {
      this.currentReport = await this.reportGenerator.getReport(this.reportId);
      this.shareStats = await this.getShareStats();
      return this.currentReport;
    } catch (error) {
      console.error('Failed to load report:', error);
      this.showError('Unable to load report. Please try again.');
    }
  }

  async getShareStats() {
    // In production, fetch from backend
    // For now, use mock data with some randomization
    return {
      views: Math.floor(Math.random() * 500) + 100,
      shares: Math.floor(Math.random() * 50) + 10,
      conversions: Math.floor(Math.random() * 20) + 5
    };
  }

  async trackView() {
    // Track page view
    if (typeof gtag !== 'undefined') {
      gtag('event', 'view_executive_report', {
        report_id: this.reportId
      });
    }
    
    // Update view count
    this.shareStats.views++;
  }

  render() {
    const container = document.getElementById('executive-report');
    if (!container) return;

    container.innerHTML = `
      <div class="executive-report-wrapper">
        ${this.renderHeader()}
        ${this.renderKeyMetrics()}
        ${this.renderROIVisualization()}
        ${this.renderBusinessValue()}
        ${this.renderCompetitiveIntel()}
        ${this.renderActionItems()}
        ${this.renderFutureStrategy()}
        ${this.renderCTA()}
        ${this.renderShareModal()}
      </div>
    `;

    // Initialize visualizations
    this.initializeVisualizations();
  }

  renderHeader() {
    const report = this.currentReport;
    if (!report) return '';

    return `
      <header class="report-header">
        <div class="header-content">
          <div class="report-branding">
            <img src="${report.metadata.conferenceLogo || '/assets/images/conference-default.png'}" 
                 alt="${report.metadata.conferenceName}"
                 class="conference-logo">
            <div class="report-titles">
              <h1 class="report-headline">${report.executiveSummary.headline}</h1>
              <p class="report-meta">
                ${report.metadata.attendeeName} • ${report.metadata.conferenceName} • ${report.metadata.dates}
              </p>
            </div>
          </div>
          
          <div class="social-proof">
            <span class="stat-item">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <span>${this.formatNumber(this.shareStats.views)} views</span>
            </span>
            <span class="stat-item">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
              <span>${this.shareStats.shares} shares</span>
            </span>
            <span class="stat-item">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              <span>${this.shareStats.conversions} team inquiries</span>
            </span>
          </div>
        </div>
        
        <div class="header-actions">
          <button class="btn btn--primary btn--share" data-action="share">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
            Share Report
          </button>
          
          <button class="btn btn--secondary btn--download" data-action="download">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            Download PDF
          </button>
        </div>
      </header>
    `;
  }

  renderKeyMetrics() {
    const metrics = this.currentReport?.executiveSummary?.keyMetrics;
    if (!metrics) return '';

    return `
      <section class="key-metrics-section">
        <div class="metrics-grid">
          <div class="metric-card metric--pipeline">
            <div class="metric-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
            </div>
            <div class="metric-content">
              <h3 class="metric-title">Pipeline Generated</h3>
              <p class="metric-value">${metrics.pipelineGenerated}</p>
              <p class="metric-change positive">+${metrics.pipelineGenerated}</p>
            </div>
          </div>
          
          <div class="metric-card metric--leads">
            <div class="metric-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div class="metric-content">
              <h3 class="metric-title">Qualified Leads</h3>
              <p class="metric-value">${metrics.qualifiedLeads}</p>
              <p class="metric-subtitle">Ready to engage</p>
            </div>
          </div>
          
          <div class="metric-card metric--connections">
            <div class="metric-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <div class="metric-content">
              <h3 class="metric-title">New Connections</h3>
              <p class="metric-value">${metrics.newConnections}</p>
              <p class="metric-subtitle">High-value network growth</p>
            </div>
          </div>
          
          <div class="metric-card metric--efficiency">
            <div class="metric-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
            <div class="metric-content">
              <h3 class="metric-title">Time Efficiency</h3>
              <p class="metric-value">${metrics.timeEfficiency}</p>
              <p class="metric-subtitle">vs industry average</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderROIVisualization() {
    return `
      <section class="roi-visualization-section">
        <div class="section-card">
          <h2 class="section-title">Return on Investment Analysis</h2>
          <div id="roi-chart" class="chart-container"></div>
          <div class="roi-breakdown">
            <div class="roi-metric">
              <span class="roi-label">Total Investment</span>
              <span class="roi-value">$${this.formatNumber(15000)}</span>
            </div>
            <div class="roi-metric">
              <span class="roi-label">Current Return</span>
              <span class="roi-value positive">$${this.formatNumber(125000)}</span>
            </div>
            <div class="roi-metric">
              <span class="roi-label">ROI Percentage</span>
              <span class="roi-value positive">733%</span>
            </div>
            <div class="roi-metric">
              <span class="roi-label">Payback Period</span>
              <span class="roi-value">1.5 months</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderBusinessValue() {
    const businessValue = this.currentReport?.executiveSummary?.businessValue;
    if (!businessValue) return '';

    return `
      <section class="business-value-section">
        <div class="value-grid">
          <div class="value-card value--immediate">
            <h3 class="value-title">Immediate Business Value</h3>
            <ul class="value-list">
              ${businessValue.immediateValue.map(item => `
                <li class="value-item">
                  <svg class="value-check" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span>${item}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          
          <div class="value-card value--future">
            <h3 class="value-title">Future Value Projection</h3>
            <ul class="value-list">
              ${businessValue.futureValue.map(item => `
                <li class="value-item">
                  <svg class="value-trend" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                  </svg>
                  <span>${item}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </section>
    `;
  }

  renderCompetitiveIntel() {
    const intel = this.currentReport?.executiveSummary?.competitiveIntel;
    if (!intel || intel.length === 0) return '';

    return `
      <section class="competitive-intel-section">
        <div class="intel-container">
          <h2 class="section-title">Competitive Intelligence</h2>
          <div class="intel-grid">
            ${intel.slice(0, 4).map(item => `
              <div class="intel-card">
                <h3 class="intel-category">${item.category}</h3>
                <p class="intel-insight">${item.insight}</p>
                <div class="intel-meta">
                  <span class="intel-source">Source: ${item.source}</span>
                  <span class="intel-confidence">${Math.round(item.confidence * 100)}% confidence</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  renderActionItems() {
    const actions = this.currentReport?.executiveSummary?.nextSteps;
    if (!actions) return '';

    return `
      <section class="action-items-section">
        <div class="section-card">
          <h2 class="section-title">Priority Action Items</h2>
          <div class="actions-list">
            ${actions.map((action, index) => `
              <div class="action-item" data-priority="${action.priority}">
                <div class="action-number">${index + 1}</div>
                <div class="action-content">
                  <h4 class="action-title">${action.title}</h4>
                  <p class="action-description">${action.description}</p>
                  <div class="action-meta">
                    <span class="action-deadline">Due: ${action.deadline}</span>
                    <span class="action-owner">Owner: ${action.owner || 'Unassigned'}</span>
                  </div>
                </div>
                <div class="action-controls">
                  <button class="btn-icon" data-action="schedule" data-item="${index}">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                  </button>
                  <button class="btn-icon" data-action="assign" data-item="${index}">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  renderFutureStrategy() {
    const strategy = this.currentReport?.recommendations?.futureStrategy;
    if (!strategy) return '';

    return `
      <section class="future-strategy-section">
        <div class="section-card">
          <h2 class="section-title">Future Conference Strategy</h2>
          <div class="strategy-grid">
            <div class="strategy-column">
              <h3 class="strategy-subtitle">Budget Optimization</h3>
              <div class="strategy-items">
                ${strategy.budgetOptimization.map(item => `
                  <div class="strategy-card">
                    <h4 class="strategy-event">${item.event}</h4>
                    <p class="strategy-rationale">${item.rationale}</p>
                    <p class="strategy-roi">Expected ROI: ${item.expectedROI}</p>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div class="strategy-column">
              <h3 class="strategy-subtitle">Team Strategy</h3>
              <div class="strategy-items">
                ${strategy.teamRecommendations.map(item => `
                  <div class="strategy-card">
                    <h4 class="strategy-event">${item.event}</h4>
                    <p class="strategy-team">Send: ${item.recommendedAttendees.join(', ')}</p>
                    <p class="strategy-rationale">${item.rationale}</p>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div class="strategy-column">
              <h3 class="strategy-subtitle">Recommended Events</h3>
              <div class="strategy-items">
                ${strategy.upcomingEvents.map(item => `
                  <div class="strategy-card">
                    <h4 class="strategy-event">${item.name}</h4>
                    <p class="strategy-dates">${item.dates}</p>
                    <p class="strategy-rationale">${item.rationale}</p>
                    <p class="strategy-priority priority-${item.priority.toLowerCase()}">
                      Priority: ${item.priority}
                    </p>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderCTA() {
    return `
      <section class="cta-section">
        <div class="cta-container">
          <h2 class="cta-title">Scale This Success Across Your Team</h2>
          <p class="cta-description">
            Get enterprise reporting and team coordination features to maximize your conference ROI company-wide.
          </p>
          <div class="cta-actions">
            <button class="btn btn--cta-primary" data-action="schedule-demo">
              Schedule Team Demo
            </button>
            <button class="btn btn--cta-secondary" data-action="view-features">
              View Team Features
            </button>
          </div>
        </div>
      </section>
    `;
  }

  renderShareModal() {
    return `
      <div class="share-modal" id="shareModal" style="display: none;">
        <div class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Share Your Conference ROI Report</h3>
            <button class="modal-close" data-action="close-modal">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="share-options">
              <button class="share-option" data-platform="email">
                <svg class="share-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>Email</span>
              </button>
              
              <button class="share-option" data-platform="linkedin">
                <svg class="share-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                <span>LinkedIn</span>
              </button>
              
              <button class="share-option" data-platform="twitter">
                <svg class="share-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.46 6c-.85.38-1.75.64-2.7.76 1-.6 1.76-1.55 2.12-2.68-.93.55-1.96.95-3.06 1.17-.88-.94-2.13-1.53-3.51-1.53-2.66 0-4.81 2.16-4.81 4.81 0 .38.04.75.13 1.1-4-.2-7.58-2.11-9.96-5.02-.42.72-.66 1.56-.66 2.46 0 1.68.85 3.16 2.14 4.02-.79-.02-1.53-.24-2.18-.6v.06c0 2.35 1.67 4.31 3.88 4.76-.4.1-.83.16-1.27.16-.31 0-.62-.03-.92-.08.63 1.96 2.45 3.39 4.61 3.43-1.69 1.32-3.83 2.1-6.15 2.1-.4 0-.8-.02-1.19-.07 2.19 1.4 4.78 2.21 7.57 2.21 9.07 0 14.02-7.5 14.02-14.02 0-.21 0-.43-.01-.64.96-.7 1.79-1.56 2.45-2.55z"/>
                </svg>
                <span>Twitter</span>
              </button>
              
              <button class="share-option" data-platform="teams">
                <svg class="share-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.27 10.82v7.45c0 .47-.12.84-.37 1.1-.24.27-.57.4-.97.4h-2.71c-.42 0-.74-.13-.98-.4-.25-.26-.37-.63-.37-1.1v-7.45c0-.48.12-.85.37-1.12.24-.26.56-.4.98-.4h2.71c.4 0 .73.14.97.4.25.27.37.64.37 1.12m-7.2-5.59v13.04c0 .47-.13.84-.38 1.1-.25.27-.58.4-.98.4h-5.4c-.41 0-.74-.13-.98-.4-.25-.26-.38-.63-.38-1.1V12.5l2.38-7.28c.1-.29.28-.52.53-.7.25-.17.52-.26.82-.26h1.77c.31 0 .58.09.83.26.24.18.42.41.52.7l.89 2.73z"/>
                </svg>
                <span>Teams</span>
              </button>
            </div>
            
            <div class="share-link-section">
              <label class="share-label">Or share via link:</label>
              <div class="share-link-container">
                <input type="text" class="share-link-input" id="shareLink" readonly 
                       value="${window.location.origin}/reports/${this.reportId}">
                <button class="btn-copy" data-action="copy-link">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  Copy
                </button>
              </div>
            </div>
            
            <div class="share-preview">
              <label class="share-label">Preview:</label>
              <div class="social-preview-card">
                <img src="/api/reports/${this.reportId}/social-image" alt="Report preview" class="preview-image">
                <div class="preview-content">
                  <h4 class="preview-title">${this.currentReport?.executiveSummary?.headline}</h4>
                  <p class="preview-description">
                    Conference delivered ${this.currentReport?.executiveSummary?.keyMetrics?.pipelineGenerated} in pipeline value
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initializeVisualizations() {
    // Initialize ROI chart
    this.renderROIChart();
    
    // Initialize other interactive elements
    this.initializeInteractiveElements();
  }

  renderROIChart() {
    const chartContainer = document.getElementById('roi-chart');
    if (!chartContainer) return;

    // Create a simple bar chart using CSS
    const data = [
      { label: 'Investment', value: 15000, type: 'cost' },
      { label: 'Direct Revenue', value: 75000, type: 'revenue' },
      { label: 'Pipeline Value', value: 125000, type: 'pipeline' },
      { label: 'Network Value', value: 50000, type: 'network' }
    ];

    const maxValue = Math.max(...data.map(d => d.value));

    chartContainer.innerHTML = `
      <div class="roi-chart-bars">
        ${data.map(item => `
          <div class="roi-bar-container">
            <div class="roi-bar roi-bar--${item.type}" 
                 style="height: ${(item.value / maxValue) * 200}px">
              <span class="roi-bar-value">$${this.formatNumber(item.value)}</span>
            </div>
            <span class="roi-bar-label">${item.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  attachEventListeners() {
    // Share button
    document.querySelector('[data-action="share"]')?.addEventListener('click', () => {
      this.showShareModal();
    });

    // Download PDF button
    document.querySelector('[data-action="download"]')?.addEventListener('click', () => {
      this.downloadPDF();
    });

    // Share modal actions
    document.querySelectorAll('.share-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const platform = e.currentTarget.dataset.platform;
        this.shareReport(platform);
      });
    });

    // Copy link button
    document.querySelector('[data-action="copy-link"]')?.addEventListener('click', () => {
      this.copyShareLink();
    });

    // Close modal
    document.querySelector('[data-action="close-modal"]')?.addEventListener('click', () => {
      this.hideShareModal();
    });

    // Modal backdrop click
    document.querySelector('.modal-backdrop')?.addEventListener('click', () => {
      this.hideShareModal();
    });

    // CTA buttons
    document.querySelector('[data-action="schedule-demo"]')?.addEventListener('click', () => {
      this.scheduleDemo();
    });

    document.querySelector('[data-action="view-features"]')?.addEventListener('click', () => {
      this.viewTeamFeatures();
    });

    // Action item controls
    document.querySelectorAll('[data-action="schedule"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemIndex = e.currentTarget.dataset.item;
        this.scheduleActionItem(itemIndex);
      });
    });

    document.querySelectorAll('[data-action="assign"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemIndex = e.currentTarget.dataset.item;
        this.assignActionItem(itemIndex);
      });
    });
  }

  showShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('active'), 10);
    }
  }

  hideShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.style.display = 'none', 300);
    }
  }

  async shareReport(platform) {
    const shareContent = await this.socialShare.generateShareContent(this.currentReport, platform);
    
    switch(platform) {
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(shareContent.subject)}&body=${encodeURIComponent(shareContent.body)}`;
        break;
      
      case 'linkedin':
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareContent.url)}`;
        window.open(linkedinUrl, '_blank');
        break;
      
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent.text)}&url=${encodeURIComponent(shareContent.url)}`;
        window.open(twitterUrl, '_blank');
        break;
      
      case 'teams':
        // In production, use Teams deep link
        this.copyShareLink();
        this.showNotification('Link copied! Paste in Microsoft Teams to share.');
        break;
    }
    
    // Track share
    await this.trackShare(platform);
    this.shareStats.shares++;
    this.updateShareStats();
  }

  async trackShare(platform) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'share_report', {
        report_id: this.reportId,
        platform: platform
      });
    }
  }

  copyShareLink() {
    const input = document.getElementById('shareLink');
    if (input) {
      input.select();
      document.execCommand('copy');
      this.showNotification('Link copied to clipboard!');
    }
  }

  async downloadPDF() {
    try {
      const pdfData = await this.pdfGenerator.generatePDF(this.currentReport);
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentReport.metadata.conferenceName}_ROI_Report.pdf`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      this.showNotification('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      this.showNotification('Failed to generate PDF. Please try again.', 'error');
    }
  }

  scheduleDemo() {
    // In production, integrate with calendar booking system
    window.open('https://calendly.com/conference-app/enterprise-demo', '_blank');
  }

  viewTeamFeatures() {
    window.location.href = '/enterprise';
  }

  scheduleActionItem(index) {
    const action = this.currentReport?.executiveSummary?.nextSteps[index];
    if (action) {
      // In production, integrate with calendar API
      this.showNotification(`Scheduling: ${action.title}`);
    }
  }

  assignActionItem(index) {
    const action = this.currentReport?.executiveSummary?.nextSteps[index];
    if (action) {
      // In production, show team member selector
      this.showNotification(`Assigning: ${action.title}`);
    }
  }

  updateShareStats() {
    document.querySelectorAll('.stat-item').forEach((el, index) => {
      const values = [this.shareStats.views, this.shareStats.shares, this.shareStats.conversions];
      if (index < values.length) {
        const span = el.querySelector('span:last-child');
        if (span) {
          const text = span.textContent;
          const number = values[index];
          span.textContent = text.replace(/\d+/, this.formatNumber(number));
        }
      }
    });
  }

  startStatsPolling() {
    // Poll for updated stats every 30 seconds
    setInterval(async () => {
      try {
        this.shareStats = await this.getShareStats();
        this.updateShareStats();
      } catch (error) {
        console.error('Failed to update stats:', error);
      }
    }, 30000);
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('active'), 10);
    
    setTimeout(() => {
      notification.classList.remove('active');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  showError(message) {
    const container = document.getElementById('executive-report');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <h2>Report Not Found</h2>
          <p>${message}</p>
          <a href="/dashboard" class="btn btn--primary">Back to Dashboard</a>
        </div>
      `;
    }
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const reportInterface = new ExecutiveReportInterface();
    // Get report ID from URL or data attribute
    const reportId = window.location.pathname.match(/reports\/([^/]+)/)?.[1] || 'demo-report';
    reportInterface.init(reportId);
  });
} else {
  const reportInterface = new ExecutiveReportInterface();
  const reportId = window.location.pathname.match(/reports\/([^/]+)/)?.[1] || 'demo-report';
  reportInterface.init(reportId);
}

export default ExecutiveReportInterface;