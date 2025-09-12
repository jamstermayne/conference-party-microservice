/**
 * ML Training Data Pipeline
 * =========================
 * Collects, processes, and manages training data for conference predictions
 */

export class TrainingDataPipeline {
  constructor() {
    this.dataStore = new Map();
    this.featureExtractors = new Map();
    this.labelGenerators = new Map();
    this.dataVersion = '1.0.0';
    this.initializeExtractors();
  }

  /**
   * Initialize feature extractors
   */
  initializeExtractors() {
    // User profile features
    this.featureExtractors.set('userProfile', (data) => ({
      seniority: this.extractSeniority(data.title),
      companySize: this.extractCompanySize(data.company),
      industry: this.extractIndustry(data.industry),
      experience: this.extractExperience(data.yearsExperience),
      networkSize: this.extractNetworkSize(data.connections),
      activityLevel: this.extractActivityLevel(data.activity)
    }));

    // Conference features
    this.featureExtractors.set('conference', (data) => ({
      size: this.normalizeAttendeeCount(data.attendees),
      duration: this.normalizeDuration(data.days),
      internationalReach: this.extractInternationalReach(data.countries),
      speakerQuality: this.extractSpeakerQuality(data.speakers),
      sponsorTier: this.extractSponsorTier(data.sponsors),
      contentDepth: this.extractContentDepth(data.sessions)
    }));

    // Historical performance features
    this.featureExtractors.set('historical', (data) => ({
      avgROI: this.normalizeROI(data.avgROI),
      successRate: this.normalizeSuccessRate(data.successRate),
      repeatAttendance: this.extractRepeatRate(data.repeatRate),
      satisfactionScore: this.normalizeSatisfaction(data.satisfaction),
      networkGrowth: this.extractNetworkGrowth(data.connectionGrowth),
      dealConversion: this.extractDealConversion(data.dealRate)
    }));

    // Market conditions features
    this.featureExtractors.set('market', (data) => ({
      economicIndicator: this.extractEconomicIndicator(data.gdpGrowth),
      industryGrowth: this.extractIndustryGrowth(data.industryGrowth),
      competitionLevel: this.extractCompetition(data.competitors),
      investmentClimate: this.extractInvestmentClimate(data.funding),
      technologyTrends: this.extractTechTrends(data.trends),
      regulatoryEnvironment: this.extractRegulatory(data.regulations)
    }));
  }

  /**
   * Collect training data from user interactions
   */
  async collectTrainingData(interaction) {
    const trainingExample = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      features: await this.extractFeatures(interaction),
      labels: await this.generateLabels(interaction),
      metadata: {
        userId: interaction.userId,
        conferenceId: interaction.conferenceId,
        interactionType: interaction.type,
        source: interaction.source
      }
    };

    // Validate data quality
    if (this.validateTrainingData(trainingExample)) {
      this.dataStore.set(trainingExample.id, trainingExample);
      await this.persistTrainingData(trainingExample);
      return trainingExample;
    }

