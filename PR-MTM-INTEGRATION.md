# PR: MeetToMatch (ICS) Integration — Secure Sync + UI

## 🎯 Overview
This PR implements a complete MeetToMatch calendar integration that securely syncs ICS calendar events with our platform. Users can connect their MTM calendar URL to automatically import and display their scheduled meetings.

## 🔐 Security Features
- **Encryption at Rest**: ICS URLs are encrypted using AES-256-GCM with Firebase Secrets
- **SHA256 Hashing**: URL hashes for safe logging and idempotency checking
- **No URL Logging**: ICS URLs are never logged in plaintext
- **Rate Limiting**: 10-minute minimum between syncs per user
- **HTTPS Only**: Enforces secure connections for ICS URLs

## 🚀 Features Implemented

### Backend (Firebase Functions)
1. **Crypto Helper** (`functions/src/lib/crypto.ts`)
   - AES-256-GCM encryption using Firebase Secrets
   - Development mode fallback for local testing
   - SHA256 hashing for safe URL comparison

2. **MTM Integration API** (`functions/src/integrations/mtm/`)
   - `POST /api/integrations/mtm/connect` - Connect ICS URL with validation
   - `POST /api/integrations/mtm/syncNow` - Manual sync trigger
   - `POST /api/integrations/mtm/disconnect` - Disconnect integration
   - `GET /api/integrations/mtm/status` - Check connection status
   - `GET /api/integrations/mtm/events` - Retrieve synced events

3. **Sync Worker** (`functions/src/integrations/mtm/sync.ts`)
   - Fetches and parses ICS files using `ical` library
   - Normalizes event data structure
   - Handles event updates and soft deletions
   - Optional Google Calendar sync with deduplication
   - Geocoding support for event locations

4. **Scheduler** (`functions/src/schedulers/mtm.ts`)
   - Runs every 15 minutes (when Cloud Scheduler is enabled)
   - Batch processing with concurrency limits
   - Automatic error recovery and retry logic

### Frontend
1. **Settings UI** (`frontend/src/js/integrations/mtm.js`)
   - Clean integration card in Settings → Integrations
   - ICS URL input with validation
   - Connection status and sync statistics
   - Manual sync and disconnect controls
   - Help link to MTM calendar location

2. **Calendar Integration** (`frontend/src/js/calendar/mtm-events.js`)
   - Source toggle to show/hide MTM events
   - Event cards with MTM badge
   - "View on map" for geocoded events
   - "Add to Calendar" for external calendar apps
   - Chronological event grouping by date

3. **Styling** 
   - `frontend/src/css/integrations.css` - Settings UI styles
   - `frontend/src/css/calendar-mtm.css` - Calendar event styles
   - Professional gradient branding for MTM elements
   - Responsive design for mobile devices

## 📋 Data Model

### Firestore Collections
```javascript
/users/{uid}/integrations/mtm {
  type: 'ics',
  urlEnc: string,         // AES-256-GCM encrypted URL
  urlSha256: string,      // SHA256 hash for idempotency
  status: 'connected' | 'error',
  lastSyncAt?: Timestamp,
  lastError?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}

/users/{uid}/mtmEvents/{icsUid} {
  source: 'mtm',
  icsUid: string,         // ICS UID for idempotency
  title: string,
  description?: string,
  location?: string,
  start: Timestamp,
  end: Timestamp,
  tz?: string,
  lat?: number,           // Geocoded latitude
  lon?: number,           // Geocoded longitude
  cancelled?: boolean,    // Soft delete flag
  googleEventId?: string, // Google Calendar sync ID
  updatedAt: Timestamp
}
```

## 🧪 Testing Plan

### Setup
1. Generate a 32-byte secret key for production:
   ```bash
   openssl rand -base64 32
   ```

2. Set the Firebase secret:
   ```bash
   firebase functions:secrets:set MEETTOMATCH_CRYPTO_KEY
   ```

3. Deploy functions:
   ```bash
   cd functions && npm run deploy
   ```

### Acceptance Tests
1. ✅ **Connect Valid ICS URL**
   - Navigate to Settings → Integrations
   - Paste MTM ICS URL
   - Verify "Connected" status
   - Check events appear in Calendar within seconds

2. ✅ **Google Calendar Sync**
   - If Google connected, verify MTM events appear
   - Re-sync updates times/titles
   - Check deduplication via `extendedProperties.private.mtmUid`

3. ✅ **Disconnect Integration**
   - Click "Disconnect" button
   - Verify integration removed
   - Events marked as cancelled (not deleted)

4. ✅ **Invalid URL Handling**
   - Try non-HTTPS URL → Error message
   - Try non-ICS URL → Validation error
   - Verify no crash, clean error display

5. ✅ **Map Integration**
   - Click "View on map" for geocoded event
   - Verify navigation to `#map/{day}?focus={lat},{lon}`
   - Map centers on event location

6. ✅ **Calendar Export**
   - Click "Add to Calendar" on MTM event
   - Verify uses existing Google/Outlook integration
   - Does NOT send back to MTM

7. ✅ **Rate Limiting**
   - Try rapid sync requests
   - Verify 10-minute throttle works
   - Check error message is user-friendly

## 🔄 Data Flow
1. User provides ICS URL → Validated & encrypted → Stored in Firestore
2. Initial sync triggered → ICS fetched & parsed → Events stored
3. Scheduler runs every 15 minutes → Checks for updates
4. Frontend polls `/api/integrations/mtm/events` → Displays in Calendar
5. Optional: Sync to Google Calendar with MTM tags

## 🛡️ Security Considerations
- ICS URLs treated as secrets (like API keys)
- Encryption key stored in Firebase Secrets (not in code)
- No plaintext URLs in logs or error messages
- HTTPS enforced for all ICS fetches
- Authentication required for all API endpoints
- Rate limiting prevents abuse

## 📝 Future Enhancements
- OAuth integration if MTM provides REST API
- Bulk event actions (accept all, decline all)
- Calendar conflict detection
- Meeting reminder notifications
- Attendee list parsing from ICS
- Two-way sync (if MTM supports it)

## 🚢 Deployment Checklist
- [ ] Set `MEETTOMATCH_CRYPTO_KEY` secret in production
- [ ] Enable Cloud Scheduler API (for auto-sync)
- [ ] Deploy Firebase Functions
- [ ] Update frontend build
- [ ] Test with real MTM calendar URL
- [ ] Monitor initial user connections

## 📊 Metrics to Track
- Connection success rate
- Average events per user
- Sync failure rate
- API response times
- Calendar view engagement

## 🐛 Known Limitations
- Cloud Scheduler must be enabled for auto-sync
- Manual sync limited to once per 10 minutes
- No real-time updates (15-minute sync interval)
- Geocoding requires location in specific format

---

**Resolves:** #[issue-number]
**Testing:** Manual testing completed with mock ICS data
**Documentation:** Inline code comments and this PR description