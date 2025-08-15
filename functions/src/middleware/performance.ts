import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Simple in-memory cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

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
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug(`Cache hit`, { path: req.path, age: Math.floor((Date.now() - cached.timestamp) / 1000) });
    res.set('X-Cache', 'HIT');
    res.set('X-Cache-Age', `${Math.floor((Date.now() - cached.timestamp) / 1000)}s`);
    return res.json(cached.data);
  }
  
  logger.debug(`Cache miss`, { path: req.path });
  
  // Override res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = function(data: any) {
    // Only cache successful responses
    if (res.statusCode === 200) {
      cache.set(key, { data, timestamp: Date.now() });
      
      // Clean old cache entries
      if (cache.size > 100) {
        const now = Date.now();
        for (const [k, v] of cache.entries()) {
          if (now - v.timestamp > CACHE_TTL) {
            cache.delete(k);
          }
        }
      }
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