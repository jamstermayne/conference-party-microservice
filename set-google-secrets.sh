#!/bin/bash

echo "================================================"
echo "Quick Google OAuth Secrets Setup"
echo "================================================"
echo ""

# Example values - replace with your actual credentials
echo "Example Client ID: 123456789-abcdef.apps.googleusercontent.com"
echo "Example Client Secret: GOCSPX-xxxxxxxxxxxxx"
echo ""

echo "Setting GOOGLE_CLIENT_ID..."
echo "Paste your Client ID and press Enter:"
firebase functions:secrets:set GOOGLE_CLIENT_ID

echo ""
echo "Setting GOOGLE_CLIENT_SECRET..."
echo "Paste your Client Secret and press Enter:"
firebase functions:secrets:set GOOGLE_CLIENT_SECRET

echo ""
echo "================================================"
echo "Verifying secrets..."
echo "================================================"
firebase functions:secrets:list

echo ""
echo "Done! Your secrets are set."
echo ""
echo "Make sure your OAuth redirect URI in Google Cloud Console is:"
echo "https://us-central1-conference-party-app.cloudfunctions.net/api/googleCalendar/google/callback"
echo ""
echo "To deploy: firebase deploy --only functions"
