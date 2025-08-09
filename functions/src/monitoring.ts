/**
 * MONITORING & ALERTING MODULE
 * Real-time system health monitoring with intelligent alerting
 */

import {getFirestore} from "firebase-admin/firestore";

interface MetricData {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

interface Alert {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private metrics: Map<string, MetricData[]> = new Map();
  private alerts: Alert[] = [];
  private thresholds: Map<string, { warning: number; critical: number }> = new Map();
  private aggregationWindow = 60000; // 1 minute

  constructor() {
    this.setupDefaultThresholds();
  }

  /**
   * Setup default monitoring thresholds
   */
  private setupDefaultThresholds() {
    // API response time thresholds (ms)
    this.thresholds.set("api.response_time", {
      warning: 2000,
      critical: 5000,
    });

    // Error rate thresholds (percentage)
    this.thresholds.set("api.error_rate", {
      warning: 5,
      critical: 10,
    });

    // Rate limit hit rate (percentage)
    this.thresholds.set("security.rate_limit_hits", {
      warning: 20,
      critical: 50,
    });

    // Memory usage (MB)
    this.thresholds.set("system.memory_usage", {
      warning: 400,
      critical: 480,
    });

    // Database query time (ms)
    this.thresholds.set("database.query_time", {
      warning: 1000,
      critical: 3000,
    });
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>) {
    const metric: MetricData = {
      value,
      timestamp: Date.now(),
      labels,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Keep only metrics within aggregation window
    const cutoff = Date.now() - this.aggregationWindow * 5; // Keep 5 windows
    this.metrics.set(
      name,
      metrics.filter((m) => m.timestamp > cutoff)
    );

    // Check thresholds
    this.checkThresholds(name, value);
  }

  /**
   * Record API request
   */
  recordApiRequest(endpoint: string, method: string, responseTime: number, statusCode: number) {
    // Record response time
    this.recordMetric("api.response_time", responseTime, {
      endpoint,
      method,
      status: String(statusCode),
    });

    // Record request count
    this.recordMetric("api.request_count", 1, {
      endpoint,
      method,
    });

    // Record errors
    if (statusCode >= 400) {
      this.recordMetric("api.error_count", 1, {
        endpoint,
        method,
        status: String(statusCode),
      });
    }

    // Calculate and record error rate
    this.calculateErrorRate();
  }

  /**
   * Record security event
   */
  recordSecurityEvent(type: "rate_limit" | "invalid_origin" | "xss_attempt" | "sql_injection", metadata?: any) {
    this.recordMetric(`security.${type}`, 1, metadata);

    // Create alert for critical security events
    if (type === "sql_injection" || type === "xss_attempt") {
      this.createAlert("critical", `Security Threat Detected: ${type}`, {
        type,
        ...metadata,
      });
    }
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate() {
    const requests = this.getRecentMetrics("api.request_count", this.aggregationWindow);
    const errors = this.getRecentMetrics("api.error_count", this.aggregationWindow);

    if (requests.length > 0) {
      const totalRequests = requests.reduce((sum, m) => sum + m.value, 0);
      const totalErrors = errors.reduce((sum, m) => sum + m.value, 0);

      if (totalRequests > 0) {
        const errorRate = (totalErrors / totalRequests) * 100;
        this.recordMetric("api.error_rate", errorRate);
      }
    }
  }

  /**
   * Check thresholds and create alerts
   */
  private checkThresholds(metricName: string, value: number) {
    const threshold = this.thresholds.get(metricName);
    if (!threshold) return;

    if (value >= threshold.critical) {
      this.createAlert("critical", `${metricName} exceeded critical threshold`, {
        metric: metricName,
        value,
        threshold: threshold.critical,
      });
    } else if (value >= threshold.warning) {
      this.createAlert("warning", `${metricName} exceeded warning threshold`, {
        metric: metricName,
        value,
        threshold: threshold.warning,
      });
    }
  }

  /**
   * Create an alert
   */
  private createAlert(severity: Alert["severity"], message: string, metadata?: any) {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      title: message,
      message: this.formatAlertMessage(severity, message, metadata),
      timestamp: Date.now(),
      resolved: false,
      metadata,
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Trigger alert handlers
    this.handleAlert(alert);

    // Store critical alerts in Firestore
    if (severity === "critical" || severity === "error") {
      this.storeAlert(alert);
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(severity: string, message: string, metadata?: any): string {
    let formatted = `[${severity.toUpperCase()}] ${message}`;

    if (metadata) {
      formatted += "\nDetails: " + JSON.stringify(metadata, null, 2);
    }

    return formatted;
  }

  /**
   * Handle alert (send notifications, etc.)
   */
  private async handleAlert(alert: Alert) {
    console.error(`Alert: ${alert.severity} - ${alert.message}`);

    // Critical alerts should trigger immediate action
    if (alert.severity === "critical") {
      // Log to external monitoring service
      // Send email/SMS notification
      // Trigger PagerDuty incident
      console.error("CRITICAL ALERT - Immediate action required!");
    }
  }

  /**
   * Store alert in Firestore
   */
  private async storeAlert(alert: Alert) {
    try {
      const db = getFirestore();
      await db.collection("system_alerts").add({
        ...alert,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to store alert:", error);
    }
  }

  /**
   * Get recent metrics
   */
  private getRecentMetrics(name: string, windowMs: number): MetricData[] {
    const metricsData = this.metrics.get(name) || [];
    const cutoff = Date.now() - windowMs;
    return metricsData.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(metricName: string, windowMs?: number): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = windowMs ?
      this.getRecentMetrics(metricName, windowMs) :
      this.metrics.get(metricName) || [];

    if (metrics.length === 0) return null;

    const values = metrics.map((m) => m.value).sort((a, b) => a - b);
    const sum = values.reduce((s, v) => s + v, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedValues: number[], p: number): number {
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy";
    metrics: Record<string, any>;
    activeAlerts: Alert[];
    recommendations: string[];
    } {
    const recentAlerts = this.alerts.filter(
      (a) => !a.resolved && (Date.now() - a.timestamp < 300000) // Last 5 minutes
    );

    const criticalAlerts = recentAlerts.filter((a) => a.severity === "critical");
    const errorAlerts = recentAlerts.filter((a) => a.severity === "error");

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (criticalAlerts.length > 0) {
      status = "unhealthy";
    } else if (errorAlerts.length > 0 || recentAlerts.length > 5) {
      status = "degraded";
    }

    // Get key metrics
    const metrics: Record<string, any> = {};
    const metricNames = [
      "api.response_time",
      "api.error_rate",
      "api.request_count",
      "security.rate_limit_hits",
    ];

    for (const name of metricNames) {
      const summary = this.getMetricsSummary(name, 60000);
      if (summary) {
        metrics[name] = summary;
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, recentAlerts);

    return {
      status,
      metrics,
      activeAlerts: recentAlerts,
      recommendations,
    };
  }

  /**
   * Generate recommendations based on metrics and alerts
   */
  private generateRecommendations(metrics: Record<string, any>, alerts: Alert[]): string[] {
    const recommendations: string[] = [];

    // Check response time
    if (metrics["api.response_time"]?.p95 > 3000) {
      recommendations.push("API response times are high. Consider optimizing database queries or adding caching.");
    }

    // Check error rate
    if (metrics["api.error_rate"]?.avg > 5) {
      recommendations.push("High error rate detected. Review recent deployments and error logs.");
    }

    // Check rate limiting
    if (metrics["security.rate_limit_hits"]?.sum > 100) {
      recommendations.push("High rate limit hits. Consider adjusting rate limits or investigating potential abuse.");
    }

    // Check for security alerts
    const securityAlerts = alerts.filter((a) => a.metadata?.type?.includes("security"));
    if (securityAlerts.length > 0) {
      recommendations.push("Security threats detected. Review security alerts and consider strengthening defenses.");
    }

    return recommendations;
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): Record<string, any> {
    const exported: Record<string, any> = {};

    for (const [name] of this.metrics.entries()) {
      const summary = this.getMetricsSummary(name);
      if (summary) {
        exported[name] = summary;
      }
    }

    return {
      timestamp: Date.now(),
      metrics: exported,
      alerts: this.alerts.slice(-10), // Last 10 alerts
      health: this.getHealthStatus(),
    };
  }

  /**
   * Clear old data
   */
  cleanup() {
    const cutoff = Date.now() - 3600000; // 1 hour

    // Clean metrics
    for (const [name, metricsData] of this.metrics.entries()) {
      this.metrics.set(
        name,
        metricsData.filter((m) => m.timestamp > cutoff)
      );
    }

    // Resolve old alerts
    this.alerts = this.alerts.map((alert) => {
      if (!alert.resolved && Date.now() - alert.timestamp > 3600000) {
        return {...alert, resolved: true};
      }
      return alert;
    });
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

// Periodic cleanup
setInterval(() => {
  monitoring.cleanup();
}, 300000); // Every 5 minutes
