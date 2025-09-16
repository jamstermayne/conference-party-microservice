/**
 * Shared Middleware Package
 * Common middleware for all microservices
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

export function createMiddlewareStack(serviceName: string) {
  return {
    // Tracing middleware
    tracing: (req: Request, res: Response, next: NextFunction) => {
      (req as any).traceId = `${serviceName}-${Date.now()}`;
      next();
    },

    // Metrics middleware
    metrics: (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      });
      next();
    },

    // Rate limiting
    rateLimit: {
      perIP: (max: number, windowMs: number) => rateLimit({ max, windowMs }),
      perUser: (max: number, windowMs: number) => rateLimit({
        max,
        windowMs,
        keyGenerator: (req) => (req as any).user?.id || req.ip
      }),
      strict: (max: number, windowMs: number) => rateLimit({
        max,
        windowMs,
        skipSuccessfulRequests: false
      })
    },

    // Auth middleware
    auth: {
      required: (req: Request, res: Response, next: NextFunction) => {
        if (!(req as any).user) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        next();
      },
      optional: (req: Request, res: Response, next: NextFunction) => {
        // Auth is optional, just continue
        next();
      }
    },

    // Error handling
    error: {
      notFound: (req: Request, res: Response) => {
        res.status(404).json({ error: 'Not found' });
      },
      handler: (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      },
      asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
      }
    },

    // Endpoints
    endpoints: {
      metrics: (req: Request, res: Response) => {
        res.json({ status: 'ok', metrics: {} });
      }
    },

    // Instances
    instances: {
      tracing: {
        shutdown: async () => {
          // Cleanup
        }
      }
    }
  };
}