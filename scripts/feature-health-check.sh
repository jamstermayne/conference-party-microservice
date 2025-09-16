#!/bin/bash

# Feature Health Check Script
# Run this before and after each feature implementation

echo "🔍 Feature Health Check"
echo "======================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check current branch
BRANCH=$(git branch --show-current)
echo "Current branch: $BRANCH"
echo ""

# 1. Check which features are enabled
echo "📋 Feature Flags Status:"
echo "------------------------"
if [ -f "frontend/src/assets/js/feature-flags.js" ]; then
    grep -E "'[a-z_]+': (true|false)" frontend/src/assets/js/feature-flags.js | while read -r line; do
        if echo "$line" | grep -q "true"; then
            echo -e "${GREEN}✅ $line${NC}"
        else
            echo -e "${YELLOW}⭕ $line${NC}"
        fi
    done
else
    echo -e "${RED}❌ Feature flags file not found${NC}"
fi
echo ""

# 2. Check navigation elements
echo "🧭 Navigation Elements:"
echo "----------------------"
NAV_COUNT=$(grep -r "data-nav=" frontend/src --include="*.html" --include="*.js" 2>/dev/null | wc -l)
echo "Found $NAV_COUNT navigation elements"
grep -r "data-nav=" frontend/src --include="*.html" --include="*.js" 2>/dev/null | grep -o 'data-nav="[^"]*"' | sort -u | head -10
echo ""

# 3. Check route definitions
echo "🛤️ Routes Defined:"
echo "-----------------"
ROUTE_COUNT=$(grep -E "'\#[a-z]+'" frontend/src/assets/js/*.js 2>/dev/null | wc -l)
echo "Found $ROUTE_COUNT route definitions"
grep -E "'#[a-z]+'" frontend/src/assets/js/*.js 2>/dev/null | grep -o "'#[^']*'" | sort -u | head -10
echo ""

# 4. Check API health
echo "🌐 API Health:"
echo "-------------"
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Local API responding${NC}"
else
    echo -e "${YELLOW}⚠️  Local API not running (run: npm run dev)${NC}"
fi

PROD_HEALTH=$(curl -s https://conference-party-app.web.app/api/health | head -c 50)
if [ ! -z "$PROD_HEALTH" ]; then
    echo -e "${GREEN}✅ Production API healthy${NC}"
else
    echo -e "${RED}❌ Production API issue${NC}"
fi
echo ""

# 5. Check for console errors
echo "🐛 Code Quality:"
echo "---------------"
ERROR_COUNT=$(grep -r "console.error" frontend/src/assets/js --include="*.js" 2>/dev/null | wc -l)
TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX" frontend/src/assets/js --include="*.js" 2>/dev/null | wc -l)
echo "Console.error calls: $ERROR_COUNT"
echo "TODO/FIXME markers: $TODO_COUNT"

# Check for common issues
MISSING_SEMIS=$(grep -r "[^;]$" frontend/src/assets/js --include="*.js" 2>/dev/null | grep -v "//" | grep -v "*" | wc -l)
echo "Lines potentially missing semicolons: $MISSING_SEMIS"
echo ""

# 6. Test status
echo "🧪 Test Status:"
echo "--------------"
if [ -f "package.json" ]; then
    if npm test 2>/dev/null | grep -q "passing"; then
        echo -e "${GREEN}✅ Tests passing${NC}"
    else
        echo -e "${YELLOW}⚠️  Some tests failing${NC}"
    fi
else
    echo -e "${RED}❌ No test suite found${NC}"
fi
echo ""

# 7. Git status
echo "📦 Git Status:"
echo "-------------"
MODIFIED=$(git status --porcelain | wc -l)
echo "Modified files: $MODIFIED"
if [ $MODIFIED -gt 0 ]; then
    echo -e "${YELLOW}Uncommitted changes:${NC}"
    git status --short
fi
echo ""

# 8. Feature activation checklist
echo "✅ Feature Activation Checklist:"
echo "--------------------------------"
echo "[ ] Feature flag added/updated"
echo "[ ] Router path configured"
echo "[ ] Navigation element added"
echo "[ ] Module imports work"
echo "[ ] No console errors"
echo "[ ] Tests pass"
echo "[ ] Local testing complete"
echo "[ ] Production deploy ready"
echo ""

# Summary
echo "📊 Summary:"
echo "----------"
if [ $ERROR_COUNT -eq 0 ] && [ $MODIFIED -eq 0 ]; then
    echo -e "${GREEN}✅ Ready for deployment${NC}"
elif [ $MODIFIED -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Commit changes before deploying${NC}"
else
    echo -e "${YELLOW}⚠️  Review issues above${NC}"
fi

echo ""
echo "Run 'npm run dev' to test locally"
echo "Run 'npm run deploy' when ready"