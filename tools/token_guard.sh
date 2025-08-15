#!/usr/bin/env bash
# Token Guard - Strict enforcement of design tokens
# Blocks commits/deploys with hardcoded values

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛡️  Token Guard - Design System Enforcement${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ERRORS=0
WARNINGS=0

# Check for hardcoded spacing values
echo -e "\n${YELLOW}Checking spacing values...${NC}"
SPACING_VIOLATIONS=$(rg -n --glob 'frontend/src/**/*.css' \
  '(:|\s)(4|8|12|16|20|24|32|40|48)px' \
  --pcre2 '(?<!border.*:.*1px)' \
  2>/dev/null | grep -v 'var(--' | grep -v 'calc(' | grep -v '@media' || true)

if [ -n "$SPACING_VIOLATIONS" ]; then
  echo -e "${RED}❌ Hardcoded spacing found:${NC}"
  echo "$SPACING_VIOLATIONS" | head -10
  ((ERRORS++))
else
  echo -e "${GREEN}✅ All spacing uses tokens${NC}"
fi

# Check for hardcoded colors
echo -e "\n${YELLOW}Checking color values...${NC}"
COLOR_VIOLATIONS=$(rg -n --glob 'frontend/src/**/*.css' \
  '#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsl' \
  --pcre2 '(?<!var\(--)' \
  2>/dev/null | grep -v 'var(--' | grep -v 'transparent' | grep -v 'inherit' || true)

if [ -n "$COLOR_VIOLATIONS" ]; then
  echo -e "${YELLOW}⚠️  Hardcoded colors found (should use tokens):${NC}"
  echo "$COLOR_VIOLATIONS" | head -5
  ((WARNINGS++))
fi

# Check for hardcoded radius values
echo -e "\n${YELLOW}Checking border-radius values...${NC}"
RADIUS_VIOLATIONS=$(rg -n --glob 'frontend/src/**/*.css' \
  'border-radius:\s*[0-9]+px' \
  2>/dev/null | grep -v 'var(--' || true)

if [ -n "$RADIUS_VIOLATIONS" ]; then
  echo -e "${RED}❌ Hardcoded border-radius found:${NC}"
  echo "$RADIUS_VIOLATIONS" | head -10
  ((ERRORS++))
else
  echo -e "${GREEN}✅ All border-radius uses tokens${NC}"
fi

# Check token files exist and are loaded
echo -e "\n${YELLOW}Checking token files...${NC}"
TOKEN_FILES=(
  "frontend/src/assets/css/spacing-tokens.css"
  "frontend/src/assets/css/color-tokens.css"
)

for file in "${TOKEN_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ $file exists${NC}"
    
    # Check if loaded in index.html
    filename=$(basename "$file")
    if grep -q "$filename" frontend/src/index.html; then
      echo -e "${GREEN}   ↳ Loaded in index.html${NC}"
    else
      echo -e "${RED}   ↳ NOT loaded in index.html${NC}"
      ((ERRORS++))
    fi
  else
    echo -e "${YELLOW}⚠️  $file not found${NC}"
    ((WARNINGS++))
  fi
done

# Check for consistent token usage
echo -e "\n${YELLOW}Checking token consistency...${NC}"
INCONSISTENT=$(rg --glob 'frontend/src/**/*.css' \
  'padding:\s*[0-9]+px\s+[0-9]+px' \
  2>/dev/null | grep -v 'var(--' || true)

if [ -n "$INCONSISTENT" ]; then
  echo -e "${YELLOW}⚠️  Inconsistent spacing (use individual properties):${NC}"
  echo "$INCONSISTENT" | head -5
  ((WARNINGS++))
else
  echo -e "${GREEN}✅ Consistent token usage${NC}"
fi

# Summary
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✨ Perfect! All design tokens properly enforced${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  ${WARNINGS} warning(s) - consider using tokens${NC}"
  exit 0
else
  echo -e "${RED}❌ ${ERRORS} error(s) found - must fix before deploy${NC}"
  echo -e "\n${BLUE}Quick fixes:${NC}"
  echo "  • Spacing: 4px→var(--s-1), 8px→var(--s-2), 12px→var(--s-3)"
  echo "  • Radius: 8px→var(--r-md), 12px→var(--r-lg), 16px→var(--r-xl)"
  echo "  • Colors: Use var(--bg-*), var(--text-*), var(--accent-*)"
  echo "  • Run: npm run migrate:tokens:apply"
  exit 1
fi