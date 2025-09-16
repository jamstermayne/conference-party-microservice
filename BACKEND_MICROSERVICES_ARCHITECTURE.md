# 🏗️ Backend Microservices Architecture
## From Monolithic Firebase Function to Surgical Microservices

### Current Backend Analysis
**Problem**: Single monolithic Firebase Function with 50+ TypeScript files
- **One Express app** handling all domains (auth, events, matchmaking, calendar, etc.)
- **Shared dependencies** across all features
- **No isolation** - changing auth affects parties affects matchmaking
- **Single deployment** - deploy everything or nothing
- **Shared database** - coupling through Firestore collections

---

## 🎯 Microservices Architecture Design

### Core Principle: Domain-Driven Services
Each microservice owns its **complete domain** with:
- Own database/data store
- Own deployment pipeline
- Own scaling characteristics
- Own technology stack
- Zero shared dependencies

### Service Architecture Overview
```
API Gateway (Kong/CloudFlare)
├── Authentication Service     (auth.api.conference-app.com)
├── Events Service            (events.api.conference-app.com)
├── Matchmaking Service       (matchmaking.api.conference-app.com)
├── Calendar Service          (calendar.api.conference-app.com)
├── Notifications Service     (notifications.api.conference-app.com)
├── Analytics Service         (analytics.api.conference-app.com)
└── File Storage Service      (files.api.conference-app.com)
```

---

## 🔐 Authentication Service
**Domain**: User identity and session management

### Technology Stack:
- **Runtime**: Node.js + Express
- **Database**: Firebase Auth + PostgreSQL (user profiles)
- **Cache**: Redis (sessions)
- **Hosting**: Google Cloud Run

### Responsibilities:
- ✅ User registration/login
- ✅ JWT token generation/validation
- ✅ OAuth integration (LinkedIn, Google)
- ✅ Magic link authentication
- ✅ Session management
- ✅ User profile storage

### API Interface:
```typescript
// POST /auth/login
interface LoginRequest {
  email: string;
  password: string;
}

// POST /auth/register
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  company?: string;
}

// GET /auth/profile
interface UserProfile {
  id: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
  createdAt: string;
  lastLoginAt: string;
}

// POST /auth/refresh
interface RefreshRequest {
  refreshToken: string;
}
```

### Database Schema:
```sql
-- PostgreSQL
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  role VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Events Published:
```typescript
// To Event Bus (Apache Kafka/Google Pub/Sub)
interface AuthEvents {
  'user.registered': { userId: string, email: string }
  'user.login': { userId: string, timestamp: string }
  'user.logout': { userId: string, sessionId: string }
  'user.profile_updated': { userId: string, changes: object }
}
```

---

## 🎉 Events Service
**Domain**: Event discovery and management

### Technology Stack:
- **Runtime**: Node.js + Express
- **Database**: MongoDB (flexible event schema)
- **Cache**: Redis (event lists, search results)
- **Search**: Elasticsearch (full-text search)
- **Hosting**: Google Cloud Run

### Responsibilities:
- ✅ Event CRUD operations
- ✅ Event search and filtering
- ✅ Event recommendations
- ✅ User saved events
- ✅ Event capacity management
- ✅ Venue information

### API Interface:
```typescript
// GET /events?location=berlin&date=2025-03-15
interface EventsQuery {
  location?: string;
  date?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

// POST /events
interface CreateEventRequest {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: {
    name: string;
    address: string;
    coordinates: { lat: number, lng: number };
  };
  capacity?: number;
  tags: string[];
  ticketPrice?: number;
}

// POST /events/{id}/save
interface SaveEventRequest {
  userId: string; // From JWT
}
```

### Database Schema:
```javascript
// MongoDB
{
  _id: ObjectId,
  title: String,
  description: String,
  date: ISODate,
  startTime: String,
  endTime: String,
  venue: {
    name: String,
    address: String,
    coordinates: {
      type: "Point",
      coordinates: [lng, lat]
    }
  },
  capacity: Number,
  attendeeCount: Number,
  tags: [String],
  ticketPrice: Number,
  createdBy: String, // userId
  createdAt: ISODate,
  updatedAt: ISODate,
  isActive: Boolean
}

// User saved events
{
  _id: ObjectId,
  userId: String,
  eventId: ObjectId,
  savedAt: ISODate
}
```

---

## 🤝 Matchmaking Service
**Domain**: Professional networking and AI matching

### Technology Stack:
- **Runtime**: Python + FastAPI (for ML/AI capabilities)
- **Database**: PostgreSQL (relational data) + Vector DB (Pinecone/Weaviate)
- **ML**: TensorFlow/PyTorch for matching algorithms
- **Cache**: Redis (match results)
- **Hosting**: Google Cloud Run

### Responsibilities:
- ✅ User profile creation
- ✅ Matching algorithm execution
- ✅ Connection requests/approvals
- ✅ Match scoring and recommendations
- ✅ Professional networking preferences

### API Interface:
```python
# POST /matchmaking/profile
class ProfileRequest(BaseModel):
    user_id: str
    business_type: str
    company_size: str
    roles: List[str]
    looking_for: List[str]
    industries: List[str]
    goals: List[str]

# GET /matchmaking/matches/{user_id}
class MatchResponse(BaseModel):
    matches: List[Match]

class Match(BaseModel):
    user_id: str
    score: float
    reasons: List[str]
    mutual_interests: List[str]
    availability_overlap: float

# POST /matchmaking/connect
class ConnectionRequest(BaseModel):
    from_user_id: str
    to_user_id: str
    message: Optional[str]
```

### Database Schema:
```sql
-- PostgreSQL
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Links to auth service
  business_type VARCHAR(50),
  company_size VARCHAR(20),
  roles JSONB, -- ["developer", "cto"]
  looking_for JSONB, -- ["investors", "partners"]
  industries JSONB,
  goals JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  UNIQUE(from_user_id, to_user_id)
);

