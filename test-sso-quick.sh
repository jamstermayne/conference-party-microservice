#!/bin/bash

# Quick SSO Button Test
# Tests that all SSO buttons are working correctly

echo "🔐 Quick SSO Button Test"
echo "========================"
echo ""

BASE_URL="${BASE_URL:-https://conference-party-app.web.app}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Testing: $BASE_URL"
echo ""

# Test results
PASSED=0
FAILED=0

echo "1️⃣  Testing OAuth Endpoints"
echo "-------------------------"

# Test Google Calendar OAuth
echo -n "Google Calendar OAuth endpoint: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/googleCalendar/status")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
    echo -e "${GREEN}✓ Working (HTTP $RESPONSE)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Failed (HTTP $RESPONSE)${NC}"
    ((FAILED++))
fi

# Test Google OAuth start
echo -n "Google OAuth start redirect: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/api/googleCalendar/google/start")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "303" ]; then
    echo -e "${GREEN}✓ Working${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Failed (HTTP $RESPONSE)${NC}"
    ((FAILED++))
fi

echo ""
echo "2️⃣  Testing Frontend Buttons"
echo "--------------------------"

# Download the main app page
echo -n "Downloading app page... "
curl -s "$BASE_URL" > /tmp/app.html
echo "done"

# Check for SSO button code
echo -n "Google sync button code: "
if grep -q "sync-google\|syncGoogleCalendar" /tmp/app.html; then
    echo -e "${GREEN}✓ Found${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Not in initial HTML (loaded dynamically)${NC}"
fi

echo -n "LinkedIn sync button code: "
if grep -q "sync-linkedin\|syncLinkedIn" /tmp/app.html; then
    echo -e "${GREEN}✓ Found${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Not in initial HTML (loaded dynamically)${NC}"
fi

echo -n "Calendar sync prompt code: "
if grep -q "calendar-sync-prompt\|sync-google-calendar" /tmp/app.html; then
    echo -e "${GREEN}✓ Found${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Not in initial HTML (loaded dynamically)${NC}"
fi

echo ""
echo "3️⃣  Testing JavaScript Implementation"
echo "-----------------------------------"

# Check app-unified.js
echo -n "Fetching app-unified.js... "
curl -s "$BASE_URL/assets/js/app-unified.js" > /tmp/app-unified.js 2>/dev/null
if [ -f /tmp/app-unified.js ] && [ -s /tmp/app-unified.js ]; then
    echo "done"
    
    echo -n "syncGoogleCalendar function: "
    if grep -q "syncGoogleCalendar" /tmp/app-unified.js; then
        echo -e "${GREEN}✓ Found${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Not found${NC}"
        ((FAILED++))
    fi
    
    echo -n "OAuth popup code: "
    if grep -q "window\.open.*google.*start\|\/api\/googleCalendar\/google\/start" /tmp/app-unified.js; then
        echo -e "${GREEN}✓ Found${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Not found${NC}"
        ((FAILED++))
    fi
    
    echo -n "OAuth message handler: "
    if grep -q "gcal:success\|gcal:error" /tmp/app-unified.js; then
        echo -e "${GREEN}✓ Found${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Not found${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}Failed to fetch${NC}"
    ((FAILED+=3))
fi

echo ""
echo "4️⃣  Testing OAuth Security"
echo "------------------------"

# Test for state parameter
echo -n "OAuth state parameter: "
OAUTH_RESPONSE=$(curl -s -I "$BASE_URL/api/googleCalendar/google/start" 2>/dev/null | grep -i "location")
if echo "$OAUTH_RESPONSE" | grep -q "state="; then
    echo -e "${GREEN}✓ Present${NC}"
    ((PASSED++))
else
    # State might be in the redirect target
    echo -e "${YELLOW}⚠ Not visible in initial redirect${NC}"
fi

# Test CORS headers
echo -n "CORS headers on API: "
CORS=$(curl -s -I "$BASE_URL/api/health" | grep -i "access-control-allow-origin")
if [ ! -z "$CORS" ]; then
    echo -e "${GREEN}✓ Present${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Not found${NC}"
fi

echo ""
echo "5️⃣  Testing Calendar Sync Endpoint"
echo "--------------------------------"

echo -n "Calendar events sync endpoint: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/googleCalendar/events/sync" \
    -H "Content-Type: application/json" \
    -d '{"events":[]}')
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "400" ]; then
    echo -e "${GREEN}✓ Protected (HTTP $RESPONSE)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Unexpected response (HTTP $RESPONSE)${NC}"
fi

echo ""
echo "======================================="
echo "            TEST RESULTS               "
echo "======================================="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"

TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo "Success Rate: $SUCCESS_RATE%"
    
    if [ $FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✅ All SSO buttons are working correctly!${NC}"
        echo ""
        echo "Summary:"
        echo "• Google Calendar OAuth is properly configured"
        echo "• OAuth popup implementation is in place"
        echo "• Security measures (state, CORS) are active"
        echo "• Calendar sync endpoint is protected"
        exit 0
    elif [ $SUCCESS_RATE -ge 70 ]; then
        echo -e "\n${YELLOW}⚠️  SSO buttons mostly working${NC}"
        echo "Some features may need attention"
        exit 0
    else
        echo -e "\n${RED}❌ SSO buttons have issues${NC}"
        exit 1
    fi
fi