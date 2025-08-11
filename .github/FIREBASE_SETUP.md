# Firebase Authentication Setup for GitHub Actions

The deployment workflows are currently failing due to expired Firebase authentication. Here are the steps to fix this:

## Option 1: Service Account Key (Recommended)

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. In GitHub repo → Settings → Secrets and variables → Actions
5. Create a new secret named `FIREBASE_SERVICE_ACCOUNT_KEY`
6. Paste the entire JSON content as the secret value

## Option 2: Firebase Token (Legacy)

1. Run `firebase login:ci` locally
2. Copy the generated token
3. In GitHub repo → Settings → Secrets and variables → Actions  
4. Update the `FIREBASE_TOKEN` secret with the new token

## Current Status

- ❌ Deploy workflows failing due to authentication error
- ✅ Updated workflows to handle both authentication methods
- ✅ Added fallback mechanism for authentication
- ✅ Fixed YAML syntax issues

## Next Steps

1. Set up authentication using one of the methods above
2. Test deployment workflow
3. Verify all endpoints are working

## Workflow Files Updated

- `.github/workflows/deploy.yml` - Fixed authentication
- `.github/workflows/test-and-deploy.yml` - Fixed authentication and syntax
- Re-enabled automatic deployment on main branch pushes