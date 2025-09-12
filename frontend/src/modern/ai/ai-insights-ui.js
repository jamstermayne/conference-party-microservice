/**
 * AI Insights UI System
 * =====================
 * Interactive visualization for AI-powered insights
 * 
 * Features:
 * - Real-time insight cards
 * - Interactive charts
 * - Prediction visualizations
 * - Conversation analysis display
 * - Career path visualization
 * - Market trend dashboards
 */

class AIInsightsUI {
    constructor() {
        this.container = null;
        this.aiEngine = null;
        this.currentView = 'dashboard';
        this.charts = new Map();
        this.animations = new Map();
        
        this.init();
    }
    
    async init() {
        this.setupContainer();
        this.initializeAIEngine();
        this.setupEventListeners();
        this.renderDashboard();
    }
    
    /**
     * Render main AI insights dashboard
     */
    async renderDashboard() {
        const insights = await this.fetchLatestInsights();
        
        this.container.innerHTML = `
            <div class="ai-insights-dashboard">
                <!-- Header -->
                <div class="ai-header">
                    <div class="ai-title-section">
                        <h1 class="ai-title">
                            <span class="ai-icon">🧠</span>
                            AI Intelligence Hub
                        </h1>
                        <p class="ai-subtitle">Powered by Advanced Machine Learning</p>
                    </div>
                    
                    <div class="ai-actions">
                        <button class="btn btn--secondary" onclick="aiInsights.exportInsights()">
                            <span class="icon">📊</span> Export Report
                        </button>
                        <button class="btn btn--primary" onclick="aiInsights.refreshInsights()">
                            <span class="icon">🔄</span> Refresh
                        </button>
                    </div>
                </div>
                
                <!-- Navigation Tabs -->
                <div class="ai-tabs">
                    <button class="ai-tab active" data-view="overview">
                        <span class="tab-icon">📈</span>
                        Overview
                    </button>
                    <button class="ai-tab" data-view="conversations">
                        <span class="tab-icon">💬</span>
                        Conversations
                    </button>
                    <button class="ai-tab" data-view="career">
                        <span class="tab-icon">🚀</span>
                        Career Path
                    </button>
                    <button class="ai-tab" data-view="market">
                        <span class="tab-icon">📊</span>
                        Market Trends
                    </button>
                    <button class="ai-tab" data-view="networking">
                        <span class="tab-icon">🤝</span>
                        Networking
                    </button>
                </div>
                
                <!-- Content Area -->
                <div class="ai-content">
                    ${this.renderOverview(insights)}
                </div>
            </div>
        `;
        
        this.attachTabListeners();
        this.initializeCharts(insights);
    }
    
