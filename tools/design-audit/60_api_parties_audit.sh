#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_lib.sh"

h1 "Parties API Audit"

echo "🎉 Testing Parties API Endpoint:"
API_ENDPOINT="$API_PROD/parties?conference=gamescom2025"
echo "  GET $API_ENDPOINT"
echo ""

if curl -sS "$API_ENDPOINT" -o /tmp/_parties.json 2>/dev/null; then
  FILE_SIZE=$(wc -c < /tmp/_parties.json)
  ok "Successfully fetched parties data ($FILE_SIZE bytes)"
  
  # Validate JSON structure
  if jq empty /tmp/_parties.json 2>/dev/null; then
    ok "Valid JSON response"
    
    # Check response structure
    if jq -e '.data' /tmp/_parties.json >/dev/null 2>&1; then
      PARTY_COUNT=$(jq '.data | length' /tmp/_parties.json)
      ok "Response contains 'data' array with $PARTY_COUNT parties"
      
      # Sample first party structure
      echo ""
      echo "  First party structure:"
      jq '.data[0] | keys' /tmp/_parties.json 2>/dev/null | head -20 | sed 's/^/    /'
      
    elif jq -e '.parties' /tmp/_parties.json >/dev/null 2>&1; then
      PARTY_COUNT=$(jq '.parties | length' /tmp/_parties.json)
      ok "Response contains 'parties' array with $PARTY_COUNT parties"
      
      # Sample first party structure
      echo ""
      echo "  First party structure:"
      jq '.parties[0] | keys' /tmp/_parties.json 2>/dev/null | head -20 | sed 's/^/    /'
      
    else
      err "Unexpected response structure (no 'data' or 'parties' array)"
      echo "  Response structure:"
      jq 'keys' /tmp/_parties.json 2>/dev/null | sed 's/^/    /'
    fi
    
    # Check for required party fields
    echo ""
    echo "📋 Party Data Validation:"
    REQUIRED_FIELDS=("title" "date" "time" "venue")
    for field in "${REQUIRED_FIELDS[@]}"; do
      if jq -e ".data[0].$field // .parties[0].$field" /tmp/_parties.json >/dev/null 2>&1; then
        ok "Field '$field' present"
      else
        warn "Field '$field' missing"
      fi
    done
    
    # Check for optional but important fields
    echo ""
    echo "🔍 Optional Fields Check:"
    OPTIONAL_FIELDS=("description" "organizer" "category" "url" "lat" "lng")
    for field in "${OPTIONAL_FIELDS[@]}"; do
      if jq -e ".data[0].$field // .parties[0].$field" /tmp/_parties.json >/dev/null 2>&1; then
        echo "  ✓ Field '$field' present"
      else
        echo "  ○ Field '$field' not found"
      fi
    done
    
  else
    err "Invalid JSON response"
    echo "  First 500 chars:"
    head -c 500 /tmp/_parties.json | sed 's/^/    /'
  fi
else
  err "Failed to fetch parties API (HTTP error or timeout)"
fi

echo ""
echo "🔄 Testing Other API Endpoints:"

# Test health endpoint
echo "  GET $API_PROD/health"
if curl -sS "$API_PROD/health" -o /tmp/_health.json 2>/dev/null; then
  if jq empty /tmp/_health.json 2>/dev/null; then
    STATUS=$(jq -r '.status // "unknown"' /tmp/_health.json)
    ok "Health check: $STATUS"
  else
    # Might be HTML (404 page)
    if grep -q "404" /tmp/_health.json; then
      warn "Health endpoint returns 404"
    else
      ok "Health endpoint responded (non-JSON)"
    fi
  fi
else
  err "Health endpoint failed"
fi

# Test sync endpoint
echo "  GET $API_PROD/sync"
if curl -sS "$API_PROD/sync" -o /tmp/_sync.json 2>/dev/null; then
  SYNC_SIZE=$(wc -c < /tmp/_sync.json)
  if [ "$SYNC_SIZE" -gt 100 ]; then
    ok "Sync endpoint responded ($SYNC_SIZE bytes)"
  else
    warn "Sync endpoint returned minimal data"
  fi
else
  warn "Sync endpoint not accessible"
fi

echo ""
echo "📊 API Summary:"
echo "  Endpoints tested:"
echo "    • /parties - Main data endpoint"
echo "    • /health - Service health check"
echo "    • /sync - Data synchronization"

if [ -f /tmp/_parties.json ] && [ "$FILE_SIZE" -gt 1000 ]; then
  echo ""
  echo "  Data quality:"
  echo "    • Total parties: ${PARTY_COUNT:-0}"
  echo "    • Response size: $FILE_SIZE bytes"
  echo "    • Valid JSON: ✅"
fi

echo ""
echo "🔐 Security Check:"
# Check for sensitive data exposure
if [ -f /tmp/_parties.json ]; then
  SENSITIVE=$(jq -r '.. | select(type == "string") | select(test("password|secret|token|key"; "i"))' /tmp/_parties.json 2>/dev/null || true)
  if [ -z "$SENSITIVE" ]; then
    ok "No obvious sensitive data exposed"
  else
    err "Potential sensitive data in response:"
    echo "$SENSITIVE" | head -3 | sed 's/^/    /'
  fi
fi