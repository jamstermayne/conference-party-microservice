#!/usr/bin/env bash
set -euo pipefail

C_RESET=$'\033[0m'; C_OK=$'\033[1;32m'; C_WARN=$'\033[1;33m'; C_ERR=$'\033[1;31m'
ok(){   printf "%s✔ %s%s\n" "$C_OK" "$*" "$C_RESET"; }
warn(){ printf "%s⚠ %s%s\n" "$C_WARN" "$*" "$C_RESET"; }
err(){  printf "%s✘ %s%s\n" "$C_ERR"  "$*" "$C_RESET"; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
JS_DIR="$ROOT/frontend/src/js"
CSS_DIR="$ROOT/frontend/src/assets/css"

echo "Reviewing component structure..."
echo ""

# Check JavaScript organization
echo "📦 JavaScript Structure:"
if [[ -d "$JS_DIR/components" ]]; then
    COMPONENT_COUNT=$(find "$JS_DIR/components" -name "*.js" 2>/dev/null | wc -l)
    ok "Components directory exists ($COMPONENT_COUNT files)"
    echo "  Components:"
    find "$JS_DIR/components" -name "*.js" 2>/dev/null | head -5 | while read -r file; do
        echo "    - $(basename "$file")"
    done
else
    warn "No components directory found"
fi

if [[ -d "$JS_DIR/views" ]]; then
    VIEW_COUNT=$(find "$JS_DIR/views" -name "*.js" 2>/dev/null | wc -l)
    ok "Views directory exists ($VIEW_COUNT files)"
    echo "  Views:"
    find "$JS_DIR/views" -name "*.js" 2>/dev/null | head -5 | while read -r file; do
        echo "    - $(basename "$file")"
    done
else
    warn "No views directory found"
fi

if [[ -d "$JS_DIR/services" ]]; then
    SERVICE_COUNT=$(find "$JS_DIR/services" -name "*.js" 2>/dev/null | wc -l)
    ok "Services directory exists ($SERVICE_COUNT files)"
else
    warn "No services directory found"
fi

# Check for UI utilities
echo ""
echo "🎨 UI Utilities:"
if [[ -d "$JS_DIR/ui" ]]; then
    UI_COUNT=$(find "$JS_DIR/ui" -name "*.js" 2>/dev/null | wc -l)
    ok "UI utilities directory exists ($UI_COUNT files)"
    find "$JS_DIR/ui" -name "*.js" 2>/dev/null | head -5 | while read -r file; do
        echo "  - $(basename "$file")"
    done
else
    warn "No UI utilities directory found"
fi

# Check component patterns
echo ""
echo "🏗️  Component Patterns:"

# Check for card components
CARD_COMPONENTS=$(find "$JS_DIR" -name "*card*.js" 2>/dev/null | wc -l)
CARD_CSS=$(find "$CSS_DIR" -name "*card*.css" 2>/dev/null | wc -l)
if [[ $CARD_COMPONENTS -gt 0 || $CARD_CSS -gt 0 ]]; then
    ok "Card pattern implemented (JS: $CARD_COMPONENTS, CSS: $CARD_CSS)"
else
    warn "No card components found"
fi

# Check for sidebar components
SIDEBAR_JS=$(find "$JS_DIR" -name "*sidebar*.js" 2>/dev/null | wc -l)
SIDEBAR_CSS=$(find "$CSS_DIR" -name "*sidebar*.css" 2>/dev/null | wc -l)
if [[ $SIDEBAR_JS -gt 0 || $SIDEBAR_CSS -gt 0 ]]; then
    ok "Sidebar components (JS: $SIDEBAR_JS, CSS: $SIDEBAR_CSS)"
else
    warn "No sidebar components found"
fi

# Check for modal/dialog components
MODAL_COMPONENTS=$(find "$JS_DIR" -name "*modal*.js" -o -name "*dialog*.js" 2>/dev/null | wc -l)
if [[ $MODAL_COMPONENTS -gt 0 ]]; then
    ok "Modal/Dialog components: $MODAL_COMPONENTS"
else
    warn "No modal/dialog components found"
fi

# Check import patterns
echo ""
echo "📦 Module Patterns:"
IMPORTS=$(grep -r "^import " "$JS_DIR" 2>/dev/null | wc -l || echo "0")
EXPORTS=$(grep -r "^export " "$JS_DIR" 2>/dev/null | wc -l || echo "0")
if [[ $IMPORTS -gt 0 ]]; then
    ok "ES6 modules in use (imports: $IMPORTS, exports: $EXPORTS)"
else
    warn "No ES6 module usage detected"
fi

# Check for consistency
echo ""
echo "✅ Consistency Checks:"

# Check naming conventions
KEBAB_CASE=$(find "$JS_DIR" -name "*-*.js" 2>/dev/null | wc -l)
CAMEL_CASE=$(find "$JS_DIR" -name "*[A-Z]*.js" 2>/dev/null | wc -l)
echo "  File naming:"
echo "    - Kebab-case files: $KEBAB_CASE"
echo "    - CamelCase files: $CAMEL_CASE"

# Check for test files
TEST_FILES=$(find "$ROOT" -name "*.test.js" -o -name "*.spec.js" 2>/dev/null | wc -l)
if [[ $TEST_FILES -gt 0 ]]; then
    ok "Test files found: $TEST_FILES"
else
    warn "No test files found"
fi

# Summary
echo ""
echo "📊 Component Summary:"
TOTAL_JS=$(find "$JS_DIR" -name "*.js" 2>/dev/null | wc -l)
TOTAL_CSS=$(find "$CSS_DIR" -name "*.css" 2>/dev/null | wc -l)
echo "  - Total JS files: $TOTAL_JS"
echo "  - Total CSS files: $TOTAL_CSS"
echo "  - Avg lines per JS: $(find "$JS_DIR" -name "*.js" -exec wc -l {} + 2>/dev/null | awk '{sum+=$1; count++} END {if(count>0) print int(sum/count); else print 0}')"