# 🧹 UGC Test Events Cleanup Guide

## 📊 Current Database Status

- **Total Events**: 104
- **UGC Test Events**: 31 (🗑️ TO BE DELETED)
- **Production Events**: 73 (✅ PRESERVE)

## 🎯 What Are UGC Test Events?

These are **test events** created during the development of the User-Generated Content (UGC) system:

- Events with `source: "ugc"` or `isUGC: true`
- Created for testing functionality, security, validation
- Include XSS attack tests, duplicate detection tests, encoding tests
- Sample names: "Test Creator Event", "Security Test `<script>alert('XSS')</script>`", etc.

## 🚀 Cleanup Solutions

### Option 1: Automated API Cleanup (Recommended)

#### Prerequisites:
```bash
# Re-authenticate with Firebase
firebase login --reauth

# Deploy updated API with DELETE endpoint
npm run build
npm run deploy
```

#### Execute Cleanup:
```bash
# Delete all UGC test events
curl -X DELETE 'https://us-central1-conference-party-app.cloudfunctions.net/api/ugc/events'
```

#### Verify Results:
```bash
# Check remaining UGC count (should be 0)
curl -s 'https://us-central1-conference-party-app.cloudfunctions.net/api/parties' | jq '.meta.ugcCount'

# Verify only production events remain (should be 73)
curl -s 'https://us-central1-conference-party-app.cloudfunctions.net/api/parties' | jq '[.data[] | select(.source == "gamescom-sheets")] | length'
```

### Option 2: Manual Firebase Console Cleanup

1. **Go to**: [Firebase Console](https://console.firebase.google.com/)
2. **Select**: `conference-party-app` project
3. **Navigate**: Firestore Database → `events` collection
4. **Filter**: `source == 'ugc'`
5. **Delete**: All UGC events (31 total)

### Option 3: Direct Firestore API

Using Google Cloud SDK with service account credentials:

```bash
# Install Google Cloud SDK
# Authenticate with service account
# Use Firestore REST API for batch deletion
```

## 📋 UGC Event IDs to Delete

Complete list of 31 UGC test events:
- `ugc-1754574459635-8fpm9m2i1` - Test Creator Event
- `ugc-1754575453812-lus9yr7il` - Test Event at Koelnmesse  
- `ugc-1754599319772-1s8l87ity` - Security Test with XSS
- `ugc-1754599638709-ybzwz0j41` - Virtual Scrolling Test Event
- `ugc-1754577375133-qoblmt8r6` - Test DROP TABLE events
- ... and 26 more test events

*Full list available in `/tmp/ugc_event_ids.txt`*

## 🔍 Test Event Categories

### Security Tests
- XSS injection attempts: `<script>alert("XSS")</script>`
- SQL injection tests: `Test DROP TABLE events`
- Malicious venue names with HTML tags

### Functionality Tests  
- Duplicate detection tests
- Encoding tests with special characters: `🎉 Party 派对 パーティー`
- Date validation tests: `not-a-date`
- Performance testing events

### Development Tests
- Claude AI test events
- Integration test events
- Consistency validation tests

## ⚠️ Critical Safety Rules

### ✅ DO DELETE:
- Events with `source: "ugc"`
- Events with `isUGC: true`
- Any event created during development/testing

### ❌ DON'T DELETE:
- Events with `source: "gamescom-sheets"`
- Any production events from Google Sheets
- Events without `ugc` prefix in ID

## 🎯 Expected Cleanup Result

```
Before: 104 events (31 UGC + 73 production)
After:   73 events (0 UGC + 73 production)
Result: -31 test events removed ✅
```

## 🛠️ Implementation Details

### DELETE Endpoint Added
```typescript
// In src/ugc.ts
export const deleteUGCEvents = async (req: Request, res: Response): Promise<void> => {
  // Batch deletes all UGC events
  // Preserves production events
  // Includes error handling and verification
}
```

### API Route Added
```typescript
// In src/index.ts  
case "/ugc/events":
  if (req.method === "DELETE") {
    await deleteUGCEvents(req, res);
  }
```

### Compiled & Ready
- ✅ TypeScript compilation successful
- ✅ DELETE function compiled to `lib/src/ugc.js`
- ✅ Route integration completed
- ✅ Ready for deployment

## 📊 Verification Queries

### Before Cleanup:
```bash
curl -s 'https://us-central1-conference-party-app.cloudfunctions.net/api/parties' | \
jq '{total: .meta.total, ugc: .meta.ugcCount, curated: (.meta.total - .meta.ugcCount)}'
```

### After Cleanup:
```bash
# Should show: {"total": 73, "ugc": 0, "curated": 73}
curl -s 'https://us-central1-conference-party-app.cloudfunctions.net/api/parties' | \
jq '{total: .meta.total, ugc: .meta.ugcCount, curated: (.meta.total - .meta.ugcCount)}'
```

## 🏁 Cleanup Status

- ✅ **UGC Events Identified**: 31 test events found
- ✅ **Production Events Safe**: 73 events will be preserved  
- ✅ **DELETE Endpoint Ready**: Compiled and integrated
- ✅ **Verification Tools**: Complete testing suite provided
- ✅ **Multiple Methods**: API, Console, and direct cleanup options
- ⏳ **Awaiting**: Firebase authentication for deployment

**Ready for execution when Firebase access is restored.**

---

*Generated as part of the enterprise-grade Conference Party Microservice transformation.*