#!/bin/bash

# SSO Button Test Runner
# Executes all SSO integration tests

set -e

echo "🔐 SSO Button Test Suite"
echo "========================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test environment
BASE_URL="${BASE_URL:-https://conference-party-app.web.app}"
echo "Testing against: $BASE_URL"
echo ""

# Function to run tests with nice output
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Running $test_name... "
    if eval "$test_command" > /tmp/test_output.log 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        echo "Error output:"
        tail -n 20 /tmp/test_output.log
        return 1
    fi
}

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

echo "1️⃣  Unit Tests"
echo "-------------"

# Run Jest unit tests
if [ -f "tests/sso-buttons.test.ts" ]; then
    if run_test "SSO Button Unit Tests" "cd functions && npm test -- sso-buttons.test.ts"; then
        ((TESTS_PASSED++))
    else
        ((TESTS_FAILED++))
    fi
else
    echo -e "${YELLOW}Skipping unit tests (file not found)${NC}"
fi

echo ""
echo "2️⃣  E2E Tests"
echo "-----------"

# Install Playwright if needed
if ! command -v npx playwright &> /dev/null; then
    echo "Installing Playwright..."
    npm install -D @playwright/test
    npx playwright install chromium
fi

# Run Playwright E2E tests
if [ -f "tests/e2e/sso-integration.spec.ts" ]; then
    if run_test "SSO Integration E2E Tests" "BASE_URL=$BASE_URL npx playwright test tests/e2e/sso-integration.spec.ts --reporter=list"; then
        ((TESTS_PASSED++))
    else
        ((TESTS_FAILED++))
    fi
else
    echo -e "${YELLOW}Skipping E2E tests (file not found)${NC}"
fi

echo ""
echo "3️⃣  API Endpoint Tests"
echo "--------------------"

# Test OAuth endpoints
echo -n "Testing Google OAuth endpoint... "
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/googleCalendar/status" | grep -q "200\|401"; then
    echo -e "${GREEN}✓${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC}"
    ((TESTS_FAILED++))
fi

echo -n "Testing calendar sync endpoint... "
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/googleCalendar/events" | grep -q "200\|401"; then
    echo -e "${GREEN}✓${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "4️⃣  Button Visibility Tests"
echo "-------------------------"

# Check if buttons are visible in the HTML
echo -n "Checking for SSO buttons in DOM... "
HTML_CONTENT=$(curl -s "$BASE_URL")

BUTTONS_FOUND=0
if echo "$HTML_CONTENT" | grep -q "sync-google"; then
    ((BUTTONS_FOUND++))
fi
if echo "$HTML_CONTENT" | grep -q "sync-linkedin"; then
    ((BUTTONS_FOUND++))
fi
if echo "$HTML_CONTENT" | grep -q "sync.*calendar"; then
    ((BUTTONS_FOUND++))
fi

if [ $BUTTONS_FOUND -gt 0 ]; then
    echo -e "${GREEN}✓ Found $BUTTONS_FOUND SSO button references${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ No SSO buttons found in initial HTML (may be dynamically loaded)${NC}"
fi

echo ""
echo "5️⃣  OAuth Flow Tests"
echo "------------------"

# Test OAuth redirect URLs
echo -n "Testing Google OAuth start URL... "
GOOGLE_OAUTH_RESPONSE=$(curl -s -I "$BASE_URL/api/googleCalendar/google/start" | head -n 1)
if echo "$GOOGLE_OAUTH_RESPONSE" | grep -q "302\|303"; then
    echo -e "${GREEN}✓ Redirects to Google OAuth${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ No redirect found${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "6️⃣  Security Tests"
echo "----------------"

# Test CORS headers
echo -n "Testing CORS configuration... "
CORS_HEADER=$(curl -s -I "$BASE_URL/api/health" | grep -i "access-control-allow-origin")
if [ ! -z "$CORS_HEADER" ]; then
    echo -e "${GREEN}✓ CORS headers present${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ No CORS headers found${NC}"
fi

# Test CSRF protection
echo -n "Testing OAuth state parameter... "
OAUTH_URL=$(curl -s -I "$BASE_URL/api/googleCalendar/google/start" | grep -i "location" | cut -d' ' -f2)
if echo "$OAUTH_URL" | grep -q "state="; then
    echo -e "${GREEN}✓ State parameter present${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ State parameter not visible in redirect${NC}"
fi

echo ""
echo "======================================="
echo "            TEST SUMMARY               "
echo "======================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    echo "Success Rate: $SUCCESS_RATE%"
    
    if [ $SUCCESS_RATE -ge 80 ]; then
        echo -e "\n${GREEN}✅ SSO Integration: HEALTHY${NC}"
        exit 0
    elif [ $SUCCESS_RATE -ge 60 ]; then
        echo -e "\n${YELLOW}⚠️  SSO Integration: DEGRADED${NC}"
        exit 1
    else
        echo -e "\n${RED}❌ SSO Integration: CRITICAL${NC}"
        exit 1
    fi
else
    echo -e "\n${YELLOW}No tests were run${NC}"
    exit 1
fi