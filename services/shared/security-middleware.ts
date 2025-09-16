import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Rate limiting configuration
export const createRateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs, // Time window
    max, // Max requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Default rate limiter (100 requests per 15 minutes)
export const defaultRateLimiter = createRateLimiter();

// Strict rate limiter for auth endpoints (20 requests per 15 minutes)
export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 20);

// API rate limiter (200 requests per 15 minutes)
export const apiRateLimiter = createRateLimiter(15 * 60 * 1000, 200);

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.firebase.com", "https://*.firebaseio.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'https://conference-party-app.web.app',
      'https://conference-party-app--preview-*.web.app',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173'
    ];

    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);

    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  maxAge: 86400 // Cache preflight for 24 hours
};

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove any potential XSS attempts from query params
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = sanitizeInput(req.query[key] as string);
    }
  }

  // Sanitize body if it exists
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  next();
};

// Sanitize input string
function sanitizeInput(input: string): string {
  // Remove script tags and other dangerous patterns
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Recursively sanitize object
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

// Authentication check middleware
export const requireAuth = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid authentication token'
    });
  }
  next();
};

// API key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key'
    });
  }

  // In production, validate against stored API keys
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (!validApiKeys.includes(apiKey as string)) {
    return res.status(403).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Error handler middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err.stack);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'An error occurred processing your request',
    ...(isDevelopment && { stack: err.stack })
  });
};

// Export all middleware as a bundle
export const securityMiddleware = {
  rateLimiter: defaultRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  securityHeaders,
  corsOptions,
  validateInput,
  requireAuth,
  validateApiKey,
  requestLogger,
  errorHandler
};