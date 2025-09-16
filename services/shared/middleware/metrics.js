"use strict";
/**
 * Metrics Collection Middleware
 * Prometheus metrics for performance monitoring and alerting
 */
Object.defineProperty(exports, "__esModule", { value: true });
const prom_client_1 = require("prom-client");
class MetricsMiddleware {
    serviceName;
    httpRequestDuration;
    httpRequestTotal;
    httpRequestErrors;
    activeConnections;
    databaseQueries;
    cacheHits;
    authAttempts;
    constructor(serviceName) {
        this.serviceName = serviceName;
        this.initializeMetrics();
        // Collect default Node.js metrics
        (0, prom_client_1.collectDefaultMetrics)({ prefix: `${serviceName}_` });
    }
    /**
     * Initialize Prometheus metrics
     */
    initializeMetrics() {
        // HTTP request duration histogram
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: `${this.serviceName}_http_request_duration_seconds`,
            help: 'HTTP request duration in seconds',
            labelNames: ['method', 'route', 'status_code', 'service'],
            buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
        });
        // HTTP request counter
        this.httpRequestTotal = new prom_client_1.Counter({
            name: `${this.serviceName}_http_requests_total`,
            help: 'Total HTTP requests',
            labelNames: ['method', 'route', 'status_code', 'service'],
        });
        // HTTP error counter
        this.httpRequestErrors = new prom_client_1.Counter({
            name: `${this.serviceName}_http_request_errors_total`,
            help: 'Total HTTP request errors',
            labelNames: ['method', 'route', 'error_type', 'service'],
        });
        // Active connections gauge
        this.activeConnections = new prom_client_1.Gauge({
            name: `${this.serviceName}_active_connections`,
            help: 'Number of active connections',
            labelNames: ['service'],
        });
        // Database queries counter
        this.databaseQueries = new prom_client_1.Counter({
            name: `${this.serviceName}_database_queries_total`,
            help: 'Total database queries',
            labelNames: ['operation', 'collection', 'status', 'service'],
        });
        // Cache hits/misses counter
        this.cacheHits = new prom_client_1.Counter({
            name: `${this.serviceName}_cache_operations_total`,
            help: 'Total cache operations',
            labelNames: ['operation', 'hit', 'service'],
        });
        // Authentication attempts counter
        this.authAttempts = new prom_client_1.Counter({
            name: `${this.serviceName}_auth_attempts_total`,
            help: 'Total authentication attempts',
            labelNames: ['method', 'status', 'service'],
        });
    }
    /**
     * Main metrics middleware
     */
    middleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            req.startTime = startTime;
            // Increment active connections
            this.activeConnections.inc({ service: this.serviceName });
            // Override res.end to capture metrics
            const originalEnd = res.end;
            res.end = (chunk, encoding) => {
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
    recordDatabaseQuery(operation, collection, success) {
        this.databaseQueries
            .labels(operation, collection, success ? 'success' : 'error', this.serviceName)
            .inc();
    }
    /**
     * Record cache operation metrics
     */
    recordCacheOperation(operation, hit) {
        this.cacheHits
            .labels(operation, hit ? 'hit' : 'miss', this.serviceName)
            .inc();
    }
    /**
     * Record authentication attempt
     */
    recordAuthAttempt(method, success) {
        this.authAttempts
            .labels(method, success ? 'success' : 'failure', this.serviceName)
            .inc();
    }
    /**
     * Create custom counter metric
     */
    createCounter(name, help, labelNames = []) {
        return new prom_client_1.Counter({
            name: `${this.serviceName}_${name}`,
            help,
            labelNames: [...labelNames, 'service'],
        });
    }
    /**
     * Create custom histogram metric
     */
    createHistogram(name, help, labelNames = [], buckets) {
        return new prom_client_1.Histogram({
            name: `${this.serviceName}_${name}`,
            help,
            labelNames: [...labelNames, 'service'],
            buckets,
        });
    }
    /**
     * Create custom gauge metric
     */
    createGauge(name, help, labelNames = []) {
        return new prom_client_1.Gauge({
            name: `${this.serviceName}_${name}`,
            help,
            labelNames: [...labelNames, 'service'],
        });
    }
    /**
     * Expose metrics endpoint
     */
    metricsEndpoint() {
        return async (req, res) => {
            try {
                res.set('Content-Type', prom_client_1.register.contentType);
                res.end(await prom_client_1.register.metrics());
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to collect metrics' });
            }
        };
    }
    /**
     * Health check with basic metrics
     */
    healthEndpoint() {
        return async (req, res) => {
            try {
                const metrics = await prom_client_1.register.getSingleMetricAsString(`${this.serviceName}_http_requests_total`);
                res.json({
                    status: 'healthy',
                    service: this.serviceName,
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    metrics_available: true,
                });
            }
            catch (error) {
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
        prom_client_1.register.clear();
    }
}
exports.default = MetricsMiddleware;
//# sourceMappingURL=metrics.js.map