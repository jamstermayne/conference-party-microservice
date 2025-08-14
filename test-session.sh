#!/bin/bash

echo "Testing Google Calendar Session Management"
echo "=========================================="

BASE_URL="http://localhost:5001/conference-party-app/us-central1/api"

# Test 1: Check status without session
echo -e "\n1. Testing status without session (should create session):"
curl -c cookies.txt -b cookies.txt \
  "$BASE_URL/googleCalendar/status" \
  -H "Content-Type: application/json" | jq '.'

# Test 2: Check status with session (should use existing session)
echo -e "\n2. Testing status with existing session:"
curl -b cookies.txt \
  "$BASE_URL/googleCalendar/status" \
  -H "Content-Type: application/json" | jq '.'

# Test 3: Start OAuth flow
echo -e "\n3. Testing OAuth start (should include session in state):"
curl -b cookies.txt -i \
  "$BASE_URL/googleCalendar/google/start" \
  -H "Content-Type: application/json" | head -n 20

# Test 4: Disconnect calendar
echo -e "\n4. Testing disconnect:"
curl -b cookies.txt \
  -X POST \
  "$BASE_URL/googleCalendar/disconnect" \
  -H "Content-Type: application/json" | jq '.'

# Clean up
rm -f cookies.txt

echo -e "\n✅ Session management tests complete!"