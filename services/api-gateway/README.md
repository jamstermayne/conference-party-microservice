# API Gateway Service

## Overview
Central entry point for all microservices in the Conference Party platform. Handles request routing, authentication, rate limiting, caching, and circuit breaking.

## Architecture

### Core Components

#### 1. Service Registry (`services/service-registry.ts`)
- **Purpose**: Service discovery and health monitoring
- **Features**:
  - Dynamic service registration
  - Periodic health checks (every 30 seconds)
  - Service status tracking
- **Single Responsibility**: Service discovery

#### 2. Circuit Breaker (`services/circuit-breaker.ts`)
- **Purpose**: Prevent cascading failures
- **States**: CLOSED → OPEN → HALF_OPEN
- **Configuration**:
  - Failure threshold: 5 failures
  - Reset timeout: 30 seconds
  - Request timeout: 5 seconds
- **Single Responsibility**: Fault tolerance

#### 3. Cache Manager (`services/cache-manager.ts`)
- **Purpose**: Response caching for performance
- **Features**:
  - In-memory caching (Node-cache)
  - TTL-based expiration
  - Cache key generation
- **Single Responsibility**: Response caching

#### 4. Request Router (`routes/index.ts`)
- **Purpose**: Dynamic request proxying
- **Features**:
  - HTTP proxy middleware
  - Path rewriting
  - Header injection (user ID, tenant ID, trace ID)
- **Single Responsibility**: Request routing

### Middleware Stack

1. **Security** (`helmet`): Security headers
2. **CORS**: Cross-origin resource sharing
3. **Rate Limiting** (`middleware/rate-limiter.ts`): 100 requests per 15 minutes
4. **Request Logging** (`middleware/request-logger.ts`): Winston logging
5. **Authentication** (`middleware/auth.ts`): JWT verification
6. **Error Handling** (`middleware/error-handler.ts`): Global error handler

## Services Configuration

```javascript
{
  matchmaking: 'http://localhost:3001',
  icons: 'http://localhost:3002',
  auth: 'http://localhost:3003',
  analytics: 'http://localhost:3004',
  notifications: 'http://localhost:3005'
}
```

## API Endpoints

### Gateway Management
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health status
- `GET /api/gateway/info` - Gateway status and metrics

### Service Proxies
- `/api/matchmaking/*` → Matchmaking Service
- `/api/icons/*` → Icons Service
- `/api/auth/*` → Authentication Service
- `/api/analytics/*` → Analytics Service
- `/api/notifications/*` → Notifications Service

## Request Flow

1. **Request arrives** at API Gateway
2. **Rate limiter** checks request limits
3. **Request logger** logs incoming request
4. **Authentication** verifies JWT token (if required)
5. **Cache check** for GET requests
6. **Service registry** finds target service
7. **Circuit breaker** checks service health
8. **Proxy** forwards request to microservice
9. **Response caching** for successful GET responses
10. **Response** sent to client

## Features

### Dynamic Service Discovery
- Services register on startup
- Health checks every 30 seconds
- Automatic failover for unhealthy services

### Circuit Breaker Pattern
- Prevents cascading failures
- Automatic recovery after timeout
- Three states: CLOSED, OPEN, HALF_OPEN

### Response Caching
- Automatic caching of GET responses
- TTL-based expiration
- Cache key includes service, path, and query params

### Multi-tenancy Support
- Tenant ID injection via headers
- Tenant-based routing
- Isolated tenant data

### Observability
- Request/response logging
- Performance metrics
- Service health monitoring
- Circuit breaker status

## Running the Gateway

### Development
```bash
cd services/api-gateway
npm install
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Environment Variables
```bash
API_GATEWAY_PORT=3000
NODE_ENV=production
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info

# Service URLs
MATCHMAKING_SERVICE_URL=http://matchmaking:3001
ICONS_SERVICE_URL=http://icons:3002
AUTH_SERVICE_URL=http://auth:3003
ANALYTICS_SERVICE_URL=http://analytics:3004
NOTIFICATIONS_SERVICE_URL=http://notifications:3005

# CORS Origins
CORS_ORIGINS=http://localhost:3000,https://app.example.com
```

## Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### Gateway Info
```bash
curl http://localhost:3000/api/gateway/info
```

### Authenticated Request
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/matchmaking/profiles
```

## Monitoring

### Metrics Tracked
- Request count per service
- Response times
- Cache hit/miss ratio
- Circuit breaker triggers
- Error rates

### Health Indicators
- Service availability
- Response times
- Memory usage
- Circuit breaker state

## Security

### Authentication
- JWT token verification
- Public paths whitelist
- Token passed to microservices

### Rate Limiting
- Per-IP rate limiting
- Configurable limits
- 429 Too Many Requests response

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Request size limits

## Architecture Principles

### 1. Single Responsibility
Each module has one clear purpose:
- Service Registry: Service discovery
- Circuit Breaker: Fault tolerance
- Cache Manager: Response caching
- Router: Request proxying

### 2. Fault Tolerance
- Circuit breaker prevents cascading failures
- Health checks detect service issues
- Graceful error handling

### 3. Performance
- Response caching reduces backend load
- Connection pooling for efficiency
- Request timeout handling

### 4. Scalability
- Stateless design
- Horizontal scaling ready
- Load balancer compatible

## Next Steps

1. **Add Redis** for distributed caching
2. **Implement WebSocket** proxy support
3. **Add request transformation** capabilities
4. **Implement API versioning**
5. **Add request/response validation**
6. **Implement rate limiting by user/tenant**
7. **Add distributed tracing** (OpenTelemetry)
8. **Implement API documentation** aggregation