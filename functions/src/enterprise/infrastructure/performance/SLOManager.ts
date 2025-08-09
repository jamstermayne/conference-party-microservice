/**
 * SERVICE LEVEL OBJECTIVES (SLO) MANAGER
 * Enterprise-grade SLO monitoring with SLA compliance and alerting
 */

import { apmTracing } from '../observability/APMTracing';

/**
 * SLO configuration
 */
export interface SLOConfig {
  name: string;
  description: string;
  target: number; // Target percentage (0-100)
  timeWindow: number; // Time window in milliseconds
  alertThreshold: number; // Alert when SLO drops below this percentage
  errorBudget: number; // Error budget percentage
  tags: string[];
  enabled: boolean;
}

/**
 * SLI (Service Level Indicator) measurement
 */
export interface SLIMeasurement {
  timestamp: number;
  value: number;
  success: boolean;
  metadata?: Record<string, any>;
}

/**
 * SLO status
 */
export interface SLOStatus {
  config: SLOConfig;
  currentSLI: number;
  target: number;
  compliance: number; // Percentage
  errorBudgetRemaining: number; // Percentage
  status: 'healthy' | 'warning' | 'critical';
  measurements: SLIMeasurement[];
  lastAlert?: number;
  recommendations: string[];
}

/**
 * Performance benchmark
 */
export interface PerformanceBenchmark {
  operation: string;
  p50: number;
  p95: number;
  p99: number;
  p99_9: number;
  mean: number;
  min: number;
  max: number;
  samples: number;
  timestamp: number;
}

/**
 * SLA compliance report
 */
export interface SLAComplianceReport {
  period: string;
  slos: SLOStatus[];
  overallCompliance: number;
  errorBudgetUtilization: number;
  incidents: {
    total: number;
    critical: number;
    resolved: number;
    mttr: number; // Mean Time To Recovery
  };
  recommendations: string[];
  trends: {
    improvingSLOs: string[];
    degradingSLOs: string[];
  };
}

/**
 * Enterprise SLO Manager
 * Comprehensive SLO monitoring and SLA compliance tracking
 */
export class SLOManager {
  private slos: Map<string, SLOStatus> = new Map();
  private performanceBenchmarks: Map<string, PerformanceBenchmark> = new Map();
  private alertHistory: Map<string, number[]> = new Map();

  constructor() {
    this.initializeDefaultSLOs();
    this.startBackgroundTasks();
  }

  /**
   * Initialize default enterprise SLOs
   */
  private initializeDefaultSLOs(): void {
    const defaultSLOs: SLOConfig[] = [
      {
        name: 'api_availability',
        description: 'API availability (non-5xx responses)',
        target: 99.9, // 99.9% uptime
        timeWindow: 86400000, // 24 hours
        alertThreshold: 99.5,
        errorBudget: 0.1,
        tags: ['availability', 'api'],
        enabled: true,
      },
      {
        name: 'api_latency_p95',
        description: 'API response time 95th percentile',
        target: 95.0, // 95% of requests under 500ms
        timeWindow: 3600000, // 1 hour
        alertThreshold: 90.0,
        errorBudget: 5.0,
        tags: ['latency', 'performance', 'api'],
        enabled: true,
      },
      {
        name: 'api_latency_p99',
        description: 'API response time 99th percentile',
        target: 99.0, // 99% of requests under 2000ms
        timeWindow: 3600000, // 1 hour
        alertThreshold: 95.0,
        errorBudget: 1.0,
        tags: ['latency', 'performance', 'api'],
        enabled: true,
      },
      {
        name: 'event_creation_success',
        description: 'Event creation success rate',
        target: 99.5, // 99.5% success rate
        timeWindow: 86400000, // 24 hours
        alertThreshold: 98.0,
        errorBudget: 0.5,
        tags: ['success_rate', 'events', 'ugc'],
        enabled: true,
      },
      {
        name: 'cache_hit_rate',
        description: 'Cache hit rate for frequently accessed data',
        target: 95.0, // 95% cache hit rate
        timeWindow: 3600000, // 1 hour
        alertThreshold: 85.0,
        errorBudget: 5.0,
        tags: ['cache', 'performance'],
        enabled: true,
      },
      {
        name: 'database_query_latency',
        description: 'Database query response time',
        target: 90.0, // 90% of queries under 100ms
        timeWindow: 3600000, // 1 hour
        alertThreshold: 80.0,
        errorBudget: 10.0,
        tags: ['database', 'latency'],
        enabled: true,
      },
      {
        name: 'error_rate',
        description: 'Overall error rate across all operations',
        target: 99.9, // 99.9% success rate
        timeWindow: 86400000, // 24 hours
        alertThreshold: 99.0,
        errorBudget: 0.1,
        tags: ['error_rate', 'reliability'],
        enabled: true,
      },
      {
        name: 'security_threat_detection',
        description: 'Security threat detection accuracy',
        target: 95.0, // 95% accuracy in threat detection
        timeWindow: 86400000, // 24 hours
        alertThreshold: 90.0,
        errorBudget: 5.0,
        tags: ['security', 'detection'],
        enabled: true,
      }
    ];

    defaultSLOs.forEach(config => {
      this.slos.set(config.name, {
        config,
        currentSLI: 100, // Start with perfect score
        target: config.target,
        compliance: 100,
        errorBudgetRemaining: config.errorBudget,
        status: 'healthy',
        measurements: [],
        recommendations: [],
      });
    });

    console.log(`📊 Initialized ${defaultSLOs.length} enterprise SLOs`);
  }

