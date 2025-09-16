# Fix Google Sheets Permission Issue

## Current Issue
The Firebase Functions cannot access the new MAU events sheet:
```
[sheets-client] Error fetching from Google Sheets: The caller does not have permission
[sheets-client] Permission denied. Make sure the sheet is shared with the service account.
```

## Service Account Email
`firebase-adminsdk-fbsvc@conference-party-app.iam.gserviceaccount.com`

## Your Sheet URL
https://docs.google.com/spreadsheets/d/10c54Otn4pMYTFQ7bRQulO-qDB05aCk_l1rRtuPmwmtE/

## Steps to Fix

### 1. Share the Sheet with Service Account

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/10c54Otn4pMYTFQ7bRQulO-qDB05aCk_l1rRtuPmwmtE/

2. Click the **Share** button (top right corner)

3. In the "Add people and groups" field, paste:
   ```
   firebase-adminsdk-fbsvc@conference-party-app.iam.gserviceaccount.com
   ```

4. **IMPORTANT**: Set permission to **"Viewer"** (not Editor)

5. **UNCHECK** "Notify people" (service accounts can't receive emails)

6. Click **Share**

### 2. Alternative: Make Sheet Public (Not Recommended)

If sharing with service account doesn't work:

1. Click Share button
2. Click "Change to anyone with the link"
3. Set to "Viewer"
4. Click "Done"

### 3. Verify Sheet Structure

Make sure your sheet has these columns in order (A-I):
- **A**: Event Title (e.g., "Salesforce Marketing Cloud Keynote")
- **B**: Venue (e.g., "Main Stage - Hall A")
- **C**: Date (e.g., "2025-03-17" or "March 17, 2025")
- **D**: Time (e.g., "14:00" or "2:00 PM")
- **E**: Price (e.g., "Free", "$50", "VIP Only")
- **F**: Description
- **G**: Link/URL (optional)
- **H**: Capacity (optional, e.g., "500")
- **I**: Tags (optional, e.g., "CDP,Analytics,Keynote")

### 4. Test After Sharing

After sharing, wait 1 minute then test:

```bash
# Test the API
curl -sL https://api-x2u6rwndvq-uc.a.run.app/api/parties | python3 -m json.tool | head -50

# Check logs for success
firebase functions:log --only api --lines 10
```

## Expected Result

Once permissions are fixed, you should see:
```
[sheets-client] Fetched 50 rows from Google Sheets
[parties] Using sheet data - 50 events
```

And the API should return MAU events like:
- "Opening Keynote: The Future of Marketing Automation"
- "Salesforce Marketing Cloud Workshop"
- "HubSpot ABM Masterclass"
- etc.

## Still Not Working?

If you still get permission errors after sharing:

1. **Double-check the email**: Make sure you shared with exactly:
   `firebase-adminsdk-fbsvc@conference-party-app.iam.gserviceaccount.com`

2. **Check sheet tab name**: If your data is not in "Sheet1", update the range in:
   `/workspaces/conference-party-microservice/functions/src/services/parties-live.ts`
   
   Change line 5 from:
   ```typescript
   const SHEET_RANGE = "Sheet1!A2:ZZ1000";
   ```
   To your tab name:
   ```typescript
   const SHEET_RANGE = "YourTabName!A2:ZZ1000";
   ```

3. **Clear Function Cache**: Force a cache clear by redeploying:
   ```bash
   cd functions
   npm run deploy
   ```

## Verification Commands

Once working, verify events are MAU-specific:

```bash
# Check event titles
curl -sL https://api-x2u6rwndvq-uc.a.run.app/api/parties | \
  python3 -c "import sys, json; data = json.load(sys.stdin); [print(e['title']) for e in data['data'][:5]]"

# Should show MAU events, not Gamescom events
```