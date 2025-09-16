/**
 * Health Check Route
 * Gateway health status
 */

import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Basic health check
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

/**
 * Detailed health check
 */
router.get('/detailed', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
  });
});

export const healthCheck = router;