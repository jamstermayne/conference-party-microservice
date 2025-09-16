/**
 * Metrics Collection Middleware
 * Prometheus metrics for performance monitoring and alerting
 */
import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram, Gauge } from 'prom-client';
interface MetricsRequest extends Request {
    startTime?: number;
    user?: {
        id: string;
        email: string;
        role?: string;
    };
}
declare class MetricsMiddleware {
    private serviceName;
    private httpRequestDuration;
    private httpRequestTotal;
    private httpRequestErrors;
    private activeConnections;
    private databaseQueries;
    private cacheHits;
    private authAttempts;
    constructor(serviceName: string);
    /**
     * Initialize Prometheus metrics
     */
    private initializeMetrics;
    /**
     * Main metrics middleware
     */
    middleware(): (req: MetricsRequest, res: Response, next: NextFunction) => void;
    /**
     * Record database operation metrics
     */
    recordDatabaseQuery(operation: string, collection: string, success: boolean): void;
    /**
     * Record cache operation metrics
     */
    recordCacheOperation(operation: 'get' | 'set' | 'delete', hit: boolean): void;
    /**
     * Record authentication attempt
     */
    recordAuthAttempt(method: 'jwt' | 'api_key' | 'oauth', success: boolean): void;
    /**
     * Create custom counter metric
     */
    createCounter(name: string, help: string, labelNames?: string[]): Counter<string>;
    /**
     * Create custom histogram metric
     */
    createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram<string>;
    /**
     * Create custom gauge metric
     */
    createGauge(name: string, help: string, labelNames?: string[]): Gauge<string>;
    /**
     * Expose metrics endpoint
     */
    metricsEndpoint(): (req: Request, res: Response) => Promise<void>;
    /**
     * Health check with basic metrics
     */
    healthEndpoint(): (req: Request, res: Response) => Promise<void>;
    /**
     * Clear all metrics (useful for testing)
     */
    clear(): void;
}
export default MetricsMiddleware;
export { MetricsRequest };
