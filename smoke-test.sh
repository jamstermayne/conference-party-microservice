#!/bin/bash

echo "🧪 SMOKE TEST CHECKLIST"
echo "======================"
echo ""

BASE_URL="https://conference-party-app.web.app"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "1️⃣  Testing Main App Loading..."
if curl -s "$BASE_URL/" | grep -q "Velocity"; then
    echo -e "${GREEN}✅ Main app loads${NC}"
else
    echo -e "${RED}❌ Main app failed to load${NC}"
fi

echo ""
echo "2️⃣  Testing Design System CSS..."
if curl -s "$BASE_URL/assets/design/tokens.css" | grep -q "accent-primary"; then
    echo -e "${GREEN}✅ Design tokens loaded${NC}"
else
    echo -e "${RED}❌ Design tokens not found${NC}"
fi

echo ""
echo "3️⃣  Testing Instrumentation..."
if curl -s "$BASE_URL/assets/js/foundation/instrumentation.js" | grep -q "party_saved"; then
    echo -e "${GREEN}✅ Instrumentation loaded${NC}"
else
    echo -e "${RED}❌ Instrumentation not found${NC}"
fi

echo ""
echo "4️⃣  Testing Theme Color..."
if curl -s "$BASE_URL/" | grep -q 'theme-color.*#6b7bff'; then
    echo -e "${GREEN}✅ Theme color updated to #6b7bff${NC}"
else
    echo -e "${YELLOW}⚠️  Theme color might not be updated${NC}"
fi

echo ""
echo "5️⃣  Testing Service Worker..."
if curl -s "$BASE_URL/sw.js" | grep -q "CACHE"; then
    echo -e "${GREEN}✅ Service worker accessible${NC}"
else
    echo -e "${RED}❌ Service worker not found${NC}"
fi

echo ""
echo "6️⃣  Testing Icons..."
if curl -I -s "$BASE_URL/assets/images/icon-192.png" | grep -q "200\|304"; then
    echo -e "${GREEN}✅ Icon 192px exists${NC}"
else
    echo -e "${YELLOW}⚠️  Icon 192px might be missing${NC}"
fi

echo ""
echo "7️⃣  Testing API Health..."
if curl -s "https://us-central1-conference-party-app.cloudfunctions.net/api/health" | grep -q "healthy"; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${RED}❌ API health check failed${NC}"
fi

echo ""
echo "8️⃣  Testing Events API..."
EVENT_COUNT=$(curl -s "https://us-central1-conference-party-app.cloudfunctions.net/api/events?conference=gamescom2025" | grep -o '"id"' | wc -l)
if [ "$EVENT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Events API returns $EVENT_COUNT events${NC}"
else
    echo -e "${RED}❌ Events API returned no events${NC}"
fi

echo ""
echo "======================"
echo "📊 SMOKE TEST SUMMARY"
echo "======================"
echo ""
echo "🌐 Live URL: $BASE_URL"
echo ""
echo "Manual Tests Required:"
echo "----------------------"
echo "☐ Routes active: Click sidebar; active item highlights; panels swap"
echo "☐ FTUE Parties: Premium cards show, Save works, toast appears"
echo "☐ Calendar: Connect Google/ICS shows UI"
echo "☐ Invites: Open /invite/GC2025-ALPHA shows invite panel"
echo "☐ PWA: Install prompt appears after first save"
echo "☐ SW Update: Bump version, redeploy, see update toast"
echo "☐ A11y: Tab navigation works, focus rings visible"
echo ""
echo "Rollback Command:"
echo "-----------------"
echo "localStorage.setItem('skin','old'); location.reload();"
echo ""
echo "Re-enable Command:"
echo "------------------"
echo "localStorage.setItem('skin','new'); location.reload();"
echo ""