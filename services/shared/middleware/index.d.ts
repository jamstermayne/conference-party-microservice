/**
 * Shared Middleware Exports
 * Central export point for all middleware components
 */
import AuthMiddleware from './auth';
import TracingMiddleware from './tracing';
import MetricsMiddleware from './metrics';
import RateLimitingMiddleware from './rate-limiting';
import ErrorHandlingMiddleware from './error-handling';
export { AuthMiddleware, TracingMiddleware, MetricsMiddleware, RateLimitingMiddleware, ErrorHandlingMiddleware, };
export type { AuthenticatedRequest, User } from './auth';
export type { TracedRequest } from './tracing';
export type { MetricsRequest } from './metrics';
export type { RateLimitedRequest, RateLimitConfig, RateLimitInfo } from './rate-limiting';
export type { AppError, ErrorRequest } from './error-handling';
/**
 * Create pre-configured middleware stack for microservices
 */
export declare function createMiddlewareStack(serviceName: string): {
    auth: {
        optional: any;
        required: any;
        requireRole: any;
        requirePermission: any;
        requireOwnership: any;
        requireApiKey: any;
    };
    tracing: (req: import("./tracing").TracedRequest, res: import("express").Response, next: import("express").NextFunction) => void;
    metrics: (req: import("./metrics").MetricsRequest, res: import("express").Response, next: import("express").NextFunction) => void;
    rateLimit: {
        global: any;
        perIP: any;
        perUser: any;
        strict: any;
        perApiKey: any;
        roleBasedLimiting: (req: import("./rate-limiting").RateLimitedRequest, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
        whitelist: any;
    };
    error: {
        handler: (error: import("./error-handling").AppError, req: import("./error-handling").ErrorRequest, res: import("express").Response, next: import("express").NextFunction) => void;
        notFound: (req: import("express").Request, res: import("express").Response) => void;
        asyncHandler: any;
    };
    utils: {
        createError: typeof ErrorHandlingMiddleware.createError;
        createValidationError: typeof ErrorHandlingMiddleware.createValidationError;
        createAuthError: typeof ErrorHandlingMiddleware.createAuthError;
        createAuthorizationError: typeof ErrorHandlingMiddleware.createAuthorizationError;
        createNotFoundError: typeof ErrorHandlingMiddleware.createNotFoundError;
        createConflictError: typeof ErrorHandlingMiddleware.createConflictError;
    };
    endpoints: {
        metrics: (req: import("express").Request, res: import("express").Response) => Promise<void>;
        health: (req: import("express").Request, res: import("express").Response) => Promise<void>;
    };
    instances: {
        auth: any;
        tracing: TracingMiddleware;
        metrics: MetricsMiddleware;
        rateLimit: RateLimitingMiddleware;
        errorHandler: ErrorHandlingMiddleware;
    };
};
/**
 * Quick setup for common microservice patterns
 */
export declare const patterns: {
    /**
     * Basic API service (public endpoints with rate limiting)
     */
    apiService: (serviceName: string) => {
        before: any[];
        after: (((error: import("./error-handling").AppError, req: import("./error-handling").ErrorRequest, res: import("express").Response, next: import("express").NextFunction) => void) | ((req: import("express").Request, res: import("express").Response) => void))[];
        endpoints: {
            metrics: (req: import("express").Request, res: import("express").Response) => Promise<void>;
            health: (req: import("express").Request, res: import("express").Response) => Promise<void>;
        };
    };
    /**
     * Authenticated service (requires valid JWT)
     */
    authenticatedService: (serviceName: string) => {
        before: any[];
        after: (((error: import("./error-handling").AppError, req: import("./error-handling").ErrorRequest, res: import("express").Response, next: import("express").NextFunction) => void) | ((req: import("express").Request, res: import("express").Response) => void))[];
        endpoints: {
            metrics: (req: import("express").Request, res: import("express").Response) => Promise<void>;
            health: (req: import("express").Request, res: import("express").Response) => Promise<void>;
        };
    };
    /**
     * Admin service (requires admin role)
     */
    adminService: (serviceName: string) => {
        before: any[];
        after: (((error: import("./error-handling").AppError, req: import("./error-handling").ErrorRequest, res: import("express").Response, next: import("express").NextFunction) => void) | ((req: import("express").Request, res: import("express").Response) => void))[];
        endpoints: {
            metrics: (req: import("express").Request, res: import("express").Response) => Promise<void>;
            health: (req: import("express").Request, res: import("express").Response) => Promise<void>;
        };
    };
    /**
     * External API service (API key authentication)
     */
    externalApiService: (serviceName: string, validApiKeys?: string[]) => {
        before: any[];
        after: (((error: import("./error-handling").AppError, req: import("./error-handling").ErrorRequest, res: import("express").Response, next: import("express").NextFunction) => void) | ((req: import("express").Request, res: import("express").Response) => void))[];
        endpoints: {
            metrics: (req: import("express").Request, res: import("express").Response) => Promise<void>;
            health: (req: import("express").Request, res: import("express").Response) => Promise<void>;
        };
    };
};
/**
 * Default export for convenience
 */
export default createMiddlewareStack;