  /**
   * Record SLI measurement
   */
  public recordSLI(
    sloName: string,
    value: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const slo = this.slos.get(sloName);
    if (!slo || !slo.config.enabled) {
      return;
    }

    const measurement: SLIMeasurement = {
      timestamp: Date.now(),
      value,
      success,
      metadata,
    };

    // Add measurement
    slo.measurements.push(measurement);

    // Keep measurements within time window
    const cutoff = Date.now() - slo.config.timeWindow;
    slo.measurements = slo.measurements.filter(m => m.timestamp > cutoff);

    // Calculate current SLI
    this.calculateSLI(slo);

    // Check for alerts
    this.checkSLOAlerts(sloName, slo);
  }

  /**
   * Record API response time for latency SLOs
   */
  public recordAPILatency(endpoint: string, responseTime: number): void {
    // Record for general API latency SLOs
    this.recordSLI('api_latency_p95', responseTime, responseTime < 500);
    this.recordSLI('api_latency_p99', responseTime, responseTime < 2000);

    // Update performance benchmarks
    this.updatePerformanceBenchmark(`api_${endpoint}`, responseTime);
  }

  /**
   * Record API availability
   */
  public recordAPIAvailability(statusCode: number): void {
    const available = statusCode < 500;
    this.recordSLI('api_availability', statusCode, available);
  }

  /**
   * Record operation success/failure
   */
  public recordOperationResult(operation: string, success: boolean, duration?: number): void {
    // Record success rate
    this.recordSLI(`${operation}_success`, success ? 1 : 0, success);

    // Record duration if provided
    if (duration !== undefined) {
      this.updatePerformanceBenchmark(operation, duration);
    }

    // Record overall error rate
    this.recordSLI('error_rate', success ? 1 : 0, success);
  }

  /**
   * Record cache performance
   */
  public recordCacheHit(hit: boolean): void {
    this.recordSLI('cache_hit_rate', hit ? 1 : 0, hit);
  }

  /**
   * Record database query latency
   */
  public recordDatabaseQuery(queryTime: number): void {
    this.recordSLI('database_query_latency', queryTime, queryTime < 100);
  }

  /**
   * Record security event
   */
  public recordSecurityEvent(threatDetected: boolean, accuracy: boolean): void {
    this.recordSLI('security_threat_detection', accuracy ? 1 : 0, accuracy);
  }