-- Vector embeddings for ML matching
CREATE TABLE user_embeddings (
  user_id UUID PRIMARY KEY,
  embedding_vector VECTOR(512), -- For similarity search
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📅 Calendar Service
**Domain**: Calendar integration and scheduling

### Technology Stack:
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL (scheduled events)
- **External APIs**: Google Calendar, Outlook, iCal
- **Queue**: Redis (background sync jobs)
- **Hosting**: Google Cloud Run

### Responsibilities:
- ✅ Calendar integration (Google, Outlook)
- ✅ Event export to calendar
- ✅ Meeting scheduling
- ✅ Availability checking
- ✅ Reminder management

### API Interface:
```typescript
// POST /calendar/sync
interface CalendarSyncRequest {
  userId: string;
  provider: 'google' | 'outlook';
  authCode: string;
}

// POST /calendar/add-event
interface AddEventRequest {
  userId: string;
  eventId: string; // From events service
  reminderMinutes?: number[];
}

// GET /calendar/availability/{userId}
interface AvailabilityResponse {
  availableSlots: TimeSlot[];
  busySlots: TimeSlot[];
}

interface TimeSlot {
  start: string; // ISO datetime
  end: string;
}
```

---

## 🔔 Notifications Service
**Domain**: Multi-channel notifications

### Technology Stack:
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL (notification preferences)
- **Queue**: Redis (notification queue)
- **External**: SendGrid (email), FCM (push), Twilio (SMS)
- **Hosting**: Google Cloud Run

### Responsibilities:
- ✅ Email notifications
- ✅ Push notifications
- ✅ SMS notifications (premium)
- ✅ In-app notifications
- ✅ Notification preferences
- ✅ Template management

---

## 📊 Analytics Service
**Domain**: Business intelligence and metrics

### Technology Stack:
- **Runtime**: Python + FastAPI
- **Database**: ClickHouse (time-series analytics)
- **Processing**: Apache Kafka + Kafka Streams
- **Visualization**: Grafana/custom dashboards
- **Hosting**: Google Cloud Run

### Responsibilities:
- ✅ Event tracking (user actions)
- ✅ Business metrics calculation
- ✅ Real-time dashboards
- ✅ A/B testing infrastructure
- ✅ Performance monitoring

---

## 🌐 API Gateway & Service Mesh

### API Gateway (Kong/CloudFlare)
```yaml
# Kong Configuration
services:
  - name: auth-service
    url: https://auth-service-hash-uc.a.run.app

  - name: events-service
    url: https://events-service-hash-uc.a.run.app

routes:
  - name: auth-routes
    service: auth-service
    paths: ["/api/auth"]

  - name: events-routes
    service: events-service
    paths: ["/api/events"]

plugins:
  - name: rate-limiting
    config:
      minute: 100

  - name: jwt
    config:
      secret_is_base64: false

  - name: cors
    config:
      origins: ["https://conference-party-app.web.app"]
```

### Service Discovery
```typescript
// service-registry.ts
interface ServiceRegistry {
  auth: "https://auth-service-hash-uc.a.run.app";
  events: "https://events-service-hash-uc.a.run.app";
  matchmaking: "https://matchmaking-service-hash-uc.a.run.app";
  calendar: "https://calendar-service-hash-uc.a.run.app";
  notifications: "https://notifications-service-hash-uc.a.run.app";
  analytics: "https://analytics-service-hash-uc.a.run.app";
}
```

---

## 🔄 Inter-Service Communication

### Event-Driven Architecture
```typescript
// Event Bus (Google Pub/Sub)
interface EventBus {
  // Authentication events
  publish('user.registered', { userId, email }): void;
  publish('user.login', { userId, timestamp }): void;

  // Events service events
  publish('event.created', { eventId, createdBy }): void;
  publish('event.saved', { eventId, userId }): void;

  // Matchmaking events
  publish('connection.requested', { fromUserId, toUserId }): void;
  publish('connection.accepted', { connectionId }): void;
}

// Service subscriptions
class EventsService {
  constructor() {
    // Listen for new users to send welcome recommendations
    EventBus.subscribe('user.registered', this.sendWelcomeEvents);
  }
}

class MatchmakingService {
  constructor() {
    // Listen for event saves to improve recommendations
    EventBus.subscribe('event.saved', this.updateUserInterests);
  }
}
```

### Synchronous Communication (Service-to-Service)
```typescript
// Service clients with circuit breakers
class AuthClient {
  async validateToken(token: string): Promise<User | null> {
    return this.circuitBreaker.execute(async () => {
      const response = await fetch(`${AUTH_SERVICE_URL}/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.json();
    });
  }
}
```

---

## 🗄️ Database Strategy

### Database per Service
```typescript
// Each service owns its data completely
interface DatabaseStrategy {
  auth: {
    type: "PostgreSQL";
    purpose: "User profiles and sessions";
    tables: ["users", "user_sessions", "oauth_tokens"];
  };

