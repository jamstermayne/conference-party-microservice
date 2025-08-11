/**
 * SECURITY MODULE - Enhanced API Protection
 * Implements comprehensive security measures for production resilience
 */
import { Request, Response } from "express";
export declare const SECURITY_CONFIG: {
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    RATE_LIMIT_MAX_REQUESTS_PER_IP: number;
    MAX_BODY_SIZE: number;
    MAX_URL_LENGTH: number;
    MAX_HEADER_SIZE: number;
    ALLOWED_ORIGINS: string[];
    FORBIDDEN_PATTERNS: RegExp[];
    CSRF_TOKEN_LENGTH: number;
    CSRF_TOKEN_EXPIRY: number;
};
/**
 * Rate limiting middleware
 */
export declare function rateLimit(req: Request, res: Response): boolean;
/**
 * Validate and sanitize input
 */
export declare function sanitizeInput(input: any): any;
/**
 * Validate request headers
 */
export declare function validateHeaders(req: Request): boolean;
/**
 * CORS validation with origin whitelist
 */
export declare function validateOrigin(origin: string | undefined): boolean;
/**
 * Generate CSRF token
 */
export declare function generateCSRFToken(): string;
export declare function validateCSRFToken(token: string): boolean;
/**
 * Store CSRF token
 */
export declare function storeCSRFToken(token: string): void;
/**
 * Security headers middleware
 */
export declare function setSecurityHeaders(res: Response): void;
/**
 * Validate event data structure
 */
export declare function validateEventData(data: any): {
    isValid: boolean;
    errors: string[];
};
/**
 * Anonymize sensitive data
 */
export declare function anonymizeData(data: any): any;
//# sourceMappingURL=security.d.ts.map