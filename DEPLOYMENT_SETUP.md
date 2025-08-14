# Firebase Deployment Setup

## Current Status
The GitHub Actions workflow is configured but requires a service account secret to be added to the repository.

## Required Setup Steps

### 1. Add Firebase Service Account Secret

1. **Get the Service Account JSON:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select the `conference-party-app` project
   - Navigate to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Add to GitHub Secrets:**
   - Go to: https://github.com/jamstermayne/conference-party-microservice/settings/secrets/actions
   - Click "New repository secret"
   - Name: `FIREBASE_SERVICE_ACCOUNT_CONFERENCE_PARTY_APP`
   - Value: Paste the entire JSON content from the downloaded file
   - Click "Add secret"

### 2. Verify Deployment

Once the secret is added:
1. Go to the Actions tab in GitHub
2. Click on "Deploy to Firebase" workflow
3. Click "Run workflow" > "Run workflow" to trigger a manual deployment
4. Or push a commit to the main branch to trigger automatic deployment

## Workflow Configuration

The deployment workflow (`/.github/workflows/firebase-deploy.yml`) includes:
- **Test job**: Runs linting and builds
- **Deploy job**: Deploys to Firebase Hosting and Functions
- **Error handling**: Provides clear instructions if secrets are missing

## Troubleshooting

If deployment fails:
1. Check that the secret name matches exactly: `FIREBASE_SERVICE_ACCOUNT_CONFERENCE_PARTY_APP`
2. Ensure the service account has the required permissions:
   - Firebase Hosting Admin
   - Cloud Functions Developer
   - Service Account User
3. Verify the project ID is correct: `conference-party-app`

## Alternative: OIDC Setup (Advanced)

For enhanced security using Workload Identity Federation:
1. Set up a workload identity pool in Google Cloud Console
2. Configure the GitHub provider
3. Update the workflow to use OIDC authentication

Refer to [Google's documentation](https://cloud.google.com/iam/docs/workload-identity-federation) for detailed OIDC setup instructions.