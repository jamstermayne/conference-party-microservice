#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_lib.sh"

h1 "Calendar Integration Audit"

echo "📅 Backend Calendar Endpoints:"
# Check for calendar endpoints in functions
if [ -d "$ROOT/functions/src" ]; then
  ENDPOINTS=$(grep -RnE "(/api/gcal/|/api/googleCalendar/|/api/calendar)" "$ROOT/functions/src" 2>/dev/null || true)
  if [ -n "$ENDPOINTS" ]; then
    ENDPOINT_COUNT=$(echo "$ENDPOINTS" | wc -l)
    ok "Found $ENDPOINT_COUNT calendar endpoint references in backend:"
    echo "$ENDPOINTS" | head -10 | while IFS=: read -r file line content; do
      rel_path="${file#$ROOT/}"
      endpoint=$(echo "$content" | grep -oE "/api/[^'\"]*" | head -1)
      echo "  • $rel_path:$line"
      echo "    Endpoint: $endpoint"
    done
  else
    warn "No calendar endpoints found in functions/src"
  fi
else
  warn "functions/src directory not found"
fi

echo ""
echo "📱 Frontend Calendar Integration:"
# Check frontend calendar hooks
CAL_PROVIDERS=$(find "$JS_DIR" -name "*calendar*" -o -name "*gcal*" 2>/dev/null || true)
if [ -n "$CAL_PROVIDERS" ]; then
  ok "Calendar-related files found:"
  echo "$CAL_PROVIDERS" | while read -r file; do
    rel_path="${file#$ROOT/}"
    size=$(du -h "$file" | cut -f1)
    echo "  • $rel_path ($size)"
  done
else
  warn "No calendar integration files found"
fi

# Check for specific calendar provider implementations
echo ""
echo "🔗 Calendar Provider Services:"
GOOGLE_CAL=$(grep -Rn "googleCalendar\|gcal" "$JS_DIR" 2>/dev/null | wc -l || echo 0)
ICAL_EXPORT=$(grep -Rn "ical\|ics\|vCalendar" "$JS_DIR" 2>/dev/null | wc -l || echo 0)
OUTLOOK=$(grep -Rn "outlook\|microsoft.*calendar" "$JS_DIR" 2>/dev/null | wc -l || echo 0)

echo "  Provider references:"
[ "$GOOGLE_CAL" -gt 0 ] && echo "    • Google Calendar: $GOOGLE_CAL references"
[ "$ICAL_EXPORT" -gt 0 ] && echo "    • iCal/ICS export: $ICAL_EXPORT references"
[ "$OUTLOOK" -gt 0 ] && echo "    • Outlook: $OUTLOOK references"

echo ""
echo "🔐 OAuth Configuration:"
# Check for OAuth flow
OAUTH_FLOW=$(grep -Rn "oauth\|OAuth\|/auth/google" "$JS_DIR" 2>/dev/null || true)
if [ -n "$OAUTH_FLOW" ]; then
  OAUTH_COUNT=$(echo "$OAUTH_FLOW" | wc -l)
  ok "OAuth flow implementation found ($OAUTH_COUNT references)"
else
  warn "No OAuth implementation found"
fi

echo ""
echo "🌐 Production Endpoint Testing:"
# Test calendar endpoints (non-breaking)
fetch_head() {
  local url="$1"
  local response
  response=$(curl -sS -I -X HEAD "$url" 2>/dev/null | head -1 || echo "Failed")
  echo "  $url"
  echo "    Response: $response"
}

echo "Testing calendar endpoints:"
for endpoint in "/api/gcal/connect" "/api/googleCalendar/status" "/api/calendar/status"; do
  fetch_head "$API_PROD$endpoint"
done

echo ""
echo "🎯 Calendar Button Implementation:"
# Check for calendar button components
CAL_BUTTONS=$(grep -Rn "add-to-calendar\|calendar-button\|AddToCalendar" "$JS_DIR" "$CSS_DIR" 2>/dev/null || true)
if [ -n "$CAL_BUTTONS" ]; then
  BUTTON_COUNT=$(echo "$CAL_BUTTONS" | wc -l)
  ok "Calendar button implementation found ($BUTTON_COUNT references)"
  
  # Check for data attributes
  DATA_ATTRS=$(grep -Rn "data-start\|data-end\|data-title" "$SRC_FE" 2>/dev/null | head -5 || true)
  if [ -n "$DATA_ATTRS" ]; then
    echo "  Event data attributes found:"
    echo "$DATA_ATTRS" | sed 's/^/    • /' | head -3
  fi
else
  warn "No calendar button implementation found"
fi

echo ""
echo "📊 Calendar Integration Summary:"
echo "  ✅ Implemented:"
[ -n "$ENDPOINTS" ] && echo "    • Backend calendar endpoints"
[ -n "$CAL_PROVIDERS" ] && echo "    • Frontend calendar services"
[ "$GOOGLE_CAL" -gt 0 ] && echo "    • Google Calendar integration"
[ -n "$CAL_BUTTONS" ] && echo "    • Calendar button components"

echo ""
echo "  ⚠️  Missing/Issues:"
[ -z "$ENDPOINTS" ] && echo "    • No backend calendar endpoints"
[ -z "$OAUTH_FLOW" ] && echo "    • No OAuth flow detected"
[ "$ICAL_EXPORT" -eq 0 ] && echo "    • No iCal export capability"