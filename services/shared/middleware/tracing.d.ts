/**
 * Distributed Tracing Middleware
 * OpenTelemetry integration for cross-service request tracking
 */
import { Request, Response, NextFunction } from 'express';
interface TracedRequest extends Request {
    traceId?: string;
    spanId?: string;
    correlationId?: string;
}
declare class TracingMiddleware {
    private tracer;
    private serviceName;
    private sdk?;
    constructor(serviceName: string);
    /**
     * Initialize OpenTelemetry SDK with Jaeger exporter
     */
    private initializeTracing;
    /**
     * Main tracing middleware
     */
    middleware(): (req: TracedRequest, res: Response, next: NextFunction) => void;
    /**
     * Create child span for database operations
     */
    createDatabaseSpan(operation: string, table?: string): any;
    /**
     * Create child span for external API calls
     */
    createHttpSpan(method: string, url: string): any;
    /**
     * Generate correlation ID for request tracking
     */
    private generateCorrelationId;
    /**
     * Get current trace context
     */
    getCurrentContext(): {
        traceId: string;
        spanId: string;
    };
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
export default TracingMiddleware;
export { TracedRequest };
