# Google Calendar API Integration Notes

## Critical: Always Include Credentials

When making fetch requests to the Google Calendar API endpoints, you **MUST** include `credentials: 'include'` to send the session cookie. Without this, you'll get 401 Unauthorized errors.

### ✅ Correct:
```javascript
await fetch('/api/googleCalendar/create', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  credentials: 'include',              // <<< CRITICAL - sends cookies
  body: JSON.stringify(payload)
});
```

### ❌ Wrong (causes 401):
```javascript
await fetch('/api/googleCalendar/create', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  // Missing credentials: 'include'    // <<< This will fail!
  body: JSON.stringify(payload)
});
```

## All Endpoints Require Credentials

Every Google Calendar endpoint needs the session cookie:

- `/api/googleCalendar/status` - Check connection
- `/api/googleCalendar/events` - List events  
- `/api/googleCalendar/create` - Create event
- `/api/googleCalendar/user` - Get user info
- `/api/googleCalendar/disconnect` - Disconnect

## Session Cookie Flow

1. User goes through OAuth: `/api/googleCalendar/google/start`
2. Backend sets `sid` cookie with `httpOnly`, `secure`, `sameSite=lax`
3. All subsequent requests must include `credentials: 'include'`
4. Backend validates session from cookie on each request

## Testing

```javascript
// Quick test to verify credentials are working:
fetch('/api/googleCalendar/status', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);  // Should show {connected: true/false}
```

## Common Errors

- **401 Unauthorized**: Missing `credentials: 'include'`
- **403 Forbidden**: Session expired or invalid
- **CORS errors**: Wrong origin or missing CORS headers

## Production URLs

- Frontend: `https://conference-party-app.web.app`
- API: `https://conference-party-app.web.app/api/googleCalendar/*`
- Functions: `https://us-central1-conference-party-app.cloudfunctions.net/api`

## Cookie Settings (Backend)

```javascript
res.cookie('sid', sid, {
  httpOnly: true,    // Can't access from JS
  secure: true,      // HTTPS only
  sameSite: 'lax',   // CSRF protection
  maxAge: 1000 * 60 * 60 * 24 * 30,  // 30 days
  path: '/'
});
```