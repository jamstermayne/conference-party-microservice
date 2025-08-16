import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Simple in-memory cache for API responses
const cache = new Map<string, { data: any; timestamp: number; etag: string }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache for better performance
const MAX_CACHE_SIZE = 100; // Limit cache size to prevent memory issues

// Generate simple ETag for cache validation
function generateETag(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `"${hash.toString(16)}"`;
}

// Performance monitoring middleware
export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const path = req.path;
  
  // Log request start
  logger.debug(`Request started`, { method: req.method, path });
  
  // Override res.json to log response time
  const originalJson = res.json.bind(res);
  res.json = function(data: any) {
    const duration = Date.now() - start;
    logger.performance(path, req.method, duration, res.statusCode);
    
    // Add performance headers
    res.set('X-Response-Time', `${duration}ms`);
    res.set('X-Served-By', 'conference-party-api');
    
    // Warn on slow requests
    if (duration > 2000) {
      logger.warn(`Slow API response`, { path, duration, method: req.method });
    }
    
    return originalJson(data);
  };
  
  next();
}

// Cache middleware for GET requests
export function cacheMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }
  
  const key = `${req.path}:${JSON.stringify(req.query)}`;
  const cached = cache.get(key);
  
  // Check if client has cached version (ETag validation)
  const clientETag = req.headers['if-none-match'];
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug(`Cache hit`, { path: req.path, age: Math.floor((Date.now() - cached.timestamp) / 1000) });
    
    // If client has same version, return 304 Not Modified
    if (clientETag && clientETag === cached.etag) {
      res.set('ETag', cached.etag);
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', 'public, max-age=300'); // 5 min browser cache
      return res.sendStatus(304);
    }
    
    // Send cached data with cache headers
    res.set('X-Cache', 'HIT');
    res.set('X-Cache-Age', `${Math.floor((Date.now() - cached.timestamp) / 1000)}s`);
    res.set('ETag', cached.etag);
    res.set('Cache-Control', 'public, max-age=300');
    return res.json(cached.data);
  }
  
  logger.debug(`Cache miss`, { path: req.path });
  
  // Override res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = function(data: any) {
    // Only cache successful responses
    if (res.statusCode === 200) {
      const etag = generateETag(data);
      cache.set(key, { data, timestamp: Date.now(), etag });
      
      // Clean old cache entries if we exceed max size
      if (cache.size > MAX_CACHE_SIZE) {
        const now = Date.now();
        let cleaned = 0;
        for (const [k, v] of cache.entries()) {
          if (now - v.timestamp > CACHE_TTL) {
            cache.delete(k);
            cleaned++;
          }
          if (cleaned >= 10) break; // Clean 10 at a time
        }
        
        // If still too large, remove oldest entries
        if (cache.size > MAX_CACHE_SIZE) {
          const entries = Array.from(cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .slice(0, 10);
          entries.forEach(([k]) => cache.delete(k));
        }
      }
      
      res.set('ETag', etag);
      res.set('Cache-Control', 'public, max-age=300');
    }
    
    res.set('X-Cache', 'MISS');
    return originalJson(data);
  };
  
  next();
}

// Add CORS preflight caching
export function corsCache(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Max-Age', '86400'); // 24 hours
    res.set('Cache-Control', 'public, max-age=86400');
    res.sendStatus(204);
    return;
  }
  next();
}