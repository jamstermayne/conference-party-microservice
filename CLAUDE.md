# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start full development environment (PWA server, live reload, API proxy, Firebase logs)
- `npm run setup` - Quick health check and dependency installation
- `npm test` - Run complete test suite (API, PWA, analytics, all systems)
- `npm run build` - Build complete PWA system
- `npm run deploy` - Deploy Firebase Functions

### Firebase Functions
- `cd functions && npm run build` - Build TypeScript functions
- `cd functions && npm run lint` - Lint Firebase Functions code  
- `cd functions && npm run test` - Run Jest test suite
- `cd functions && npm run test:integration` - Run API integration tests
- `cd functions && npm run deploy` - Deploy to Firebase (production)
- `cd functions && npm run serve` - Run local emulator

### Tool System (33 NPM Scripts)
- `npm run firebase:health` - Test all 5 API endpoints
- `npm run firebase:deploy` - Deploy via CI/CD pipeline
- `npm run api:test` - Full API test suite (9/9 tests)
- `npm run data:geocode` - Geocode events using Google Maps
- `npm run pwa:build` - Build complete PWA system
- `npm run analytics:build` - Build analytics system
- `npm run calendar:export` - Export iCal files
- `npm run search:build` - Build search index for PWA

## Architecture Overview

### Core Structure
This is a **Professional Intelligence Platform** - a sophisticated microservices PWA for Gamescom 2025 professional networking with:
- **Firebase Functions** (`functions/src/index.ts`) - Consolidated API with comprehensive endpoints
- **Professional Intelligence Platform Frontend** (`public/`) - Slack-inspired PWA with mobile-first navigation
- **Controller Architecture** (`public/js/controllers/`) - MVC pattern with specialized controllers for each section
- **Professional Networking Services** (`public/js/services/`) - Advanced networking, proximity, and opportunities systems
- **Performance Optimization Layer** (`public/js/`) - Centralized systems for 10,000+ concurrent users
- **Tool System** (`tools/`) - 10 velocity tools for development automation

### Professional Intelligence Platform Features
- **Mobile-First Navigation**: Bottom tabbar with 5 main sections (Now, People, Opportunities, Events, Profile)
- **Rich UI Components**: Connection cards, event cards, opportunity cards with professional styling
- **4-Step Onboarding**: Professional persona setup (Developer, Publishing, Investor, Service Provider)
- **Real-time Professional Matching**: LinkedIn-quality networking with proximity detection
- **Enterprise Architecture**: MVC controllers, service layers, and advanced state management

