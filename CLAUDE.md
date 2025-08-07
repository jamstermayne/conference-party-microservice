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
This is a **microservices PWA** for Gamescom 2025 party discovery with:
- **Firebase Functions** (`functions/src/index.ts`) - Consolidated API with comprehensive endpoints
- **PWA Frontend** (`public/`) - Offline-first progressive web app with viral referral system
- **Tool System** (`tools/`) - 10 velocity tools for development automation

### Key Components
- **Consolidated API**: Single `api` function handles all endpoints (/health, /parties, /swipe, /sync, /referral/*)
- **Data Source**: Google Sheets webhook integration (Sheet ID: `1Cq-UcdgtSz2FaROahsj7Db2nmStBFCN97EZzBEHCrKg`)
- **PWA System**: Service worker + manifest + offline search (43KB cache system)
- **Analytics**: Privacy-compliant GDPR/CCPA tracking system
- **Referral System**: World-class viral growth engine with trackable attribution

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

### Frontend (`public/`)
- **Vanilla JavaScript** (no framework dependencies)
- **Modular structure**: Separate files for analytics, PWA, cache utils
- **Mobile-first**: Touch gestures and responsive design
- **Offline-first**: Service worker handles all caching strategies

### Tool System (`tools/`)
- **Node.js scripts** with detailed logging and error handling
- **Data backups**: All generated data saved to `tools/data-backups/`
- **Modular design**: Each tool is standalone with help commands

## Testing Strategy

### API Testing
- **Jest test suite** in `functions/tests/`
- **Integration tests**: Test all API endpoints end-to-end
- **Performance tests**: Response time and load testing
- Run with: `cd functions && npm run test`

### System Testing
- **Health checks**: `npm run firebase:health` tests all 5 endpoints
- **PWA testing**: Service worker and offline functionality
- **Analytics testing**: Privacy compliance and tracking accuracy

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

### Critical Reminders
- **Webhook expires**: January 6, 2025 - needs renewal
- **GitHub Codespaces only**: No local development setup
- **Tool system**: Use `npm run [tool]:help` for any tool guidance
- **Architecture**: Consolidated from 8 functions to 3 for better performance