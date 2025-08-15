#!/usr/bin/env bash
set -euo pipefail

C_RESET=$'\033[0m'; C_OK=$'\033[1;32m'; C_WARN=$'\033[1;33m'; C_ERR=$'\033[1;31m'
ok(){   printf "%s✔ %s%s\n" "$C_OK" "$*" "$C_RESET"; }
warn(){ printf "%s⚠ %s%s\n" "$C_WARN" "$*" "$C_RESET"; }
err(){  printf "%s✘ %s%s\n" "$C_ERR"  "$*" "$C_RESET"; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CSS_DIR="$ROOT/frontend/src/assets/css"
SRC_DIR="$ROOT/frontend/src"

echo "Analyzing CSS architecture..."
echo ""

# Count CSS files
echo "📁 CSS Files:"
CSS_COUNT=$(find "$CSS_DIR" -name "*.css" 2>/dev/null | wc -l)
ok "Found $CSS_COUNT CSS files"

# List main CSS files
echo ""
echo "Main stylesheets:"
for file in "$CSS_DIR"/*.css; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        size=$(wc -c < "$file")
        lines=$(wc -l < "$file")
        echo "  - $filename ($lines lines, $size bytes)"
    fi
done

# Check for BEM methodology
echo ""
echo "🏗️  BEM Methodology:"
BEM_BLOCK=$(grep -r '^\.[a-z][a-z0-9-]*\s*{' "$CSS_DIR" 2>/dev/null | wc -l || echo "0")
BEM_ELEMENT=$(grep -r '\.__[a-z][a-z0-9-]*' "$CSS_DIR" 2>/dev/null | wc -l || echo "0")
BEM_MODIFIER=$(grep -r '\--[a-z][a-z0-9-]*' "$CSS_DIR" 2>/dev/null | wc -l || echo "0")

if [[ $BEM_ELEMENT -gt 0 || $BEM_MODIFIER -gt 0 ]]; then
    ok "BEM naming found:"
    echo "  - Elements (__): $BEM_ELEMENT"
    echo "  - Modifiers (--): $BEM_MODIFIER"
else
    warn "No BEM naming convention detected"
fi

# Check for CSS variables usage
echo ""
echo "🎨 CSS Variables:"
VAR_DEFINITIONS=$(grep -r '^\s*--[a-z][a-z0-9-]*:' "$CSS_DIR" 2>/dev/null | wc -l || echo "0")
VAR_USAGE=$(grep -r 'var(--' "$CSS_DIR" 2>/dev/null | wc -l || echo "0")
ok "Variable definitions: $VAR_DEFINITIONS"
ok "Variable usage: $VAR_USAGE"

# Check for media queries
echo ""
echo "📱 Responsive Design:"
MEDIA_QUERIES=$(grep -r '@media' "$CSS_DIR" 2>/dev/null | wc -l || echo "0")
if [[ $MEDIA_QUERIES -gt 0 ]]; then
    ok "Media queries found: $MEDIA_QUERIES"
else
    warn "No media queries found"
fi

# Check for duplicate selectors
echo ""
echo "🔍 Code Quality:"
SELECTORS=$(grep -rh '^\s*[.#a-z][^{]*{' "$CSS_DIR" 2>/dev/null | sed 's/{.*//g' | sort | uniq -d | head -5)
if [[ -n "$SELECTORS" ]]; then
    warn "Duplicate selectors found:"
    echo "$SELECTORS" | while IFS= read -r selector; do
        echo "  - $selector"
    done
else
    ok "No duplicate selectors detected"
fi

# Check for important usage
IMPORTANT_COUNT=$(grep -r '!important' "$CSS_DIR" 2>/dev/null | wc -l || echo "0")
if [[ $IMPORTANT_COUNT -gt 10 ]]; then
    warn "High !important usage: $IMPORTANT_COUNT"
elif [[ $IMPORTANT_COUNT -gt 0 ]]; then
    ok "Moderate !important usage: $IMPORTANT_COUNT"
else
    ok "No !important usage"
fi

# Check CSS organization
echo ""
echo "📋 Organization:"
if [[ -f "$CSS_DIR/spacing-tokens.css" ]] && [[ -f "$CSS_DIR/color-tokens.css" ]]; then
    ok "Token files properly separated"
else
    warn "Token files not properly organized"
fi

# Component-specific CSS
COMPONENT_CSS=$(find "$CSS_DIR" -name "*card*.css" -o -name "*button*.css" -o -name "*sidebar*.css" 2>/dev/null | wc -l)
if [[ $COMPONENT_CSS -gt 0 ]]; then
    ok "Component-specific CSS files: $COMPONENT_CSS"
else
    warn "No component-specific CSS files found"
fi