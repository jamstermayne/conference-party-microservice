/**
 * KPI Dashboard Visualization
 * ============================
 * Real-time success metrics dashboard
 * 
 * Features:
 * - Interactive KPI cards
 * - Real-time chart updates
 * - Alert notifications
 * - Trend analysis
 * - Export capabilities
 */

class KPIDashboard {
    constructor() {
        this.container = null;
        this.metricsSystem = null;
        this.charts = new Map();
        this.refreshInterval = null;
        this.currentView = 'overview';
        
        this.init();
    }
    
    async init() {
        this.setupContainer();
        this.initializeMetricsSystem();
        this.renderDashboard();
        this.startAutoRefresh();
    }
    
    /**
     * Render main KPI dashboard
     */
    async renderDashboard() {
        const dashboard = await this.metricsSystem.generateDashboard();
        
        this.container.innerHTML = `
            <div class="kpi-dashboard">
                <!-- Header -->
                <div class="kpi-header">
                    <div class="kpi-title-section">
                        <h1 class="kpi-title">Success Metrics Dashboard</h1>
                        <div class="kpi-status">
                            <span class="status-indicator ${this.getStatusClass(dashboard.summary.status)}"></span>
                            <span class="status-text">${dashboard.summary.status}</span>
                            <span class="health-score">Health Score: ${dashboard.summary.healthScore}%</span>
                        </div>
                    </div>
                    
                    <div class="kpi-actions">
                        <button class="btn btn--ghost" onclick="kpiDashboard.toggleAutoRefresh()">
                            <span class="icon">🔄</span>
                            <span id="refresh-status">Auto-refresh: ON</span>
                        </button>
                        <button class="btn btn--secondary" onclick="kpiDashboard.exportReport()">
                            <span class="icon">📊</span>
                            Export Report
                        </button>
                        <button class="btn btn--primary" onclick="kpiDashboard.refreshNow()">
                            <span class="icon">🔄</span>
                            Refresh Now
                        </button>
                    </div>
                </div>
                
                <!-- Alert Banner -->
                ${this.renderAlertBanner(dashboard.summary.alerts)}
                
                <!-- Navigation -->
                <div class="kpi-nav">
                    <button class="kpi-nav-item active" data-view="overview">
                        <span class="nav-icon">📈</span>
                        Overview
                    </button>
                    <button class="kpi-nav-item" data-view="user">
                        <span class="nav-icon">😊</span>
                        User Delight
                    </button>
                    <button class="kpi-nav-item" data-view="growth">
                        <span class="nav-icon">🚀</span>
                        Growth
                    </button>
                    <button class="kpi-nav-item" data-view="technical">
                        <span class="nav-icon">⚙️</span>
                        Technical
                    </button>
                    <button class="kpi-nav-item" data-view="features">
                        <span class="nav-icon">✨</span>
                        Features
                    </button>
                </div>
                
                <!-- Content -->
                <div class="kpi-content">
                    ${this.renderOverview(dashboard)}
                </div>
                
                <!-- Action Items -->
                ${this.renderActionItems(dashboard.actionItems)}
            </div>
        `;
        
        this.attachEventListeners();
        this.initializeCharts(dashboard);
    }
    
