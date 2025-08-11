# 🚀 Run Guide

## Development Server
```bash
npm run dev            # Full development stack
# Starts: TypeScript watch + Firebase emulators
```

## Individual Services
```bash
npm run serve          # Firebase emulators only
npm run build:watch    # TypeScript watch mode
npm start             # Firebase functions shell
```

## Local Testing
```bash
# API available at:
http://localhost:5001/conference-party-app/us-central1/api

# Test endpoints:
curl http://localhost:5001/conference-party-app/us-central1/api/health
curl http://localhost:5001/conference-party-app/us-central1/api/parties
```

## Environment Setup
1. **First time setup**:
   ```bash
   npm install
   npm run build
   ```

2. **Start development**:
   ```bash
   npm run dev
   ```

3. **Access services**:
   - Functions: `http://localhost:5001`
   - Firestore UI: `http://localhost:4000`
   - Functions logs: `firebase functions:log`

## Testing While Running
```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:api      # API tests only
```

## Environment Variables
- Development: Uses `.env`
- Testing: Uses `.env.test`
- Copy `.env.example` for custom configuration