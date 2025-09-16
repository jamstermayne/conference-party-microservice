# 🌐 API Gateway & Middleware Architecture
## Intelligent Traffic Routing & Cross-Cutting Concerns

### Current Problem
- **No API Gateway** - Frontend calls services directly
- **Duplicated middleware** - Auth, CORS, logging in every service
- **No traffic management** - Rate limiting, circuit breakers missing
- **Security vulnerabilities** - No centralized security layer

---

## 🚪 API Gateway Strategy

### Kong API Gateway Architecture
```yaml
# kong.yml - Declarative Configuration
_format_version: "3.0"

services:
  # Authentication Service
  - name: auth-service
    url: https://auth-service-hash-uc.a.run.app
    retries: 3
    connect_timeout: 30000
    read_timeout: 30000

  # Events Service
  - name: events-service
    url: https://events-service-hash-uc.a.run.app
    retries: 3
    connect_timeout: 30000

  # Matchmaking Service (Python/FastAPI)
  - name: matchmaking-service
    url: https://matchmaking-service-hash-uc.a.run.app
    retries: 3
    connect_timeout: 60000  # ML operations need more time

  # Calendar Service
  - name: calendar-service
    url: https://calendar-service-hash-uc.a.run.app
    retries: 3

  # Notifications Service
  - name: notifications-service
    url: https://notifications-service-hash-uc.a.run.app
    retries: 2

  # Analytics Service
  - name: analytics-service
    url: https://analytics-service-hash-uc.a.run.app
    retries: 1  # Analytics can be best-effort

routes:
  # Auth Routes
  - name: auth-login
    service: auth-service
    paths: ["/api/auth/login"]
    methods: ["POST"]

  - name: auth-register
    service: auth-service
    paths: ["/api/auth/register"]
    methods: ["POST"]

  - name: auth-profile
    service: auth-service
    paths: ["/api/auth/profile"]
    methods: ["GET", "PUT"]

  - name: auth-refresh
    service: auth-service
    paths: ["/api/auth/refresh"]
    methods: ["POST"]

  # Events Routes
  - name: events-list
    service: events-service
    paths: ["/api/events"]
    methods: ["GET"]

  - name: events-create
    service: events-service
    paths: ["/api/events"]
    methods: ["POST"]

  - name: events-detail
    service: events-service
    paths: ["/api/events/(?<event_id>[a-zA-Z0-9-]+)"]
    methods: ["GET", "PUT", "DELETE"]

  - name: events-save
    service: events-service
    paths: ["/api/events/(?<event_id>[a-zA-Z0-9-]+)/save"]
    methods: ["POST", "DELETE"]

  # Matchmaking Routes
  - name: matchmaking-profile
    service: matchmaking-service
    paths: ["/api/matchmaking/profile"]
    methods: ["GET", "POST", "PUT"]

  - name: matchmaking-matches
    service: matchmaking-service
    paths: ["/api/matchmaking/matches"]
    methods: ["GET"]

  - name: matchmaking-connect
    service: matchmaking-service
    paths: ["/api/matchmaking/connect"]
    methods: ["POST"]

  # Calendar Routes
  - name: calendar-sync
    service: calendar-service
    paths: ["/api/calendar/sync"]
    methods: ["POST"]

  - name: calendar-events
    service: calendar-service
    paths: ["/api/calendar/events"]
    methods: ["GET", "POST"]

plugins:
  # Global Plugins (applied to all routes)
  - name: cors
    config:
      origins:
        - "https://conference-party-app.web.app"
        - "https://conference-party-app--preview-*.web.app"
        - "http://localhost:3000"
        - "http://localhost:5000"
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      headers: ["Content-Type", "Authorization", "Accept", "Origin"]
      credentials: true
      max_age: 86400

  - name: request-id
    config:
      header_name: "X-Request-ID"
      echo_downstream: true

  # Rate Limiting - Different limits per service
  - name: rate-limiting
    service: auth-service
    config:
      minute: 60  # Auth is critical but not high-throughput

  - name: rate-limiting
    service: events-service
    config:
      minute: 200  # Events are browsed frequently

  - name: rate-limiting
    service: matchmaking-service
    config:
      minute: 30   # ML operations are expensive

  # Authentication - Protect non-auth routes
  - name: jwt
    route: events-create
    config:
      secret_is_base64: false
      key_claim_name: "sub"

  - name: jwt
    route: matchmaking-profile
    config:
      secret_is_base64: false

  # Circuit Breaker - Protect against cascading failures
  - name: proxy-cache
    service: events-service
    config:
      response_code: [200]
      request_method: ["GET"]
      content_type: ["application/json"]
      cache_ttl: 300  # Cache events for 5 minutes

  # Response Transformation
  - name: response-transformer
    config:
      add:
        headers:
          - "X-Service-Version:1.0.0"
          - "X-Response-Time:{{upstream_response_time}}"

  # Request Size Limiting
  - name: request-size-limiting
    config:
      allowed_payload_size: 10  # 10MB max

  # IP Restriction (for admin routes)
  - name: ip-restriction
    route: analytics-admin
    config:
      allow: ["192.168.1.0/24", "10.0.0.0/8"]
```

