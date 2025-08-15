# MTM Google Calendar Mirror - Owner Checklist

## ✅ Prerequisites (Already Complete)
- [x] **Secrets configured in Secret Manager:**
  - `GOOGLE_CLIENT_ID`: OAuth client ID for Google Calendar API
  - `GOOGLE_CLIENT_SECRET`: OAuth client secret
  - `MEETTOMATCH_CRYPTO_KEY`: AES-256 encryption key for ICS URLs

## 🚀 Deployment Steps

### 1. Deploy Functions (CI/CD or Manual)
```bash
# Option A: CI/CD (automatic on push to main)
git push origin main

# Option B: Manual deployment
cd functions
npm run build
npm run deploy
```

### 2. Verify Deployment
```bash
# Check function status
firebase functions:list

# Verify endpoints are working
curl -X GET https://apifn-x2u6rwndvq-uc.a.run.app/api/health
```

## 🔒 Optional: Tighten Firestore Security Rules

### Current Rules (Permissive)
```javascript
// firestore.rules
match /users/{uid}/mtmEvents/{id} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow write: if false; // server only
}

match /users/{uid}/integrations/{type} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow write: if false; // server only
}
```

### Recommended Production Rules (Tighter)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // MTM Events - Server-only writes, user can read their own
    match /users/{uid}/mtmEvents/{eventId} {
      allow read: if request.auth != null 
                  && request.auth.uid == uid
                  && request.auth.token.email_verified == true;
      allow write: if false; // Server-only via Admin SDK
    }
    
    // Integration Settings - Server-only writes, user can read their own
    match /users/{uid}/integrations/{integrationType} {
      allow read: if request.auth != null 
                  && request.auth.uid == uid
                  && request.auth.token.email_verified == true
                  && integrationType in ['mtm', 'google'];
      allow write: if false; // Server-only via Admin SDK
    }
    
    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Deploy Security Rules
```bash
# Update firestore.rules file with the above rules
firebase deploy --only firestore:rules
```

## 🧪 Testing Checklist

### Basic Functionality
- [ ] User can sign in with Google OAuth
- [ ] User can connect MeetToMatch ICS URL
- [ ] Events sync from ICS to Firestore
- [ ] Events appear in calendar/map UI

### Google Calendar Mirror
- [ ] Mirror toggle appears for authenticated users
- [ ] Enable mirror → events sync to Google Calendar
- [ ] Disable mirror → stops syncing (existing events remain)
- [ ] Calendar ID selection works (primary vs custom)
- [ ] 15-minute scheduler runs successfully

### Error Handling
- [ ] Invalid ICS URL shows error
- [ ] Network failures don't crash sync
- [ ] Mirror failures don't break MTM sync
- [ ] Token refresh works when Google token expires

## 📊 Monitoring

### Cloud Console Monitoring
1. **Functions Health**: https://console.cloud.google.com/functions
2. **Scheduler Jobs**: https://console.cloud.google.com/cloudscheduler
3. **Secret Manager**: https://console.cloud.google.com/security/secret-manager
4. **Firestore Usage**: https://console.firebase.google.com/project/conference-party-app/firestore

### Key Metrics to Watch
- Function execution count and latency
- Scheduler success rate (should run every 15 minutes)
- Secret access logs
- Firestore read/write operations

## 🔐 Security Considerations

### Required APIs
Ensure these APIs are enabled in Google Cloud Console:
- [x] Cloud Functions API
- [x] Cloud Scheduler API
- [x] Secret Manager API
- [x] Firestore API
- [x] Google Calendar API

### Service Account Permissions
The default service account needs:
- `secretmanager.secretAccessor` (for secrets)
- `datastore.user` (for Firestore)
- Calendar API scope (handled by OAuth flow)

## 📝 User Documentation

### For End Users
1. Sign in with Google account
2. Go to Settings → Integrations
3. Connect MeetToMatch with your ICS URL
4. Enable "Mirror to Google Calendar"
5. Events sync automatically every 15 minutes

### For Developers
- MTM events stored in: `/users/{uid}/mtmEvents/`
- Mirror settings in: `/users/{uid}/integrations/mtm`
- Google tokens in: `/users/{uid}/integrations/google`
- Encryption: AES-256-GCM for ICS URLs

## ⚠️ Important Notes

1. **ICS URL Security**: URLs are encrypted with AES-256-GCM before storage
2. **Idempotent Sync**: Uses ICS UIDs to prevent duplicate events
3. **Rate Limiting**: 10-minute minimum between manual syncs
4. **Best-Effort Mirror**: Google sync failures don't break MTM sync
5. **Private Extended Properties**: MTM events tagged with `mtmUid` in Google Calendar

## 🎯 Final Verification

Run these commands to verify everything is working:

```bash
# 1. Check function deployment
firebase functions:list

# 2. Test API endpoints
curl https://apifn-x2u6rwndvq-uc.a.run.app/api/integrations/mtm/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Check scheduler
gcloud scheduler jobs list --location=us-central1

# 4. Verify secrets
firebase functions:secrets:access MEETTOMATCH_CRYPTO_KEY
firebase functions:secrets:access GOOGLE_CLIENT_ID
firebase functions:secrets:access GOOGLE_CLIENT_SECRET
```

## 📞 Support

If issues arise:
1. Check Cloud Functions logs
2. Verify API quotas aren't exceeded
3. Ensure secrets are properly configured
4. Check Firestore rules aren't blocking access

---

**Last Updated**: August 2025
**Implementation**: MTM → Google Calendar Mirror with AES-256 encryption