# Calendar Integration Flow

## Architecture
The calendar feature uses a **backend-only OAuth flow** to avoid CORS issues:

```
Frontend → Backend OAuth → Google → Backend Callback → Frontend Display
```

## Files Structure

### 1. Router (`router.js`)
```javascript
case 'calendar':
  (await import('./calendar-integrated.js?v=b030')).renderCalendar(main);
  break;
```

### 2. Main View (`calendar-integrated.js`)
- Checks authentication status via backend
- Shows "Connect" button if not authenticated
- Shows calendar events if authenticated
- Handles "Add to Calendar" for parties

### 3. Backend Service (`services/gcal-backend.js`)
- **No client-side OAuth** - redirects to backend
- All API calls go through Firebase Functions
- Token management handled by backend
- Clean state management

### 4. CSS (`calendar-uniform.css`)
- Hour-based grid layout (8am-10pm)
- Event overlap handling
- "Now" indicator
- Responsive design

## User Flow

### First Time Connection
1. User navigates to `#calendar`
2. Sees "Connect Google Calendar" button
3. Clicks button → redirects to `/api/calendar/google/start`
4. Backend handles OAuth with Google
5. Returns to app with `?calendar=connected`
6. Frontend shows calendar events

### Viewing Events
1. Frontend calls `/api/calendar/events?range=today`
2. Backend uses stored token to fetch from Google
3. Events displayed in agenda or grid view
4. User can switch between Today/Tomorrow/Week

### Adding Party to Calendar
1. User clicks "Add to Calendar" on a party
2. Frontend sends party data to `/api/calendar/events`
3. Backend creates event in Google Calendar
4. Success toast shown to user

## API Endpoints

| Endpoint | Method | Purpose |
|----------|---------|---------|
| `/api/calendar/google/start` | GET | Start OAuth flow |
| `/api/calendar/google/callback` | GET | OAuth callback (backend only) |
| `/api/calendar/status` | GET | Check connection status |
| `/api/calendar/events` | GET | List calendar events |
| `/api/calendar/events` | POST | Create new event |
| `/api/calendar/disconnect` | POST | Revoke access |

## Key Benefits

✅ **No CORS Issues** - No external scripts loaded
✅ **Secure** - Tokens never exposed to frontend  
✅ **Simple** - Frontend only handles UI
✅ **Reliable** - Backend manages token refresh

## Testing

1. Navigate to `#calendar`
2. Click "Connect Google Calendar"
3. Complete OAuth flow
4. Verify events display
5. Test "Add to Calendar" on a party

## Configuration Required

In Firebase Functions environment:
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `OAUTH_REDIRECT` - Callback URL

In Google Cloud Console:
1. Enable Calendar API
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://[your-domain]/api/calendar/google/callback`