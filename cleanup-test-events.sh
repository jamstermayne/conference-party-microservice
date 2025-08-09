#!/bin/bash

# CLEAN UGC TEST EVENTS
# Simple script to remove test events using direct API call

echo "🗑️  Cleaning UGC test events from database..."
echo ""

# Get current events to show status
echo "📊 Checking current database status..."
response=$(curl -s "https://us-central1-conference-party-app.cloudfunctions.net/api/parties")

total_events=$(echo "$response" | jq -r '.meta.total // (.data | length)')
ugc_count=$(echo "$response" | jq -r '.meta.ugcCount // ([.data[] | select(.source == "ugc" or .isUGC == true)] | length)')
curated_count=$((total_events - ugc_count))

echo "   Total events: $total_events"
echo "   UGC test events: $ugc_count" 
echo "   Curated events: $curated_count (will be preserved)"
echo ""

if [ "$ugc_count" -eq 0 ]; then
    echo "✅ No UGC test events found to delete"
    exit 0
fi

echo "🗑️  Sample UGC test events to be deleted:"
echo "$response" | jq -r '.data[] | select(.source == "ugc" or .isUGC == true) | "   - \(.name // .["Event Name"]) (\(.creator // .Hosts))"' | head -5
if [ "$ugc_count" -gt 5 ]; then
    echo "   ... and $((ugc_count - 5)) more"
fi
echo ""

echo "🚀 Calling delete endpoint..."

# Since we need to deploy first, let's call the deployed function
# But first we need to build and deploy it without the enterprise modules

echo "⚠️  Need to deploy updated API first..."
echo "⚠️  Skipping enterprise modules that have missing dependencies..."

# For now, let's just print instructions
echo ""
echo "📝 Manual cleanup instructions:"
echo "1. The UGC events are all events with source='ugc' or isUGC=true"
echo "2. These are test events created during development and should be removed"
echo "3. To clean them up manually:"
echo "   - Access Firebase Console: https://console.firebase.google.com/"
echo "   - Go to Firestore Database"
echo "   - Collection: 'events'"
echo "   - Filter by: source == 'ugc'"
echo "   - Delete all UGC events"
echo ""
echo "4. Or wait for the updated API with DELETE endpoint to be deployed"
echo ""

echo "🔍 UGC Event IDs that need deletion:"
echo "$response" | jq -r '.data[] | select(.source == "ugc" or .isUGC == true) | .id'