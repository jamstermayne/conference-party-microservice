# Update to MAU Events Sheet

## Current Setup
- **Service Account Email**: firebase-adminsdk-fbsvc@conference-party-app.iam.gserviceaccount.com
- **Current Sheet ID**: 1Cq-UcdgtSz2FaROahsj7Db2nmStBFCN97EZzBEHCrKg (Gamescom events)
- **New Sheet ID**: [TO BE PROVIDED] (MAU 2025 events)

## Steps to Update

### 1. Update Configuration Files

You need to update the SPREADSHEET_ID in these two files:

#### File 1: `/workspaces/conference-party-microservice/functions/src/services/sheets-client.ts`
```typescript
// Line 4 - Replace with your new sheet ID
const SPREADSHEET_ID = "YOUR_NEW_MAU_SHEET_ID_HERE";
```

#### File 2: `/workspaces/conference-party-microservice/functions/src/services/parties-live.ts`
```typescript
// Line 4 - Replace with your new sheet ID
const SPREADSHEET_ID = "YOUR_NEW_MAU_SHEET_ID_HERE";
```

### 2. Ensure Sheet Format

Your MAU events sheet should have these columns in order (A-I):
- **Column A**: Event Title
- **Column B**: Venue/Location
- **Column C**: Date (e.g., "2025-03-15" or "March 15, 2025")
- **Column D**: Time (e.g., "14:00" or "2:00 PM")
- **Column E**: Price (e.g., "Free", "$50", "Invite Only")
- **Column F**: Description
- **Column G**: Link/URL
- **Column H**: Capacity (optional, e.g., "200")
- **Column I**: Tags (optional, comma-separated, e.g., "CDP,Analytics,Networking")

### 3. Grant Access to Service Account

✅ You've already done this! The service account `firebase-adminsdk-fbsvc@conference-party-app.iam.gserviceaccount.com` has been given access.

### 4. Deploy Changes

After updating the sheet IDs:

```bash
# 1. Build the functions
cd functions
npm run build

# 2. Test locally (optional)
npm run serve

# 3. Deploy to Firebase
npm run deploy

# 4. Test the API
curl https://us-central1-conference-party-app.cloudfunctions.net/api/parties
```

### 5. Clear Cache and Verify

The system has a 5-minute cache. After deployment:

1. Wait 5 minutes for cache to expire OR
2. Restart the Firebase functions to clear cache immediately:
   ```bash
   firebase functions:delete api --force
   firebase deploy --only functions
   ```

3. Verify new events are loading:
   ```bash
   # Check API directly
   curl https://us-central1-conference-party-app.cloudfunctions.net/api/parties | jq '.'
   
   # Or check in browser
   # https://conference-party-app.web.app/#events
   ```

## Expected MAU Event Examples

Your sheet should contain events like:
- "Salesforce Marketing Cloud Keynote"
- "HubSpot ABM Workshop"
- "CDP Integration Masterclass"
- "Attribution Modeling Summit"
- "MarTech Stack Optimization"
- "AI in Marketing Panel"
- "Networking Reception - Sponsored by Segment"

## Troubleshooting

### If events don't appear:
1. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only api
   ```

2. Verify sheet is shared with service account (you've done this ✅)

3. Check sheet format matches expected columns

4. Ensure dates are in future (past events may be filtered)

### Common Issues:
- **403 Error**: Sheet not shared with service account
- **Empty results**: Wrong column format or sheet range
- **Old events showing**: Cache not cleared, wait 5 minutes or redeploy

## Quick Update Script

Once you have the new sheet ID, run this to update both files:

```bash
# Replace YOUR_NEW_SHEET_ID with actual ID
NEW_SHEET_ID="YOUR_NEW_SHEET_ID"
OLD_SHEET_ID="1Cq-UcdgtSz2FaROahsj7Db2nmStBFCN97EZzBEHCrKg"

# Update both files
sed -i "s/$OLD_SHEET_ID/$NEW_SHEET_ID/g" functions/src/services/sheets-client.ts
sed -i "s/$OLD_SHEET_ID/$NEW_SHEET_ID/g" functions/src/services/parties-live.ts

# Show the changes
echo "Updated sheets-client.ts:"
grep SPREADSHEET_ID functions/src/services/sheets-client.ts

echo "Updated parties-live.ts:"
grep SPREADSHEET_ID functions/src/services/parties-live.ts
```

## Next Steps

1. Get the new MAU events sheet ID from Google Sheets URL
2. Run the update script or manually edit the files
3. Deploy to Firebase
4. Test the events API
5. Verify events appear in the app

---

**Note**: The webhook endpoint (`/api/webhook`) will also automatically sync any updates from the new sheet once the ID is updated.