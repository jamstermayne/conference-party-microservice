/**
 * Rate Limiting Middleware
 * Distributed rate limiting with Redis backend
 */
import { Request, Response, NextFunction } from 'express';
interface RateLimitedRequest extends Request {
    ip: string;
    user?: {
        id: string;
        email: string;
        role?: string;
    };
}
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: RateLimitedRequest) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    message?: string;
    headers?: boolean;
}
interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: Date;
    retryAfter?: number;
}
declare class RateLimitingMiddleware {
    private redis;
    private defaultConfig;
    constructor();
    /**
     * Create rate limiting middleware
     */
    create(config?: Partial<RateLimitConfig>): (req: RateLimitedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * Global rate limiting (all users)
     */
    global(maxRequests?: number, windowMs?: number): (req: RateLimitedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * Per-IP rate limiting
     */
    perIP(maxRequests?: number, windowMs?: number): (req: RateLimitedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * Per-user rate limiting (requires authentication)
     */
    perUser(maxRequests?: number, windowMs?: number): (req: RateLimitedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * Aggressive rate limiting for sensitive endpoints
     */
    strict(maxRequests?: number, windowMs?: number): (req: RateLimitedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * API key rate limiting
     */
    perApiKey(maxRequests?: number, windowMs?: number): (req: RateLimitedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * Dynamic rate limiting based on user role
     */
    roleBasedLimiting(): (req: RateLimitedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * Generate rate limiting key
     */
    private generateKey;
    /**
     * Reset rate limit for a specific key
     */
    reset(key: string): Promise<void>;
    /**
     * Get current rate limit status
     */
    getStatus(key: string, windowMs?: number): Promise<RateLimitInfo | null>;
    /**
     * Whitelist certain IPs or users
     */
    createWhitelist(whitelist: string[]): (req: RateLimitedRequest, res: Response, next: NextFunction) => void | Promise<Response<any, Record<string, any>>>;
}
export default RateLimitingMiddleware;
export { RateLimitedRequest, RateLimitConfig, RateLimitInfo };
