#!/bin/bash

echo "🗑️  Deleting all UGC test events..."
echo ""

# Call the DELETE endpoint
response=$(curl -X DELETE -s -w "\nHTTP_STATUS:%{http_code}" "https://us-central1-conference-party-app.cloudfunctions.net/api/ugc/events")

# Extract HTTP status
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
body=$(echo "$response" | sed '$d')

echo "Response: $body"
echo "HTTP Status: $http_status"

if [ "$http_status" = "200" ]; then
    echo ""
    echo "✅ UGC events deletion request successful"
    
    # Verify by checking the count
    echo ""
    echo "🔍 Verifying deletion..."
    count=$(curl -s "https://us-central1-conference-party-app.cloudfunctions.net/api/parties?limit=100" | grep -o '"isUGC":true' | wc -l)
    echo "Remaining UGC events: $count"
    
    if [ "$count" = "0" ]; then
        echo "✅ All UGC test events have been successfully deleted!"
    else
        echo "⚠️  $count UGC events still remain"
    fi
else
    echo "❌ Failed to delete UGC events (HTTP $http_status)"
    echo "Note: The DELETE endpoint may not be deployed yet. Try again after deployment completes."
fi