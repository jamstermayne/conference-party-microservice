# Admin Setup Guide

## Security Notice
Admin privileges should NEVER be granted based on hardcoded email addresses in the frontend code. This is a serious security vulnerability as anyone can see the source code and use those emails.

## Proper Admin Setup

### Using Firebase Custom Claims (Recommended)

1. **Set admin custom claim via Firebase Admin SDK:**
```bash
# Using Firebase CLI
firebase functions:shell

# Then in the shell:
admin.auth().setCustomUserClaims('USER_UID', { admin: true })
```

2. **Or create a secure admin setup script:**
```javascript
// admin-setup.js (run locally, never commit with real UIDs)
const admin = require('firebase-admin');
admin.initializeApp();

async function setAdminUser(uid) {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log(`Admin privileges granted to user ${uid}`);
}

// Replace with actual user UID
setAdminUser('YOUR_USER_UID');
```

### Using Environment Variables

1. **Set admin emails in environment:**
```bash
# In .env file (never commit this)
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

2. **Check in backend only:**
```javascript
const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
const isAdmin = adminEmails.includes(userEmail);
```

## Security Best Practices

1. **Never hardcode admin emails in frontend code**
2. **Always validate admin status on the backend**
3. **Use Firebase Custom Claims for role-based access**
4. **Store sensitive configuration in environment variables**
5. **Implement proper authentication flow**

## Current Implementation Status

- ✅ Removed hardcoded admin emails from frontend
- ✅ Updated backend to use Firebase Custom Claims
- ✅ Disabled frontend-based admin detection
- ⚠️ Admin setup now requires proper Firebase configuration

## Next Steps

To grant admin privileges to a user:

1. Get the user's UID from Firebase Auth
2. Run the Firebase Admin SDK command to set custom claims
3. The backend will automatically recognize admin users
4. Frontend features will be enabled based on backend validation