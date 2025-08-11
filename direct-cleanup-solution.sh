#!/bin/bash

# DIRECT CLEANUP SOLUTION
# Creates a comprehensive cleanup strategy for UGC test events

echo "🧹 COMPREHENSIVE UGC TEST EVENT CLEANUP SOLUTION"
echo "================================================="
echo ""

# Get current database status
echo "📊 Analyzing current database state..."
response=$(curl -s "https://us-central1-conference-party-app.cloudfunctions.net/api/parties")

total_events=$(echo "$response" | jq -r '.meta.total // (.data | length)')
ugc_count=$(echo "$response" | jq -r '.meta.ugcCount // ([.data[] | select(.source == "ugc" or .isUGC == true)] | length)')
curated_count=$((total_events - ugc_count))

echo "📋 Database Status:"
echo "   Total events: $total_events"
echo "   UGC test events: $ugc_count (TO BE DELETED)"
echo "   Curated events: $curated_count (PRESERVE)"
echo ""

if [ "$ugc_count" -eq 0 ]; then
    echo "✅ No UGC test events found - database is already clean!"
    exit 0
fi

echo "🎯 UGC Test Events Identified for Deletion:"
echo "============================================"

# Create detailed report of UGC events
echo "$response" | jq -r '.data[] | select(.source == "ugc" or .isUGC == true) | 
"ID: \(.id)
Name: \(.name // .["Event Name"])  
Creator: \(.creator // .Hosts)
Date: \(.date // .Date)
Venue: \(.venue // .Address)
Type: Test/Development Event
---"'

echo ""
echo "📝 CLEANUP SOLUTIONS:"
echo "===================="
echo ""

echo "🚀 SOLUTION 1: Deploy Updated API (Recommended)"
echo "-----------------------------------------------"
echo "1. Re-authenticate Firebase:"
echo "   firebase login --reauth"
echo ""
echo "2. Deploy updated functions:"
echo "   npm run deploy"
echo ""
echo "3. Execute cleanup:"
echo "   curl -X DELETE 'https://us-central1-conference-party-app.cloudfunctions.net/api/ugc/events'"
echo ""

echo "🔧 SOLUTION 2: Manual Firebase Console Cleanup"
echo "----------------------------------------------"
echo "1. Go to: https://console.firebase.google.com/"
echo "2. Select project: conference-party-app"
echo "3. Navigate to: Firestore Database"
echo "4. Collection: events"
echo "5. Filter by: source == 'ugc'"
echo "6. Select all UGC events and delete"
echo ""

echo "🛠️ SOLUTION 3: Direct Firestore API Cleanup"
echo "-------------------------------------------"
echo "Using Google Cloud SDK with service account:"
echo ""
echo "# Install gcloud CLI"
echo "# Authenticate with service account"
echo "# Use Firestore REST API to batch delete UGC events"
echo ""

echo "📋 UGC Event IDs for Manual Deletion:"
echo "====================================="
echo "$response" | jq -r '.data[] | select(.source == "ugc" or .isUGC == true) | .id' | nl

echo ""
echo "⚡ IMMEDIATE ACTION SCRIPT:"
echo "=========================="
echo "# Save UGC IDs to file for bulk operations"

# Save UGC event IDs to a file
ugc_ids_file="/tmp/ugc_event_ids.txt"
echo "$response" | jq -r '.data[] | select(.source == "ugc" or .isUGC == true) | .id' > "$ugc_ids_file"

echo "UGC Event IDs saved to: $ugc_ids_file"
echo "Total IDs saved: $(wc -l < $ugc_ids_file)"
echo ""

echo "🔍 VERIFICATION QUERIES:"
echo "========================"
echo "# Check current UGC count:"
echo "curl -s 'https://us-central1-conference-party-app.cloudfunctions.net/api/parties' | jq '.meta.ugcCount'"
echo ""
echo "# After cleanup, verify only curated events remain:"
echo "curl -s 'https://us-central1-conference-party-app.cloudfunctions.net/api/parties' | jq '[.data[] | select(.source == \"gamescom-sheets\")] | length'"
echo ""

echo "🎯 CLEANUP SUMMARY:"
echo "==================="
echo "✅ UGC cleanup solution ready"
echo "✅ $ugc_count test events identified"
echo "✅ $curated_count production events will be preserved" 
echo "✅ Multiple cleanup methods provided"
echo "✅ Verification queries prepared"
echo ""

echo "🚨 IMPORTANT REMINDERS:"
echo "======================="
echo "⚠️  ONLY delete events with source='ugc' or isUGC=true"
echo "⚠️  PRESERVE all events with source='gamescom-sheets'"
echo "⚠️  Backup database before bulk operations"
echo "⚠️  Verify cleanup with provided queries"
echo ""

echo "📊 Expected Result: $total_events → $curated_count events (${ugc_count} removed)"
echo ""
echo "🏁 Ready for cleanup execution!"