---

## 🔒 Security Layer

### JWT Authentication Strategy
```typescript
// gateway/middleware/jwt-validator.ts
interface JWTMiddleware {
  // Public routes (no auth required)
  publicRoutes: [
    "/api/auth/login",
    "/api/auth/register",
    "/api/events" // GET only
  ];

  // Protected routes (JWT required)
  protectedRoutes: [
    "/api/auth/profile",
    "/api/events" // POST, PUT, DELETE
    "/api/matchmaking/*",
    "/api/calendar/*"
  ];

  // Admin routes (special role required)
  adminRoutes: [
    "/api/admin/*",
    "/api/analytics/admin/*"
  ];
}

// JWT validation logic
async function validateJWT(token: string): Promise<User | null> {
  try {
    // Verify with Auth Service
    const response = await fetch(`${AUTH_SERVICE_URL}/validate`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.ok) {
      const user = await response.json();

      // Cache valid tokens for 5 minutes
      await redis.setex(`jwt:${token}`, 300, JSON.stringify(user));

      return user;
    }
  } catch (error) {
    console.error('JWT validation failed:', error);
  }

  return null;
}
```

### API Key Management
```typescript
// gateway/middleware/api-keys.ts
interface APIKeyStrategy {
  // Partner API keys for external integrations
  partnerKeys: {
    'linkedin-integration': {
      keyId: 'ln_abc123',
      permissions: ['auth:linkedin', 'profile:read'],
      rateLimit: 1000  // requests per hour
    },
    'google-calendar': {
      keyId: 'gc_def456',
      permissions: ['calendar:read', 'calendar:write'],
      rateLimit: 500
    }
  };

  // Internal service keys for service-to-service communication
  serviceKeys: {
    'auth-to-matchmaking': 'svc_auth_match_xyz789',
    'events-to-analytics': 'svc_events_analytics_abc456'
  };
}
```

---

## ⚡ Performance & Reliability

### Intelligent Caching Strategy
```typescript
// gateway/middleware/cache.ts
interface CacheStrategy {
  // Cache configuration per route
  routes: {
    "/api/events": {
      method: "GET",
      ttl: 300,      // 5 minutes
      varyBy: ["location", "date", "tags"],
      invalidateOn: [
        "event.created",
        "event.updated",
        "event.deleted"
      ]
    },

    "/api/matchmaking/matches": {
      method: "GET",
      ttl: 1800,     // 30 minutes
      varyBy: ["userId"],
      invalidateOn: [
        "user.profile_updated",
        "connection.created"
      ]
    },

    "/api/auth/profile": {
      method: "GET",
      ttl: 600,      // 10 minutes
      varyBy: ["userId"],
      invalidateOn: ["user.profile_updated"]
    }
  };
}

// Cache implementation with Redis
class IntelligentCache {
  async get(key: string): Promise<any> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  // Event-driven cache invalidation
  async onEvent(eventType: string, data: any): Promise<void> {
    switch (eventType) {
      case 'event.created':
        await this.invalidatePattern('cache:events:*');
        break;

      case 'user.profile_updated':
        await this.invalidatePattern(`cache:profile:${data.userId}*`);
        await this.invalidatePattern(`cache:matches:${data.userId}*`);
        break;
    }
  }
}
```

