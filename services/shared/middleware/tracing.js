"use strict";
/**
 * Distributed Tracing Middleware
 * OpenTelemetry integration for cross-service request tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@opentelemetry/api");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const sdk_node_1 = require("@opentelemetry/sdk-node");
const exporter_jaeger_1 = require("@opentelemetry/exporter-jaeger");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
class TracingMiddleware {
    tracer;
    serviceName;
    sdk;
    constructor(serviceName) {
        this.serviceName = serviceName;
        this.initializeTracing();
        this.tracer = api_1.trace.getTracer(serviceName, '1.0.0');
    }
    /**
     * Initialize OpenTelemetry SDK with Jaeger exporter
     */
    initializeTracing() {
        const jaegerExporter = new exporter_jaeger_1.JaegerExporter({
            endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
        });
        this.sdk = new sdk_node_1.NodeSDK({
            resource: new resources_1.Resource({
                [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: this.serviceName,
                [semantic_conventions_1.SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
                [semantic_conventions_1.SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
            }),
            traceExporter: jaegerExporter,
            instrumentations: [(0, auto_instrumentations_node_1.getNodeSDK)()],
        });
        this.sdk.start();
    }
    /**
     * Main tracing middleware
     */
    middleware() {
        return (req, res, next) => {
            const spanName = `${req.method} ${req.route?.path || req.path}`;
            const span = this.tracer.startSpan(spanName, {
                kind: api_1.SpanKind.SERVER,
                attributes: {
                    'http.method': req.method,
                    'http.url': req.url,
                    'http.route': req.route?.path || req.path,
                    'http.user_agent': req.get('User-Agent'),
                    'service.name': this.serviceName,
                },
            });
            // Extract trace context from headers
            const traceId = req.headers['x-trace-id'] || span.spanContext().traceId;
            const parentSpanId = req.headers['x-parent-span-id'];
            const correlationId = req.headers['x-correlation-id'] || this.generateCorrelationId();
            // Add trace info to request
            req.traceId = traceId;
            req.spanId = span.spanContext().spanId;
            req.correlationId = correlationId;
            // Add trace headers to response
            res.setHeader('X-Trace-Id', traceId);
            res.setHeader('X-Span-Id', span.spanContext().spanId);
            res.setHeader('X-Correlation-Id', correlationId);
            // Add user info if available
            if (req.user) {
                span.setAttributes({
                    'user.id': req.user.id,
                    'user.email': req.user.email,
                });
            }
            // Capture request timing
            const startTime = Date.now();
            // Override res.end to capture response data
            const originalEnd = res.end;
            res.end = function (chunk, encoding) {
                const duration = Date.now() - startTime;
                span.setAttributes({
                    'http.status_code': res.statusCode,
                    'http.response_time_ms': duration,
                });
                if (res.statusCode >= 400) {
                    span.setStatus({
                        code: api_1.SpanStatusCode.ERROR,
                        message: `HTTP ${res.statusCode}`,
                    });
                }
                else {
                    span.setStatus({ code: api_1.SpanStatusCode.OK });
                }
                span.end();
                originalEnd.call(this, chunk, encoding);
            };
            // Handle errors
            res.on('error', (error) => {
                span.recordException(error);
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: error.message,
                });
                span.end();
            });
            // Continue with active span context
            api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), () => {
                next();
            });
        };
    }
    /**
     * Create child span for database operations
     */
    createDatabaseSpan(operation, table) {
        return this.tracer.startSpan(`db.${operation}`, {
            kind: api_1.SpanKind.CLIENT,
            attributes: {
                'db.system': 'firestore',
                'db.operation': operation,
                'db.collection.name': table,
                'service.name': this.serviceName,
            },
        });
    }
    /**
     * Create child span for external API calls
     */
    createHttpSpan(method, url) {
        return this.tracer.startSpan(`http.${method.toLowerCase()}`, {
            kind: api_1.SpanKind.CLIENT,
            attributes: {
                'http.method': method,
                'http.url': url,
                'service.name': this.serviceName,
            },
        });
    }
    /**
     * Generate correlation ID for request tracking
     */
    generateCorrelationId() {
        return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get current trace context
     */
    getCurrentContext() {
        const span = api_1.trace.getActiveSpan();
        if (!span)
            return null;
        const spanContext = span.spanContext();
        return {
            traceId: spanContext.traceId,
            spanId: spanContext.spanId,
        };
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        if (this.sdk) {
            await this.sdk.shutdown();
        }
    }
}
exports.default = TracingMiddleware;
//# sourceMappingURL=tracing.js.map