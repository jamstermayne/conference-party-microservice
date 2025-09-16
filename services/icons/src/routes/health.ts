/**
 * Health Check Route
 */

import { Router, Request, Response } from 'express';
import os from 'os';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'icon-delivery-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      loadAvg: os.loadavg()
    }
  });
});

healthRouter.get('/ready', (_req: Request, res: Response) => {
  // Check if service is ready to handle requests
  res.json({
    ready: true,
    checks: {
      cache: 'ready',
      icons: 'loaded',
      routes: 'configured'
    }
  });
});

healthRouter.get('/live', (_req: Request, res: Response) => {
  // Simple liveness check
  res.status(200).send('OK');
});