    /**
     * Render overview section
     */
    renderOverview(insights) {
        return `
            <div class="ai-overview">
                <!-- Key Metrics -->
                <div class="ai-metrics-grid">
                    <div class="ai-metric-card pulse">
                        <div class="metric-icon">🎯</div>
                        <div class="metric-content">
                            <div class="metric-value">${insights.opportunities || 24}</div>
                            <div class="metric-label">Opportunities Detected</div>
                            <div class="metric-trend positive">+12% this week</div>
                        </div>
                    </div>
                    
                    <div class="ai-metric-card pulse delay-1">
                        <div class="metric-icon">📈</div>
                        <div class="metric-content">
                            <div class="metric-value">${insights.careerScore || 87}%</div>
                            <div class="metric-label">Career Trajectory Score</div>
                            <div class="metric-trend positive">On track</div>
                        </div>
                    </div>
                    
                    <div class="ai-metric-card pulse delay-2">
                        <div class="metric-icon">🌐</div>
                        <div class="metric-content">
                            <div class="metric-value">${insights.networkStrength || 156}</div>
                            <div class="metric-label">Network Connections</div>
                            <div class="metric-trend neutral">Stable growth</div>
                        </div>
                    </div>
                    
                    <div class="ai-metric-card pulse delay-3">
                        <div class="metric-icon">💡</div>
                        <div class="metric-content">
                            <div class="metric-value">${insights.insightCount || 42}</div>
                            <div class="metric-label">AI Insights Generated</div>
                            <div class="metric-trend positive">New insights daily</div>
                        </div>
                    </div>
                </div>
                
                <!-- AI Insights Feed -->
                <div class="ai-insights-feed">
                    <h2 class="section-title">Latest AI Insights</h2>
                    <div class="insights-list">
                        ${this.renderInsightCards(insights.latest || [])}
                    </div>
                </div>
                
                <!-- Predictions Chart -->
                <div class="ai-predictions-section">
                    <h2 class="section-title">Predictive Analytics</h2>
                    <div class="predictions-chart">
                        <canvas id="predictions-chart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render conversation analysis view
     */
    renderConversationAnalysis(analysis) {
        return `
            <div class="conversation-analysis">
                <!-- Sentiment Overview -->
                <div class="sentiment-overview">
                    <h2 class="section-title">Conversation Sentiment Analysis</h2>
                    <div class="sentiment-chart-container">
                        <canvas id="sentiment-chart"></canvas>
                    </div>
                    <div class="sentiment-summary">
                        <div class="sentiment-stat positive">
                            <span class="stat-icon">😊</span>
                            <span class="stat-value">${analysis.sentiment?.positive || 65}%</span>
                            <span class="stat-label">Positive</span>
                        </div>
                        <div class="sentiment-stat neutral">
                            <span class="stat-icon">😐</span>
                            <span class="stat-value">${analysis.sentiment?.neutral || 25}%</span>
                            <span class="stat-label">Neutral</span>
                        </div>
                        <div class="sentiment-stat negative">
                            <span class="stat-icon">😔</span>
                            <span class="stat-value">${analysis.sentiment?.negative || 10}%</span>
                            <span class="stat-label">Negative</span>
                        </div>
                    </div>
                </div>
                
                <!-- Topic Clusters -->
                <div class="topic-clusters">
                    <h2 class="section-title">Discussion Topics</h2>
                    <div class="topic-bubble-chart">
                        <canvas id="topic-chart"></canvas>
                    </div>
                    <div class="topic-list">
                        ${this.renderTopicList(analysis.topics || [])}
                    </div>
                </div>
                
                <!-- Opportunity Detection -->
                <div class="opportunity-detection">
                    <h2 class="section-title">Detected Opportunities</h2>
                    <div class="opportunity-cards">
                        ${this.renderOpportunityCards(analysis.opportunities || [])}
                    </div>
                </div>
                
                <!-- Key Insights -->
                <div class="conversation-insights">
                    <h2 class="section-title">Key Conversation Insights</h2>
                    <div class="insight-timeline">
                        ${this.renderInsightTimeline(analysis.insights || [])}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render career path visualization
     */
    renderCareerPath(careerData) {
        return `
            <div class="career-path-viz">
                <!-- Current Position -->
                <div class="current-position">
                    <h2 class="section-title">Current Career Position</h2>
                    <div class="position-card">
                        <div class="position-header">
                            <div class="position-title">${careerData.current?.role || 'Senior Developer'}</div>
                            <div class="position-company">${careerData.current?.company || 'Tech Corp'}</div>
                        </div>
                        <div class="position-metrics">
                            <div class="metric">
                                <span class="label">Market Value</span>
                                <span class="value">$${careerData.current?.marketValue || '120,000'}</span>
                            </div>
                            <div class="metric">
                                <span class="label">Competitiveness</span>
                                <span class="value">${careerData.current?.competitiveness || 85}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Career Trajectory -->
                <div class="career-trajectory">
                    <h2 class="section-title">Predicted Career Path</h2>
                    <div class="trajectory-timeline">
                        ${this.renderCareerTimeline(careerData.trajectory || [])}
                    </div>
                </div>
                
                <!-- Skill Development -->
                <div class="skill-development">
                    <h2 class="section-title">Recommended Skills</h2>
                    <div class="skill-matrix">
                        ${this.renderSkillMatrix(careerData.skills || [])}
                    </div>
                </div>
                
                <!-- Salary Projection -->
                <div class="salary-projection">
                    <h2 class="section-title">Salary Growth Projection</h2>
                    <div class="salary-chart-container">
                        <canvas id="salary-chart"></canvas>
                    </div>
                </div>
                
                <!-- Action Plan -->
                <div class="career-action-plan">
                    <h2 class="section-title">Recommended Action Plan</h2>
                    <div class="action-steps">
                        ${this.renderActionSteps(careerData.actionPlan || [])}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render market trends dashboard
     */
    renderMarketTrends(marketData) {
        return `
            <div class="market-trends-dashboard">
                <!-- Trend Overview -->
                <div class="trend-overview">
                    <h2 class="section-title">Market Trend Analysis</h2>
                    <div class="trend-cards">
                        <div class="trend-card emerging">
                            <div class="trend-header">
                                <span class="trend-icon">🚀</span>
                                <span class="trend-label">Emerging</span>
                            </div>
                            <div class="trend-items">
                                ${this.renderTrendItems(marketData.emerging || [])}
                            </div>
                        </div>
                        
                        <div class="trend-card declining">
                            <div class="trend-header">
                                <span class="trend-icon">📉</span>
                                <span class="trend-label">Declining</span>
                            </div>
                            <div class="trend-items">
                                ${this.renderTrendItems(marketData.declining || [])}
                            </div>
                        </div>
                        
                        <div class="trend-card stable">
                            <div class="trend-header">
                                <span class="trend-icon">➡️</span>
                                <span class="trend-label">Stable</span>
                            </div>
                            <div class="trend-items">
                                ${this.renderTrendItems(marketData.stable || [])}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Market Dynamics -->
                <div class="market-dynamics">
                    <h2 class="section-title">Market Dynamics</h2>
                    <div class="dynamics-chart">
                        <canvas id="market-chart"></canvas>
                    </div>
                </div>
                
                <!-- Investment Insights -->
                <div class="investment-insights">
                    <h2 class="section-title">Investment Opportunities</h2>
                    <div class="investment-grid">
                        ${this.renderInvestmentCards(marketData.investments || [])}
                    </div>
                </div>
                
                <!-- Competitive Landscape -->
                <div class="competitive-landscape">
                    <h2 class="section-title">Competitive Analysis</h2>
                    <div class="competitor-matrix">
                        ${this.renderCompetitorMatrix(marketData.competitors || [])}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render networking strategy
     */
    renderNetworkingStrategy(networkData) {
        return `
            <div class="networking-strategy">
                <!-- Network Overview -->
                <div class="network-overview">
                    <h2 class="section-title">Network Analysis</h2>
                    <div class="network-visualization">
                        <canvas id="network-graph"></canvas>
                    </div>
                    <div class="network-stats">
                        <div class="stat">
                            <span class="stat-value">${networkData.connections || 156}</span>
                            <span class="stat-label">Total Connections</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${networkData.industries || 12}</span>
                            <span class="stat-label">Industries Covered</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${networkData.influencers || 8}</span>
                            <span class="stat-label">Key Influencers</span>
                        </div>
                    </div>
                </div>
                
                <!-- Target Profiles -->
                <div class="target-profiles">
                    <h2 class="section-title">Recommended Connections</h2>
                    <div class="profile-cards">
                        ${this.renderProfileCards(networkData.targets || [])}
                    </div>
                </div>
                
                <!-- Networking Events -->
                <div class="networking-events">
                    <h2 class="section-title">Strategic Events</h2>
                    <div class="event-recommendations">
                        ${this.renderEventRecommendations(networkData.events || [])}
                    </div>
                </div>
                
                <!-- Connection Strategy -->
                <div class="connection-strategy">
                    <h2 class="section-title">Outreach Strategy</h2>
                    <div class="strategy-steps">
                        ${this.renderStrategySteps(networkData.strategy || [])}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Helper rendering methods
     */
    renderInsightCards(insights) {
        if (!insights.length) {
            insights = this.generateSampleInsights();
        }
        
        return insights.map((insight, index) => `
            <div class="insight-card slide-in delay-${index % 4}">
                <div class="insight-header">
                    <span class="insight-icon">${insight.icon || '💡'}</span>
                    <span class="insight-type">${insight.type || 'Opportunity'}</span>
                    <span class="insight-confidence">${insight.confidence || 85}% confidence</span>
                </div>
                <div class="insight-content">
                    <h3 class="insight-title">${insight.title}</h3>
                    <p class="insight-description">${insight.description}</p>
                </div>
                <div class="insight-actions">
                    <button class="btn btn--sm btn--primary">View Details</button>
                    <button class="btn btn--sm btn--ghost">Dismiss</button>
                </div>
            </div>
        `).join('');
    }
    
    renderTopicList(topics) {
        if (!topics.length) {
            topics = ['AI/ML', 'Cloud Computing', 'Blockchain', 'DevOps', 'Security'];
        }
        
        return topics.map(topic => `
            <div class="topic-item">
                <div class="topic-bar" style="width: ${Math.random() * 100}%"></div>
                <span class="topic-name">${topic}</span>
            </div>
        `).join('');
    }
    
    renderOpportunityCards(opportunities) {
        if (!opportunities.length) {
            opportunities = this.generateSampleOpportunities();
        }
        
        return opportunities.map(opp => `
            <div class="opportunity-card">
                <div class="opp-type ${opp.type}">
                    <span class="opp-icon">${this.getOpportunityIcon(opp.type)}</span>
                    <span class="opp-label">${opp.type}</span>
                </div>
                <div class="opp-details">
                    <h4>${opp.title}</h4>
                    <p>${opp.description}</p>
                    <div class="opp-value">Estimated Value: ${opp.value}</div>
                </div>
                <button class="btn btn--sm btn--primary">Pursue</button>
            </div>
        `).join('');
    }
    
    /**
     * Chart initialization
     */
    initializeCharts(data) {
        // Initialize prediction chart
        this.renderPredictionChart('predictions-chart', data.predictions);
        
        // Initialize other charts based on current view
        if (this.currentView === 'conversations') {
            this.renderSentimentChart('sentiment-chart', data.sentiment);
            this.renderTopicChart('topic-chart', data.topics);
        } else if (this.currentView === 'career') {
            this.renderSalaryChart('salary-chart', data.salary);
        } else if (this.currentView === 'market') {
            this.renderMarketChart('market-chart', data.market);
        } else if (this.currentView === 'networking') {
            this.renderNetworkGraph('network-graph', data.network);
        }
    }
    
    /**
     * Sample data generators
     */
    generateSampleInsights() {
        return [
            {
                icon: '🎯',
                type: 'Opportunity',
                confidence: 92,
                title: 'High-Value Partnership Detected',
                description: 'Analysis suggests strong synergy with TechCorp for joint product development.'
            },
            {
                icon: '📈',
                type: 'Career',
                confidence: 87,
                title: 'Skill Gap Identified',
                description: 'Cloud architecture expertise would accelerate your path to Staff Engineer.'
            },
            {
                icon: '🌟',
                type: 'Networking',
                confidence: 94,
                title: 'Strategic Connection Available',
                description: 'John Smith (CTO at StartupX) shares 3 mutual connections.'
            },
            {
                icon: '💰',
                type: 'Market',
                confidence: 78,
                title: 'Emerging Technology Trend',
                description: 'WebAssembly adoption increasing 40% quarter-over-quarter in your industry.'
            }
        ];
    }
    
    generateSampleOpportunities() {
        return [
            {
                type: 'collaboration',
                title: 'Joint Research Project',
                description: 'Collaborate on AI ethics framework with University team',
                value: '$50,000 grant'
            },
            {
                type: 'business',
                title: 'Enterprise Contract',
                description: 'Potential 6-month consulting engagement with Fortune 500',
                value: '$180,000'
            },
            {
                type: 'investment',
                title: 'Seed Investment',
                description: 'VC interest in your startup concept',
                value: '$500,000'
            }
        ];
    }
    
    getOpportunityIcon(type) {
        const icons = {
            collaboration: '🤝',
            business: '💼',
            investment: '💰',
            learning: '📚',
            partnership: '🔗'
        };
        return icons[type] || '💡';
    }
    
    /**
     * Event handlers
     */
    attachTabListeners() {
        document.querySelectorAll('.ai-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
    }
    
    async switchView(view) {
        this.currentView = view;
        const content = document.querySelector('.ai-content');
        
        // Add transition effect
        content.style.opacity = '0';
        
        setTimeout(async () => {
            switch(view) {
                case 'overview':
                    content.innerHTML = this.renderOverview(await this.fetchLatestInsights());
                    break;
                case 'conversations':
                    content.innerHTML = this.renderConversationAnalysis(await this.fetchConversationAnalysis());
                    break;
                case 'career':
                    content.innerHTML = this.renderCareerPath(await this.fetchCareerData());
                    break;
                case 'market':
                    content.innerHTML = this.renderMarketTrends(await this.fetchMarketData());
                    break;
                case 'networking':
                    content.innerHTML = this.renderNetworkingStrategy(await this.fetchNetworkData());
                    break;
            }
            
            content.style.opacity = '1';
            this.initializeCharts(await this.fetchLatestInsights());
        }, 300);
    }
    
    /**
     * Data fetching methods
     */
    async fetchLatestInsights() {
        // In production, this would fetch from AI engine
        return {
            opportunities: 24,
            careerScore: 87,
            networkStrength: 156,
            insightCount: 42,
            latest: this.generateSampleInsights(),
            predictions: { labels: ['Q1', 'Q2', 'Q3', 'Q4'], data: [65, 75, 85, 92] }
        };
    }
    
    async fetchConversationAnalysis() {
        return {
            sentiment: { positive: 65, neutral: 25, negative: 10 },
            topics: ['AI/ML', 'Cloud', 'Security', 'DevOps'],
            opportunities: this.generateSampleOpportunities(),
            insights: []
        };
    }
    
    async fetchCareerData() {
        return {
            current: { role: 'Senior Developer', company: 'TechCorp', marketValue: '120000', competitiveness: 85 },
            trajectory: [],
            skills: [],
            actionPlan: []
        };
    }
    
    async fetchMarketData() {
        return {
            emerging: ['WebAssembly', 'Edge Computing', 'Quantum'],
            declining: ['Legacy Systems', 'Monolithic Architecture'],
            stable: ['Cloud', 'Microservices'],
            investments: [],
            competitors: []
        };
    }
    
    async fetchNetworkData() {
        return {
            connections: 156,
            industries: 12,
            influencers: 8,
            targets: [],
            events: [],
            strategy: []
        };
    }
    
    /**
     * Initialize the UI
     */
    setupContainer() {
        this.container = document.getElementById('ai-insights-container') || document.body;
    }
    
    initializeAIEngine() {
        // Connect to AI engine
        this.aiEngine = window.aiEngine || new AdvancedIntelligenceEngine();
    }
    
    setupEventListeners() {
        // Global event listeners
        window.addEventListener('resize', () => this.handleResize());
    }
    
    handleResize() {
        // Redraw charts on resize
        this.charts.forEach(chart => chart.resize());
    }
}

// Initialize AI Insights UI
const aiInsightsUI = new AIInsightsUI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIInsightsUI;
}