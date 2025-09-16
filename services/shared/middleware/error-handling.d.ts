/**
 * Error Handling Middleware
 * Centralized error handling with logging and response formatting
 */
import { Request, Response, NextFunction } from 'express';
interface AppError extends Error {
    statusCode?: number;
    code?: string;
    isOperational?: boolean;
    details?: any;
}
interface ErrorRequest extends Request {
    traceId?: string;
    correlationId?: string;
    user?: {
        id: string;
        email: string;
    };
}
declare class ErrorHandlingMiddleware {
    private serviceName;
    private isDevelopment;
    constructor(serviceName: string);
    /**
     * Main error handling middleware (must be last middleware)
     */
    handler(): (error: AppError, req: ErrorRequest, res: Response, next: NextFunction) => void;
    /**
     * 404 Not Found handler
     */
    notFoundHandler(): (req: Request, res: Response) => void;
    /**
     * Async error wrapper for route handlers
     */
    asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Parse different types of errors
     */
    private parseError;
    /**
     * Format error response
     */
    private formatErrorResponse;
    /**
     * Log error with context
     */
    private logError;
    /**
     * Parse Joi validation errors
     */
    private parseValidationError;
    /**
     * Map Firestore error codes to HTTP status codes
     */
    private mapFirestoreError;
    /**
     * Sanitize request headers (remove sensitive data)
     */
    private sanitizeHeaders;
    /**
     * Sanitize request body (remove sensitive data)
     */
    private sanitizeBody;
    /**
     * Create custom application error
     */
    static createError(message: string, statusCode?: number, code?: string, details?: any): AppError;
    /**
     * Create validation error
     */
    static createValidationError(message: string, details?: any): AppError;
    /**
     * Create authentication error
     */
    static createAuthError(message?: string): AppError;
    /**
     * Create authorization error
     */
    static createAuthorizationError(message?: string): AppError;
    /**
     * Create not found error
     */
    static createNotFoundError(resource?: string): AppError;
    /**
     * Create conflict error
     */
    static createConflictError(message: string): AppError;
}
export default ErrorHandlingMiddleware;
export { AppError, ErrorRequest };
