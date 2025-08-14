# Google OAuth Setup Instructions

## ✅ Deployment Status
Functions have been deployed with placeholder secrets. You now need to update them with real values.

## 📋 Required Steps

### 1. Get OAuth Credentials from Google Cloud Console
1. Go to https://console.cloud.google.com/apis/credentials
2. Select your project: `conference-party-app`
3. Click "CREATE CREDENTIALS" → "OAuth client ID"
4. Choose "Web application"
5. Add this Authorized redirect URI:
   ```
   https://us-central1-conference-party-app.cloudfunctions.net/apiFn/api/google/callback
   ```
6. Click "CREATE"
7. Copy the Client ID and Client Secret

### 2. Update the Secrets
Run these commands with your actual values:

```bash
# Replace YOUR_ACTUAL_CLIENT_ID with the Client ID from Google Console
echo "YOUR_ACTUAL_CLIENT_ID" | firebase functions:secrets:set GOOGLE_CLIENT_ID

# Replace YOUR_ACTUAL_CLIENT_SECRET with the Client Secret from Google Console
echo "YOUR_ACTUAL_CLIENT_SECRET" | firebase functions:secrets:set GOOGLE_CLIENT_SECRET
```

### 3. Redeploy Functions
```bash
firebase deploy --only functions
```

### 4. Test the Integration
1. Visit https://conference-party-app.web.app/#calendar
2. Click "Connect Google Calendar"
3. Complete the OAuth flow
4. You should see your calendar events

## 🔧 Troubleshooting

### If OAuth fails:
1. Check the redirect URI matches exactly in Google Console
2. Ensure the secrets are set correctly:
   ```bash
   firebase functions:secrets:access GOOGLE_CLIENT_ID
   firebase functions:secrets:access GOOGLE_CLIENT_SECRET
   ```
3. Check function logs:
   ```bash
   firebase functions:log --only apiFn
   ```

### Required Google APIs
Make sure these APIs are enabled in your Google Cloud project:
- Google Calendar API
- Gmail API (for email ICS features)
- People API (for contacts)

## 📝 Current Configuration
- **Function URL**: https://apifn-x2u6rwndvq-uc.a.run.app
- **OAuth Start**: https://conference-party-app.web.app/api/google/start
- **OAuth Callback**: https://us-central1-conference-party-app.cloudfunctions.net/apiFn/api/google/callback
- **Secrets**: Currently set to PLACEHOLDER values (needs update)