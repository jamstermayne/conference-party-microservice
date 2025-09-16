import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT,
  });
} catch (error) {
  // Already initialized
}

const app = express();

// Service discovery configuration
const SERVICE_ROUTES = {
  auth: {
    baseUrl: process.env.AUTH_SERVICE_URL || 'https://us-central1-conference-party-app.cloudfunctions.net/authService',
    paths: ['/login', '/logout', '/verify', '/profile', '/oauth'],
    healthPath: '/health'
  },
  events: {
    baseUrl: process.env.EVENTS_SERVICE_URL || 'https://us-central1-conference-party-app.cloudfunctions.net/eventsService',
    paths: ['/events', '/search', '/days', '/sync', '/stats'],
    healthPath: '/health'
  },
  matchmaking: {
    baseUrl: process.env.MATCHMAKING_SERVICE_URL || 'https://us-central1-conference-party-app.cloudfunctions.net/matchmakingService',
    paths: ['/profile', '/matches', '/swipe', '/nearby'],
    healthPath: '/health'
  },
  calendar: {
    baseUrl: process.env.CALENDAR_SERVICE_URL || 'https://us-central1-conference-party-app.cloudfunctions.net/calendarService',
    paths: ['/events', '/integrations', '/sync', '/export', '/availability'],
    healthPath: '/health'
  },
  admin: {
    baseUrl: process.env.ADMIN_SERVICE_URL || 'https://us-central1-conference-party-app.cloudfunctions.net/adminService',
    paths: ['/users', '/events', '/analytics', '/stats', '/system'],
    healthPath: '/health'
  }
};

// Service health cache
const serviceHealthCache = new Map<string, { isHealthy: boolean; lastCheck: number }>();
const HEALTH_CACHE_TTL = 30000; // 30 seconds