    /**
     * Render overview section
     */
    renderOverview(dashboard) {
        return `
            <div class="kpi-overview">
                <!-- Score Cards -->
                <div class="score-cards">
                    <div class="score-card user-delight">
                        <div class="score-header">
                            <span class="score-icon">😊</span>
                            <span class="score-label">User Delight</span>
                        </div>
                        <div class="score-value">${dashboard.userDelight.score}%</div>
                        <div class="score-trend ${this.getTrendClass(dashboard.userDelight.metrics.nps.trend)}">
                            ${this.getTrendIcon(dashboard.userDelight.metrics.nps.trend)}
                            <span>${dashboard.userDelight.metrics.nps.trend}</span>
                        </div>
                    </div>
                    
                    <div class="score-card growth">
                        <div class="score-header">
                            <span class="score-icon">🚀</span>
                            <span class="score-label">Business Growth</span>
                        </div>
                        <div class="score-value">${dashboard.businessGrowth.score}%</div>
                        <div class="score-trend ${this.getTrendClass(dashboard.businessGrowth.metrics.monthlyActiveUsers.trend)}">
                            ${this.getTrendIcon(dashboard.businessGrowth.metrics.monthlyActiveUsers.trend)}
                            <span>${dashboard.businessGrowth.metrics.monthlyActiveUsers.trend}</span>
                        </div>
                    </div>
                    
                    <div class="score-card technical">
                        <div class="score-header">
                            <span class="score-icon">⚙️</span>
                            <span class="score-label">Technical Health</span>
                        </div>
                        <div class="score-value">${dashboard.technicalHealth.score}%</div>
                        <div class="score-trend ${this.getTrendClass(dashboard.technicalHealth.metrics.uptime.trend)}">
                            ${this.getTrendIcon(dashboard.technicalHealth.metrics.uptime.trend)}
                            <span>${dashboard.technicalHealth.metrics.uptime.trend}</span>
                        </div>
                    </div>
                    
                    <div class="score-card features">
                        <div class="score-header">
                            <span class="score-icon">✨</span>
                            <span class="score-label">Feature Adoption</span>
                        </div>
                        <div class="score-value">${dashboard.featureSuccess.score}%</div>
                        <div class="score-trend ${this.getTrendClass('growing')}">
                            ${this.getTrendIcon('growing')}
                            <span>growing</span>
                        </div>
                    </div>
                </div>
                
                <!-- Key Metrics Grid -->
                <div class="key-metrics">
                    <h2 class="section-title">Key Performance Indicators</h2>
                    <div class="metrics-grid">
                        ${this.renderKeyMetrics(dashboard)}
                    </div>
                </div>
                
                <!-- Charts Section -->
                <div class="charts-section">
                    <div class="chart-container">
                        <h3>User Growth Trend</h3>
                        <canvas id="growth-chart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h3>Revenue Metrics</h3>
                        <canvas id="revenue-chart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h3>Technical Performance</h3>
                        <canvas id="performance-chart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h3>Feature Adoption</h3>
                        <canvas id="adoption-chart"></canvas>
                    </div>
                </div>
                
                <!-- Predictions -->
                <div class="predictions-section">
                    <h2 class="section-title">Predictions & Projections</h2>
                    <div class="predictions-grid">
                        ${this.renderPredictions(dashboard.predictions)}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render key metrics
     */
    renderKeyMetrics(dashboard) {
        const metrics = [
            {
                label: 'NPS Score',
                value: dashboard.userDelight.metrics.nps.current,
                target: dashboard.userDelight.metrics.nps.target,
                unit: '',
                icon: '🎯'
            },
            {
                label: 'Monthly Active Users',
                value: this.formatNumber(dashboard.businessGrowth.metrics.monthlyActiveUsers.current),
                target: this.formatNumber(dashboard.businessGrowth.metrics.monthlyActiveUsers.target),
                unit: '',
                icon: '👥'
            },
            {
                label: 'MRR Growth',
                value: dashboard.businessGrowth.metrics.revenueGrowth.current,
                target: dashboard.businessGrowth.metrics.revenueGrowth.target,
                unit: '% MoM',
                icon: '💰'
            },
            {
                label: 'System Uptime',
                value: dashboard.technicalHealth.metrics.uptime.current,
                target: dashboard.technicalHealth.metrics.uptime.target,
                unit: '%',
                icon: '✅'
            },
            {
                label: 'App Rating',
                value: dashboard.userDelight.metrics.appStoreRating.current,
                target: dashboard.userDelight.metrics.appStoreRating.target,
                unit: '⭐',
                icon: '⭐'
            },
            {
                label: 'Task Completion',
                value: dashboard.userDelight.metrics.taskCompletionRate.current,
                target: dashboard.userDelight.metrics.taskCompletionRate.target,
                unit: '%',
                icon: '✔️'
            },
            {
                label: 'Enterprise Clients',
                value: dashboard.businessGrowth.metrics.enterpriseClients.current,
                target: dashboard.businessGrowth.metrics.enterpriseClients.target,
                unit: '',
                icon: '🏢'
            },
            {
                label: 'Viral Coefficient',
                value: dashboard.businessGrowth.metrics.viralCoefficient.current.toFixed(2),
                target: dashboard.businessGrowth.metrics.viralCoefficient.target,
                unit: '',
                icon: '📈'
            }
        ];
        
        return metrics.map(metric => `
            <div class="metric-card ${this.getMetricStatus(metric)}">
                <div class="metric-header">
                    <span class="metric-icon">${metric.icon}</span>
                    <span class="metric-label">${metric.label}</span>
                </div>
                <div class="metric-body">
                    <div class="metric-value">
                        ${metric.value}${metric.unit}
                    </div>
                    <div class="metric-target">
                        Target: ${metric.target}${metric.unit}
                    </div>
                </div>
                <div class="metric-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.calculateProgress(metric)}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Render predictions section
     */
    renderPredictions(predictions) {
        return `
            <div class="prediction-card">
                <h4>Next Month</h4>
                <div class="prediction-content">
                    <div class="prediction-metric">
                        <span class="label">MAU</span>
                        <span class="value">${this.formatNumber(predictions.nextMonth.mau)}</span>
                    </div>
                    <div class="prediction-metric">
                        <span class="label">MRR</span>
                        <span class="value">$${this.formatNumber(predictions.nextMonth.mrr)}</span>
                    </div>
                    <div class="prediction-confidence">
                        Confidence: ${predictions.nextMonth.confidence}%
                    </div>
                </div>
            </div>
            
            <div class="prediction-card">
                <h4>Next Quarter</h4>
                <div class="prediction-content">
                    <div class="prediction-metric">
                        <span class="label">MAU</span>
                        <span class="value">${this.formatNumber(predictions.nextQuarter.mau)}</span>
                    </div>
                    <div class="prediction-metric">
                        <span class="label">ARR</span>
                        <span class="value">$${this.formatNumber(predictions.nextQuarter.arr)}</span>
                    </div>
                    <div class="prediction-confidence">
                        Confidence: ${predictions.nextQuarter.confidence}%
                    </div>
                </div>
            </div>
            
            <div class="prediction-card risks">
                <h4>Identified Risks</h4>
                <div class="risk-list">
                    ${predictions.risks.slice(0, 3).map(risk => `
                        <div class="risk-item">
                            <span class="risk-icon">⚠️</span>
                            <span class="risk-text">${risk.description}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="prediction-card opportunities">
                <h4>Opportunities</h4>
                <div class="opportunity-list">
                    ${predictions.opportunities.slice(0, 3).map(opp => `
                        <div class="opportunity-item">
                            <span class="opp-icon">💡</span>
                            <span class="opp-text">${opp.description}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render alert banner
     */
    renderAlertBanner(alerts) {
        if (!alerts || alerts.length === 0) return '';
        
        const highPriorityAlerts = alerts.filter(a => a.severity === 'high');
        if (highPriorityAlerts.length === 0) return '';
        
        return `
            <div class="alert-banner">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                    <div class="alert-title">Attention Required</div>
                    <div class="alert-messages">
                        ${highPriorityAlerts.map(alert => `
                            <div class="alert-message">${alert.message}</div>
                        `).join('')}
                    </div>
                </div>
                <button class="alert-dismiss" onclick="kpiDashboard.dismissAlerts()">✕</button>
            </div>
        `;
    }
    
    /**
     * Render action items
     */
    renderActionItems(actionItems) {
        if (!actionItems || actionItems.length === 0) return '';
        
        return `
            <div class="action-items-section">
                <h2 class="section-title">Recommended Actions</h2>
                <div class="action-items-grid">
                    ${actionItems.slice(0, 6).map(item => `
                        <div class="action-item ${item.priority}">
                            <div class="action-header">
                                <span class="action-priority">${item.priority.toUpperCase()}</span>
                                <span class="action-category">${item.category.replace('_', ' ')}</span>
                            </div>
                            <div class="action-content">
                                <h4>${item.action}</h4>
                                <div class="action-metrics">
                                    <span class="current">Current: ${item.current}</span>
                                    <span class="target">Target: ${item.target}</span>
                                </div>
                                <div class="action-suggestions">
                                    ${item.suggestions.map(s => `
                                        <div class="suggestion">• ${s}</div>
                                    `).join('')}
                                </div>
                            </div>
                            <button class="btn btn--sm btn--primary" onclick="kpiDashboard.takeAction('${item.action}')">
                                Take Action
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Initialize charts
     */
    initializeCharts(dashboard) {
        // Growth chart
        this.renderGrowthChart('growth-chart', dashboard.businessGrowth);
        
        // Revenue chart
        this.renderRevenueChart('revenue-chart', dashboard.businessGrowth);
        
        // Performance chart
        this.renderPerformanceChart('performance-chart', dashboard.technicalHealth);
        
        // Adoption chart
        this.renderAdoptionChart('adoption-chart', dashboard.featureSuccess);
    }
    
    /**
     * Render growth chart
     */
    renderGrowthChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        // Simulate chart rendering
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#6366F1';
        ctx.fillRect(10, 50, 50, 100);
        ctx.fillRect(70, 40, 50, 110);
        ctx.fillRect(130, 30, 50, 120);
        ctx.fillRect(190, 20, 50, 130);
    }
    
    /**
     * Helper methods
     */
    getStatusClass(status) {
        const statusMap = {
            'excellent': 'status-excellent',
            'good': 'status-good',
            'warning': 'status-warning',
            'critical': 'status-critical'
        };
        return statusMap[status] || 'status-neutral';
    }
    
    getTrendClass(trend) {
        const trendMap = {
            'improving': 'trend-up',
            'growing': 'trend-up',
            'stable': 'trend-stable',
            'declining': 'trend-down',
            'decreasing': 'trend-down'
        };
        return trendMap[trend] || 'trend-stable';
    }
    
    getTrendIcon(trend) {
        const iconMap = {
            'improving': '📈',
            'growing': '📈',
            'stable': '➡️',
            'declining': '📉',
            'decreasing': '📉'
        };
        return iconMap[trend] || '➡️';
    }
    
    getMetricStatus(metric) {
        const progress = this.calculateProgress(metric);
        if (progress >= 100) return 'metric-success';
        if (progress >= 70) return 'metric-warning';
        return 'metric-danger';
    }
    
    calculateProgress(metric) {
        if (!metric.target) return 0;
        return Math.min(100, (parseFloat(metric.value) / parseFloat(metric.target)) * 100);
    }
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    /**
     * Event handlers
     */
    attachEventListeners() {
        // Navigation
        document.querySelectorAll('.kpi-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.kpi-nav-item').forEach(i => i.classList.remove('active'));
                e.target.classList.add('active');
                this.switchView(e.target.dataset.view);
            });
        });
    }
    
    async switchView(view) {
        this.currentView = view;
        const content = document.querySelector('.kpi-content');
        
        // Fade out
        content.style.opacity = '0';
        
        setTimeout(async () => {
            const dashboard = await this.metricsSystem.generateDashboard();
            
            switch(view) {
                case 'overview':
                    content.innerHTML = this.renderOverview(dashboard);
                    break;
                case 'user':
                    content.innerHTML = this.renderUserDelight(dashboard.userDelight);
                    break;
                case 'growth':
                    content.innerHTML = this.renderGrowth(dashboard.businessGrowth);
                    break;
                case 'technical':
                    content.innerHTML = this.renderTechnical(dashboard.technicalHealth);
                    break;
                case 'features':
                    content.innerHTML = this.renderFeatures(dashboard.featureSuccess);
                    break;
            }
            
            // Fade in
            content.style.opacity = '1';
            this.initializeCharts(dashboard);
        }, 300);
    }
    
    /**
     * Auto-refresh functionality
     */
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.refreshDashboard();
        }, 30000); // Refresh every 30 seconds
    }
    
    toggleAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            document.getElementById('refresh-status').textContent = 'Auto-refresh: OFF';
        } else {
            this.startAutoRefresh();
            document.getElementById('refresh-status').textContent = 'Auto-refresh: ON';
        }
    }
    
    async refreshNow() {
        await this.renderDashboard();
    }
    
    async refreshDashboard() {
        // Only refresh visible metrics for performance
        const dashboard = await this.metricsSystem.generateDashboard();
        this.updateMetricsDisplay(dashboard);
    }
    
    /**
     * Export functionality
     */
    async exportReport() {
        const dashboard = await this.metricsSystem.generateDashboard();
        const report = this.generateReport(dashboard);
        
        // Download as JSON
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kpi-report-${new Date().toISOString()}.json`;
        a.click();
    }
    
    /**
     * Initialize
     */
    setupContainer() {
        this.container = document.getElementById('kpi-dashboard-container') || document.body;
    }
    
    initializeMetricsSystem() {
        this.metricsSystem = window.successMetrics || new SuccessMetricsSystem();
    }
}

// Initialize KPI Dashboard
const kpiDashboard = new KPIDashboard();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KPIDashboard;
}