#!/bin/bash

echo "================================================"
echo "Google OAuth Setup for Firebase Functions"
echo "================================================"
echo ""
echo "This script will help you set up Google OAuth secrets for your Firebase Functions."
echo ""
echo "Prerequisites:"
echo "1. Go to https://console.cloud.google.com/apis/credentials"
echo "2. Create an OAuth 2.0 Client ID (Web application)"
echo "3. Add authorized redirect URI:"
echo "   https://us-central1-conference-party-app.cloudfunctions.net/api/googleCalendar/google/callback"
echo "4. Copy your Client ID and Client Secret"
echo ""
echo "================================================"
echo ""

# Check if already logged in to Firebase
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Please login to Firebase first:"
    firebase login
fi

# Ensure we're using the right project
echo "Setting active project to conference-party-app..."
firebase use conference-party-app

echo ""
echo "Now we'll set your Google OAuth credentials as Firebase secrets."
echo "These will be securely stored and only accessible to your functions."
echo ""

# Set GOOGLE_CLIENT_ID
echo "Step 1: Setting GOOGLE_CLIENT_ID"
echo "Enter your Google OAuth Client ID (looks like: 123456789-abcdef.apps.googleusercontent.com):"
read -r CLIENT_ID

if [ -z "$CLIENT_ID" ]; then
    echo "Error: Client ID cannot be empty"
    exit 1
fi

echo "$CLIENT_ID" | firebase functions:secrets:set GOOGLE_CLIENT_ID

# Set GOOGLE_CLIENT_SECRET  
echo ""
echo "Step 2: Setting GOOGLE_CLIENT_SECRET"
echo "Enter your Google OAuth Client Secret:"
read -rs CLIENT_SECRET
echo ""

if [ -z "$CLIENT_SECRET" ]; then
    echo "Error: Client Secret cannot be empty"
    exit 1
fi

echo "$CLIENT_SECRET" | firebase functions:secrets:set GOOGLE_CLIENT_SECRET

echo ""
echo "================================================"
echo "Secrets have been set! Now updating function configuration..."
echo "================================================"
echo ""

# Check current secrets
echo "Verifying secrets are set:"
firebase functions:secrets:access GOOGLE_CLIENT_ID > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ GOOGLE_CLIENT_ID is set"
else
    echo "✗ GOOGLE_CLIENT_ID failed to set"
fi

firebase functions:secrets:access GOOGLE_CLIENT_SECRET > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ GOOGLE_CLIENT_SECRET is set"
else
    echo "✗ GOOGLE_CLIENT_SECRET failed to set"
fi

echo ""
echo "================================================"
echo "Setup complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Update your functions/src/index.ts to include the secrets in runWith()"
echo "2. Deploy with: npm run deploy"
echo "3. Test at: https://conference-party-app.web.app/calendar-demo.html"
echo ""
echo "Your OAuth redirect URI should be:"
echo "https://us-central1-conference-party-app.cloudfunctions.net/api/googleCalendar/google/callback"
echo ""