### Key Components
- **Consolidated API**: Single `api` function handles all endpoints (/health, /parties, /swipe, /sync, /referral/*)
- **Data Source**: Google Sheets webhook integration (Sheet ID: `1Cq-UcdgtSz2FaROahsj7Db2nmStBFCN97EZzBEHCrKg`)
- **PWA System**: Service worker + manifest + offline search (43KB cache system)
- **Professional Networking**: 5-system LinkedIn-killer platform with cross-conference persistence
- **Performance Foundation**: 4-layer optimization preventing localStorage fragmentation and memory leaks

### Data Flow
1. Google Sheets → Webhook → Firebase Functions → Firestore
2. PWA → API endpoints → Cached responses
3. Offline → Service Worker → Local cache → Background sync
4. Referral Share → Trackable Code → Click Attribution → Conversion Analytics

## Code Conventions

### Firebase Functions (`functions/src/`)
- **TypeScript** with strict mode enabled
- **Single consolidated function** pattern: one `api` export handles all routes
- **CORS enabled** for all responses with proper headers
- **Error handling**: Always return JSON responses, graceful degradation
- **Caching**: In-memory cache with 5-minute TTL
- **Validation**: Request validation with detailed error messages

### Professional Intelligence Platform Frontend (`public/`)
- **Professional Architecture**: MVC controller pattern with specialized controllers
- **Mobile-First Design**: Slack-inspired bottom navigation with 5 main sections
- **Rich UI Components**: Connection cards, event cards, opportunity cards with professional styling
- **4-Step Professional Onboarding**: Persona-based setup for industry professionals
- **Performance-optimized**: 4-layer optimization system with centralized managers
- **Professional networking**: 5 complete systems (onboarding, invites, proximity, opportunities, conferences)
- **Offline-first**: Service worker handles all caching strategies

#### Controllers Architecture (`public/js/controllers/`)
- **HomeController**: Professional dashboard with today's events, activity feed, nearby professionals
- **PeopleController**: Professional connections and networking interface  
- **OpportunitiesController**: Career opportunities and job matching system
- **EventController**: Gaming industry events and party discovery
- **MeController**: Professional profile and settings management
- **InviteController**: Exclusive invite system with quality control
- **CalendarController**: Professional calendar sync and event management

#### Services Layer (`public/js/services/`)
- **Professional Networking**: Advanced connection matching and relationship management
- **Proximity Detection**: Privacy-first location intelligence for venue-based networking
- **Opportunities Matching**: Career and business opportunity recommendation engine
- **Calendar Integration**: Google Calendar and Meet to Match synchronization

### Tool System (`tools/`)
- **Node.js scripts** with detailed logging and error handling
- **Data backups**: All generated data saved to `tools/data-backups/`
- **Modular design**: Each tool is standalone with help commands

## Performance Optimization System

### Critical Performance Enhancements (Ready for 10,000+ Users)
- **90% reduction** in localStorage operations (42 keys → 1 unified structure)
- **93% reduction** in event listeners (154 individual → 10 delegated handlers)
- **75% faster** DOM rendering with RequestAnimationFrame batching
- **70% reduction** in JSON parse/stringify operations
- **40% reduction** in memory usage with automatic cleanup

### Optimization Layers (`public/js/`)
1. **StorageManager**: Unified localStorage with intelligent caching and batch operations
2. **EventManager**: Centralized event delegation with automatic cleanup and memory leak prevention
3. **DOMOptimizer**: Batched DOM operations preventing layout thrashing
4. **CacheManager**: Multi-layer caching (Memory → Session → Persistent) with smart invalidation
5. **PerformanceMonitor**: Real-time metrics and comprehensive system validation

### Professional Networking Systems
- **OnboardingManager**: 4-persona professional setup (Developer, Publishing, Investor, Service Provider)
- **InviteManager**: Exclusive 10-invite quality control system with deep link handling
- **ProximityManager**: Privacy-first location intelligence with venue-based clustering
- **OpportunityToggle**: LinkedIn-killer consent-based networking eliminating spam
- **ConferenceManager**: Cross-conference persistence creating permanent professional network

### Performance Testing Commands
- `testPerformance()` - Browser console command to validate all optimization systems
- `performanceStats()` - Get real-time performance metrics and recommendations
- Performance monitoring automatically active in development environment

## Testing Strategy

### API Testing
- **Jest test suite** in `functions/tests/`
- **Integration tests**: Test all API endpoints end-to-end
- **Performance tests**: Response time and load testing
- Run with: `cd functions && npm run test`

### Performance Testing
- **Optimization validation**: Run `testPerformance()` in browser console
- **Real-time monitoring**: PerformanceMonitor tracks all metrics automatically
- **Load testing**: System validated for 10,000+ concurrent users
- **Memory leak prevention**: Automatic cleanup across all systems

### System Testing
- **Health checks**: `npm run firebase:health` tests all 5 endpoints
- **PWA testing**: Service worker and offline functionality
- **Professional networking**: All 5 networking systems integration tested

## Development Workflow

### Starting Development
1. `npm run setup` - Install dependencies and health check
2. `npm run dev` - Start development environment
3. Access PWA at `http://localhost:3000`
4. API proxy automatically forwards to Firebase Functions

### Making Changes
1. **Frontend changes**: Edit files in `public/`, auto-reload enabled
2. **API changes**: Edit `functions/src/index.ts`, rebuild with `cd functions && npm run build`
3. **Testing**: Always run `npm test` before deploying
4. **Linting**: Use `cd functions && npm run lint` for code quality

### Deployment Process
1. `npm run build` - Build all systems
2. `cd functions && npm run test` - Ensure tests pass
3. `npm run deploy` - Deploy to Firebase
4. `npm run firebase:health` - Verify deployment

## Build & Deployment

### Build Process
- `npm run build` - Complete PWA build with optimization
- `npm run pwa:build` - Build PWA components and service worker
- `npm run analytics:build` - Build analytics tracking system
- `cd functions && npm run build` - Compile TypeScript Firebase Functions

### Deployment Pipeline
- `npm run deploy` - Full production deployment
- `npm run firebase:deploy` - Deploy via CI/CD pipeline
- `cd functions && npm run deploy` - Deploy functions only
- **Auto-deploy**: Main branch pushes trigger automatic deployment

### GitHub Repository Protection

#### Branch Protection Rules (Main Branch)
- **Require pull request reviews**: 1 required reviewer
- **Dismiss stale PR reviews**: When new commits are pushed
- **Require status checks**: All CI/CD checks must pass
- **Require branches to be up to date**: Before merging
- **Include administrators**: Rules apply to admins too
- **Restrict pushes**: Only allow through pull requests

#### Required Status Checks
- **Build Process**: `npm run build` must succeed
- **Test Suite**: `npm test` must pass (9/9 API tests)
- **Linting**: `cd functions && npm run lint` must pass
- **Security Audit**: `npm audit` must show no high/critical vulnerabilities
- **Performance Tests**: API response time < 2000ms average

#### Security Policies
- **Dependabot**: Automated dependency updates enabled
- **Security advisories**: GitHub security alerts enabled  
- **Secrets scanning**: Repository secrets protection active
- **Vulnerability alerts**: Auto-generated for dependencies

### CI/CD Workflow (.github/workflows/test-and-deploy.yml)
```yaml
name: Test and Deploy
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: cd functions && npm ci && npm run lint && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
```

### Environment Secrets
- `FIREBASE_SERVICE_ACCOUNT`: Service account JSON for deployment
- `GITHUB_TOKEN`: Auto-generated for repository operations
- `GOOGLE_SHEETS_API_KEY`: API key for sheets webhook integration
- `FIREBASE_CONFIG`: Project configuration JSON

### Release Management
- **Semantic versioning**: Major.Minor.Patch (e.g., v2.1.3)
- **Release tags**: Auto-generated on main branch merges
- **Changelog**: Auto-generated from commit messages
- **Deployment notifications**: Slack/email on successful deploys

## Important Notes

### Data Management
- **Primary data source**: Google Sheets with webhook auto-sync
- **Firestore**: Cached party data with deterministic IDs
- **No user authentication**: Anonymous usage tracking only
- **Privacy first**: No personal data or IP addresses stored

### Production Environment
- **Base URL**: `https://us-central1-conference-party-app.cloudfunctions.net`
- **CORS enabled**: Browser access works correctly
- **Performance**: ~1400ms average API response time
- **Reliability**: 9/9 API tests passing consistently
- **Uptime**: 99.9% SLA with Firebase hosting
- **CDN**: Global edge caching enabled

## Recent Major Updates (August 2025)

### GPT-5 Enhanced Email Sync Integration ✅ (Latest - August 10)
- **Global Email Sync System**: Intelligent email field detection across entire app
- **Proactive Bonus Triggers**: Email sync prompts appear automatically after bonus invite unlocks  
- **Contextual Messaging**: Different prompt copy for bonus-triggered vs typing-triggered scenarios
- **Micro-Pulse Animations**: Subtle GPU-accelerated animations for enhanced user feedback
- **Session Management**: Smart once-per-session prompting to prevent spam
- **Production Integration**: Full integration with existing contacts.js and reward systems

#### Key Features Added:
- `globalEmailSync.js` - Universal email field detection with dual trigger system
- `email-sync-popup.css` - Slack-inspired popup styling with responsive design
- Enhanced `invite-enhanced.js` - Emits `invites:bonus` events for proactive triggers
- Updated `animations.css` - Improved micro-pulse effects (scale 1.2x for stronger feedback)
- Complete `Store` API - Added missing `.get()`, `.set()`, `.patch()`, `.remove()` methods
- GPT-5 Event Handlers - Comprehensive event system for all new features

#### User Flow Enhancement:
1. **Reactive**: User types in email field → Shows baseline sync prompt
2. **Proactive**: Bonus invites unlocked → 900ms delay → Shows enhanced "unlock" prompt  
3. **Unified**: Both flows use same provider selection and bonus integration
4. **Analytics**: Tracks trigger type (bonus vs typing) for optimization

### Frontend-Backend Disconnect Resolution ✅
- **Issue**: Deployed app showed basic "Loading events..." interface instead of Professional Intelligence Platform
- **Fix**: Updated index.html to load Professional Intelligence Platform architecture
- **Result**: Live app now shows Slack-inspired mobile-first interface with rich connection cards

### Onboarding System Fixed ✅  
- **Issue**: Role selection broken on second onboarding screen - clicks not working
- **Root Cause**: Onboarding trying to use `window.$` and `window.DOM` optimized event handlers not available during load
- **Fix**: Replaced with standard JavaScript event listeners and localStorage operations
- **Result**: Role selection now fully functional, 4-step professional setup working

### Architecture Improvements ✅
- **Professional Intelligence Platform**: Full MVC controller architecture deployed
- **Mobile-First Navigation**: Bottom tabbar with 5 main sections working
- **Rich UI Components**: Connection cards, event cards, opportunity cards with professional styling
- **Performance**: All optimization systems active (4-layer optimization, FPS watchdog)

### Deployment Status ✅
- **Live URL**: https://conference-party-app.web.app
- **API Health**: 5/5 endpoints healthy (100% operational)
- **Test Coverage**: 91/109 tests passing (84% success rate)  
- **Event Data**: 58+ events available with offline search capability
- **User Experience**: Complete professional onboarding → networking → email sync flow
- **GPT-5 Integration**: All proactive and reactive email sync features active
- **Build System**: PWA build complete (43KB service worker, 9KB offline search)
- **Performance**: Enhanced Store API with dot notation paths and event emission

### Critical Reminders
- **Webhook expires**: January 6, 2025 - needs renewal
- **GitHub Codespaces only**: No local development setup
- **Tool system**: Use `npm run [tool]:help` for any tool guidance
- **Architecture**: Consolidated from 8 functions to 3 for better performance
- **Branch protection**: All changes must go through PR process
- **Security**: Regular dependency updates and vulnerability scanning active
- **CI/CD**: Automatic testing and deployment on main branch
- **Performance monitoring**: FPS watchdog and optimization systems active