### Circuit Breaker Pattern
```typescript
// gateway/middleware/circuit-breaker.ts
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: Date;

  constructor(
    private threshold: number = 5,      // Failures before opening
    private timeout: number = 60000,    // Timeout before trying again
    private resetTimeout: number = 30000 // Time to stay half-open
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime &&
           (Date.now() - this.lastFailureTime.getTime()) > this.timeout;
  }
}

// Usage in gateway
const authServiceBreaker = new CircuitBreaker(3, 30000);
const eventsServiceBreaker = new CircuitBreaker(5, 60000);
const matchmakingServiceBreaker = new CircuitBreaker(2, 120000); // ML is sensitive

app.use('/api/auth', async (req, res, next) => {
  try {
    await authServiceBreaker.execute(() => proxyToAuthService(req, res));
  } catch (error) {
    res.status(503).json({
      error: 'Auth service temporarily unavailable',
      retryAfter: 30
    });
  }
});
```

### Load Balancing & Health Checks
```typescript
// gateway/load-balancer.ts
interface LoadBalancer {
  services: {
    auth: [
      'https://auth-service-1-hash.a.run.app',
      'https://auth-service-2-hash.a.run.app'
    ],
    events: [
      'https://events-service-1-hash.a.run.app',
      'https://events-service-2-hash.a.run.app',
      'https://events-service-3-hash.a.run.app'  // Events need more capacity
    ]
  };

  healthChecks: {
    interval: 30000;  // Check every 30 seconds
    timeout: 5000;    // 5 second timeout
    retries: 3;       // Retry 3 times before marking unhealthy
  };

  strategies: {
    auth: 'round-robin';      // Simple round-robin for auth
    events: 'least-response-time';  // Route to fastest instance
    matchmaking: 'consistent-hash'; // Sticky sessions for ML state
  };
}

class HealthMonitor {
  private healthyServices = new Map<string, string[]>();

  async checkHealth(serviceName: string, url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}/health`, {
        timeout: 5000
      });

      const health = await response.json();
      return response.ok && health.status === 'healthy';
    } catch {
      return false;
    }
  }

  async updateHealthyServices(): Promise<void> {
    for (const [service, urls] of Object.entries(this.services)) {
      const healthy = [];

      for (const url of urls) {
        if (await this.checkHealth(service, url)) {
          healthy.push(url);
        }
      }

      this.healthyServices.set(service, healthy);
    }
  }

  getHealthyService(serviceName: string, strategy: string): string | null {
    const healthy = this.healthyServices.get(serviceName) || [];

    if (healthy.length === 0) return null;

    switch (strategy) {
      case 'round-robin':
        return this.roundRobin(serviceName, healthy);
      case 'least-response-time':
        return this.leastResponseTime(healthy);
      default:
        return healthy[0];
    }
  }
}
```

---

## 📊 Observability & Monitoring

### Distributed Tracing
```typescript
// gateway/middleware/tracing.ts
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('api-gateway');

function tracingMiddleware(req: Request, res: Response, next: NextFunction) {
  const span = tracer.startSpan(`${req.method} ${req.path}`, {
    kind: SpanKind.SERVER,
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.user_agent': req.get('User-Agent'),
      'user.id': req.user?.id
    }
  });

  // Inject trace context for downstream services
  const headers = {};
  trace.setSpanContext(context.active(), span);
  propagation.inject(context.active(), headers);

  // Add trace headers to proxy request
  req.traceHeaders = headers;

  res.on('finish', () => {
    span.setAttributes({
      'http.status_code': res.statusCode,
      'http.response_size': res.get('content-length')
    });

    if (res.statusCode >= 400) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: `HTTP ${res.statusCode}`
      });
    }

    span.end();
  });

  next();
}
```

### Metrics Collection
```typescript
// gateway/middleware/metrics.ts
import { createPrometheusMetrics } from 'prom-client';

const metrics = {
  httpRequests: new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'service']
  }),

  httpDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration',
    labelNames: ['method', 'route', 'service'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),

  serviceHealth: new Gauge({
    name: 'service_health',
    help: 'Service health status (1=healthy, 0=unhealthy)',
    labelNames: ['service', 'instance']
  }),

  circuitBreakerState: new Gauge({
    name: 'circuit_breaker_state',
    help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
    labelNames: ['service']
  })
};

function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const service = getServiceFromPath(req.path);

    metrics.httpRequests.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
      service
    });

    metrics.httpDuration.observe({
      method: req.method,
      route: req.route?.path || req.path,
      service
    }, duration);
  });

  next();
}

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

---

## 🔄 Event-Driven Middleware