  /**
   * Calculate SLI for an SLO
   */
  private calculateSLI(slo: SLOStatus): void {
    if (slo.measurements.length === 0) {
      return;
    }

    const successfulMeasurements = slo.measurements.filter(m => m.success);
    const totalMeasurements = slo.measurements.length;

    // Calculate SLI as success rate percentage
    slo.currentSLI = (successfulMeasurements.length / totalMeasurements) * 100;

    // Calculate compliance percentage
    slo.compliance = Math.min(100, (slo.currentSLI / slo.target) * 100);

    // Calculate error budget remaining
    const errorBudgetUsed = Math.max(0, slo.target - slo.currentSLI);
    slo.errorBudgetRemaining = Math.max(0, slo.config.errorBudget - errorBudgetUsed);

    // Determine status
    if (slo.currentSLI >= slo.target) {
      slo.status = 'healthy';
    } else if (slo.currentSLI >= slo.config.alertThreshold) {
      slo.status = 'warning';
    } else {
      slo.status = 'critical';
    }

    // Generate recommendations
    slo.recommendations = this.generateSLORecommendations(slo);
  }

  /**
   * Update performance benchmark
   */
  private updatePerformanceBenchmark(operation: string, value: number): void {
    let benchmark = this.performanceBenchmarks.get(operation);
    
    if (!benchmark) {
      benchmark = {
        operation,
        p50: value,
        p95: value,
        p99: value,
        p99_9: value,
        mean: value,
        min: value,
        max: value,
        samples: 0,
        timestamp: Date.now(),
      };
    }

    // Update running statistics
    const newSamples = benchmark.samples + 1;
    benchmark.mean = (benchmark.mean * benchmark.samples + value) / newSamples;
    benchmark.min = Math.min(benchmark.min, value);
    benchmark.max = Math.max(benchmark.max, value);
    benchmark.samples = newSamples;
    benchmark.timestamp = Date.now();

    // Calculate percentiles (simplified - in production use proper percentile calculation)
    // For now, using approximation
    if (newSamples > 10) {
      benchmark.p50 = benchmark.mean * 0.8;
      benchmark.p95 = benchmark.mean * 1.5;
      benchmark.p99 = benchmark.mean * 2.0;
      benchmark.p99_9 = benchmark.mean * 3.0;
    }

    this.performanceBenchmarks.set(operation, benchmark);
  }

  /**
   * Check for SLO alerts
   */
  private checkSLOAlerts(sloName: string, slo: SLOStatus): void {
    if (slo.status === 'critical' || 
        (slo.status === 'warning' && slo.currentSLI < slo.config.alertThreshold)) {
      
      const now = Date.now();
      const alertHistory = this.alertHistory.get(sloName) || [];
      
      // Check if we recently sent an alert (avoid spam)
      const lastAlert = alertHistory[alertHistory.length - 1];
      const alertCooldown = 300000; // 5 minutes
      
      if (!lastAlert || now - lastAlert > alertCooldown) {
        this.triggerSLOAlert(sloName, slo);
        alertHistory.push(now);
        this.alertHistory.set(sloName, alertHistory);
        slo.lastAlert = now;
      }
    }
  }

  /**
   * Trigger SLO alert
   */
  private triggerSLOAlert(sloName: string, slo: SLOStatus): void {
    const alertMessage = `🚨 SLO VIOLATION: ${slo.config.name}
    Current: ${slo.currentSLI.toFixed(2)}%
    Target: ${slo.target}%
    Status: ${slo.status.toUpperCase()}
    Error Budget Remaining: ${slo.errorBudgetRemaining.toFixed(2)}%`;

    console.error(alertMessage);

    // In production, integrate with alerting systems:
    // - PagerDuty
    // - Slack/Teams notifications
    // - Email alerts
    // - SMS for critical issues
  }

