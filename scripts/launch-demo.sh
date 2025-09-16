#!/bin/bash

echo "🎯 EVENTS COMPANY DEMO LAUNCHER"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Starting demo preparation...${NC}"
echo ""

# 1. Check current branch
BRANCH=$(git branch --show-current)
echo "Current branch: $BRANCH"

# 2. Save any uncommitted work
if [[ $(git status --porcelain) ]]; then
    echo -e "${YELLOW}Saving uncommitted changes...${NC}"
    git stash push -m "Demo preparation stash"
fi

# 3. Start local server
echo -e "${BLUE}Starting local development server...${NC}"
npm run dev &
SERVER_PID=$!
sleep 3

# 4. Display demo URLs
echo ""
echo -e "${GREEN}✅ DEMO READY!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 DEMO ACCESS POINTS:"
echo ""
echo "1. LOCAL DEMO (for testing):"
echo "   http://localhost:3000?demo=true"
echo ""
echo "2. PRODUCTION DEMO:"
echo "   https://conference-party-app.web.app?demo=true"
echo ""
echo "3. SECRET ACTIVATION:"
echo "   - Type 'demo' anywhere on the page"
echo "   - Or press Ctrl+Shift+D"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎬 DEMO FLOW:"
echo ""
echo "1. Start with basic app (don't reveal demo mode)"
echo "2. Show standard features (2 min)"
echo "3. 'Accidentally' type 'demo' or Ctrl+Shift+D"
echo "4. Admin panel slides in from left"
echo "5. Click through each enterprise feature"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 KEY TALKING POINTS:"
echo ""
echo "• 'What you saw was just the surface...'"
echo "• 'This is actually an Enterprise Intelligence Platform'"
echo "• 'White-label ready in 14 days'"
echo "• '3.2x average ROI for our clients'"
echo "• 'Used by Fortune 500 companies'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}Demo server running. Press Ctrl+C to stop.${NC}"
echo ""

# Keep script running
wait $SERVER_PID