/**
 * Routes Setup
 * Configure proxy routes to microservices
 */

import { Express, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ServiceRegistry } from '../services/service-registry';
import { CircuitBreaker } from '../services/circuit-breaker';
import { CacheManager } from '../services/cache-manager';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Setup all routes
 */
export function setupRoutes(
  app: Express,
  serviceRegistry: ServiceRegistry,
  circuitBreaker: CircuitBreaker,
  cacheManager: CacheManager
): void {
  // Setup proxy for each service
  for (const [name, serviceConfig] of Object.entries(config.services)) {
    setupServiceProxy(
      app,
      name,
      serviceConfig.prefix,
      serviceRegistry,
      circuitBreaker,
      cacheManager
    );
  }

  // Gateway info endpoint
  app.get('/api/gateway/info', (req: Request, res: Response) => {
    res.json({
      version: '1.0.0',
      services: serviceRegistry.getServices().map(s => ({
        name: s.name,
        status: s.status,
        lastCheck: s.lastCheck,
      })),
      circuits: Array.from(circuitBreaker.getAllStatuses().entries()).map(
        ([service, stats]) => ({
          service,
          state: stats.state,
          failures: stats.failures,
        })
      ),
      cache: cacheManager.getStats(),
    });
  });
}

/**
 * Setup proxy for a single service
 */
function setupServiceProxy(
  app: Express,
  serviceName: string,
  prefix: string,
  serviceRegistry: ServiceRegistry,
  circuitBreaker: CircuitBreaker,
  cacheManager: CacheManager
): void {
  // Create proxy middleware
  const proxy = createProxyMiddleware({
    target: 'http://placeholder', // Will be dynamically set
    changeOrigin: true,
    pathRewrite: {
      [`^${prefix}`]: '',
    },
    router: async (req) => {
      // Get service URL dynamically
      const serviceUrl = serviceRegistry.getServiceUrl(serviceName);
      if (!serviceUrl) {
        throw new Error(`Service ${serviceName} is not available`);
      }
      return serviceUrl;
    },
    onProxyReq: (proxyReq, req: any, res) => {
      // Add headers
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-Tenant-Id', req.user.tenantId || 'default');
      }

      // Add trace ID
      proxyReq.setHeader('X-Trace-Id', `gateway-${Date.now()}`);
    },
    onProxyRes: (proxyRes, req: any, res) => {
      // Log response
      logger.info('Proxy response', {
        service: serviceName,
        path: req.path,
        status: proxyRes.statusCode,
      });
    },
    onError: (err, req, res: any) => {
      logger.error('Proxy error', {
        service: serviceName,
        error: err.message,
      });

      res.status(503).json({
        error: 'Service unavailable',
        service: serviceName,
      });
    },
  });

  // Apply middleware chain
  app.use(
    prefix,
    // Authentication (skip for public paths)
    (req: Request, res: Response, next: NextFunction) => {
      const isPublicPath = config.auth.publicPaths.some(path =>
        req.path.startsWith(path)
      );

      if (isPublicPath) {
        return next();
      }

      return authenticate(req, res, next);
    },
    // Cache check
    (req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET') {
        const cacheKey = cacheManager.generateKey(
          serviceName,
          req.path,
          req.query
        );
        const cached = cacheManager.get(cacheKey);

        if (cached) {
          logger.info('Cache hit', { service: serviceName, path: req.path });
          return res.json(cached);
        }
      }

      // Store original send function
      const originalSend = res.send.bind(res);
      res.send = function(data: any) {
        // Cache successful GET responses
        if (req.method === 'GET' && res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            const cacheKey = cacheManager.generateKey(
              serviceName,
              req.path,
              req.query
            );
            cacheManager.set(cacheKey, parsed);
          } catch (e) {
            // Not JSON, don't cache
          }
        }
        return originalSend(data);
      };

      next();
    },
    // Circuit breaker wrapper
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await circuitBreaker.execute(serviceName, async () => {
          return new Promise((resolve, reject) => {
            proxy(req, res, (err) => {
              if (err) reject(err);
              else resolve(undefined);
            });
          });
        });
      } catch (error: any) {
        logger.error('Circuit breaker triggered', {
          service: serviceName,
          error: error.message,
        });

        res.status(503).json({
          error: 'Service temporarily unavailable',
          service: serviceName,
          retry: 'Please try again later',
        });
      }
    }
  );

  logger.info(`Proxy configured for ${serviceName} at ${prefix}`);
}