  /**
   * Generate SLO recommendations
   */
  private generateSLORecommendations(slo: SLOStatus): string[] {
    const recommendations: string[] = [];

    if (slo.status === 'critical') {
      recommendations.push('IMMEDIATE ACTION REQUIRED: SLO is critically below target');
      
      if (slo.config.name.includes('latency')) {
        recommendations.push('Investigate slow database queries and optimize indexes');
        recommendations.push('Consider implementing additional caching layers');
        recommendations.push('Review and optimize API endpoints');
      }
      
      if (slo.config.name.includes('availability')) {
        recommendations.push('Check for service outages and infrastructure issues');
        recommendations.push('Review error logs for recurring issues');
        recommendations.push('Consider implementing circuit breakers');
      }
      
      if (slo.config.name.includes('error_rate')) {
        recommendations.push('Review recent deployments for introduced bugs');
        recommendations.push('Implement additional input validation');
        recommendations.push('Enhance error handling and recovery');
      }
    }

    if (slo.status === 'warning') {
      recommendations.push('Monitor closely - SLO approaching critical threshold');
      recommendations.push('Consider preventive measures to improve performance');
    }

    if (slo.errorBudgetRemaining < slo.config.errorBudget * 0.2) {
      recommendations.push('Error budget nearly exhausted - reduce deployment frequency');
      recommendations.push('Focus on reliability improvements over new features');
    }

    return recommendations;
  }

  /**
   * Get SLO status
   */
  public getSLOStatus(sloName?: string): SLOStatus | SLOStatus[] {
    if (sloName) {
      const slo = this.slos.get(sloName);
      if (!slo) {
        throw new Error(`SLO not found: ${sloName}`);
      }
      return slo;
    }

    return Array.from(this.slos.values());
  }

  /**
   * Get performance benchmarks
   */
  public getPerformanceBenchmarks(operation?: string): PerformanceBenchmark | PerformanceBenchmark[] {
    if (operation) {
      const benchmark = this.performanceBenchmarks.get(operation);
      if (!benchmark) {
        throw new Error(`Performance benchmark not found: ${operation}`);
      }
      return benchmark;
    }

    return Array.from(this.performanceBenchmarks.values());
  }

  /**
   * Generate SLA compliance report
   */
  public generateComplianceReport(period: string = '24h'): SLAComplianceReport {
    const slos = Array.from(this.slos.values());
    const totalCompliance = slos.reduce((sum, slo) => sum + slo.compliance, 0) / slos.length;
    const avgErrorBudgetUtilization = slos.reduce((sum, slo) => {
      return sum + (slo.config.errorBudget - slo.errorBudgetRemaining);
    }, 0) / slos.length;

    // Analyze trends
    const improvingSLOs = slos.filter(slo => slo.currentSLI > slo.target).map(slo => slo.config.name);
    const degradingSLOs = slos.filter(slo => slo.status === 'warning' || slo.status === 'critical').map(slo => slo.config.name);

    // Calculate incident metrics
    const criticalIncidents = slos.filter(slo => slo.status === 'critical').length;
    const totalIncidents = slos.filter(slo => slo.status !== 'healthy').length;

    const recommendations = this.generateGlobalRecommendations(slos);

    return {
      period,
      slos,
      overallCompliance: totalCompliance,
      errorBudgetUtilization: avgErrorBudgetUtilization,
      incidents: {
        total: totalIncidents,
        critical: criticalIncidents,
        resolved: 0, // Would track resolved incidents
        mttr: 0, // Would calculate mean time to recovery
      },
      recommendations,
      trends: {
        improvingSLOs,
        degradingSLOs,
      },
    };
  }

  /**
   * Generate global recommendations
   */
  private generateGlobalRecommendations(slos: SLOStatus[]): string[] {
    const recommendations: string[] = [];
    const criticalSLOs = slos.filter(slo => slo.status === 'critical');
    const warningSLOs = slos.filter(slo => slo.status === 'warning');

    if (criticalSLOs.length > 0) {
      recommendations.push(`${criticalSLOs.length} SLOs are in critical state - immediate action required`);
    }

    if (warningSLOs.length > 0) {
      recommendations.push(`${warningSLOs.length} SLOs are in warning state - monitor closely`);
    }

    const avgErrorBudget = slos.reduce((sum, slo) => sum + slo.errorBudgetRemaining, 0) / slos.length;
    if (avgErrorBudget < 20) {
      recommendations.push('Error budgets are low across multiple SLOs - focus on reliability');
    }

    const latencySLOs = slos.filter(slo => slo.config.tags.includes('latency'));
    const poorLatencySLOs = latencySLOs.filter(slo => slo.status !== 'healthy');
    if (poorLatencySLOs.length > 0) {
      recommendations.push('Multiple latency SLOs are degraded - investigate performance bottlenecks');
    }

    return recommendations;
  }

