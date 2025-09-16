# 🛡️ Shared Middleware Library
## Cross-Cutting Concerns for All Microservices

This shared middleware library provides battle-tested, production-ready middleware components that all microservices need, ensuring consistency while maintaining service independence and following the "1 Function, 1 Thing" principle.

## 📦 Available Middleware

### 🔐 Authentication & Authorization (`auth.ts`)
- **JWT Validation**: Local + remote validation with Redis caching
- **Role-based Access Control**: Multi-role authorization with inheritance
- **Permission-based Security**: Granular permission checking
- **API Key Authentication**: External service integration
- **Ownership Validation**: Resource-level access control

### 📊 Observability (`tracing.ts`, `metrics.ts`)
- **Distributed Tracing**: OpenTelemetry with Jaeger integration
- **Prometheus Metrics**: Request duration, error rates, custom metrics
- **Correlation IDs**: Request tracking across service boundaries
- **Performance Monitoring**: Real-time performance insights

### ⚡ Performance & Security (`rate-limiting.ts`)
- **Distributed Rate Limiting**: Redis-backed with sliding windows
- **Role-based Limits**: Dynamic limits based on user roles
- **Global Protection**: Service-wide traffic shaping
- **Smart Whitelisting**: IP and user-based exemptions

### 🔄 Reliability (`error-handling.ts`)
- **Centralized Error Handling**: Consistent error responses
- **Context-aware Logging**: Structured error logging with tracing
- **Custom Error Types**: Application-specific error handling
- **Graceful Degradation**: Fail-open patterns for external dependencies

## 🚀 Quick Start

### Simple Usage (Individual Middleware)
```typescript
import { AuthMiddleware, TracingMiddleware, MetricsMiddleware } from '@conference-app/shared-middleware';

const app = express();

// Create middleware instances
const auth = new AuthMiddleware();
const tracing = new TracingMiddleware('user-service');
const metrics = new MetricsMiddleware('user-service');

// Apply middleware
app.use(tracing.middleware());
app.use(metrics.middleware());
app.use(auth.optional());

// Protected route
app.get('/users', auth.required(), getUsersHandler);
```

### Advanced Usage (Middleware Stack)
```typescript
import { createMiddlewareStack } from '@conference-app/shared-middleware';

const middleware = createMiddlewareStack('user-service');

const app = express();

// Apply common middleware stack
app.use(middleware.tracing);
app.use(middleware.metrics);
app.use(middleware.rateLimit.perIP(100, 15 * 60 * 1000)); // 100 req/15min per IP
app.use(middleware.auth.optional);

// Route-specific middleware
app.get('/users',
  middleware.auth.required(),
  middleware.rateLimit.perUser(1000, 60 * 60 * 1000), // 1000 req/hour per user
  getUsersHandler
);

app.get('/admin/users',
  middleware.auth.required(),
  middleware.auth.requireRole('admin'),
  middleware.rateLimit.strict(10, 60 * 1000), // 10 req/min for admin ops
  getAdminUsersHandler
);

// Error handling (must be last)
app.use(middleware.error.notFound);
app.use(middleware.error.handler);

// Expose metrics and health endpoints
app.get('/metrics', middleware.endpoints.metrics);
app.get('/health', middleware.endpoints.health);
```

### Pre-configured Patterns
```typescript
import { patterns } from '@conference-app/shared-middleware';

// Public API service
const publicApi = patterns.apiService('events-service');
app.use(publicApi.before);
// ... your routes ...
app.use(publicApi.after);

// Authenticated service
const authApi = patterns.authenticatedService('user-service');
app.use(authApi.before);
// ... your routes ...
app.use(authApi.after);

// Admin service
const adminApi = patterns.adminService('admin-service');
app.use(adminApi.before);
// ... your routes ...
app.use(adminApi.after);

// External API service
const externalApi = patterns.externalApiService('webhook-service', ['ak_live_123', 'ak_test_456']);
app.use(externalApi.before);
// ... your routes ...
app.use(externalApi.after);
```

## 🔧 Configuration

### Environment Variables
```bash
# Authentication
JWT_SECRET=your-secret-key
AUTH_SERVICE_URL=http://auth-service:8080
REDIS_URL=redis://localhost:6379

# Tracing
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
SERVICE_VERSION=1.0.0

# Rate Limiting (uses REDIS_URL)

# Error Handling
NODE_ENV=production
```