  events: {
    type: "MongoDB";
    purpose: "Flexible event schema and search";
    collections: ["events", "saved_events", "venues"];
  };

  matchmaking: {
    type: "PostgreSQL + Vector DB";
    purpose: "Relational data + ML embeddings";
    tables: ["user_profiles", "connections", "user_embeddings"];
  };

  calendar: {
    type: "PostgreSQL";
    purpose: "Calendar integrations and sync";
    tables: ["calendar_auths", "synced_events", "availability"];
  };

  notifications: {
    type: "PostgreSQL";
    purpose: "Notification preferences and history";
    tables: ["user_preferences", "notification_log", "templates"];
  };

  analytics: {
    type: "ClickHouse";
    purpose: "Time-series analytics and metrics";
    tables: ["events", "user_actions", "business_metrics"];
  };
}
```

### Data Consistency Strategy
```typescript
// Eventual consistency via events
interface DataSync {
  // When user updates profile in auth service
  authService.updateProfile() => {
    // Update local auth database
    await db.users.update(userId, profileData);

    // Publish event for other services
    EventBus.publish('user.profile_updated', {
      userId,
      changes: profileData
    });
  }

  // Matchmaking service listens and updates its copy
  matchmakingService.onUserProfileUpdated() => {
    await db.user_profiles.update(userId, relevantChanges);
  }
}
```

---

## 🚀 Deployment Architecture

### Container Strategy
```dockerfile
# Each service gets its own container
# auth-service/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