  /**
   * Start background monitoring tasks
   */
  private startBackgroundTasks(): void {
    // Calculate SLIs every minute
    setInterval(() => {
      this.slos.forEach(slo => this.calculateSLI(slo));
    }, 60000);

    // Generate hourly compliance reports
    setInterval(() => {
      const report = this.generateComplianceReport('1h');
      console.log('📊 Hourly SLA Compliance Report:', {
        overallCompliance: report.overallCompliance.toFixed(2) + '%',
        criticalIncidents: report.incidents.critical,
        degradingSLOs: report.trends.degradingSLOs.length,
      });
    }, 3600000);

    // Clean old measurements every hour
    setInterval(() => {
      this.cleanupOldMeasurements();
    }, 3600000);

    // Generate daily performance benchmarks report
    setInterval(() => {
      this.generatePerformanceReport();
    }, 86400000);
  }

  /**
   * Cleanup old measurements outside time window
   */
  private cleanupOldMeasurements(): void {
    this.slos.forEach(slo => {
      const cutoff = Date.now() - slo.config.timeWindow;
      slo.measurements = slo.measurements.filter(m => m.timestamp > cutoff);
    });

    // Clean old alert history
    this.alertHistory.forEach((history, sloName) => {
      const cutoff = Date.now() - 86400000; // Keep 24 hours
      const recentAlerts = history.filter(timestamp => timestamp > cutoff);
      this.alertHistory.set(sloName, recentAlerts);
    });
  }

  /**
   * Generate performance report
   */
  private generatePerformanceReport(): void {
    const benchmarks = Array.from(this.performanceBenchmarks.values());
    const slowOperations = benchmarks
      .filter(b => b.p95 > 1000) // Operations with P95 > 1 second
      .sort((a, b) => b.p95 - a.p95)
      .slice(0, 5);

    console.log('🏃 Daily Performance Report:', {
      totalOperations: benchmarks.length,
      slowOperations: slowOperations.map(op => ({
        operation: op.operation,
        p95: op.p95,
        samples: op.samples,
      })),
    });
  }

  /**
   * Get comprehensive system health
   */
  public getSystemHealth(): {
    overallHealth: 'healthy' | 'degraded' | 'critical';
    sloCompliance: number;
    criticalIssues: string[];
    recommendations: string[];
    performanceSummary: any;
  } {
    const slos = Array.from(this.slos.values());
    const criticalSLOs = slos.filter(slo => slo.status === 'critical');
    const warningSLOs = slos.filter(slo => slo.status === 'warning');
    
    let overallHealth: 'healthy' | 'degraded' | 'critical';
    if (criticalSLOs.length > 0) {
      overallHealth = 'critical';
    } else if (warningSLOs.length > 0) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'healthy';
    }

    const overallCompliance = slos.reduce((sum, slo) => sum + slo.compliance, 0) / slos.length;
    
    const criticalIssues = criticalSLOs.map(slo => 
      `${slo.config.name}: ${slo.currentSLI.toFixed(1)}% (target: ${slo.target}%)`
    );

    const recommendations = this.generateGlobalRecommendations(slos);

    const benchmarks = Array.from(this.performanceBenchmarks.values());
    const performanceSummary = {
      avgP95: benchmarks.reduce((sum, b) => sum + b.p95, 0) / benchmarks.length,
      slowestOperation: benchmarks.reduce((slowest, current) => 
        current.p95 > slowest.p95 ? current : slowest, benchmarks[0] || { operation: 'none', p95: 0 }
      ).operation,
    };

    return {
      overallHealth,
      sloCompliance: overallCompliance,
      criticalIssues,
      recommendations,
      performanceSummary,
    };
  }
}

// Export singleton instance
export const sloManager = new SLOManager();