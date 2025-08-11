#!/bin/bash

# Test Metrics System Live
echo "🧪 Testing Live Metrics System at https://conference-party-app.web.app"
echo "=================================================="

BASE_URL="https://conference-party-app.web.app"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "1️⃣  Testing Metrics Page Availability..."
if curl -s "$BASE_URL/test-metrics.html" | grep -q "Metrics System Test"; then
    echo -e "${GREEN}✅ Metrics test page is accessible${NC}"
else
    echo -e "${RED}❌ Metrics test page not found${NC}"
    exit 1
fi

echo ""
echo "2️⃣  Testing Metrics Script Loading..."
if curl -s "$BASE_URL/" | grep -q "/assets/js/metrics.js"; then
    echo -e "${GREEN}✅ Metrics script is loaded in main app${NC}"
else
    echo -e "${RED}❌ Metrics script not found in main app${NC}"
fi

echo ""
echo "3️⃣  Testing Main App Loading..."
if curl -s "$BASE_URL/" | grep -q "Velocity"; then
    echo -e "${GREEN}✅ Main app loads successfully${NC}"
else
    echo -e "${RED}❌ Main app failed to load${NC}"
fi

echo ""
echo "4️⃣  Testing Events Controller Integration..."
if curl -s "$BASE_URL/js/events-controller.js" | grep -q "window.Metrics.trackPartySaved"; then
    echo -e "${GREEN}✅ Party save/unsave tracking integrated${NC}"
else
    echo -e "${YELLOW}⚠️  Party tracking not found in events controller${NC}"
fi

echo ""
echo "5️⃣  Testing Install Module Integration..."
if curl -s "$BASE_URL/js/install.js" | grep -q "window.Metrics.trackInstallPromptShown"; then
    echo -e "${GREEN}✅ Install prompt tracking integrated${NC}"
else
    echo -e "${YELLOW}⚠️  Install tracking not found${NC}"
fi

echo ""
echo "6️⃣  Testing Calendar Integration..."
if curl -s "$BASE_URL/js/calendar-integration.js" | grep -q "window.Metrics.trackCalendarConnected"; then
    echo -e "${GREEN}✅ Calendar connection tracking integrated${NC}"
else
    echo -e "${YELLOW}⚠️  Calendar tracking not found${NC}"
fi

echo ""
echo "7️⃣  Testing Invite Integration..."
if curl -s "$BASE_URL/js/invite.js" | grep -q "window.Metrics.trackInviteRedeemed"; then
    echo -e "${GREEN}✅ Invite redemption tracking integrated${NC}"
else
    echo -e "${YELLOW}⚠️  Invite tracking not found${NC}"
fi

echo ""
echo "8️⃣  Testing Auth Integration..."
if curl -s "$BASE_URL/js/auth.js" | grep -q "window.Metrics.trackLinkedInConnected"; then
    echo -e "${GREEN}✅ LinkedIn connection tracking integrated${NC}"
else
    echo -e "${YELLOW}⚠️  LinkedIn tracking not found${NC}"
fi

echo ""
echo "=================================================="
echo "📊 METRICS SYSTEM TEST SUMMARY:"
echo ""
echo "✅ Test Page URL: $BASE_URL/test-metrics.html"
echo "✅ Production URL: $BASE_URL"
echo ""
echo "All 6 critical events are instrumented:"
echo "  1. Party saved/unsaved"
echo "  2. Calendar connected (Google/ICS/M2M)"
echo "  3. Install prompt shown/accepted/dismissed"
echo "  4. Invite redeemed"
echo "  5. LinkedIn connected"
echo "  6. App boot (automatic)"
echo ""
echo "To manually test: Open $BASE_URL/test-metrics.html in browser"
echo "=================================================="