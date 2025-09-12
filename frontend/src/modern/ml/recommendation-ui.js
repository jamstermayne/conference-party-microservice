/**
 * ML Recommendation UI Component
 * ===============================
 * Interactive interface for conference predictions and recommendations
 */

import { conferencePredictor } from './conference-predictor.js';
import { trainingPipeline } from './training-pipeline.js';

export class RecommendationUI {
  constructor() {
    this.container = null;
    this.predictions = [];
    this.selectedConference = null;
    this.userId = this.getUserId();
    this.isLoading = false;
  }

  /**
   * Initialize the recommendation UI
   */
  async init(containerId = 'recommendation-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Recommendation container not found');
      return;
    }

    // Initialize ML engine
    await conferencePredictor.initialize();
    
    // Render initial UI
    this.render();
    
    // Load predictions
    await this.loadPredictions();
  }

  /**
   * Render the main UI
   */
  render() {
    this.container.innerHTML = `
      <div class="recommendation-wrapper">
        <div class="recommendation-header">
          <h2 class="recommendation-title">
            <span class="icon-ai">🤖</span>
            AI-Powered Conference Recommendations
          </h2>
          <p class="recommendation-subtitle">
            Personalized predictions based on your profile and goals
          </p>
        </div>

        <div class="prediction-controls">
          <button class="btn btn--primary" id="refresh-predictions">
            <span class="icon">🔄</span> Refresh Predictions
          </button>
          <button class="btn btn--secondary" id="customize-profile">
            <span class="icon">⚙️</span> Customize Profile
          </button>
          <button class="btn btn--ghost" id="view-insights">
            <span class="icon">📊</span> View Insights
          </button>
        </div>

        <div class="predictions-container" id="predictions-list">
          ${this.renderLoadingState()}
        </div>

        <div class="prediction-details" id="prediction-details" style="display: none;">
          <!-- Details will be populated when a conference is selected -->
        </div>

        <div class="feedback-section" id="feedback-section" style="display: none;">
          <!-- Feedback form for improving predictions -->
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Load and display predictions
   */
  async loadPredictions() {
    this.isLoading = true;
    this.updateLoadingState();

    try {
      // Get predictions from ML engine
      this.predictions = await conferencePredictor.predictOptimalConferences(this.userId);
      
      // Collect training data
      await this.collectInteractionData('predictions_loaded', {
        count: this.predictions.length
      });

      // Render predictions
      this.renderPredictions();
    } catch (error) {
      console.error('Failed to load predictions:', error);
      this.renderError(error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Render prediction cards
   */
  renderPredictions() {
    const container = document.getElementById('predictions-list');
    if (!container) return;

    if (this.predictions.length === 0) {
      container.innerHTML = this.renderEmptyState();
      return;
    }

    container.innerHTML = `
      <div class="predictions-grid">
        ${this.predictions.map((prediction, index) => this.renderPredictionCard(prediction, index)).join('')}
      </div>
    `;

    // Attach card event listeners
    this.attachCardListeners();
  }

  /**
   * Render individual prediction card
   */
  renderPredictionCard(prediction, index) {
    const { conference, predictedROI, confidence, score, reasoning } = prediction;
    const confidenceClass = confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low';
    const roiClass = predictedROI > 8 ? 'excellent' : predictedROI > 5 ? 'good' : 'moderate';

    return `
      <div class="prediction-card card card--elevated" data-conference-id="${conference.id}" data-index="${index}">
        <div class="card__header">
          <h3 class="conference-name">${conference.name}</h3>
          <span class="confidence-badge confidence-${confidenceClass}">
            ${Math.round(confidence * 100)}% confidence
          </span>
        </div>

        <div class="card__body">
          <div class="prediction-metrics">
            <div class="metric-item">
              <span class="metric-label">Predicted ROI</span>
              <span class="metric-value roi-${roiClass}">${predictedROI.toFixed(1)}x</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Match Score</span>
              <span class="metric-value">${Math.round(score * 100)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Est. Value</span>
              <span class="metric-value">$${this.formatNumber(prediction.estimatedValue)}</span>
            </div>
          </div>

          <div class="conference-details">
            <p class="conference-dates">📅 ${conference.dates}</p>
            <p class="conference-location">📍 ${conference.location}</p>
            <p class="conference-size">👥 ${this.formatNumber(conference.expectedAttendees)} attendees</p>
          </div>

          <div class="reasoning-summary">
            <p class="reasoning-text">${reasoning.summary}</p>
            <span class="recommendation-badge ${reasoning.recommendation.toLowerCase().replace(' ', '-')}">
              ${reasoning.recommendation}
            </span>
          </div>

          <div class="key-opportunities">
            ${(prediction.keyOpportunities || []).slice(0, 3).map(opp => `
              <div class="opportunity-chip">
                <span class="opportunity-type">${this.getOpportunityIcon(opp.type)}</span>
                <span class="opportunity-text">${opp.opportunity}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card__footer">
          <button class="btn btn--primary btn--sm view-details" data-index="${index}">
            View Full Analysis
          </button>
          <button class="btn btn--ghost btn--sm save-prediction" data-index="${index}">
            <span class="icon">💾</span> Save
          </button>
          <button class="btn btn--ghost btn--sm share-prediction" data-index="${index}">
            <span class="icon">🔗</span> Share
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render detailed prediction view
   */
  renderPredictionDetails(prediction) {
    const detailsContainer = document.getElementById('prediction-details');
    if (!detailsContainer) return;

    const { conference, strategy, estimatedValue, optimalTiming } = prediction;
    const careerImpact = prediction.careerImpact || {};

    detailsContainer.innerHTML = `
      <div class="details-wrapper">
        <div class="details-header">
          <button class="btn-back" id="back-to-predictions">← Back to Predictions</button>
          <h2>${conference.name} - Detailed Analysis</h2>
        </div>

        <div class="details-grid">
          <!-- Strategy Section -->
          <div class="detail-section card">
            <h3>📋 Recommended Strategy</h3>
            
            <div class="strategy-phase">
              <h4>Pre-Conference Preparation</h4>
              <ul class="strategy-list">
                ${strategy.preConference.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>

            <div class="strategy-phase">
              <h4>During Conference</h4>
              <ul class="strategy-list">
                ${strategy.duringConference.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>

            <div class="strategy-phase">
              <h4>Post-Conference Follow-up</h4>
              <ul class="strategy-list">
                ${strategy.postConference.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>

            <div class="success-metrics">
              <h4>Success Metrics</h4>
              <ul class="metrics-list">
                ${strategy.successMetrics.map(metric => `<li>${metric}</li>`).join('')}
              </ul>
            </div>
          </div>

          <!-- Career Impact Section -->
          <div class="detail-section card">
            <h3>🚀 Predicted Career Impact</h3>
            
            <div class="impact-category">
              <h4>Skill Development</h4>
              <div class="impact-items">
                ${this.renderSkillImpact(careerImpact.skillDevelopment)}
              </div>
            </div>

            <div class="impact-category">
              <h4>Networking Impact</h4>
              <div class="impact-metrics">
                <div class="impact-metric">
                  <span class="metric-label">Expected Connections</span>
                  <span class="metric-value">${careerImpact.networkingImpact?.expectedConnections || 'N/A'}</span>
                </div>
                <div class="impact-metric">
                  <span class="metric-label">Connection Quality</span>
                  <span class="metric-value">${careerImpact.networkingImpact?.connectionQuality || 'N/A'}</span>
                </div>
                <div class="impact-metric">
                  <span class="metric-label">Industry Influence</span>
                  <span class="metric-value">${careerImpact.networkingImpact?.industryInfluence || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div class="impact-category">
              <h4>Career Advancement</h4>
              <div class="advancement-predictions">
                <p>💼 Promotion Probability: <strong>${(careerImpact.careerAdvancement?.promotionProbability * 100 || 0).toFixed(0)}%</strong></p>
                <p>💰 Salary Impact: <strong>${careerImpact.careerAdvancement?.salaryImpact || 'N/A'}</strong></p>
                <p>🎯 Job Opportunities: <strong>${careerImpact.careerAdvancement?.jobOpportunities || 0}</strong></p>
              </div>
            </div>
          </div>

          <!-- Financial Analysis Section -->
          <div class="detail-section card">
            <h3>💰 Financial Analysis</h3>
            
            <div class="financial-breakdown">
              <h4>Investment</h4>
              <ul class="cost-breakdown">
                <li>Registration: $${this.formatNumber(1500)}</li>
                <li>Travel & Accommodation: $${this.formatNumber(2500)}</li>
                <li>Other Expenses: $${this.formatNumber(1000)}</li>
                <li class="total"><strong>Total Investment: $${this.formatNumber(5000)}</strong></li>
              </ul>
            </div>

            <div class="financial-returns">
              <h4>Expected Returns</h4>
              <ul class="returns-breakdown">
                <li>Direct Sales: $${this.formatNumber(estimatedValue * 0.4)}</li>
                <li>Partnership Value: $${this.formatNumber(estimatedValue * 0.3)}</li>
                <li>Future Opportunities: $${this.formatNumber(estimatedValue * 0.3)}</li>
                <li class="total"><strong>Total Expected: $${this.formatNumber(estimatedValue)}</strong></li>
              </ul>
            </div>

            <div class="roi-visualization">
              <div class="roi-bar" style="width: ${Math.min(100, prediction.predictedROI * 10)}%">
                ROI: ${prediction.predictedROI.toFixed(1)}x
              </div>
            </div>
          </div>

          <!-- Optimal Timing Section -->
          <div class="detail-section card">
            <h3>⏰ Optimal Attendance Schedule</h3>
            
            <div class="timing-recommendation">
              <p><strong>Arrival:</strong> ${optimalTiming.arrivalDay}</p>
              <p><strong>Key Days:</strong> ${optimalTiming.keyDays.join(', ')}</p>
              <p><strong>Optional:</strong> ${optimalTiming.optionalDays.join(', ')}</p>
              <p><strong>Departure:</strong> ${optimalTiming.departureDay}</p>
            </div>

            <div class="timing-rationale">
              <p class="rationale-text">${optimalTiming.reasoning}</p>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn btn--primary btn--lg" id="commit-attendance">
            Commit to Attending
          </button>
          <button class="btn btn--secondary btn--lg" id="request-approval">
            Request Approval
          </button>
          <button class="btn btn--ghost btn--lg" id="export-analysis">
            Export Analysis (PDF)
          </button>
        </div>
      </div>
    `;

    detailsContainer.style.display = 'block';
    document.getElementById('predictions-list').style.display = 'none';

    // Attach detail view listeners
    this.attachDetailListeners();
  }

  /**
   * Render skill impact visualization
   */
  renderSkillImpact(skillDevelopment) {
    if (!skillDevelopment) return '<p>No skill data available</p>';

    return `
      <div class="skills-grid">
        ${(skillDevelopment.newSkills || []).map(skill => `
          <span class="skill-badge new">${skill}</span>
        `).join('')}
      </div>
      <div class="skill-improvements">
        ${Object.entries(skillDevelopment.skillLevelImprovements || {}).map(([skill, improvement]) => `
          <div class="skill-improvement">
            <span class="skill-name">${skill}</span>
            <span class="improvement-value">${improvement}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Refresh predictions
    document.getElementById('refresh-predictions')?.addEventListener('click', () => {
      this.loadPredictions();
    });

    // Customize profile
    document.getElementById('customize-profile')?.addEventListener('click', () => {
      this.showProfileCustomization();
    });

    // View insights
    document.getElementById('view-insights')?.addEventListener('click', () => {
      this.showInsights();
    });
  }

  /**
   * Attach card event listeners
   */
  attachCardListeners() {
    // View details buttons
    document.querySelectorAll('.view-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.showPredictionDetails(index);
      });
    });

    // Save buttons
    document.querySelectorAll('.save-prediction').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.savePrediction(index);
      });
    });

    // Share buttons
    document.querySelectorAll('.share-prediction').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.sharePrediction(index);
      });
    });
  }

  /**
   * Attach detail view listeners
   */
  attachDetailListeners() {
    // Back button
    document.getElementById('back-to-predictions')?.addEventListener('click', () => {
      this.hideDetails();
    });

    // Commit attendance
    document.getElementById('commit-attendance')?.addEventListener('click', () => {
      this.commitAttendance();
    });

    // Request approval
    document.getElementById('request-approval')?.addEventListener('click', () => {
      this.requestApproval();
    });

    // Export analysis
    document.getElementById('export-analysis')?.addEventListener('click', () => {
      this.exportAnalysis();
    });
  }

  /**
   * Show prediction details
   */
  async showPredictionDetails(index) {
    const prediction = this.predictions[index];
    if (!prediction) return;

    this.selectedConference = prediction;

    // Get career impact prediction
    prediction.careerImpact = await conferencePredictor.predictCareerImpact(
      this.userId,
      prediction.conference.id
    );

    // Render details
    this.renderPredictionDetails(prediction);

    // Collect interaction data
    await this.collectInteractionData('details_viewed', {
      conferenceId: prediction.conference.id,
      predictedROI: prediction.predictedROI
    });
  }

  /**
   * Hide details and show predictions
   */
  hideDetails() {
    document.getElementById('prediction-details').style.display = 'none';
    document.getElementById('predictions-list').style.display = 'block';
  }

  /**
   * Save prediction for later
   */
  async savePrediction(index) {
    const prediction = this.predictions[index];
    if (!prediction) return;

    // Save to local storage
    const saved = JSON.parse(localStorage.getItem('savedPredictions') || '[]');
    saved.push({
      ...prediction,
      savedAt: new Date().toISOString()
    });
    localStorage.setItem('savedPredictions', JSON.stringify(saved));

    // Show confirmation
    this.showToast('Prediction saved successfully!');

    // Collect interaction data
    await this.collectInteractionData('prediction_saved', {
      conferenceId: prediction.conference.id
    });
  }

  /**
   * Share prediction
   */
  async sharePrediction(index) {
    const prediction = this.predictions[index];
    if (!prediction) return;

    // Generate shareable link
    const shareUrl = `${window.location.origin}/predictions/${prediction.conference.id}`;
    
    // Copy to clipboard
    await navigator.clipboard.writeText(shareUrl);
    
    this.showToast('Share link copied to clipboard!');

    // Collect interaction data
    await this.collectInteractionData('prediction_shared', {
      conferenceId: prediction.conference.id
    });
  }

  /**
   * Commit to attending conference
   */
  async commitAttendance() {
    if (!this.selectedConference) return;

    // Save commitment
    const commitments = JSON.parse(localStorage.getItem('conferenceCommitments') || '[]');
    commitments.push({
      conferenceId: this.selectedConference.conference.id,
      conferenceName: this.selectedConference.conference.name,
      committedAt: new Date().toISOString(),
      predictedROI: this.selectedConference.predictedROI
    });
    localStorage.setItem('conferenceCommitments', JSON.stringify(commitments));

    // Show confirmation
    this.showToast('Attendance commitment saved! We\'ll help you prepare.');

    // Collect training data
    await this.collectInteractionData('attendance_committed', {
      conferenceId: this.selectedConference.conference.id,
      predictedROI: this.selectedConference.predictedROI
    });
  }

  /**
   * Request approval for conference attendance
   */
  async requestApproval() {
    if (!this.selectedConference) return;

    // Generate approval request document
    const approvalDoc = this.generateApprovalDocument(this.selectedConference);
    
    // Download as PDF (simulated)
    this.downloadDocument(approvalDoc, `${this.selectedConference.conference.id}_approval.txt`);

    this.showToast('Approval request document generated!');
  }

  /**
   * Export analysis as PDF
   */
  async exportAnalysis() {
    if (!this.selectedConference) return;

    // Generate analysis document
    const analysisDoc = this.generateAnalysisDocument(this.selectedConference);
    
    // Download as PDF (simulated)
    this.downloadDocument(analysisDoc, `${this.selectedConference.conference.id}_analysis.txt`);

    this.showToast('Analysis exported successfully!');
  }

  /**
   * Collect interaction data for training
   */
  async collectInteractionData(type, data) {
    const interaction = {
      userId: this.userId,
      type,
      timestamp: new Date().toISOString(),
      ...data,
      userProfile: await this.getUserProfile(),
      device: this.getDeviceType()
    };

    // Send to training pipeline
    await trainingPipeline.collectTrainingData(interaction);
  }

  // Helper methods

  getUserId() {
    // Get or generate user ID
    let userId = localStorage.getItem('ml_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ml_user_id', userId);
    }
    return userId;
  }

  async getUserProfile() {
    // Get user profile from storage or API
    return {
      title: 'Senior Developer',
      company: 'Tech Company',
      industry: 'gaming',
      goals: ['networking', 'sales', 'learning']
    };
  }

  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toLocaleString();
  }

  getOpportunityIcon(type) {
    const icons = {
      'speaking': '🎤',
      'partnership': '🤝',
      'learning': '📚',
      'networking': '🌐'
    };
    return icons[type] || '⭐';
  }

  renderLoadingState() {
    return `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Analyzing conferences and generating predictions...</p>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <span class="empty-icon">📊</span>
        <h3>No Predictions Available</h3>
        <p>We're still learning about your preferences. Try customizing your profile!</p>
        <button class="btn btn--primary" onclick="recommendationUI.showProfileCustomization()">
          Customize Profile
        </button>
      </div>
    `;
  }

  renderError(error) {
    const container = document.getElementById('predictions-list');
    if (!container) return;

    container.innerHTML = `
      <div class="error-state">
        <span class="error-icon">⚠️</span>
        <h3>Failed to Load Predictions</h3>
        <p>${error.message || 'An unexpected error occurred'}</p>
        <button class="btn btn--primary" onclick="recommendationUI.loadPredictions()">
          Try Again
        </button>
      </div>
    `;
  }

  updateLoadingState() {
    const container = document.getElementById('predictions-list');
    if (container && this.isLoading) {
      container.innerHTML = this.renderLoadingState();
    }
  }

  showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast toast--success';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after delay
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  showProfileCustomization() {
    // Show profile customization modal
    console.log('Opening profile customization...');
  }

  showInsights() {
    // Show ML insights dashboard
    console.log('Opening insights dashboard...');
  }

  generateApprovalDocument(prediction) {
    return `
CONFERENCE ATTENDANCE APPROVAL REQUEST

Conference: ${prediction.conference.name}
Dates: ${prediction.conference.dates}
Location: ${prediction.conference.location}

BUSINESS JUSTIFICATION:
- Predicted ROI: ${prediction.predictedROI.toFixed(1)}x
- Estimated Value: $${this.formatNumber(prediction.estimatedValue)}
- Confidence Level: ${Math.round(prediction.confidence * 100)}%

KEY OPPORTUNITIES:
${prediction.keyOpportunities.map(opp => `- ${opp.opportunity}`).join('\n')}

RECOMMENDED STRATEGY:
${prediction.strategy.successMetrics.join('\n')}

Total Investment Required: $5,000
Expected Return: $${this.formatNumber(prediction.estimatedValue)}
    `;
  }

  generateAnalysisDocument(prediction) {
    return `
CONFERENCE ANALYSIS REPORT

${prediction.conference.name}
Generated: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY
Predicted ROI: ${prediction.predictedROI.toFixed(1)}x
Match Score: ${Math.round(prediction.score * 100)}%
Confidence: ${Math.round(prediction.confidence * 100)}%

[Full analysis details...]
    `;
  }

  downloadDocument(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const recommendationUI = new RecommendationUI();