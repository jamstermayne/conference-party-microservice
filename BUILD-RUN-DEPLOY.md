# Build, Run & Deploy Guide

## 🚀 Quick Start

```bash
# Install dependencies and verify setup
npm run setup

# Start development server
npm run dev

# Run tests
npm test

# Deploy to production
npm run deploy
```

## 📁 Project Structure

```
conference-party-microservice/
├── frontend/               # Static frontend (PWA)
│   ├── src/               # Source files served directly
│   │   ├── index.html     # Main app entry
│   │   ├── js/           # JavaScript modules
│   │   ├── assets/css/   # Stylesheets
│   │   └── maps.html     # Map view
│   └── test-*.html       # Test pages
├── functions/             # Firebase Functions (API)
│   ├── src/              # TypeScript source
│   │   └── index.ts      # Main API handler
│   └── tests/            # Jest test suite
├── public/               # Legacy PWA files
└── tools/                # Development tools
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm 8+
- GitHub Codespaces (recommended) or local setup

### Local Development

#### 1. Start Frontend Server
```bash
# Simple static server (port 3000)
npm run dev

# Or use Firebase hosting emulator (port 5000)
npm run dev:firebase
```

Access at: `http://localhost:3000`

#### 2. Start Firebase Functions Locally
```bash
# Build and serve functions
cd functions
npm run build
npm run serve
```

API available at: `http://localhost:5001/conference-party-app/us-central1/api`

### Key Development Commands

```bash
# Frontend
npm run dev                 # Start static server
npm run dev:firebase        # Firebase hosting emulator

# Firebase Functions
cd functions
npm run build              # Compile TypeScript
npm run lint               # Lint code
npm run test               # Run Jest tests
npm run serve              # Local emulator

# Testing
npm test                   # Full test suite
npm run firebase:health    # Test API endpoints
npm run api:test          # API integration tests

# Tools
npm run data:geocode      # Geocode event venues
npm run calendar:export   # Generate iCal files
npm run search:build      # Build offline search index
```

## 🏗️ Build Process

### Frontend Build
The frontend is served as static files with no build step required for JavaScript. CSS uses design tokens that are pre-compiled.

```bash
# Build complete PWA system
npm run build

# Individual build tasks
npm run pwa:build         # Service worker & manifest
npm run analytics:build   # Analytics tracking
npm run search:build      # Offline search index
```

### Firebase Functions Build
```bash
cd functions
npm run build             # TypeScript → JavaScript
```

Output: `functions/lib/index.js`

### Design Token System
CSS uses a token-based design system:
- Spacing tokens: `--s-1` through `--s-8`
- Radius tokens: `--r-xs` through `--r-2xl`
- Color tokens: Semantic color variables

Token enforcement via:
```bash
npm run lint:tokens       # Check for hardcoded values
```

## 🚢 Deployment

### Automatic Deployment (CI/CD)
Pushing to `main` branch triggers automatic deployment via GitHub Actions.

```yaml
# .github/workflows/test-and-deploy.yml
on:
  push:
    branches: [main]
```

### Manual Deployment

#### Full Deployment
```bash
# Deploy everything (functions + hosting)
npm run deploy
```

#### Deploy Functions Only
```bash
cd functions
npm run deploy
```

#### Deploy Hosting Only
```bash
firebase deploy --only hosting
```

### Deployment Checklist
- [ ] Run tests: `npm test`
- [ ] Check linting: `cd functions && npm run lint`
- [ ] Verify token compliance: `npm run lint:tokens`
- [ ] Test API health: `npm run firebase:health`
- [ ] Check build: `npm run build`

## 🔍 Testing

### Test Suites
```bash
# All tests
npm test

# Specific test suites
cd functions && npm run test              # Unit tests
cd functions && npm run test:integration   # Integration tests
npm run firebase:health                    # API health checks
npm run api:test                          # Full API test suite
```

### Manual Testing Pages
- `/test-sidebar-velocity.html` - Sidebar styling
- `/test-calendar-integration.html` - Google Calendar OAuth
- `/test-map-pins.html` - Map pin navigation
- `/test-subnav-days.html` - Day navigation
- `/test-sidebar-sync.html` - Active state sync

## 🌍 Environments

### Development
- Frontend: `http://localhost:3000`
- API: `http://localhost:5001/conference-party-app/us-central1/api`
- Firebase Emulator UI: `http://localhost:4000`

### Production
- App: `https://conference-party-app.web.app`
- API: `https://us-central1-conference-party-app.cloudfunctions.net/api`

## 📝 Configuration

### Environment Variables
```bash
# Firebase configuration (auto-detected in Codespaces)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

### Firebase Project
```bash
# View current project
firebase use

# Switch project
firebase use <project-id>
```

### API Configuration
- Google Sheets ID: `1Cq-UcdgtSz2FaROahsj7Db2nmStBFCN97EZzBEHCrKg`
- Conference: `gamescom2025`
- Maps API Key: Restricted to `*.web.app` domains

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
python3 -m http.server 3001 --directory frontend/src
```

#### Firebase Deploy Fails
```bash
# Check authentication
firebase login

# Verify project
firebase use --add

# Check service account
echo $GOOGLE_APPLICATION_CREDENTIALS
```

#### API Not Responding
```bash
# Check health endpoint
curl https://conference-party-app.web.app/api/health

# View function logs
firebase functions:log
```

#### Build Errors
```bash
# Clear caches
rm -rf node_modules functions/node_modules
npm ci
cd functions && npm ci

# Rebuild
npm run build
```

### Debug Commands
```bash
# View Firebase config
firebase functions:config:get

# Test specific endpoint
curl -X GET "https://conference-party-app.web.app/api/parties?conference=gamescom2025"

# Check service worker
# In browser console:
navigator.serviceWorker.getRegistrations()

# Clear all caches
# In browser console:
caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
```

## 📊 Performance Monitoring

### Key Metrics
- API response time: < 2000ms average
- PWA load time: < 3s on 3G
- Lighthouse score: > 90
- Bundle size: < 100KB (excluding maps)

### Monitoring Commands
```bash
# API performance
npm run firebase:health

# In browser console
testPerformance()        # Test optimization systems
performanceStats()       # Get real-time metrics
```

## 🔐 Security

### API Security
- CORS enabled with proper headers
- No authentication required (public data)
- Rate limiting via Firebase
- Input validation on all endpoints

### Frontend Security
- Content Security Policy headers
- XSS protection
- No sensitive data in localStorage
- OAuth tokens handled server-side

## 📚 Additional Resources

- [CLAUDE.md](./CLAUDE.md) - AI assistant instructions
- [Firebase Console](https://console.firebase.google.com)
- [GitHub Repository](https://github.com/jamstermayne/conference-party-microservice)
- [API Documentation](./functions/README.md)

## 🎯 Quick Commands Reference

```bash
# Most common commands
npm run setup            # Initial setup
npm run dev             # Start development
npm test                # Run tests
npm run build           # Build everything
npm run deploy          # Deploy to production

# Troubleshooting
npm run firebase:health  # Check API status
npm run lint:tokens     # Check CSS tokens
npm audit fix           # Fix vulnerabilities
```

---

Last Updated: August 2025