### Google Cloud Run Deployment
```yaml
# auth-service/deploy.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: auth-service
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "100"
    spec:
      containers:
      - image: gcr.io/project/auth-service:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: database_url
```

### Independent CI/CD Pipelines
```yaml
# .github/workflows/auth-service.yml
name: Auth Service Deploy
on:
  push:
    paths: ['services/auth/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Auth Service
        run: |
          cd services/auth
          npm ci
          npm run build
          npm test
      - name: Deploy to Cloud Run
        run: gcloud run deploy auth-service --source services/auth/
```

---

## 🔧 Development Workflow

### Local Development
```bash
# Start all services locally with Docker Compose
docker-compose up

# Or develop single service
cd services/auth
npm run dev     # Runs on port 3001

cd services/events
npm run dev     # Runs on port 3002

# API Gateway runs on port 8080 and routes to services
```

### Service Development
```bash
# Work on auth service only
cd services/auth
npm run dev         # Hot reload
npm run test        # Unit tests
npm run test:e2e    # Service integration tests
npm run build       # Build for production
npm run deploy      # Deploy to staging/prod
```

### Testing Strategy
```typescript
// Unit tests per service
describe('AuthService', () => {
  test('should authenticate valid user', async () => {
    // Test auth service in isolation
  });
});

// Integration tests between services
describe('Service Integration', () => {
  test('should sync user profile between auth and matchmaking', async () => {
    // Test event-driven communication
  });
});

// End-to-end tests
describe('Complete User Journey', () => {
  test('should register, create profile, and find matches', async () => {
    // Test entire flow across all services
  });
});
```

---

## 📊 Monitoring & Observability

### Service Health Monitoring
```typescript
// Each service exposes health endpoints
app.get('/health', (req, res) => {
  res.json({
    service: 'auth-service',
    status: 'healthy',
    version: process.env.SERVICE_VERSION,
    uptime: process.uptime(),
    database: await checkDatabaseHealth(),
    dependencies: await checkDependencies()
  });
});
```

### Distributed Tracing
```typescript
// OpenTelemetry for request tracing across services
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('auth-service');

app.post('/login', async (req, res) => {
  const span = tracer.startSpan('user-login');

  try {
    // Login logic with tracing
    const user = await authenticateUser(req.body);
    span.setTag('user.id', user.id);

    res.json({ user });
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
});
```

---

## 🎯 Migration Strategy

### Phase 1: Service Extraction (Strangler Fig)
```bash
# Week 1: Extract Auth Service
# Create new auth-service alongside existing monolith
# Route /api/auth to new service, everything else to monolith

# Week 2: Extract Events Service
# Create events-service
# Route /api/events to new service

# Continue until monolith is empty
```

### Phase 2: Database Decomposition
```bash
# Gradually move data from shared Firestore to service-specific databases
# Use event sourcing for data synchronization
# Maintain backward compatibility during transition
```

### Phase 3: Full Microservices
```bash
# All services independent
# API Gateway handles all routing
# Event bus handles all inter-service communication
# Monolith decommissioned
```

---

## 🎉 End Result: Perfect Surgical Backend

### Before (Monolith):
```bash
# Change auth logic
vi functions/src/middleware/auth.ts
npm run build           # 2min - builds everything
npm run deploy          # 5min - deploys everything (high risk)
```

### After (Microservices):
```bash
# Change auth logic
cd services/auth
vi src/auth.ts
npm run build           # 30s - builds only auth
npm run deploy          # 1min - deploys only auth (zero risk)
```

### Surgical Benefits:
- **Build Time**: 90% reduction (2min → 30s)
- **Deploy Risk**: 100% reduction (everything → only auth)
- **Team Autonomy**: Auth team owns auth service completely
- **Technology Flexibility**: Each service can use different tech stack
- **Independent Scaling**: Scale auth service separately from events
- **Zero Coupling**: Auth changes never affect events or matchmaking

Each microservice becomes **100% autonomous** with its own:
- Codebase and repository
- Database and data ownership
- Technology stack choice
- Deployment pipeline
- Scaling characteristics
- Team ownership

This achieves true **"1 Function, 1 Thing"** on the backend where changing authentication has **zero impact** on events, matchmaking, calendar, or any other service.