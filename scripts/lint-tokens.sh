#!/usr/bin/env bash
# Comprehensive token linting - combines all token checks
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎨 Design Token Linting${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"

ERRORS=0

# 1. Check for hardcoded px values
echo -e "\n${YELLOW}1. Checking for hardcoded px values...${NC}"
if ./scripts/check-tokens.sh; then
  echo -e "${GREEN}   ✅ Pass${NC}"
else
  echo -e "${RED}   ❌ Fail${NC}"
  ((ERRORS++))
fi

# 2. Validate token definitions exist
echo -e "\n${YELLOW}2. Validating token definitions...${NC}"
if [ -f "frontend/src/assets/css/spacing-tokens.css" ]; then
  # Check essential tokens are defined
  MISSING_TOKENS=()
  for token in "--s-1" "--s-2" "--s-3" "--s-4" "--s-5" "--s-6" "--r-md" "--r-lg" "--r-xl"; do
    if ! grep -q -- "$token:" frontend/src/assets/css/spacing-tokens.css; then
      MISSING_TOKENS+=("$token")
    fi
  done
  
  if [ ${#MISSING_TOKENS[@]} -eq 0 ]; then
    echo -e "${GREEN}   ✅ All essential tokens defined${NC}"
  else
    echo -e "${RED}   ❌ Missing tokens: ${MISSING_TOKENS[*]}${NC}"
    ((ERRORS++))
  fi
else
  echo -e "${RED}   ❌ spacing-tokens.css not found${NC}"
  ((ERRORS++))
fi

# 3. Check token usage consistency
echo -e "\n${YELLOW}3. Checking token usage consistency...${NC}"
INCONSISTENCIES=$(grep -r "padding: [0-9]" frontend/src --include="*.css" | grep -v "padding: 0" | grep -v "var(--" || true)
if [ -z "$INCONSISTENCIES" ]; then
  echo -e "${GREEN}   ✅ Consistent token usage${NC}"
else
  echo -e "${RED}   ❌ Found inconsistent spacing:${NC}"
  echo "$INCONSISTENCIES" | head -5
  ((ERRORS++))
fi

# 4. Check for undefined token usage
echo -e "\n${YELLOW}4. Checking for undefined tokens...${NC}"
UNDEFINED=$(grep -roh "var(--[a-z0-9-]*)" frontend/src --include="*.css" | sort -u | while read token; do
  token_name=$(echo "$token" | sed 's/var(//;s/)//')
  # Skip known system tokens
  if [[ ! "$token_name" =~ ^--(bg-|text-|accent|surface|border|error|warning|success|ease-|rail-|panel|card-|v-|ink-|fg-|a-|divider|ok|z-) ]]; then
    if ! grep -q -- "$token_name:" frontend/src/assets/css/spacing-tokens.css 2>/dev/null; then
      echo "$token"
    fi
  fi
done)

if [ -z "$UNDEFINED" ]; then
  echo -e "${GREEN}   ✅ All tokens are defined${NC}"
else
  echo -e "${RED}   ❌ Undefined tokens found:${NC}"
  echo "$UNDEFINED"
  ((ERRORS++))
fi

# 5. Check HTML loads token CSS
echo -e "\n${YELLOW}5. Checking HTML loads spacing-tokens.css...${NC}"
if grep -q "spacing-tokens.css" frontend/src/index.html; then
  echo -e "${GREEN}   ✅ Token CSS is loaded${NC}"
else
  echo -e "${RED}   ❌ spacing-tokens.css not loaded in index.html${NC}"
  ((ERRORS++))
fi

# Summary
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✨ All token checks passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Found $ERRORS token issue(s)${NC}"
  echo -e "\n${YELLOW}Quick fixes:${NC}"
  echo "  • Run: npm run migrate:tokens       - Preview token migrations"
  echo "  • Run: npm run migrate:tokens:apply - Apply token migrations"
  echo "  • Run: npm run validate:tokens      - Validate token usage"
  exit 1
fi