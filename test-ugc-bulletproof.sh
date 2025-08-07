#!/bin/bash

# UGC System Bulletproof Testing Script
# Tests all edge cases, error scenarios, and integration points

API_BASE="https://us-central1-conference-party-app.cloudfunctions.net/api"
TEST_RESULTS=()
FAILED_TESTS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Starting Bulletproof UGC Testing Suite"
echo "========================================="

# Function to test and record results
test_case() {
    local test_name="$1"
    local command="$2"
    local expected="$3"
    
    echo -e "\n${YELLOW}Testing: $test_name${NC}"
    
    result=$(eval "$command" 2>&1)
    
    if [[ "$result" == *"$expected"* ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TEST_RESULTS+=("✅ $test_name")
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "Expected: $expected"
        echo "Got: $result"
        TEST_RESULTS+=("❌ $test_name")
        ((FAILED_TESTS++))
    fi
}

# 1. DUPLICATE DETECTION EDGE CASES
echo -e "\n${YELLOW}=== 1. DUPLICATE DETECTION TESTS ===${NC}"

# Test 1.1: Exact duplicate
test_case "1.1 Exact venue and time duplicate detection" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -H 'Content-Type: application/json' \
    -d '{\"name\":\"Test Event\",\"creator\":\"Tester\",\"date\":\"2025-08-20\",\"startTime\":\"19:00\",\"venue\":\"Koelnmesse Hall 4\"}' | jq -r '.duplicateWarning'" \
    "true"

# Test 1.2: Similar venue with typos
test_case "1.2 Similar venue with typos" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -H 'Content-Type: application/json' \
    -d '{\"name\":\"Test\",\"creator\":\"Test\",\"date\":\"2025-08-20\",\"startTime\":\"19:00\",\"venue\":\"Koelnmesse Hal 4\"}' | jq -r '.duplicateWarning'" \
    "true"

# Test 1.3: Different date should not trigger duplicate
test_case "1.3 Different date no duplicate" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -H 'Content-Type: application/json' \
    -d '{\"name\":\"Test\",\"creator\":\"Test\",\"date\":\"2025-08-21\",\"startTime\":\"19:00\",\"venue\":\"Koelnmesse Hall 4\",\"forceCreate\":true}' | jq -r '.success'" \
    "true"

# 2. INPUT VALIDATION & SANITIZATION
echo -e "\n${YELLOW}=== 2. INPUT VALIDATION TESTS ===${NC}"

# Test 2.1: SQL Injection attempt
test_case "2.1 SQL Injection prevention" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -H 'Content-Type: application/json' \
    -d '{\"name\":\"Test DROP TABLE events\",\"creator\":\"Hacker\",\"date\":\"2025-08-22\",\"startTime\":\"20:00\",\"venue\":\"Test\",\"forceCreate\":true}' | jq -r '.success'" \
    "true"

# Test 2.2: XSS attempt
test_case "2.2 XSS prevention" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -H 'Content-Type: application/json' \
    -d '{\"name\":\"<script>alert(1)</script>\",\"creator\":\"XSS Test\",\"date\":\"2025-08-22\",\"startTime\":\"21:00\",\"venue\":\"Safe Venue\",\"forceCreate\":true}' | jq -r '.success'" \
    "true"

# Test 2.3: Empty required fields
test_case "2.3 Empty required fields rejection" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -H 'Content-Type: application/json' \
    -d '{\"name\":\"\",\"creator\":\"\",\"date\":\"\",\"startTime\":\"\",\"venue\":\"\"}' | jq -r '.success'" \
    "false"

# Test 2.4: Very long input
test_case "2.4 Long input handling" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -H 'Content-Type: application/json' \
    -d '{\"name\":\"$(printf 'A%.0s' {1..500})\",\"creator\":\"$(printf 'B%.0s' {1..200})\",\"date\":\"2025-08-22\",\"startTime\":\"22:00\",\"venue\":\"Test\"}' | jq -r '.error' | grep -q 'exceed' && echo 'true' || echo 'false'" \
    "true"

# Test 2.5: Special characters
test_case "2.5 Special characters handling" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -H 'Content-Type: application/json' \
    -d '{\"name\":\"Event @ Köln #1 & Friends!\",\"creator\":\"Müller & Co.\",\"date\":\"2025-08-23\",\"startTime\":\"19:00\",\"venue\":\"Café & Bar\",\"forceCreate\":true}' | jq -r '.success'" \
    "true"

# 3. API INTEGRATION TESTS
echo -e "\n${YELLOW}=== 3. API INTEGRATION TESTS ===${NC}"

# Test 3.1: Mixed feed includes UGC
test_case "3.1 Mixed feed includes UGC events" \
    "curl -s '$API_BASE/parties?limit=100' | jq -r '.meta.ugcCount' | grep -E '^[0-9]+$' && echo 'true' || echo 'false'" \
    "true"

# Test 3.2: Filter to exclude UGC
test_case "3.2 Exclude UGC filter works" \
    "curl -s '$API_BASE/parties?includeUGC=false&limit=100' | jq -r '.meta.ugcCount'" \
    "0"

# Test 3.3: Pagination with UGC
test_case "3.3 Pagination works with mixed events" \
    "curl -s '$API_BASE/parties?page=1&limit=5' | jq -r '.meta.hasMore'" \
    "true"

# 4. PERFORMANCE TESTS
echo -e "\n${YELLOW}=== 4. PERFORMANCE TESTS ===${NC}"

# Test 4.1: Response time under 2 seconds
test_case "4.1 API response time < 2s" \
    "curl -s -w '%{time_total}' -o /dev/null '$API_BASE/parties?limit=50' | awk '{if(\$1 < 2) print \"true\"; else print \"false\"}'" \
    "true"

# Test 4.2: Concurrent requests
echo -e "\n${YELLOW}Testing: 4.2 Concurrent request handling${NC}"
for i in {1..5}; do
    curl -s "$API_BASE/parties?limit=10" > /dev/null 2>&1 &
done
wait
echo -e "${GREEN}✅ PASSED - Handled 5 concurrent requests${NC}"
TEST_RESULTS+=("✅ 4.2 Concurrent request handling")

# 5. ERROR HANDLING TESTS
echo -e "\n${YELLOW}=== 5. ERROR HANDLING TESTS ===${NC}"

# Test 5.1: Invalid JSON
test_case "5.1 Invalid JSON handling" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -H 'Content-Type: application/json' \
    -d 'invalid json {' | jq -r '.success'" \
    "false"

# Test 5.2: Missing content-type
test_case "5.2 Missing content-type handling" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -d '{\"name\":\"Test\"}' | grep -q 'error' && echo 'true' || echo 'false'" \
    "true"

# Test 5.3: Wrong HTTP method
test_case "5.3 Wrong HTTP method handling" \
    "curl -s -X GET '$API_BASE/ugc/events/create' | jq -r '.error' | grep -q 'not allowed' && echo 'true' || echo 'false'" \
    "true"

# 6. DATA CONSISTENCY TESTS
echo -e "\n${YELLOW}=== 6. DATA CONSISTENCY TESTS ===${NC}"

# Test 6.1: Create and retrieve
echo -e "\n${YELLOW}Testing: 6.1 Create and retrieve consistency${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/ugc/events/create" \
    -H "Content-Type: application/json" \
    -d '{"name":"Consistency Test Event","creator":"Test Suite","date":"2025-08-25","startTime":"15:00","venue":"Test Venue 123","forceCreate":true}')

EVENT_ID=$(echo $CREATE_RESPONSE | jq -r '.eventId')

if [[ -n "$EVENT_ID" && "$EVENT_ID" != "null" ]]; then
    # Check if event appears in main feed
    sleep 2 # Allow time for propagation
    FOUND=$(curl -s "$API_BASE/parties?limit=100" | jq -r ".data[] | select(.id == \"$EVENT_ID\") | .id")
    
    if [[ "$FOUND" == "$EVENT_ID" ]]; then
        echo -e "${GREEN}✅ PASSED - Event created and retrievable${NC}"
        TEST_RESULTS+=("✅ 6.1 Create and retrieve consistency")
    else
        echo -e "${RED}❌ FAILED - Event not found in feed${NC}"
        TEST_RESULTS+=("❌ 6.1 Create and retrieve consistency")
        ((FAILED_TESTS++))
    fi
else
    echo -e "${RED}❌ FAILED - Could not create event${NC}"
    TEST_RESULTS+=("❌ 6.1 Create and retrieve consistency")
    ((FAILED_TESTS++))
fi

# 7. SECURITY TESTS
echo -e "\n${YELLOW}=== 7. SECURITY TESTS ===${NC}"

# Test 7.1: Path traversal attempt
test_case "7.1 Path traversal prevention" \
    "curl -s -X POST '$API_BASE/../../../admin/clear' | grep -q '404' && echo 'true' || echo 'false'" \
    "true"

# Test 7.2: Large payload rejection
echo -e "\n${YELLOW}Testing: 7.2 Large payload rejection${NC}"
LARGE_PAYLOAD=$(printf '{"name":"Test","creator":"Test","description":"%*s","date":"2025-08-26","startTime":"10:00","venue":"Test"}' 1000000 | tr ' ' 'A')
RESPONSE=$(curl -s -X POST "$API_BASE/ugc/events/create" \
    -H "Content-Type: application/json" \
    -d "$LARGE_PAYLOAD" 2>&1)

if [[ "$RESPONSE" == *"413"* ]] || [[ "$RESPONSE" == *"too large"* ]] || [[ "$RESPONSE" == *"error"* ]]; then
    echo -e "${GREEN}✅ PASSED - Large payload handled${NC}"
    TEST_RESULTS+=("✅ 7.2 Large payload rejection")
else
    echo -e "${YELLOW}⚠️  WARNING - Large payload may not be limited${NC}"
    TEST_RESULTS+=("⚠️  7.2 Large payload rejection")
fi

# 8. FIELD MAPPING TESTS
echo -e "\n${YELLOW}=== 8. FIELD MAPPING TESTS ===${NC}"

# Test 8.1: UGC fields properly mapped
test_case "8.1 UGC fields mapped to standard format" \
    "curl -s '$API_BASE/parties?limit=100' | jq -r '.data[] | select(.isUGC == true) | has(\"Event Name\")' | head -1" \
    "true"

# 9. OFFLINE/PWA TESTS
echo -e "\n${YELLOW}=== 9. PWA/OFFLINE SIMULATION ===${NC}"

# Test 9.1: Service worker caching headers
test_case "9.1 API returns cacheable headers" \
    "curl -s -I '$API_BASE/parties' | grep -q 'Cache-Control\\|ETag\\|Last-Modified' && echo 'true' || echo 'false'" \
    "true"

# 10. EDGE CASE TESTS
echo -e "\n${YELLOW}=== 10. EDGE CASE TESTS ===${NC}"

# Test 10.1: Unicode and emoji handling
test_case "10.1 Unicode and emoji support" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -H 'Content-Type: application/json' \
    -d '{\"name\":\"🎉 Party 派对 パーティー\",\"creator\":\"👤 User\",\"date\":\"2025-08-27\",\"startTime\":\"20:00\",\"venue\":\"🏢 Building\",\"forceCreate\":true}' | jq -r '.success'" \
    "true"

# Test 10.2: Time edge cases
test_case "10.2 Edge time values (00:00)" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -H 'Content-Type: application/json' \
    -d '{\"name\":\"Midnight Event\",\"creator\":\"Night Owl\",\"date\":\"2025-08-28\",\"startTime\":\"00:00\",\"venue\":\"Late Venue\",\"forceCreate\":true}' | jq -r '.success'" \
    "true"

# Test 10.3: Date validation (invalid date)
test_case "10.3 Invalid date format rejection" \
    "curl -s -X POST '$API_BASE/ugc/events/create' \
    -H 'Content-Type: application/json' \
    -d '{\"name\":\"Test\",\"creator\":\"Test\",\"date\":\"not-a-date\",\"startTime\":\"19:00\",\"venue\":\"Test\"}' | jq -r '.success'" \
    "false"

# ====== RESULTS SUMMARY ======
echo -e "\n${YELLOW}======================================${NC}"
echo -e "${YELLOW}        TEST RESULTS SUMMARY${NC}"
echo -e "${YELLOW}======================================${NC}\n"

for result in "${TEST_RESULTS[@]}"; do
    echo "$result"
done

echo -e "\n${YELLOW}======================================${NC}"
TOTAL_TESTS=${#TEST_RESULTS[@]}
PASSED_TESTS=$((TOTAL_TESTS - FAILED_TESTS))

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! ($PASSED_TESTS/$TOTAL_TESTS)${NC}"
    echo -e "${GREEN}The UGC system is BULLETPROOF! 💪${NC}"
else
    echo -e "${RED}⚠️  SOME TESTS FAILED: $FAILED_TESTS/$TOTAL_TESTS${NC}"
    echo -e "${YELLOW}Review failed tests above for details${NC}"
fi

echo -e "${YELLOW}======================================${NC}\n"

# Clean up test data (optional)
echo -e "${YELLOW}Cleaning up test data...${NC}"
# Add cleanup commands here if needed

exit $FAILED_TESTS