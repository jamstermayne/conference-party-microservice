"use strict";
/**
 * Shared Middleware Exports
 * Central export point for all middleware components
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patterns = exports.ErrorHandlingMiddleware = exports.RateLimitingMiddleware = exports.MetricsMiddleware = exports.TracingMiddleware = exports.AuthMiddleware = void 0;
exports.createMiddlewareStack = createMiddlewareStack;
const auth_1 = __importDefault(require("./auth"));
exports.AuthMiddleware = auth_1.default;
const tracing_1 = __importDefault(require("./tracing"));
exports.TracingMiddleware = tracing_1.default;
const metrics_1 = __importDefault(require("./metrics"));
exports.MetricsMiddleware = metrics_1.default;
const rate_limiting_1 = __importDefault(require("./rate-limiting"));
exports.RateLimitingMiddleware = rate_limiting_1.default;
const error_handling_1 = __importDefault(require("./error-handling"));
exports.ErrorHandlingMiddleware = error_handling_1.default;
/**
 * Create pre-configured middleware stack for microservices
 */
function createMiddlewareStack(serviceName) {
    const auth = auth_1.default;
    const tracing = new tracing_1.default(serviceName);
    const metrics = new metrics_1.default(serviceName);
    const rateLimit = new rate_limiting_1.default();
    const errorHandler = new error_handling_1.default(serviceName);
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
            createError: error_handling_1.default.createError,
            createValidationError: error_handling_1.default.createValidationError,
            createAuthError: error_handling_1.default.createAuthError,
            createAuthorizationError: error_handling_1.default.createAuthorizationError,
            createNotFoundError: error_handling_1.default.createNotFoundError,
            createConflictError: error_handling_1.default.createConflictError,
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
exports.patterns = {
    /**
     * Basic API service (public endpoints with rate limiting)
     */
    apiService: (serviceName) => {
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
    authenticatedService: (serviceName) => {
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
    adminService: (serviceName) => {
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
    externalApiService: (serviceName, validApiKeys) => {
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
exports.default = createMiddlewareStack;
//# sourceMappingURL=index.js.map