### Service-specific Setup
```typescript
// services/user-service/src/app.ts
import express from 'express';
import { createMiddlewareStack } from '@conference-app/shared-middleware';

const app = express();
const middleware = createMiddlewareStack('user-service');

// Essential middleware
app.use(express.json());
app.use(middleware.tracing);
app.use(middleware.metrics);

// Authentication (optional for public endpoints)
app.use(middleware.auth.optional);

// Public routes
app.get('/users/search',
  middleware.rateLimit.perIP(50, 15 * 60 * 1000),
  searchUsersHandler
);

// Protected routes
app.get('/users/me',
  middleware.auth.required(),
  middleware.rateLimit.perUser(100, 60 * 60 * 1000),
  getCurrentUserHandler
);

app.post('/users/me',
  middleware.auth.required(),
  middleware.rateLimit.strict(5, 60 * 1000), // Strict for mutations
  updateCurrentUserHandler
);

// Admin routes
app.get('/admin/users',
  middleware.auth.required(),
  middleware.auth.requireRole(['admin', 'moderator']),
  middleware.rateLimit.roleBasedLimiting(),
  getAllUsersHandler
);

// Error handling
app.use(middleware.error.notFound);
app.use(middleware.error.handler);

export default app;
```

## 📊 Metrics & Monitoring

### Available Metrics
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_total` - Total request counter
- `http_request_errors_total` - Error counter by type
- `active_connections` - Current active connections
- `database_queries_total` - Database operation counter
- `cache_operations_total` - Cache hit/miss counter
- `auth_attempts_total` - Authentication attempt counter

### Custom Metrics
```typescript
const metrics = new MetricsMiddleware('my-service');

// Create custom metrics
const orderCounter = metrics.createCounter('orders_processed_total', 'Total orders processed');
const orderValue = metrics.createHistogram('order_value_dollars', 'Order value distribution');
const queueSize = metrics.createGauge('queue_size', 'Current queue size');

// Use in your code
orderCounter.inc({ status: 'completed' });
orderValue.observe({ currency: 'USD' }, 99.99);
queueSize.set({ queue: 'orders' }, 42);

// Record built-in metrics
metrics.recordDatabaseQuery('select', 'users', true);
metrics.recordCacheOperation('get', true);
metrics.recordAuthAttempt('jwt', true);
```

## 🔍 Distributed Tracing

### Automatic Tracing
- HTTP requests are automatically traced
- Trace and correlation IDs are propagated via headers
- Database and external API calls can be manually traced

### Manual Tracing
```typescript
import { TracingMiddleware } from '@conference-app/shared-middleware';

const tracing = new TracingMiddleware('my-service');

// Database operations
const dbSpan = tracing.createDatabaseSpan('select', 'users');
try {
  const users = await db.collection('users').get();
  dbSpan.setStatus({ code: SpanStatusCode.OK });
  return users;
} catch (error) {
  dbSpan.recordException(error);
  dbSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  throw error;
} finally {
  dbSpan.end();
}

// External API calls
const httpSpan = tracing.createHttpSpan('POST', 'https://api.external.com/webhooks');
try {
  const response = await fetch('https://api.external.com/webhooks', { method: 'POST' });
  httpSpan.setAttributes({ 'http.status_code': response.status });
  httpSpan.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  httpSpan.recordException(error);
  httpSpan.setStatus({ code: SpanStatusCode.ERROR });
} finally {
  httpSpan.end();
}
```

## 🚨 Error Handling

### Custom Error Types
```typescript
import { ErrorHandlingMiddleware } from '@conference-app/shared-middleware';

// Create custom errors
const ValidationError = ErrorHandlingMiddleware.createValidationError(
  'Invalid user data',
  [{ field: 'email', message: 'Invalid email format' }]
);

const NotFoundError = ErrorHandlingMiddleware.createNotFoundError('User');
const AuthError = ErrorHandlingMiddleware.createAuthError('Token expired');

// Throw in route handlers
app.post('/users', (req, res, next) => {
  if (!req.body.email) {
    return next(ErrorHandlingMiddleware.createValidationError('Email is required'));
  }

  // Your logic here
});
```

### Async Route Wrapper
```typescript
const middleware = createMiddlewareStack('my-service');

// Wrap async routes to automatically catch errors
app.get('/users', middleware.error.asyncHandler(async (req, res) => {
  const users = await getUsersFromDatabase(); // Any errors are automatically caught
  res.json(users);
}));
```

## 🔐 Authentication Examples

### JWT Authentication
```typescript
const auth = new AuthMiddleware();

// Optional authentication
app.get('/events', auth.optional(), (req, res) => {
  // req.user will be set if valid token provided
  const isAuthenticated = !!req.user;
  const events = getEvents(isAuthenticated);
  res.json(events);
});

// Required authentication
app.get('/profile', auth.required(), (req, res) => {
  // req.user is guaranteed to exist
  res.json({ user: req.user });
});

// Role-based access
app.get('/admin',
  auth.required(),
  auth.requireRole('admin'),
  (req, res) => {
    res.json({ message: 'Admin access granted' });
  }
);