### Message Broker Integration
```typescript
// gateway/middleware/events.ts
import { Kafka } from 'kafkajs';

class EventMiddleware {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'api-gateway',
      brokers: ['kafka-broker-1:9092', 'kafka-broker-2:9092']
    });
    this.producer = this.kafka.producer();
  }

  // Publish events for analytics and auditing
  async publishEvent(eventType: string, data: any, req: Request): Promise<void> {
    await this.producer.send({
      topic: 'api-events',
      messages: [{
        key: eventType,
        value: JSON.stringify({
          eventType,
          data,
          metadata: {
            requestId: req.headers['x-request-id'],
            userId: req.user?.id,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            timestamp: new Date().toISOString()
          }
        })
      }]
    });
  }

  // Middleware to publish API events
  publishAPIEvent(eventType: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Publish after response
      res.on('finish', async () => {
        if (res.statusCode < 400) {
          await this.publishEvent(eventType, {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode
          }, req);
        }
      });

      next();
    };
  }
}

// Usage
const eventMiddleware = new EventMiddleware();

app.post('/api/auth/login',
  eventMiddleware.publishAPIEvent('user.login_attempt'),
  proxyToAuthService
);

app.post('/api/events',
  eventMiddleware.publishAPIEvent('event.created'),
  proxyToEventsService
);
```

---

## 🔧 Gateway Implementation

### Express.js Gateway Server
```typescript
// gateway/src/app.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Global middleware
app.use(corsMiddleware);
app.use(tracingMiddleware);
app.use(metricsMiddleware);
app.use(rateLimitingMiddleware);

// Service proxies with circuit breakers
const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' },
  onProxyReq: (proxyReq, req) => {
    // Add trace headers
    Object.assign(proxyReq.headers, req.traceHeaders);
  },
  onError: (err, req, res) => {
    console.error('Auth service proxy error:', err);
    res.status(503).json({ error: 'Auth service unavailable' });
  }
});

const eventsProxy = createProxyMiddleware({
  target: process.env.EVENTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/events': '' }
});

// Route to services
app.use('/api/auth',
  jwtMiddleware.optional(), // Auth routes don't require JWT
  authServiceBreaker.middleware(),
  authProxy
);

app.use('/api/events',
  cacheMiddleware('/api/events'),
  jwtMiddleware.required(['POST', 'PUT', 'DELETE']),
  eventsServiceBreaker.middleware(),
  eventsProxy
);

// Health check for gateway itself
app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'healthy',
    uptime: process.uptime(),
    services: {
      auth: authServiceBreaker.state,
      events: eventsServiceBreaker.state,
      matchmaking: matchmakingServiceBreaker.state
    }
  });
});

export default app;
```

### Docker Deployment
```dockerfile
# gateway/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY dist/ ./dist/

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["node", "dist/app.js"]
```

---

## 🎯 Migration Strategy

### Phase 1: Gateway Introduction
```bash
# Deploy gateway alongside existing monolith
# Route all traffic through gateway initially to monolith
# Gradually route specific paths to new services
```

### Phase 2: Service Migration
```bash
# Week 1: Route /api/auth to new auth service
# Week 2: Route /api/events to new events service
# Week 3: Route /api/matchmaking to new matchmaking service
# Continue until all services migrated
```

### Phase 3: Advanced Features
```bash
# Add intelligent caching
# Implement circuit breakers
# Add comprehensive monitoring
# Optimize performance
```

---

## 🎉 Result: Intelligent API Layer

The API Gateway becomes the **intelligent nerve center** that:

### ✅ **Provides:**
- **Unified API Interface** - Single endpoint for frontend
- **Intelligent Routing** - Route to healthy service instances
- **Security Layer** - JWT validation, rate limiting, IP filtering
- **Performance Optimization** - Caching, compression, circuit breakers
- **Observability** - Tracing, metrics, logging for all requests
- **Resilience** - Automatic failover, retry logic, graceful degradation

### ✅ **Enables:**
- **Service Independence** - Services don't need to handle cross-cutting concerns
- **Easy Frontend Development** - Single API endpoint to integrate with
- **Operational Excellence** - Centralized monitoring and control
- **Security** - Consistent security policies across all services
- **Performance** - Intelligent caching and load balancing

This creates a **surgical middleware layer** that handles all cross-cutting concerns centrally while allowing each microservice to focus purely on its business domain.