#!/usr/bin/env bash
# Token enforcement script - prevents hardcoded px values
# Returns 0 if all checks pass, 1 if violations found

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Checking for hardcoded px values..."

# Allowed exceptions (1px borders, specific use cases)
ALLOWED_PATTERNS=(
  "border.*1px"           # 1px borders are OK
  "outline.*1px"          # 1px outlines are OK  
  "box-shadow"            # Box shadows often need specific px
  "hairline"              # Hairline borders
  "icon"                  # Icon dimensions
  "sprite"                # Sprite positions
  "calc"                  # calc() expressions
  "transform"             # Transform values
  "@media"                # Media queries
  "animation"             # Animation keyframes
  "transition"            # Transition durations
  "\.svg"                 # SVG files
  "var\(--"               # Already using tokens
)

# Build grep exclusion pattern
EXCLUDE_PATTERN=$(IFS='|'; echo "${ALLOWED_PATTERNS[*]}")

# Find violations
VIOLATIONS=$(rg -n --glob 'frontend/src/**/*.css' \
  -e '(:|\s)([4-9]|[1-9][0-9]+)px' \
  -e 'border-radius:\s*([2-9]|[1-9][0-9]+)px' \
  2>/dev/null | grep -vE "$EXCLUDE_PATTERN" || true)

if [ -n "$VIOLATIONS" ]; then
  echo -e "${RED}❌ Found hardcoded px values that should use tokens:${NC}\n"
  echo "$VIOLATIONS" | while IFS= read -r line; do
    # Extract file, line number, and content
    file=$(echo "$line" | cut -d: -f1)
    line_num=$(echo "$line" | cut -d: -f2)
    content=$(echo "$line" | cut -d: -f3-)
    
    # Suggest token replacement
    suggestion=""
    if [[ "$content" =~ 4px ]]; then suggestion=" → Use var(--s-1)"; fi
    if [[ "$content" =~ 8px ]]; then suggestion=" → Use var(--s-2)"; fi
    if [[ "$content" =~ 12px ]]; then suggestion=" → Use var(--s-3)"; fi
    if [[ "$content" =~ 16px ]]; then suggestion=" → Use var(--s-4)"; fi
    if [[ "$content" =~ 20px ]]; then suggestion=" → Use var(--s-5)"; fi
    if [[ "$content" =~ 24px ]]; then suggestion=" → Use var(--s-6)"; fi
    if [[ "$content" =~ 32px ]]; then suggestion=" → Use var(--s-7)"; fi
    if [[ "$content" =~ 40px ]]; then suggestion=" → Use var(--s-8)"; fi
    if [[ "$content" =~ 48px ]]; then suggestion=" → Use var(--s-10)"; fi
    
    if [[ "$content" =~ border-radius.*2px ]]; then suggestion=" → Use var(--r-xs)"; fi
    if [[ "$content" =~ border-radius.*4px ]]; then suggestion=" → Use var(--r-sm)"; fi
    if [[ "$content" =~ border-radius.*8px ]]; then suggestion=" → Use var(--r-md)"; fi
    if [[ "$content" =~ border-radius.*12px ]]; then suggestion=" → Use var(--r-lg)"; fi
    if [[ "$content" =~ border-radius.*16px ]]; then suggestion=" → Use var(--r-xl)"; fi
    if [[ "$content" =~ border-radius.*24px ]]; then suggestion=" → Use var(--r-2xl)"; fi
    
    echo -e "  ${file}:${line_num}${YELLOW}${suggestion}${NC}"
    echo "    $content"
  done
  
  echo -e "\n${YELLOW}📚 Token Reference:${NC}"
  echo "  Spacing: 4px→var(--s-1), 8px→var(--s-2), 12px→var(--s-3), 16px→var(--s-4)"
  echo "           20px→var(--s-5), 24px→var(--s-6), 32px→var(--s-7), 40px→var(--s-8)"
  echo "  Radius:  2px→var(--r-xs), 4px→var(--r-sm), 8px→var(--r-md), 12px→var(--r-lg)"
  echo "           16px→var(--r-xl), 24px→var(--r-2xl), 50%/999px→var(--r-full)"
  echo -e "\n${RED}Please replace hardcoded values with design tokens.${NC}"
  exit 1
else
  echo -e "${GREEN}✅ All CSS files use design tokens correctly!${NC}"
  exit 0
fi