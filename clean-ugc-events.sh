#!/bin/bash

# CLEAN UGC TEST EVENTS
# Script to remove test events created during UGC system development

echo "🗑️  Cleaning UGC test events from database..."
echo "⚠️  This will remove test events created during development"
echo ""

# Get current events to show what will be deleted
echo "📊 Fetching current events..."
response=$(curl -s "https://us-central1-conference-party-app.cloudfunctions.net/api/parties")

# Count total events and UGC events
total_events=$(echo "$response" | jq '.data | length')
ugc_count=$(echo "$response" | jq '[.data[] | select(.source == "ugc" or .isUGC == true)] | length')
curated_count=$((total_events - ugc_count))

echo "📊 Database status:"
echo "   Total events: $total_events"
echo "   UGC test events: $ugc_count" 
echo "   Curated events: $curated_count (will be preserved)"
echo ""

if [ "$ugc_count" -eq 0 ]; then
    echo "✅ No UGC test events found to delete"
    exit 0
fi

echo "🗑️  Found $ugc_count UGC test events to delete:"
echo "$response" | jq -r '.data[] | select(.source == "ugc" or .isUGC == true) | "   - \(.name // .["Event Name"]) (\(.creator // .Hosts)) - \(.date // .Date)"'
echo ""

echo "🚀 Starting deletion process..."
echo ""

# Get UGC event IDs
ugc_ids=$(echo "$response" | jq -r '.data[] | select(.source == "ugc" or .isUGC == true) | .id')

deleted_count=0
failed_count=0

# Delete each UGC event
echo "$ugc_ids" | while read -r event_id; do
    if [ -n "$event_id" ]; then
        echo "🗑️  Deleting event: $event_id"
        
        delete_response=$(curl -s -X DELETE \
            "https://us-central1-conference-party-app.cloudfunctions.net/api/parties/$event_id" \
            -H "Content-Type: application/json")
        
        # Check if deletion was successful
        if echo "$delete_response" | jq -e '.success' >/dev/null 2>&1; then
            echo "   ✅ Successfully deleted"
            ((deleted_count++))
        else
            echo "   ❌ Failed to delete"
            echo "      Response: $delete_response"
            ((failed_count++))
        fi
        
        # Small delay to avoid rate limiting
        sleep 0.5
    fi
done

echo ""
echo "🎉 Cleanup completed!"
echo "   Deleted: $deleted_count events"
echo "   Failed: $failed_count events"
echo ""

# Verify final state
echo "📊 Verifying final database state..."
final_response=$(curl -s "https://us-central1-conference-party-app.cloudfunctions.net/api/parties")
final_total=$(echo "$final_response" | jq '.data | length')
final_ugc=$(echo "$final_response" | jq '[.data[] | select(.source == "ugc" or .isUGC == true)] | length')
final_curated=$((final_total - final_ugc))

echo "   Final total events: $final_total"
echo "   Remaining UGC events: $final_ugc"
echo "   Curated events: $final_curated"

if [ "$final_ugc" -eq 0 ]; then
    echo ""
    echo "✅ Database cleanup successful!"
    echo "🗄️  Only production events remain"
else
    echo ""
    echo "⚠️  $final_ugc UGC events still remain"
fi

echo ""
echo "🏁 Cleanup process completed"