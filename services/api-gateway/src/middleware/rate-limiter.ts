/**
 * Rate Limiter Middleware
 * Prevent API abuse
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: config.rateLimit.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: config.rateLimit.message,
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
    });
  },
});