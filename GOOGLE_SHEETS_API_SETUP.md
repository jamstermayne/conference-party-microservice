# Google Sheets API Setup Guide

## Step 1: Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Library**
4. Search for "Google Sheets API"
5. Click on it and press **ENABLE**

## Step 2: Create API Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API Key**
3. Copy the API key that appears
4. (Optional but recommended) Click **Restrict Key** to add restrictions:
   - Under **Application restrictions**, select **HTTP referrers**
   - Add your domains:
     - `https://conference-party-app.web.app/*`
     - `https://us-central1-conference-party-app.cloudfunctions.net/*`
   - Under **API restrictions**, select **Restrict key**
   - Choose **Google Sheets API** from the list
   - Click **SAVE**

## Step 3: Make Your Sheet Public (Read-Only)

Since Firebase only has viewer access, your sheet needs to be publicly readable:

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1Cq-UcdgtSz2FaROahsj7Db2nmStBFCN97EZzBEHCrKg/
2. Click **Share** button (top right)
3. Under **General access**, change from "Restricted" to:
   - **Anyone with the link** 
   - Set permission to **Viewer**
4. Click **Done**

## Step 4: Add API Key to Firebase

### Option A: Using Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **conference-party-app**
3. Go to **Functions** in the left sidebar
4. Click on **Secret Manager** or **Environment Configuration**
5. Add a new secret:
   - Name: `GOOGLE_SHEETS_API_KEY`
   - Value: Your API key from Step 2
6. Save the secret

### Option B: Using Firebase CLI
```bash
firebase functions:secrets:set GOOGLE_SHEETS_API_KEY
# When prompted, paste your API key and press Enter
```

## Step 5: Update Function to Use the Secret

The function is already configured to use the secret in `/functions/src/services/parties-live.ts`:

```typescript
function getSourceUrl(): string {
  const apiKey = process.env['GOOGLE_SHEETS_API_KEY'];
  if (!apiKey) {
    throw new Error("[parties-live] GOOGLE_SHEETS_API_KEY secret not available");
  }
  return `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_RANGE}?key=${apiKey}`;
}
```

## Step 6: Deploy Functions with Secret Access

```bash
cd functions
npm run deploy
```

## Step 7: Test the API

Once deployed, test the ingestion:

```bash
# Trigger ingestion from Google Sheets
curl -X POST "https://conference-party-app.web.app/api/parties/ingest"

# Check the status
curl "https://conference-party-app.web.app/api/parties/status"

# Get the parties
curl "https://conference-party-app.web.app/api/parties?conference=gamescom2025"
```

## Alternative: Direct Sheet Access URL

If you want to test without API key (publicly readable sheet):
```
https://sheets.googleapis.com/v4/spreadsheets/1Cq-UcdgtSz2FaROahsj7Db2nmStBFCN97EZzBEHCrKg/values/Sheet1!A2:H100?key=YOUR_API_KEY
```

## Troubleshooting

### Error: "API key not valid"
- Make sure you've enabled the Google Sheets API for your project
- Check that the API key has no typos
- Verify the key restrictions match your domain

### Error: "The caller does not have permission"
- Ensure the Google Sheet is shared publicly (Anyone with link > Viewer)
- Check that the sheet ID is correct

### Error: "GOOGLE_SHEETS_API_KEY secret not available"
- The secret hasn't been added to Firebase
- Redeploy functions after adding the secret
- Make sure the function has permission to access secrets

## Current Sheet Structure

Your sheet should have these columns:
- Column A: Event Title
- Column B: Venue
- Column C: Date
- Column D: Time
- Column E: Price
- Column F: Description
- Column G: Link (optional)
- Column H: Tags (optional)

The function reads from row 2 onwards (skipping header row).