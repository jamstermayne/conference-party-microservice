import { onRequest } from "firebase-functions/v2/https";
import express, { Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createRateLimiter } from '../../shared/security-middleware';

const app = express();

// Environment configuration
const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  events: process.env.EVENTS_SERVICE_URL || 'http://events-service:3002',
  matchmaking: process.env.MATCHMAKING_SERVICE_URL || 'http://matchmaking-service:3003',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3004',
  notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3005'
};

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

// Apply rate limiting
app.use('/api/auth', createRateLimiter(15 * 60 * 1000, 50)); // 50 requests per 15 min for auth
app.use('/api/events', createRateLimiter(60 * 1000, 100)); // 100 requests per minute for events
app.use('/api/matchmaking', createRateLimiter(60 * 1000, 60)); // 60 requests per minute for matchmaking

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "api-gateway",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: Object.keys(SERVICE_URLS),
    endpoints: {
      auth: SERVICE_URLS.auth,
      events: SERVICE_URLS.events,
      matchmaking: SERVICE_URLS.matchmaking,
      analytics: SERVICE_URLS.analytics,
      notifications: SERVICE_URLS.notifications
    }
  });
});

// Service discovery and routing
const serviceRoutes = [
  {
    path: '/api/auth',
    target: SERVICE_URLS.auth,
    service: 'auth-service',
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' }
  },
  {
    path: '/api/events',
    target: SERVICE_URLS.events,
    service: 'events-service',
    changeOrigin: true,
    pathRewrite: { '^/api/events': '' }
  },
  {
    path: '/api/matchmaking',
    target: SERVICE_URLS.matchmaking,
    service: 'matchmaking-service',
    changeOrigin: true,
    pathRewrite: { '^/api/matchmaking': '' }
  },
  {
    path: '/api/analytics',
    target: SERVICE_URLS.analytics,
    service: 'analytics-service',
    changeOrigin: true,
    pathRewrite: { '^/api/analytics': '' }
  },
  {
    path: '/api/notifications',
    target: SERVICE_URLS.notifications,
    service: 'notifications-service',
    changeOrigin: true,
    pathRewrite: { '^/api/notifications': '' }
  }
];

// Circuit breaker state
const circuitBreakers = new Map<string, {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  nextAttempt: number;
}>();

// Initialize circuit breakers
serviceRoutes.forEach(route => {
  circuitBreakers.set(route.service, {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
    nextAttempt: 0
  });
});

// Circuit breaker middleware
const circuitBreakerMiddleware = (serviceName: string) => {
  return (req: Request, res: Response, next: any) => {
    const breaker = circuitBreakers.get(serviceName);

    if (!breaker) return next();

    // Check if circuit is open
    if (breaker.isOpen) {
      if (Date.now() < breaker.nextAttempt) {
        return res.status(503).json({
          error: "Service temporarily unavailable",
          service: serviceName,
          retryAfter: new Date(breaker.nextAttempt).toISOString()
        });
      }
      // Half-open state - allow one request through
      breaker.isOpen = false;
    }

    next();
  };
};

// Error handler for proxied requests
const handleProxyError = (serviceName: string) => {
  return (err: any, req: Request, res: Response, target: any) => {
    const breaker = circuitBreakers.get(serviceName);

    if (breaker) {
      breaker.failures++;
      breaker.lastFailure = Date.now();

      // Open circuit after 5 failures
      if (breaker.failures >= 5) {
        breaker.isOpen = true;
        breaker.nextAttempt = Date.now() + 30000; // 30 second timeout
        console.error(`Circuit breaker opened for ${serviceName}`);
      }
    }

    console.error(`Proxy error for ${serviceName}:`, err);

    res.status(502).json({
      error: "Service unavailable",
      service: serviceName,
      message: "The requested service is currently unavailable. Please try again later."
    });
  };
};

// Success handler to reset circuit breaker
const handleProxySuccess = (serviceName: string) => {
  return (proxyRes: any, req: Request, res: Response) => {
    const breaker = circuitBreakers.get(serviceName);

    if (breaker && proxyRes.statusCode < 500) {
      // Reset failures on successful response
      breaker.failures = 0;
      breaker.isOpen = false;
    }
  };
};

// Set up proxy routes
serviceRoutes.forEach(route => {
  app.use(
    route.path,
    circuitBreakerMiddleware(route.service),
    createProxyMiddleware({
      target: route.target,
      changeOrigin: route.changeOrigin,
      pathRewrite: route.pathRewrite,
      onError: handleProxyError(route.service),
      onProxyRes: handleProxySuccess(route.service),
      timeout: 30000,
      proxyTimeout: 30000,
      logLevel: 'warn'
    })
  );
});

// Service health monitoring endpoint
app.get("/api/health/services", async (_req: Request, res: Response) => {
  const healthChecks = await Promise.allSettled(
    serviceRoutes.map(async route => {
      const breaker = circuitBreakers.get(route.service);
      return {
        service: route.service,
        url: route.target,
        status: breaker?.isOpen ? 'unhealthy' : 'healthy',
        failures: breaker?.failures || 0,
        lastFailure: breaker?.lastFailure ? new Date(breaker.lastFailure).toISOString() : null,
        circuitBreaker: {
          isOpen: breaker?.isOpen || false,
          nextAttempt: breaker?.nextAttempt ? new Date(breaker.nextAttempt).toISOString() : null
        }
      };
    })
  );

  const services = healthChecks.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      service: serviceRoutes[index].service,
      status: 'error',
      error: 'Health check failed'
    };
  });

  res.status(200).json({
    timestamp: new Date().toISOString(),
    services,
    overall: services.every(s => s.status === 'healthy') ? 'healthy' : 'degraded'
  });
});

// Legacy route compatibility
app.get("/parties", (req: Request, res: Response) => {
  res.redirect(301, '/api/events');
});

app.get("/swipe", (req: Request, res: Response) => {
  res.redirect(301, '/api/matchmaking/swipe');
});

app.get("/sync", (req: Request, res: Response) => {
  res.redirect(301, '/api/events/sync');
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
    availableServices: [
      '/api/auth',
      '/api/events',
      '/api/matchmaking',
      '/api/analytics',
      '/api/notifications'
    ]
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Gateway error:', err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    path: req.path
  });
});

// Export the function
export const apiGateway = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 20,
  minInstances: 1,
  memory: '512MiB',
  timeoutSeconds: 60
}, app);