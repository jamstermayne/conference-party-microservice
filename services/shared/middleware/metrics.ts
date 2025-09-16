/**
 * Metrics Collection Middleware
 * Prometheus metrics for performance monitoring and alerting
 */

import { Request, Response, NextFunction } from 'express';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

interface MetricsRequest extends Request {
  startTime?: number;
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

class MetricsMiddleware {
  private serviceName: string;
  private httpRequestDuration: Histogram<string>;
  private httpRequestTotal: Counter<string>;
  private httpRequestErrors: Counter<string>;
  private activeConnections: Gauge<string>;
  private databaseQueries: Counter<string>;
  private cacheHits: Counter<string>;
  private authAttempts: Counter<string>;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.initializeMetrics();
    
    // Collect default Node.js metrics
    collectDefaultMetrics({ prefix: `${serviceName}_` });
  }

  /**
   * Initialize Prometheus metrics
   */
  private initializeMetrics() {
    // HTTP request duration histogram
    this.httpRequestDuration = new Histogram({
      name: `${this.serviceName}_http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
    });

    // HTTP request counter
    this.httpRequestTotal = new Counter({
      name: `${this.serviceName}_http_requests_total`,
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service'],
    });

    // HTTP error counter
    this.httpRequestErrors = new Counter({
      name: `${this.serviceName}_http_request_errors_total`,
      help: 'Total HTTP request errors',
      labelNames: ['method', 'route', 'error_type', 'service'],
    });

    // Active connections gauge
    this.activeConnections = new Gauge({
      name: `${this.serviceName}_active_connections`,
      help: 'Number of active connections',
      labelNames: ['service'],
    });

    // Database queries counter
    this.databaseQueries = new Counter({
      name: `${this.serviceName}_database_queries_total`,
      help: 'Total database queries',
      labelNames: ['operation', 'collection', 'status', 'service'],
    });

    // Cache hits/misses counter
    this.cacheHits = new Counter({
      name: `${this.serviceName}_cache_operations_total`,
      help: 'Total cache operations',
      labelNames: ['operation', 'hit', 'service'],
    });

    // Authentication attempts counter
    this.authAttempts = new Counter({
      name: `${this.serviceName}_auth_attempts_total`,
      help: 'Total authentication attempts',
      labelNames: ['method', 'status', 'service'],
    });
  }

  /**
   * Main metrics middleware
   */
  middleware() {
    return (req: MetricsRequest, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      req.startTime = startTime;

      // Increment active connections
      this.activeConnections.inc({ service: this.serviceName });

      // Override res.end to capture metrics
      const originalEnd = res.end;
      res.end = (chunk?: any, encoding?: any) => {
        const duration = (Date.now() - startTime) / 1000;
        const route = req.route?.path || req.path;
        const statusCode = res.statusCode.toString();

        // Record request duration
        this.httpRequestDuration
          .labels(req.method, route, statusCode, this.serviceName)
          .observe(duration);

        // Increment request counter
        this.httpRequestTotal
          .labels(req.method, route, statusCode, this.serviceName)
          .inc();

        // Record errors
        if (res.statusCode >= 400) {
          const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
          this.httpRequestErrors
            .labels(req.method, route, errorType, this.serviceName)
            .inc();
        }

        // Decrement active connections
        this.activeConnections.dec({ service: this.serviceName });

        originalEnd.call(res, chunk, encoding);
      };

      next();
    };
  }

  /**
   * Record database operation metrics
   */
  recordDatabaseQuery(operation: string, collection: string, success: boolean) {
    this.databaseQueries
      .labels(operation, collection, success ? 'success' : 'error', this.serviceName)
      .inc();
  }

  /**
   * Record cache operation metrics
   */
  recordCacheOperation(operation: 'get' | 'set' | 'delete', hit: boolean) {
    this.cacheHits
      .labels(operation, hit ? 'hit' : 'miss', this.serviceName)
      .inc();
  }

  /**
   * Record authentication attempt
   */
  recordAuthAttempt(method: 'jwt' | 'api_key' | 'oauth', success: boolean) {
    this.authAttempts
      .labels(method, success ? 'success' : 'failure', this.serviceName)
      .inc();
  }

  /**
   * Create custom counter metric
   */
  createCounter(name: string, help: string, labelNames: string[] = []) {
    return new Counter({
      name: `${this.serviceName}_${name}`,
      help,
      labelNames: [...labelNames, 'service'],
    });
  }

  /**
   * Create custom histogram metric
   */
  createHistogram(name: string, help: string, labelNames: string[] = [], buckets?: number[]) {
    return new Histogram({
      name: `${this.serviceName}_${name}`,
      help,
      labelNames: [...labelNames, 'service'],
      buckets,
    });
  }

  /**
   * Create custom gauge metric
   */
  createGauge(name: string, help: string, labelNames: string[] = []) {
    return new Gauge({
      name: `${this.serviceName}_${name}`,
      help,
      labelNames: [...labelNames, 'service'],
    });
  }

  /**
   * Expose metrics endpoint
   */
  metricsEndpoint() {
    return async (req: Request, res: Response) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (error) {
        res.status(500).json({ error: 'Failed to collect metrics' });
      }
    };
  }

  /**
   * Health check with basic metrics
   */
  healthEndpoint() {
    return async (req: Request, res: Response) => {
      try {
        const metrics = await register.getSingleMetricAsString(`${this.serviceName}_http_requests_total`);
        
        res.json({
          status: 'healthy',
          service: this.serviceName,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          metrics_available: true,
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          service: this.serviceName,
          error: 'Metrics collection failed',
        });
      }
    };
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear() {
    register.clear();
  }
}

export default MetricsMiddleware;
export { MetricsRequest };
