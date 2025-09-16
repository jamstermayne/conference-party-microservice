/**
 * Rate Limiting Middleware
 * Distributed rate limiting with Redis backend
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

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

class RateLimitingMiddleware {
  private redis: any;
  private defaultConfig: RateLimitConfig;

  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.defaultConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      message: 'Too many requests, please try again later',
      headers: true,
    };
  }

  /**
   * Create rate limiting middleware
   */
  create(config: Partial<RateLimitConfig> = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };

    return async (req: RateLimitedRequest, res: Response, next: NextFunction) => {
      try {
        const key = this.generateKey(req, finalConfig);
        const window = Math.floor(Date.now() / finalConfig.windowMs);
        const redisKey = `rate_limit:${key}:${window}`;

        // Get current count
        const current = await this.redis.get(redisKey);
        const count = current ? parseInt(current) : 0;

        // Calculate rate limit info
        const remaining = Math.max(0, finalConfig.maxRequests - count - 1);
        const reset = new Date((window + 1) * finalConfig.windowMs);
        const rateLimitInfo: RateLimitInfo = {
          limit: finalConfig.maxRequests,
          remaining,
          reset,
        };

        // Set headers
        if (finalConfig.headers) {
          res.set({
            'X-RateLimit-Limit': finalConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.getTime().toString(),
          });
        }

        // Check if limit exceeded
        if (count >= finalConfig.maxRequests) {
          rateLimitInfo.retryAfter = Math.ceil((reset.getTime() - Date.now()) / 1000);
          
          if (finalConfig.headers) {
            res.set('Retry-After', rateLimitInfo.retryAfter.toString());
          }

          return res.status(429).json({
            error: finalConfig.message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: rateLimitInfo.retryAfter,
            limit: rateLimitInfo.limit,
            reset: rateLimitInfo.reset,
          });
        }

        // Increment counter
        await this.redis.incr(redisKey);
        await this.redis.expire(redisKey, Math.ceil(finalConfig.windowMs / 1000));

        // Attach rate limit info to request
        (req as any).rateLimit = rateLimitInfo;

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        // Fail open - don't block requests if Redis is down
        next();
      }
    };
  }

  /**
   * Global rate limiting (all users)
   */
  global(maxRequests: number = 1000, windowMs: number = 60 * 1000) {
    return this.create({
      maxRequests,
      windowMs,
      keyGenerator: () => 'global',
      message: 'Service temporarily unavailable due to high load',
    });
  }

  /**
   * Per-IP rate limiting
   */
  perIP(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    return this.create({
      maxRequests,
      windowMs,
      keyGenerator: (req) => `ip:${req.ip}`,
      message: 'Too many requests from this IP address',
    });
  }

  /**
   * Per-user rate limiting (requires authentication)
   */
  perUser(maxRequests: number = 1000, windowMs: number = 60 * 60 * 1000) {
    return this.create({
      maxRequests,
      windowMs,
      keyGenerator: (req) => req.user ? `user:${req.user.id}` : `ip:${req.ip}`,
      message: 'Too many requests for this user account',
    });
  }

  /**
   * Aggressive rate limiting for sensitive endpoints
   */
  strict(maxRequests: number = 5, windowMs: number = 60 * 1000) {
    return this.create({
      maxRequests,
      windowMs,
      keyGenerator: (req) => req.user ? `user:${req.user.id}` : `ip:${req.ip}`,
      message: 'Rate limit exceeded for sensitive operation',
    });
  }

  /**
   * API key rate limiting
   */
  perApiKey(maxRequests: number = 10000, windowMs: number = 60 * 60 * 1000) {
    return this.create({
      maxRequests,
      windowMs,
      keyGenerator: (req) => {
        const apiKey = req.headers['x-api-key'] as string;
        return apiKey ? `api_key:${apiKey}` : `ip:${req.ip}`;
      },
      message: 'API rate limit exceeded',
    });
  }

  /**
   * Dynamic rate limiting based on user role
   */
  roleBasedLimiting() {
    return async (req: RateLimitedRequest, res: Response, next: NextFunction) => {
      const user = req.user;
      let config: Partial<RateLimitConfig>;

      if (!user) {
        // Anonymous users - very strict
        config = {
          maxRequests: 10,
          windowMs: 60 * 1000, // 1 minute
          keyGenerator: (req) => `ip:${req.ip}`,
        };
      } else {
        switch (user.role) {
          case 'admin':
            // Admins get highest limits
            config = {
              maxRequests: 10000,
              windowMs: 60 * 60 * 1000, // 1 hour
            };
            break;
          case 'premium':
            // Premium users get higher limits
            config = {
              maxRequests: 1000,
              windowMs: 60 * 60 * 1000, // 1 hour
            };
            break;
          default:
            // Regular users
            config = {
              maxRequests: 100,
              windowMs: 60 * 60 * 1000, // 1 hour
            };
        }
        config.keyGenerator = (req) => `user:${user.id}`;
      }

      return this.create(config)(req, res, next);
    };
  }

  /**
   * Generate rate limiting key
   */
  private generateKey(req: RateLimitedRequest, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(req);
    }

    // Default key generation strategy
    if (req.user) {
      return `user:${req.user.id}`;
    }
    return `ip:${req.ip}`;
  }

  /**
   * Reset rate limit for a specific key
   */
  async reset(key: string) {
    const pattern = `rate_limit:${key}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }

  /**
   * Get current rate limit status
   */
  async getStatus(key: string, windowMs: number = 15 * 60 * 1000): Promise<RateLimitInfo | null> {
    try {
      const window = Math.floor(Date.now() / windowMs);
      const redisKey = `rate_limit:${key}:${window}`;
      const count = await this.redis.get(redisKey);

      if (!count) return null;

      return {
        limit: 100, // This would come from the actual config
        remaining: Math.max(0, 100 - parseInt(count)),
        reset: new Date((window + 1) * windowMs),
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return null;
    }
  }

  /**
   * Whitelist certain IPs or users
   */
  createWhitelist(whitelist: string[]) {
    return (req: RateLimitedRequest, res: Response, next: NextFunction) => {
      const ip = req.ip;
      const userId = req.user?.id;

      // Check if IP or user is whitelisted
      if (whitelist.includes(ip) || (userId && whitelist.includes(userId))) {
        return next();
      }

      // Apply normal rate limiting
      return this.perIP()(req, res, next);
    };
  }
}

export default RateLimitingMiddleware;
export { RateLimitedRequest, RateLimitConfig, RateLimitInfo };
