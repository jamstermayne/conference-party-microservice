/**
 * Shared Middleware Exports
 * Central export point for all middleware components
 */

import AuthMiddleware from './auth';
import TracingMiddleware from './tracing';
import MetricsMiddleware from './metrics';
import RateLimitingMiddleware from './rate-limiting';
import ErrorHandlingMiddleware from './error-handling';

// Re-export all middleware classes
export {
  AuthMiddleware,
  TracingMiddleware,
  MetricsMiddleware,
  RateLimitingMiddleware,
  ErrorHandlingMiddleware,
};

// Re-export types
export type { AuthenticatedRequest, User } from './auth';
export type { TracedRequest } from './tracing';
export type { MetricsRequest } from './metrics';
export type { RateLimitedRequest, RateLimitConfig, RateLimitInfo } from './rate-limiting';
export type { AppError, ErrorRequest } from './error-handling';

/**
 * Create pre-configured middleware stack for microservices
 */
export function createMiddlewareStack(serviceName: string) {
  const auth = AuthMiddleware;
  const tracing = new TracingMiddleware(serviceName);
  const metrics = new MetricsMiddleware(serviceName);
  const rateLimit = new RateLimitingMiddleware();
  const errorHandler = new ErrorHandlingMiddleware(serviceName);

  return {
    // Authentication & Authorization
    auth: {
      optional: auth.optional(),
      required: auth.required(),
      requireRole: auth.requireRole.bind(auth),
      requirePermission: auth.requirePermission.bind(auth),
      requireOwnership: auth.requireOwnership.bind(auth),
      requireApiKey: auth.requireApiKey.bind(auth),
    },

    // Observability
    tracing: tracing.middleware(),
    metrics: metrics.middleware(),

    // Performance & Security
    rateLimit: {
      global: rateLimit.global.bind(rateLimit),
      perIP: rateLimit.perIP.bind(rateLimit),
      perUser: rateLimit.perUser.bind(rateLimit),
      strict: rateLimit.strict.bind(rateLimit),
      perApiKey: rateLimit.perApiKey.bind(rateLimit),
      roleBasedLimiting: rateLimit.roleBasedLimiting(),
      whitelist: rateLimit.createWhitelist.bind(rateLimit),
    },

    // Error Handling
    error: {
      handler: errorHandler.handler(),
      notFound: errorHandler.notFoundHandler(),
      asyncHandler: errorHandler.asyncHandler.bind(errorHandler),
    },

    // Utility functions
    utils: {
      createError: ErrorHandlingMiddleware.createError,
      createValidationError: ErrorHandlingMiddleware.createValidationError,
      createAuthError: ErrorHandlingMiddleware.createAuthError,
      createAuthorizationError: ErrorHandlingMiddleware.createAuthorizationError,
      createNotFoundError: ErrorHandlingMiddleware.createNotFoundError,
      createConflictError: ErrorHandlingMiddleware.createConflictError,
    },

    // Metrics endpoints
    endpoints: {
      metrics: metrics.metricsEndpoint(),
      health: metrics.healthEndpoint(),
    },

    // Instance references for advanced usage
    instances: {
      auth,
      tracing,
      metrics,
      rateLimit,
      errorHandler,
    },
  };
}

/**
 * Quick setup for common microservice patterns
 */
export const patterns = {
  /**
   * Basic API service (public endpoints with rate limiting)
   */
  apiService: (serviceName: string) => {
    const middleware = createMiddlewareStack(serviceName);
    return {
      before: [
        middleware.tracing,
        middleware.metrics,
        middleware.rateLimit.perIP(100, 15 * 60 * 1000), // 100 req/15min per IP
        middleware.auth.optional,
      ],
      after: [
        middleware.error.notFound,
        middleware.error.handler,
      ],
      endpoints: middleware.endpoints,
    };
  },

  /**
   * Authenticated service (requires valid JWT)
   */
  authenticatedService: (serviceName: string) => {
    const middleware = createMiddlewareStack(serviceName);
    return {
      before: [
        middleware.tracing,
        middleware.metrics,
        middleware.rateLimit.perUser(1000, 60 * 60 * 1000), // 1000 req/hour per user
        middleware.auth.required(),
      ],
      after: [
        middleware.error.notFound,
        middleware.error.handler,
      ],
      endpoints: middleware.endpoints,
    };
  },

  /**
   * Admin service (requires admin role)
   */
  adminService: (serviceName: string) => {
    const middleware = createMiddlewareStack(serviceName);
    return {
      before: [
        middleware.tracing,
        middleware.metrics,
        middleware.rateLimit.strict(10, 60 * 1000), // 10 req/min
        middleware.auth.required(),
        middleware.auth.requireRole('admin'),
      ],
      after: [
        middleware.error.notFound,
        middleware.error.handler,
      ],
      endpoints: middleware.endpoints,
    };
  },

  /**
   * External API service (API key authentication)
   */
  externalApiService: (serviceName: string, validApiKeys?: string[]) => {
    const middleware = createMiddlewareStack(serviceName);
    return {
      before: [
        middleware.tracing,
        middleware.metrics,
        middleware.rateLimit.perApiKey(10000, 60 * 60 * 1000), // 10k req/hour per API key
        middleware.auth.requireApiKey(validApiKeys),
      ],
      after: [
        middleware.error.notFound,
        middleware.error.handler,
      ],
      endpoints: middleware.endpoints,
    };
  },
};

/**
 * Default export for convenience
 */
export default createMiddlewareStack;