// Middleware
app.use(cors({
  origin: [
    'https://conference-party-app.web.app',
    'https://conference-party-app--preview-*.web.app',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  maxAge: 86400
}));

app.use(compression({ threshold: 1024, level: 6 }));
app.use(morgan('combined'));
app.use(express.json());

// Request tracking middleware
app.use((req: any, res: Response, next: NextFunction) => {
  req.startTime = Date.now();
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  res.setHeader('X-Request-ID', req.requestId);
  res.setHeader('X-Gateway-Version', '1.0.0');

  console.log(`[Gateway] ${req.requestId} ${req.method} ${req.path} - Start`);

  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    console.log(`[Gateway] ${req.requestId} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// Service health check function
async function checkServiceHealth(serviceName: string): Promise<boolean> {
  const cached = serviceHealthCache.get(serviceName);
  const now = Date.now();

  // Return cached result if still fresh
  if (cached && (now - cached.lastCheck) < HEALTH_CACHE_TTL) {
    return cached.isHealthy;
  }

  try {
    const service = SERVICE_ROUTES[serviceName as keyof typeof SERVICE_ROUTES];
    const healthUrl = `${service.baseUrl}${service.healthPath}`;

    const response = await fetch(healthUrl, {
      method: 'GET',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const isHealthy = response.ok;
    serviceHealthCache.set(serviceName, { isHealthy, lastCheck: now });

    return isHealthy;

  } catch (error) {
    console.error(`[Gateway] Health check failed for ${serviceName}:`, error);
    serviceHealthCache.set(serviceName, { isHealthy: false, lastCheck: now });
    return false;
  }
}

// Route resolution function
function resolveService(path: string): { serviceName: string; targetPath: string } | null {
  for (const [serviceName, config] of Object.entries(SERVICE_ROUTES)) {
    for (const servicePath of config.paths) {
      if (path.startsWith(servicePath)) {
        return {
          serviceName,
          targetPath: path
        };
      }
    }
  }
  return null;
}

// Circuit breaker middleware
const circuitBreakers = new Map<string, {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open'
}>();

function getCircuitBreakerState(serviceName: string) {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(serviceName, { failures: 0, lastFailure: 0, state: 'closed' });
  }
  return circuitBreakers.get(serviceName)!;
}

function circuitBreakerMiddleware(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const breaker = getCircuitBreakerState(serviceName);
    const now = Date.now();

    // Check if circuit should be reset (after 30 seconds)
    if (breaker.state === 'open' && (now - breaker.lastFailure) > 30000) {
      breaker.state = 'half-open';
      breaker.failures = 0;
    }

    // Block requests if circuit is open
    if (breaker.state === 'open') {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        service: serviceName,
        retryAfter: 30
      });
    }

    next();
  };
}

// Service proxy creation
function createServiceProxy(serviceName: string): any {
  const service = SERVICE_ROUTES[serviceName as keyof typeof SERVICE_ROUTES];

  const options: Options = {
    target: service.baseUrl,
    changeOrigin: true,
    pathRewrite: (path) => path,
    timeout: 30000,
    proxyTimeout: 30000,

    onError: (err, req: any, res) => {
      const breaker = getCircuitBreakerState(serviceName);
      breaker.failures++;
      breaker.lastFailure = Date.now();

      if (breaker.failures >= 5) {
        breaker.state = 'open';
      }

      console.error(`[Gateway] Proxy error for ${serviceName}:`, err.message);

      if (!res.headersSent) {
        res.status(502).json({
          error: 'Service unavailable',
          service: serviceName,
          requestId: req.requestId
        });
      }
    },

    onProxyRes: (proxyRes, req: any, res) => {
      // Reset circuit breaker on successful response
      if (proxyRes.statusCode && proxyRes.statusCode < 500) {
        const breaker = getCircuitBreakerState(serviceName);
        if (breaker.state === 'half-open') {
          breaker.state = 'closed';
          breaker.failures = 0;
        }
      }

      // Add service identification headers
      res.setHeader('X-Service-Name', serviceName);
      res.setHeader('X-Service-Response-Time', Date.now() - req.startTime);
    },

    logLevel: 'warn'
  };

  return createProxyMiddleware(options);
}

// Gateway health check
app.get("/health", async (req: Request, res: Response) => {
  try {
    const serviceHealthPromises = Object.keys(SERVICE_ROUTES).map(async (serviceName) => {
      const isHealthy = await checkServiceHealth(serviceName);
      return { service: serviceName, healthy: isHealthy };
    });

    const serviceHealthResults = await Promise.all(serviceHealthPromises);
    const allHealthy = serviceHealthResults.every(result => result.healthy);

    const health = {
      gateway: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: serviceHealthResults.reduce((acc, result) => {
        acc[result.service] = result.healthy ? "healthy" : "unhealthy";
        return acc;
      }, {} as Record<string, string>),
      overall: allHealthy ? "healthy" : "degraded"
    };

    res.status(allHealthy ? 200 : 503).json(health);

  } catch (error) {
    console.error('[Gateway] Health check error:', error);
    res.status(500).json({
      gateway: "error",
      error: "Health check failed"
    });
  }
});

// Service discovery endpoint
app.get("/services", (req: Request, res: Response) => {
  const services = Object.entries(SERVICE_ROUTES).map(([name, config]) => ({
    name,
    baseUrl: config.baseUrl,
    paths: config.paths,
    status: serviceHealthCache.get(name)?.isHealthy ? 'healthy' : 'unknown'
  }));

  res.status(200).json({
    services,
    gateway: {
      version: "1.0.0",
      timestamp: new Date().toISOString()
    }
  });
});

// Route all requests to appropriate microservices
app.use("/*", async (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;

  // Skip static assets and gateway-specific routes
  if (path.startsWith('/health') || path.startsWith('/services')) {
    return next();
  }

  const resolution = resolveService(path);

  if (!resolution) {
    return res.status(404).json({
      error: "Service not found",
      path,
      availableServices: Object.keys(SERVICE_ROUTES)
    });
  }

  const { serviceName } = resolution;

  // Check service health before routing
  const isHealthy = await checkServiceHealth(serviceName);
  if (!isHealthy) {
    return res.status(503).json({
      error: "Target service unavailable",
      service: serviceName,
      path
    });
  }

  // Apply circuit breaker and route to service
  const circuitBreaker = circuitBreakerMiddleware(serviceName);
  const serviceProxy = createServiceProxy(serviceName);

  circuitBreaker(req, res, (err?: any) => {
    if (err) return next(err);
    serviceProxy(req, res, next);
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Gateway] Unhandled error:', err);

  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal gateway error",
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Export the function
export const apiGateway = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 10,
  memory: "1GiB",
  timeoutSeconds: 60,
}, app);

// Also export as legacy 'api' function for backward compatibility
export const api = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 10,
  memory: "1GiB",
  timeoutSeconds: 60,
}, app);