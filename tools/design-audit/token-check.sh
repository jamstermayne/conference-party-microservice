#!/usr/bin/env bash
set -euo pipefail

C_RESET=$'\033[0m'; C_OK=$'\033[1;32m'; C_WARN=$'\033[1;33m'; C_ERR=$'\033[1;31m'
ok(){   printf "%s✔ %s%s\n" "$C_OK" "$*" "$C_RESET"; }
warn(){ printf "%s⚠ %s%s\n" "$C_WARN" "$*" "$C_RESET"; }
err(){  printf "%s✘ %s%s\n" "$C_ERR"  "$*" "$C_RESET"; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CSS_DIR="$ROOT/frontend/src/assets/css"

echo "Checking token compliance..."
echo ""

# Check for spacing token usage
echo "📏 Spacing Tokens:"
SPACING_TOKENS=(--s-1 --s-2 --s-3 --s-4 --s-5 --s-6 --s-7 --s-8)
for token in "${SPACING_TOKENS[@]}"; do
    count=$(grep -r "$token" "$CSS_DIR" 2>/dev/null | wc -l || echo "0")
    if [[ $count -gt 0 ]]; then
        ok "$token used $count times"
    else
        warn "$token not used"
    fi
done

echo ""
echo "🎨 Color Tokens:"
# Check for color token usage
COLOR_TOKENS=(--color-primary --bg-primary --text-primary --nav-bg --nav-text)
for token in "${COLOR_TOKENS[@]}"; do
    count=$(grep -r "$token" "$CSS_DIR" 2>/dev/null | wc -l || echo "0")
    if [[ $count -gt 0 ]]; then
        ok "$token used $count times"
    else
        warn "$token not used"
    fi
done

echo ""
echo "⚠️  Hardcoded Values:"
# Find hardcoded px values (excluding tokens file)
HARDCODED=$(grep -rn '\b[0-9]\+px\b' "$CSS_DIR" 2>/dev/null | grep -v "tokens.css" | head -10)
if [[ -n "$HARDCODED" ]]; then
    err "Found hardcoded px values:"
    echo "$HARDCODED" | while IFS= read -r line; do
        echo "  - $line"
    done
else
    ok "No hardcoded px values found"
fi

# Find hardcoded colors
echo ""
echo "🎨 Hardcoded Colors:"
HARDCODED_COLORS=$(grep -rn '#[0-9a-fA-F]\{3,6\}\b' "$CSS_DIR" 2>/dev/null | grep -v "tokens.css" | grep -v "color-tokens.css" | head -10)
if [[ -n "$HARDCODED_COLORS" ]]; then
    warn "Found hardcoded colors (consider using tokens):"
    echo "$HARDCODED_COLORS" | while IFS= read -r line; do
        echo "  - $line"
    done
else
    ok "No hardcoded colors found"
fi

echo ""
echo "📊 Token File Status:"
# Check token files exist
TOKEN_FILES=(
    "spacing-tokens.css"
    "color-tokens.css"
    "sidebar-tokens.css"
)

for file in "${TOKEN_FILES[@]}"; do
    if [[ -f "$CSS_DIR/$file" ]]; then
        lines=$(wc -l < "$CSS_DIR/$file")
        ok "$file exists ($lines lines)"
    else
        err "$file missing"
    fi
done