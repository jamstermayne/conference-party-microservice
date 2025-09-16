#!/bin/bash

# Test Admin Authentication System
echo "🔐 Testing Admin Authentication Middleware..."
echo "=========================================="

API_URL="http://localhost:5001/conference-party-app/us-central1/api"

# Test 1: Try to access admin endpoint without auth
echo -e "\n1️⃣ Test: Access without authentication"
curl -s -X GET "$API_URL/admin" | jq '.'

# Test 2: Login with valid credentials
echo -e "\n2️⃣ Test: Login with valid credentials"
TOKEN=$(curl -s -X POST "$API_URL/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@conference-party.com","password":"admin123"}' | jq -r '.token')

if [ "$TOKEN" != "null" ]; then
  echo "✅ Login successful! Token received."
else
  echo "❌ Login failed!"
fi

# Test 3: Access admin endpoint with token
echo -e "\n3️⃣ Test: Access with valid token"
curl -s -X GET "$API_URL/admin" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Test 4: Get current user info
echo -e "\n4️⃣ Test: Get current user info"
curl -s -X GET "$API_URL/admin/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Test 5: Access matchmaking stats (requires permission)
echo -e "\n5️⃣ Test: Access matchmaking stats (requires MATCHMAKING permission)"
curl -s -X GET "$API_URL/admin/matchmaking/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Test 6: Refresh token
echo -e "\n6️⃣ Test: Refresh token"
NEW_TOKEN=$(curl -s -X POST "$API_URL/admin/auth/refresh" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.token')

if [ "$NEW_TOKEN" != "null" ]; then
  echo "✅ Token refreshed successfully!"
else
  echo "❌ Token refresh failed!"
fi

# Test 7: Logout
echo -e "\n7️⃣ Test: Logout"
curl -s -X POST "$API_URL/admin/auth/logout" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n=========================================="
echo "✨ Authentication tests complete!"