    return null;
  }

  /**
   * Extract all features from interaction data
   */
  async extractFeatures(interaction) {
    const features = {};

    // Extract user features
    if (interaction.userProfile) {
      features.user = this.featureExtractors.get('userProfile')(interaction.userProfile);
    }

    // Extract conference features
    if (interaction.conference) {
      features.conference = this.featureExtractors.get('conference')(interaction.conference);
    }

    // Extract historical features
    if (interaction.history) {
      features.historical = this.featureExtractors.get('historical')(interaction.history);
    }

    // Extract market features
    if (interaction.market) {
      features.market = this.featureExtractors.get('market')(interaction.market);
    }

    // Extract interaction features
    features.interaction = this.extractInteractionFeatures(interaction);

    // Extract temporal features
    features.temporal = this.extractTemporalFeatures(interaction);

    // Extract network features
    features.network = await this.extractNetworkFeatures(interaction);

    return this.flattenFeatures(features);
  }

  /**
   * Generate labels for supervised learning
   */
  async generateLabels(interaction) {
    const labels = {};

    // ROI label
    if (interaction.outcome?.roi) {
      labels.roi = this.normalizeROI(interaction.outcome.roi);
    }

    // Success label (binary)
    if (interaction.outcome?.success !== undefined) {
      labels.success = interaction.outcome.success ? 1 : 0;
    }

    // Connection count label
    if (interaction.outcome?.connections) {
      labels.connections = this.normalizeConnections(interaction.outcome.connections);
    }

    // Deal value label
    if (interaction.outcome?.dealValue) {
      labels.dealValue = this.normalizeDealValue(interaction.outcome.dealValue);
    }

    // Satisfaction label
    if (interaction.outcome?.satisfaction) {
      labels.satisfaction = this.normalizeSatisfaction(interaction.outcome.satisfaction);
    }

    // Career impact label
    if (interaction.outcome?.careerImpact) {
      labels.careerImpact = this.normalizeCareerImpact(interaction.outcome.careerImpact);
    }

    return labels;
  }

  /**
   * Extract interaction-specific features
   */
  extractInteractionFeatures(interaction) {
    return {
      dayOfWeek: this.extractDayOfWeek(interaction.timestamp),
      timeOfDay: this.extractTimeOfDay(interaction.timestamp),
      deviceType: this.extractDeviceType(interaction.device),
      sessionDuration: this.normalizeD uration(interaction.duration),
      clickDepth: this.normalizeClickDepth(interaction.clicks),
      engagementScore: this.calculateEngagement(interaction)
    };
  }

  /**
   * Extract temporal features
   */
  extractTemporalFeatures(interaction) {
    const date = new Date(interaction.timestamp);
    const conferenceDate = new Date(interaction.conference?.startDate);
    
    return {
      daysUntilConference: this.normalizeDays(
        Math.floor((conferenceDate - date) / (1000 * 60 * 60 * 24))
      ),
      quarter: Math.floor(date.getMonth() / 3) + 1,
      month: date.getMonth() + 1,
      isWeekend: date.getDay() === 0 || date.getDay() === 6 ? 1 : 0,
      isHolidayPeriod: this.isHolidayPeriod(date) ? 1 : 0,
      yearProgress: date.getMonth() / 12
    };
  }

  /**
   * Extract network-based features
   */
  async extractNetworkFeatures(interaction) {
    // Simulate network analysis
    return {
      userCentrality: Math.random(), // Graph centrality score
      clusterCoefficient: Math.random(), // How connected user's network is
      bridgeScore: Math.random(), // Ability to connect disparate groups
      influenceRadius: Math.random(), // Reach within network
      diversityIndex: Math.random(), // Network diversity
      growthVelocity: Math.random() // Network growth rate
    };
  }

  /**
   * Validate training data quality
   */
  validateTrainingData(data) {
    // Check for required fields
    if (!data.features || !data.labels) return false;

    // Check for data completeness
    const featureCompleteness = this.calculateCompleteness(data.features);
    if (featureCompleteness < 0.7) return false; // Require 70% complete

    // Check for anomalies
    if (this.detectAnomalies(data)) return false;

    // Check for duplicates
    if (this.isDuplicate(data)) return false;

    return true;
  }

  /**
   * Persist training data to storage
   */
  async persistTrainingData(data) {
    // In production, save to database or data warehouse
    const key = `training_${data.id}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      
      // Also send to backend for aggregation
      await this.sendToBackend(data);
    } catch (error) {
      console.error('Failed to persist training data:', error);
    }
  }

  /**
   * Prepare batch of training data for model training
   */
  async prepareBatch(batchSize = 32) {
    const allData = Array.from(this.dataStore.values());
    const shuffled = this.shuffle(allData);
    const batch = shuffled.slice(0, batchSize);

    // Convert to tensor-ready format
    const features = batch.map(item => Object.values(item.features));
    const labels = batch.map(item => Object.values(item.labels));

    return {
      features: this.normalizeFeatures(features),
      labels: this.normalizeLabels(labels),
      metadata: batch.map(item => item.metadata)
    };
  }

  /**
   * Generate synthetic training data for cold start
   */
  async generateSyntheticData(count = 1000) {
    const syntheticData = [];

    for (let i = 0; i < count; i++) {
      const synthetic = {
        id: `synthetic_${i}`,
        timestamp: this.randomDate(),
        features: this.generateSyntheticFeatures(),
        labels: this.generateSyntheticLabels(),
        metadata: {
          synthetic: true,
          version: this.dataVersion
        }
      };

      if (this.validateTrainingData(synthetic)) {
        syntheticData.push(synthetic);
      }
    }

    return syntheticData;
  }

  /**
   * Generate synthetic features
   */
  generateSyntheticFeatures() {
    const features = {};
    
    // Generate realistic feature distributions
    for (let i = 0; i < 50; i++) {
      features[`feature_${i}`] = this.generateRealisticValue(i);
    }

    return features;
  }

  /**
   * Generate synthetic labels
   */
  generateSyntheticLabels() {
    // Generate correlated labels
    const roi = Math.random() * 10;
    const success = roi > 5 ? 1 : 0;
    const connections = Math.floor(roi * 5 + Math.random() * 10);
    
    return {
      roi: roi,
      success: success,
      connections: connections,
      satisfaction: Math.min(1, roi / 10 + Math.random() * 0.2)
    };
  }

  /**
   * Analyze feature importance
   */
  async analyzeFeatureImportance() {
    const importance = new Map();
    const allData = Array.from(this.dataStore.values());

    // Calculate correlation between each feature and labels
    const features = Object.keys(allData[0]?.features || {});
    
    for (const feature of features) {
      const correlation = this.calculateCorrelation(
        allData.map(d => d.features[feature]),
        allData.map(d => d.labels.roi || 0)
      );
      importance.set(feature, Math.abs(correlation));
    }

    // Sort by importance
    return Array.from(importance.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Top 20 features
  }

  /**
   * Monitor data drift
   */
  async monitorDataDrift() {
    const recentData = this.getRecentData(100);
    const historicalData = this.getHistoricalData(100);

    const drift = {};

    // Compare feature distributions
    const features = Object.keys(recentData[0]?.features || {});
    
    for (const feature of features) {
      const recentDist = recentData.map(d => d.features[feature]);
      const historicalDist = historicalData.map(d => d.features[feature]);
      
      drift[feature] = this.calculateKLDivergence(recentDist, historicalDist);
    }

    // Alert if significant drift detected
    const maxDrift = Math.max(...Object.values(drift));
    if (maxDrift > 0.5) {
      console.warn('Significant data drift detected:', drift);
      await this.triggerRetraining();
    }

    return drift;
  }

  // Helper methods

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  extractSeniority(title) {
    const levels = {
      'intern': 0.1, 'junior': 0.2, 'mid': 0.4,
      'senior': 0.6, 'lead': 0.7, 'principal': 0.8,
      'director': 0.9, 'vp': 0.95, 'c-level': 1.0
    };
    
    const titleLower = (title || '').toLowerCase();
    for (const [key, value] of Object.entries(levels)) {
      if (titleLower.includes(key)) return value;
    }
    return 0.5;
  }

  extractCompanySize(company) {
    // Simulate company size extraction
    return Math.random();
  }

  extractIndustry(industry) {
    const industries = {
      'gaming': 0, 'software': 1, 'marketing': 2,
      'finance': 3, 'healthcare': 4, 'retail': 5
    };
    return industries[industry] !== undefined ? industries[industry] / 5 : 0.5;
  }

  extractExperience(years) {
    return Math.min(1, (years || 0) / 20);
  }

  extractNetworkSize(connections) {
    return Math.min(1, (connections || 0) / 5000);
  }

  extractActivityLevel(activity) {
    return Math.min(1, (activity || 0) / 100);
  }

  normalizeAttendeeCount(count) {
    return Math.min(1, (count || 0) / 500000);
  }

  normalizeDuration(days) {
    return Math.min(1, (days || 0) / 7);
  }

  normalizeROI(roi) {
    return Math.min(1, (roi || 0) / 20);
  }

  normalizeConnections(connections) {
    return Math.min(1, (connections || 0) / 100);
  }

  normalizeDealValue(value) {
    return Math.min(1, (value || 0) / 1000000);
  }

  normalizeSatisfaction(satisfaction) {
    return Math.min(1, Math.max(0, (satisfaction || 0) / 5));
  }

  normalizeCareerImpact(impact) {
    return Math.min(1, Math.max(0, impact || 0));
  }

  normalizeDays(days) {
    return Math.min(1, Math.max(-1, days / 365));
  }

  flattenFeatures(features) {
    const flat = {};
    
    const flatten = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (typeof value === 'object' && value !== null) {
          flatten(value, newKey);
        } else {
          flat[newKey] = value;
        }
      }
    };
    
    flatten(features);
    return flat;
  }

  calculateCompleteness(features) {
    const values = Object.values(features);
    const nonNull = values.filter(v => v !== null && v !== undefined);
    return nonNull.length / values.length;
  }

  detectAnomalies(data) {
    // Simple anomaly detection
    for (const value of Object.values(data.features)) {
      if (typeof value === 'number' && (value < -10 || value > 10)) {
        return true;
      }
    }
    return false;
  }

  isDuplicate(data) {
    // Check for exact duplicates
    for (const existing of this.dataStore.values()) {
      if (JSON.stringify(existing.features) === JSON.stringify(data.features)) {
        return true;
      }
    }
    return false;
  }

  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  normalizeFeatures(features) {
    // Min-max normalization
    return features.map(row => 
      row.map(val => (val - Math.min(...row)) / (Math.max(...row) - Math.min(...row)))
    );
  }

  normalizeLabels(labels) {
    return labels;
  }

  randomDate() {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
  }

  generateRealisticValue(index) {
    // Generate values with realistic distributions
    if (index % 5 === 0) {
      // Binary features
      return Math.random() > 0.5 ? 1 : 0;
    } else if (index % 3 === 0) {
      // Normal distribution
      return Math.max(0, Math.min(1, (Math.random() + Math.random() + Math.random()) / 3));
    } else {
      // Uniform distribution
      return Math.random();
    }
  }

  calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
    
    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return isNaN(correlation) ? 0 : correlation;
  }

  calculateKLDivergence(p, q) {
    // Simplified KL divergence calculation
    let divergence = 0;
    for (let i = 0; i < p.length; i++) {
      if (p[i] > 0 && q[i] > 0) {
        divergence += p[i] * Math.log(p[i] / q[i]);
      }
    }
    return divergence;
  }

  getRecentData(count) {
    const allData = Array.from(this.dataStore.values());
    return allData
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, count);
  }

  getHistoricalData(count) {
    const allData = Array.from(this.dataStore.values());
    return allData
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(0, count);
  }

  isHolidayPeriod(date) {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Check common holiday periods
    if (month === 11 && day > 20) return true; // Christmas
    if (month === 0 && day < 5) return true; // New Year
    if (month === 6) return true; // Summer vacation
    
    return false;
  }

  extractDayOfWeek(timestamp) {
    return new Date(timestamp).getDay() / 6;
  }

  extractTimeOfDay(timestamp) {
    const hours = new Date(timestamp).getHours();
    return hours / 24;
  }

  extractDeviceType(device) {
    const types = { 'mobile': 0, 'tablet': 0.5, 'desktop': 1 };
    return types[device] !== undefined ? types[device] : 0.5;
  }

  normalizeClickDepth(clicks) {
    return Math.min(1, (clicks || 0) / 50);
  }

  calculateEngagement(interaction) {
    const duration = interaction.duration || 0;
    const clicks = interaction.clicks || 0;
    const shares = interaction.shares || 0;
    
    return Math.min(1, (duration / 3600 + clicks / 50 + shares / 10) / 3);
  }

  extractInternationalReach(countries) {
    return Math.min(1, (countries || 0) / 100);
  }

  extractSpeakerQuality(speakers) {
    // Simulate speaker quality score
    return Math.random() * 0.5 + 0.5;
  }

  extractSponsorTier(sponsors) {
    // Simulate sponsor tier score
    return Math.random() * 0.5 + 0.5;
  }

  extractContentDepth(sessions) {
    return Math.min(1, (sessions || 0) / 500);
  }

  normalizeSuccessRate(rate) {
    return Math.min(1, Math.max(0, rate || 0));
  }

  extractRepeatRate(rate) {
    return Math.min(1, Math.max(0, rate || 0));
  }

  extractNetworkGrowth(growth) {
    return Math.min(1, (growth || 0) / 100);
  }

  extractDealConversion(rate) {
    return Math.min(1, Math.max(0, rate || 0));
  }

  extractEconomicIndicator(gdp) {
    return Math.min(1, Math.max(-1, (gdp || 0) / 10));
  }

  extractIndustryGrowth(growth) {
    return Math.min(1, Math.max(-1, (growth || 0) / 20));
  }

  extractCompetition(competitors) {
    return Math.min(1, (competitors || 0) / 100);
  }

  extractInvestmentClimate(funding) {
    return Math.min(1, (funding || 0) / 1000000000);
  }

  extractTechTrends(trends) {
    // Simulate tech trends score
    return Math.random();
  }

  extractRegulatory(regulations) {
    // Simulate regulatory environment score
    return Math.random() * 0.5 + 0.5;
  }

  async sendToBackend(data) {
    // In production, send to backend API
    console.log('Training data collected:', data.id);
  }

  async triggerRetraining() {
    console.log('Triggering model retraining due to data drift');
    // In production, trigger ML pipeline
  }
}

// Export singleton instance
export const trainingPipeline = new TrainingDataPipeline();