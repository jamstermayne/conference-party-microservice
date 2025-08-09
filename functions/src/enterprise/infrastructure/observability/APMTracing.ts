/**
 * APPLICATION PERFORMANCE MONITORING & DISTRIBUTED TRACING
 * Enterprise-grade observability with OpenTelemetry integration
 */

import { trace, context, SpanStatusCode, SpanKind, Span } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

/**
 * Trace context for request correlation
 */
export interface TraceContext {
  traceId: string;
  spanId: string;
  correlationId: string;
  userId?: string;
  sessionId?: string;
  requestId: string;
}

/**
 * Performance metrics for SLA monitoring
 */
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
  timestamp: number;
  traceId: string;
}

/**
 * Advanced APM and Distributed Tracing System
 */
export class APMTracing {
  private static instance: APMTracing;
  private tracer: any;
  private provider: NodeTracerProvider;
  private metrics: PerformanceMetrics[] = [];
  private readonly serviceName = 'conference-party-microservice';

  constructor() {
    this.initializeTracing();
  }

  public static getInstance(): APMTracing {
    if (!APMTracing.instance) {
      APMTracing.instance = new APMTracing();
    }
    return APMTracing.instance;
  }

  /**
   * Initialize OpenTelemetry tracing
   */
  private initializeTracing(): void {
    // Create tracer provider with resource information
    this.provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: '3.1.0',
        [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'conference-platform',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'production',
      }),
    });

    // Configure Jaeger exporter for distributed tracing
    if (process.env.JAEGER_ENDPOINT) {
      const jaegerExporter = new JaegerExporter({
        endpoint: process.env.JAEGER_ENDPOINT,
        headers: {
          'x-service-name': this.serviceName,
        },
      });

      this.provider.addSpanProcessor(
        new BatchSpanProcessor(jaegerExporter, {
          maxQueueSize: 1000,
          scheduledDelayMillis: 1000,
        })
      );
    }

    // Register the provider globally
    this.provider.register();
    this.tracer = trace.getTracer(this.serviceName, '3.1.0');

    console.log(`🔍 APM Tracing initialized for ${this.serviceName}`);
  }

  /**
   * Start a new trace span
   */
  public startSpan(
    name: string, 
    options: {
      kind?: SpanKind;
      attributes?: Record<string, any>;
      parentContext?: any;
    } = {}
  ): Span {
    const span = this.tracer.startSpan(name, {
      kind: options.kind || SpanKind.INTERNAL,
      attributes: {
        'service.name': this.serviceName,
        'service.version': '3.1.0',
        ...options.attributes,
      },
    }, options.parentContext);

    return span;
  }

  /**
   * Trace HTTP requests with comprehensive metadata
   */
  public async traceHttpRequest<T>(
    operation: string,
    request: any,
    handler: (span: Span, traceContext: TraceContext) => Promise<T>
  ): Promise<T> {
    const span = this.startSpan(`HTTP ${request.method} ${operation}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': request.method,
        'http.url': request.url,
        'http.route': request.path,
        'http.user_agent': request.headers['user-agent'],
        'http.request_content_length': request.headers['content-length'],
        'user.id': request.user?.id,
        'session.id': request.sessionId,
      },
    });

    const startTime = Date.now();
    const traceContext: TraceContext = {
      traceId: span.spanContext().traceId,
      spanId: span.spanContext().spanId,
      correlationId: this.generateCorrelationId(),
      userId: request.user?.id,
      sessionId: request.sessionId,
      requestId: request.headers['x-request-id'] || this.generateRequestId(),
    };

    try {
      const result = await context.with(trace.setSpan(context.active(), span), async () => {
        return handler(span, traceContext);
      });

      const duration = Date.now() - startTime;
      
      // Record success metrics
      span.setAttributes({
        'http.status_code': 200,
        'operation.duration': duration,
        'operation.success': true,
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      
      this.recordMetrics({
        operation,
        duration,
        success: true,
        timestamp: startTime,
        traceId: traceContext.traceId,
      });

      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Record error metrics
      span.setAttributes({
        'http.status_code': error.statusCode || 500,
        'operation.duration': duration,
        'operation.success': false,
        'error.name': error.constructor.name,
        'error.message': error.message,
      });

      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });

      this.recordMetrics({
        operation,
        duration,
        success: false,
        error: error.message,
        timestamp: startTime,
        traceId: traceContext.traceId,
      });

      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Trace database operations
   */
  public async traceDbOperation<T>(
    operation: string,
    collection: string,
    query: any,
    handler: (span: Span) => Promise<T>
  ): Promise<T> {
    const span = this.startSpan(`DB ${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'firestore',
        'db.operation': operation,
        'db.collection.name': collection,
        'db.statement': JSON.stringify(query),
      },
    });

    const startTime = Date.now();

    try {
      const result = await context.with(trace.setSpan(context.active(), span), async () => {
        return handler(span);
      });

      const duration = Date.now() - startTime;
      span.setAttributes({
        'db.operation.duration': duration,
        'db.operation.success': true,
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      span.setAttributes({
        'db.operation.duration': duration,
        'db.operation.success': false,
        'error.name': error.constructor.name,
        'error.message': error.message,
      });

      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });

      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Trace external API calls
   */
  public async traceExternalCall<T>(
    service: string,
    operation: string,
    url: string,
    handler: (span: Span) => Promise<T>
  ): Promise<T> {
    const span = this.startSpan(`External ${service} ${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': 'GET', // Default, override in handler
        'http.url': url,
        'external.service': service,
        'external.operation': operation,
      },
    });

    try {
      const result = await context.with(trace.setSpan(context.active(), span), async () => {
        return handler(span);
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return result;

    } catch (error: any) {
      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Create custom span for business operations
   */
  public async traceOperation<T>(
    name: string,
    attributes: Record<string, any> = {},
    handler: (span: Span) => Promise<T>
  ): Promise<T> {
    const span = this.startSpan(name, {
      attributes: {
        'operation.type': 'business_logic',
        ...attributes,
      },
    });

    try {
      const result = await context.with(trace.setSpan(context.active(), span), async () => {
        return handler(span);
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return result;

    } catch (error: any) {
      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log slow operations (> 2 seconds)
    if (metrics.duration > 2000) {
      console.warn(`🐌 Slow operation detected: ${metrics.operation} took ${metrics.duration}ms`, {
        traceId: metrics.traceId,
        error: metrics.error,
      });
    }
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(timeWindow: number = 3600000): any {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < timeWindow);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
      };
    }

    const successful = recentMetrics.filter(m => m.success);
    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    return {
      totalRequests: recentMetrics.length,
      successRate: (successful.length / recentMetrics.length) * 100,
      averageResponseTime: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length,
      p95ResponseTime: durations[p95Index] || 0,
      p99ResponseTime: durations[p99Index] || 0,
      errorRate: ((recentMetrics.length - successful.length) / recentMetrics.length) * 100,
      slowestOperations: recentMetrics
        .filter(m => m.duration > 1000)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5),
    };
  }

  /**
   * Get current trace context
   */
  public getCurrentTraceContext(): TraceContext | null {
    const activeSpan = trace.getActiveSpan();
    if (!activeSpan) {
      return null;
    }

    const spanContext = activeSpan.spanContext();
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      correlationId: this.generateCorrelationId(),
      requestId: this.generateRequestId(),
    };
  }

  /**
   * Generate correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Shutdown tracing gracefully
   */
  public async shutdown(): Promise<void> {
    await this.provider.shutdown();
    console.log('🔍 APM Tracing shut down gracefully');
  }
}

// Export singleton instance
export const apmTracing = APMTracing.getInstance();