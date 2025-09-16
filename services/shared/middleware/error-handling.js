"use strict";
/**
 * Error Handling Middleware
 * Centralized error handling with logging and response formatting
 */
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = require("joi");
class ErrorHandlingMiddleware {
    serviceName;
    isDevelopment;
    constructor(serviceName) {
        this.serviceName = serviceName;
        this.isDevelopment = process.env.NODE_ENV === 'development';
    }
    /**
     * Main error handling middleware (must be last middleware)
     */
    handler() {
        return (error, req, res, next) => {
            // If response already sent, delegate to default Express error handler
            if (res.headersSent) {
                return next(error);
            }
            const errorInfo = this.parseError(error);
            const errorResponse = this.formatErrorResponse(errorInfo, req);
            // Log error details
            this.logError(error, req, errorInfo);
            // Send error response
            res.status(errorInfo.statusCode).json(errorResponse);
        };
    }
    /**
     * 404 Not Found handler
     */
    notFoundHandler() {
        return (req, res) => {
            const error = {
                error: 'Not Found',
                message: `Route ${req.method} ${req.originalUrl} not found`,
                code: 'ROUTE_NOT_FOUND',
                statusCode: 404,
                timestamp: new Date().toISOString(),
                service: this.serviceName,
                traceId: req.traceId,
            };
            res.status(404).json(error);
        };
    }
    /**
     * Async error wrapper for route handlers
     */
    asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    /**
     * Parse different types of errors
     */
    parseError(error) {
        let statusCode = 500;
        let code = 'INTERNAL_SERVER_ERROR';
        let message = 'An unexpected error occurred';
        let details = undefined;
        // Custom application errors
        if (error.statusCode && error.isOperational) {
            statusCode = error.statusCode;
            code = error.code || 'APPLICATION_ERROR';
            message = error.message;
            details = error.details;
        }
        // Validation errors (Joi)
        else if (error instanceof joi_1.ValidationError || error.name === 'ValidationError') {
            statusCode = 400;
            code = 'VALIDATION_ERROR';
            message = 'Invalid input data';
            details = this.parseValidationError(error);
        }
        // JWT errors
        else if (error.name === 'JsonWebTokenError') {
            statusCode = 401;
            code = 'JWT_INVALID';
            message = 'Invalid authentication token';
        }
        else if (error.name === 'TokenExpiredError') {
            statusCode = 401;
            code = 'JWT_EXPIRED';
            message = 'Authentication token has expired';
        }
        // Mongoose/MongoDB errors
        else if (error.name === 'MongoError' || error.name === 'MongooseError') {
            statusCode = 500;
            code = 'DATABASE_ERROR';
            message = 'Database operation failed';
        }
        // Firestore errors
        else if (error.code && error.code.startsWith('firestore/')) {
            statusCode = this.mapFirestoreError(error.code);
            code = 'FIRESTORE_ERROR';
            message = 'Database operation failed';
        }
        // Rate limiting errors
        else if (error.code === 'RATE_LIMIT_EXCEEDED') {
            statusCode = 429;
            code = 'RATE_LIMIT_EXCEEDED';
            message = error.message || 'Too many requests';
        }
        // Network/timeout errors
        else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            statusCode = 502;
            code = 'SERVICE_UNAVAILABLE';
            message = 'External service unavailable';
        }
        else if (error.code === 'ETIMEDOUT') {
            statusCode = 504;
            code = 'REQUEST_TIMEOUT';
            message = 'Request timed out';
        }
        // Generic errors
        else if (error.message) {
            message = error.message;
        }
        return {
            statusCode,
            code,
            message,
            details,
            originalError: error,
        };
    }
    /**
     * Format error response
     */
    formatErrorResponse(errorInfo, req) {
        const baseResponse = {
            error: errorInfo.message,
            code: errorInfo.code,
            statusCode: errorInfo.statusCode,
            timestamp: new Date().toISOString(),
            service: this.serviceName,
            traceId: req.traceId,
            correlationId: req.correlationId,
        };
        // Add details if available
        if (errorInfo.details) {
            baseResponse.details = errorInfo.details;
        }
        // Add stack trace in development
        if (this.isDevelopment && errorInfo.originalError.stack) {
            baseResponse.stack = errorInfo.originalError.stack;
        }
        return baseResponse;
    }
    /**
     * Log error with context
     */
    logError(error, req, errorInfo) {
        const logData = {
            error: {
                message: error.message,
                stack: error.stack,
                code: errorInfo.code,
                statusCode: errorInfo.statusCode,
            },
            request: {
                method: req.method,
                url: req.originalUrl,
                headers: this.sanitizeHeaders(req.headers),
                body: this.sanitizeBody(req.body),
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            },
            context: {
                service: this.serviceName,
                traceId: req.traceId,
                correlationId: req.correlationId,
                userId: req.user?.id,
                timestamp: new Date().toISOString(),
            },
        };
        // Log based on severity
        if (errorInfo.statusCode >= 500) {
            console.error('[ERROR]', JSON.stringify(logData, null, 2));
        }
        else if (errorInfo.statusCode >= 400) {
            console.warn('[WARN]', JSON.stringify(logData, null, 2));
        }
        else {
            console.info('[INFO]', JSON.stringify(logData, null, 2));
        }
    }
    /**
     * Parse Joi validation errors
     */
    parseValidationError(error) {
        if (error.details && Array.isArray(error.details)) {
            return error.details.map((detail) => ({
                field: detail.path?.join('.') || 'unknown',
                message: detail.message,
                value: detail.context?.value,
            }));
        }
        return null;
    }
    /**
     * Map Firestore error codes to HTTP status codes
     */
    mapFirestoreError(code) {
        switch (code) {
            case 'firestore/permission-denied':
                return 403;
            case 'firestore/not-found':
                return 404;
            case 'firestore/already-exists':
                return 409;
            case 'firestore/invalid-argument':
                return 400;
            case 'firestore/unauthenticated':
                return 401;
            case 'firestore/resource-exhausted':
                return 429;
            default:
                return 500;
        }
    }
    /**
     * Sanitize request headers (remove sensitive data)
     */
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        delete sanitized.authorization;
        delete sanitized.cookie;
        delete sanitized['x-api-key'];
        return sanitized;
    }
    /**
     * Sanitize request body (remove sensitive data)
     */
    sanitizeBody(body) {
        if (!body || typeof body !== 'object')
            return body;
        const sanitized = { ...body };
        const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'key'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        return sanitized;
    }
    /**
     * Create custom application error
     */
    static createError(message, statusCode = 500, code, details) {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.code = code;
        error.isOperational = true;
        error.details = details;
        return error;
    }
    /**
     * Create validation error
     */
    static createValidationError(message, details) {
        return this.createError(message, 400, 'VALIDATION_ERROR', details);
    }
    /**
     * Create authentication error
     */
    static createAuthError(message = 'Authentication required') {
        return this.createError(message, 401, 'AUTHENTICATION_ERROR');
    }
    /**
     * Create authorization error
     */
    static createAuthorizationError(message = 'Insufficient permissions') {
        return this.createError(message, 403, 'AUTHORIZATION_ERROR');
    }
    /**
     * Create not found error
     */
    static createNotFoundError(resource = 'Resource') {
        return this.createError(`${resource} not found`, 404, 'NOT_FOUND');
    }
    /**
     * Create conflict error
     */
    static createConflictError(message) {
        return this.createError(message, 409, 'CONFLICT');
    }
}
exports.default = ErrorHandlingMiddleware;
//# sourceMappingURL=error-handling.js.map