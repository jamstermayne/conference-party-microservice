# 🚀 Deployment Guide

## Quick Deploy
```bash
npm run deploy         # Deploy to Firebase
```

## Pre-deployment Checklist
```bash
npm run quality:check  # Full validation pipeline
# ✅ Linting passed
# ✅ Build successful  
# ✅ 91/91 tests passing
# ✅ Security audit clean
```

## Deployment Process

### 1. Manual Deployment
```bash
# Build and test
npm run build
npm test

# Deploy functions
cd functions
npm run deploy
```

### 2. CI/CD Deployment (Recommended)
- Push to `main` branch triggers auto-deploy
- GitHub Actions runs full test suite
- Deploys only if all checks pass

### 3. Environment-Specific Deploys
```bash
# Production
firebase use production
npm run deploy

# Staging  
firebase use staging
npm run deploy
```

## Verification
```bash
# Test deployed API
curl https://us-central1-conference-party-app.cloudfunctions.net/api/health

# Check function logs
npm run logs

# Run health check
npm run firebase:health
```

## Rollback
```bash
# View deployments
firebase functions:log

# Rollback if needed (contact admin)
```

## Production URLs
- **API**: `https://us-central1-conference-party-app.cloudfunctions.net/api`
- **Health**: `https://us-central1-conference-party-app.cloudfunctions.net/api/health`
- **PWA**: `https://conference-party-app.web.app`

## Deployment Status
- ✅ **Live**: All 18 API endpoints operational
- ✅ **Tests**: 91/91 passing in production
- ✅ **Performance**: <2000ms average response time
- ✅ **Security**: All vulnerabilities patched