// Permission-based access
app.delete('/users/:id',
  auth.required(),
  auth.requirePermission(['users:delete', 'admin:full']),
  (req, res) => {
    // User has either 'users:delete' or 'admin:full' permission
  }
);

// Ownership validation
app.get('/users/:id/profile',
  auth.required(),
  auth.requireOwnership((req) => req.params.id),
  (req, res) => {
    // User can only access their own profile
  }
);
```

### API Key Authentication
```typescript
// External webhooks
app.post('/webhooks/stripe',
  auth.requireApiKey(['ak_live_stripe_123']),
  handleStripeWebhook
);

// General API access
app.get('/api/public/events',
  auth.requireApiKey(), // Any key starting with 'ak_'
  getPublicEvents
);
```

## 🎯 Rate Limiting Examples

```typescript
const rateLimit = new RateLimitingMiddleware();

// Per-IP limiting
app.use('/api', rateLimit.perIP(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Per-user limiting
app.use('/api/user', rateLimit.perUser(1000, 60 * 60 * 1000)); // 1000 requests per hour

// Strict limiting for sensitive operations
app.post('/api/admin/reset-password', rateLimit.strict(5, 60 * 1000)); // 5 requests per minute

// Role-based dynamic limiting
app.use('/api', rateLimit.roleBasedLimiting());

// API key limiting
app.use('/api/external', rateLimit.perApiKey(10000, 60 * 60 * 1000)); // 10k requests per hour

// Whitelist certain IPs
app.use('/api', rateLimit.createWhitelist(['192.168.1.100', 'admin-user-id']));
```

## 🔧 Advanced Patterns

### Circuit Breaker Pattern
```typescript
// In your service
class ExternalServiceClient {
  private failures = 0;
  private lastFailure = 0;
  private readonly maxFailures = 5;
  private readonly timeout = 60000; // 1 minute

  async callExternalService() {
    if (this.isCircuitOpen()) {
      throw ErrorHandlingMiddleware.createError('Circuit breaker open', 503, 'SERVICE_UNAVAILABLE');
    }

    try {
      const result = await fetch('https://external-api.com');
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isCircuitOpen() {
    return this.failures >= this.maxFailures &&
           (Date.now() - this.lastFailure) < this.timeout;
  }

  private onSuccess() {
    this.failures = 0;
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
  }
}
```

### Health Check Implementation
```typescript
app.get('/health', (req, res) => {
  const checks = {
    service: 'healthy',
    database: 'checking...',
    redis: 'checking...',
    external_apis: 'checking...',
  };

  // Add your health checks here
  Promise.all([
    checkDatabase(),
    checkRedis(),
    checkExternalAPIs(),
  ]).then(([db, redis, apis]) => {
    checks.database = db ? 'healthy' : 'unhealthy';
    checks.redis = redis ? 'healthy' : 'unhealthy';
    checks.external_apis = apis ? 'healthy' : 'unhealthy';

    const overall = Object.values(checks).every(status => status === 'healthy');

    res.status(overall ? 200 : 503).json({
      status: overall ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    });
  });
});
```

## 📋 Migration Guide

### From Existing Express Apps
1. **Install middleware**: `npm install @conference-app/shared-middleware`
2. **Replace existing middleware** with shared components
3. **Add observability** (tracing, metrics)
4. **Implement error handling** patterns
5. **Test and deploy** incrementally

### Service-by-Service Migration
```typescript
// Step 1: Add basic middleware
import { createMiddlewareStack } from '@conference-app/shared-middleware';
const middleware = createMiddlewareStack('my-service');

// Step 2: Replace authentication
// OLD: app.use(customAuthMiddleware)
// NEW: app.use(middleware.auth.required())

// Step 3: Add observability
app.use(middleware.tracing);
app.use(middleware.metrics);

// Step 4: Add rate limiting
app.use(middleware.rateLimit.perUser(1000, 60 * 60 * 1000));

// Step 5: Centralize error handling
app.use(middleware.error.notFound);
app.use(middleware.error.handler);
```

## 🤝 Contributing

When adding new middleware:
1. Follow the established patterns in existing middleware
2. Include comprehensive TypeScript types
3. Add detailed documentation and examples
4. Implement proper error handling and logging
5. Include unit tests and integration tests
6. Update this README with usage examples

## 📚 API Reference

For detailed API documentation, see the individual middleware files:
- [`auth.ts`](./auth.ts) - Authentication and authorization
- [`tracing.ts`](./tracing.ts) - Distributed tracing with OpenTelemetry
- [`metrics.ts`](./metrics.ts) - Prometheus metrics collection
- [`rate-limiting.ts`](./rate-limiting.ts) - Request rate limiting
- [`error-handling.ts`](./error-handling.ts) - Centralized error handling