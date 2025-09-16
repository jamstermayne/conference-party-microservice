# API Usage Guide

## Live Data (Production API)
By default, the app connects to the live Firebase Functions API that pulls data from Google Sheets:
- **Endpoint**: `https://us-central1-conference-party-app.cloudfunctions.net/apiFn/api`
- **Data Source**: Google Sheets with real Gamescom 2025 events
- **Usage**: Just navigate to http://localhost:3000 (no parameters needed)

## Local Mock Data (Testing)
To use local mock data instead of the live API:
- **Usage**: Navigate to http://localhost:3000?local=true
- **Purpose**: Testing without hitting the production API
- **Data**: Static mock events in `/frontend/src/api/`

## Quick Test Commands

### Test Live API (default):
```javascript
// In browser console at http://localhost:3000
fetch('https://us-central1-conference-party-app.cloudfunctions.net/apiFn/api/parties?conference=gamescom2025')
  .then(r => r.json())
  .then(data => console.log('Live events:', data.data.length));
```

### Test Local Mock API:
```javascript
// In browser console at http://localhost:3000?local=true
fetch('/api/parties')
  .then(r => r.json())
  .then(data => console.log('Mock events:', data.data.length));
```

## Switching Between APIs

1. **Live Data** (default):
   - http://localhost:3000
   - Uses real Google Sheets data
   - ~58+ live events

2. **Mock Data** (testing):
   - http://localhost:3000?local=true
   - Uses local JSON files
   - 4 sample events

## Troubleshooting

If the live API is slow or unavailable:
1. The app will automatically try backup endpoints
2. You can force local mode with `?local=true`
3. Check API status: https://us-central1-conference-party-app.cloudfunctions.net/apiFn/api/health

## API Endpoints

### Live Production API:
- `/api/parties?conference=gamescom2025` - Get all parties
- `/api/health` - Check API health
- `/api/invites/status` - Get invite status
- `/api/sync` - Sync saved events

### Local Mock API (when using ?local=true):
- `/api/parties` - Mock party data
- `/api/feature-flags` - Feature configuration
- `/api/invites/status` - Mock invite status
- `/api/health` - Mock health check