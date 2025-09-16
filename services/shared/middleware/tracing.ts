/**
 * Distributed Tracing Middleware
 * OpenTelemetry integration for cross-service request tracking
 */

import { Request, Response, NextFunction } from 'express';
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { getNodeSDK } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

interface TracedRequest extends Request {
  traceId?: string;
  spanId?: string;
  correlationId?: string;
}

class TracingMiddleware {
  private tracer: any;
  private serviceName: string;
  private sdk?: NodeSDK;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.initializeTracing();
    this.tracer = trace.getTracer(serviceName, '1.0.0');
  }

  /**
   * Initialize OpenTelemetry SDK with Jaeger exporter
   */
  private initializeTracing() {
    const jaegerExporter = new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
    });

    this.sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      }),
      traceExporter: jaegerExporter,
      instrumentations: [getNodeSDK()],
    });

    this.sdk.start();
  }

  /**
   * Main tracing middleware
   */
  middleware() {
    return (req: TracedRequest, res: Response, next: NextFunction) => {
      const spanName = `${req.method} ${req.route?.path || req.path}`;
      
      const span = this.tracer.startSpan(spanName, {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': req.method,
          'http.url': req.url,
          'http.route': req.route?.path || req.path,
          'http.user_agent': req.get('User-Agent'),
          'service.name': this.serviceName,
        },
      });

      // Extract trace context from headers
      const traceId = req.headers['x-trace-id'] as string || span.spanContext().traceId;
      const parentSpanId = req.headers['x-parent-span-id'] as string;
      const correlationId = req.headers['x-correlation-id'] as string || this.generateCorrelationId();

      // Add trace info to request
      req.traceId = traceId;
      req.spanId = span.spanContext().spanId;
      req.correlationId = correlationId;

      // Add trace headers to response
      res.setHeader('X-Trace-Id', traceId);
      res.setHeader('X-Span-Id', span.spanContext().spanId);
      res.setHeader('X-Correlation-Id', correlationId);

      // Add user info if available
      if ((req as any).user) {
        span.setAttributes({
          'user.id': (req as any).user.id,
          'user.email': (req as any).user.email,
        });
      }

      // Capture request timing
      const startTime = Date.now();

      // Override res.end to capture response data
      const originalEnd = res.end;
      res.end = function(this: Response, chunk?: any, encoding?: any) {
        const duration = Date.now() - startTime;
        
        span.setAttributes({
          'http.status_code': res.statusCode,
          'http.response_time_ms': duration,
        });

        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP ${res.statusCode}`,
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        span.end();
        originalEnd.call(this, chunk, encoding);
      };

      // Handle errors
      res.on('error', (error) => {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        span.end();
      });

      // Continue with active span context
      context.with(trace.setSpan(context.active(), span), () => {
        next();
      });
    };
  }

  /**
   * Create child span for database operations
   */
  createDatabaseSpan(operation: string, table?: string) {
    return this.tracer.startSpan(`db.${operation}`, {
      kind: SpanKind.CLIENT,
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
  createHttpSpan(method: string, url: string) {
    return this.tracer.startSpan(`http.${method.toLowerCase()}`, {
      kind: SpanKind.CLIENT,
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
  private generateCorrelationId(): string {
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current trace context
   */
  getCurrentContext() {
    const span = trace.getActiveSpan();
    if (!span) return null;

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

export default TracingMiddleware;
export { TracedRequest };
