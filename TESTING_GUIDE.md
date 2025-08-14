# Testing Guide for Google Calendar Integration

## Current Status
✅ Code deployed
✅ Auth simplified for testing  
⚠️ Function needs public access (returning 403)

## Make Function Public

### Option 1: Google Cloud Console (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `conference-party-app`
3. Navigate to Cloud Run
4. Click on `apifn` service
5. Click "PERMISSIONS" tab
6. Click "ADD PRINCIPAL"
7. Enter: `allUsers`
8. Role: `Cloud Run Invoker`
9. Save

### Option 2: Using gcloud CLI
```bash
gcloud run services add-iam-policy-binding apifn \
  --location=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

## Test Endpoints

Once public access is granted, test these endpoints:

### 1. Health Check
```bash
curl https://conference-party-app.web.app/api/health
```
Expected: 
```json
{
  "status": "healthy",
  "timestamp": "2025-08-14T...",
  "version": "2.1.0"
}
```

### 2. Calendar Status
```bash
curl https://conference-party-app.web.app/api/googleCalendar/status
```
Expected:
```json
{
  "connected": false
}
```

### 3. Test OAuth Flow
1. Navigate to: https://conference-party-app.web.app#calendar
2. Click "Connect Google Calendar"
3. Should redirect to: `/api/googleCalendar/google/start`
4. Complete Google OAuth
5. Return to app with calendar connected

## Frontend Testing

### Test in Browser
1. Open: https://conference-party-app.web.app#calendar
2. Open DevTools Console (F12)
3. Test calendar service:

```javascript
// Test connection status
const connected = await GCal.isConnected();
console.log('Connected:', connected);

// If not connected, start OAuth
if (!connected) {
  GCal.startOAuth();
}

// If connected, list events
const events = await GCal.listEvents('today');
console.log('Events:', events);
```

## Common Issues & Solutions

### Issue: 403 Forbidden
**Solution**: Function needs public access (see above)

### Issue: CORS Error
**Solution**: Already fixed - using backend-only OAuth

### Issue: "no_session" error
**Solution**: Auth temporarily disabled for testing

### Issue: No Google credentials
**Solution**: Set environment variables in Firebase:
```bash
firebase functions:config:set \
  google.client_id="YOUR_CLIENT_ID" \
  google.client_secret="YOUR_SECRET"
```

## Architecture Verification

```
Frontend (gcal.js)
    ↓
/api/googleCalendar/*
    ↓
apiFn function
    ↓
googleCalendarRouter
    ↓
Google Calendar API
```

## Next Steps
1. ✅ Make function public
2. ✅ Test all endpoints
3. ⬜ Set up Google OAuth credentials
4. ⬜ Add proper authentication
5. ⬜ Test end-to-end flow