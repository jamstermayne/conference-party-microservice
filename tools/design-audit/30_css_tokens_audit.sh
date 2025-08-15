#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_lib.sh"

h1 "Design Tokens Audit (spacing/radius/shadow)"

echo "📏 Token Usage Analysis:"
TOKEN_FILES=$(grep -Rl --include="*.css" -E "(--s-|--r-|--shadow-)" "$CSS_DIR" 2>/dev/null || true)
if [ -n "$TOKEN_FILES" ]; then
  TOKEN_COUNT=$(echo "$TOKEN_FILES" | wc -l)
  ok "Design tokens used in $TOKEN_COUNT CSS files"
  
  # Count specific token usage
  SPACING_USES=$(grep -rh "var(--s-" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)
  RADIUS_USES=$(grep -rh "var(--r-" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)
  SHADOW_USES=$(grep -rh "var(--shadow-" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)
  
  echo "  Token usage breakdown:"
  echo "    • Spacing tokens: $SPACING_USES instances"
  echo "    • Radius tokens: $RADIUS_USES instances"
  echo "    • Shadow tokens: $SHADOW_USES instances"
else
  warn "No design token usage found"
fi

echo ""
echo "🚫 Raw Pixel Values (common spacing):"
# Check for common spacing values that should use tokens
RAW_PX=$(grep -RnE ":\s*(4|8|12|16|20|24|32|40|48|56|64|80|96)px(?![^;]*var\()" "$CSS_DIR" --include="*.css" 2>/dev/null | grep -v -E "(tokens|README)" || true)
if [ -z "$RAW_PX" ]; then
  ok "No raw spacing px values found"
else
  RAW_COUNT=$(echo "$RAW_PX" | wc -l)
  warn "Found $RAW_COUNT raw px spacing values (should use tokens):"
  echo "$RAW_PX" | head -10 | while IFS=: read -r file line content; do
    rel_path="${file#$ROOT/}"
    echo "  • $rel_path:$line"
    echo "    $content" | sed 's/^/    /' | head -c 80
    echo
  done
  [ "$RAW_COUNT" -gt 10 ] && echo "  ... and $((RAW_COUNT - 10)) more"
fi

echo ""
echo "🔲 Border Radius Values:"
RADIUS_RAW=$(grep -RnE "border-radius\s*:\s*(2|3|4|6|8|12|16|24)px" "$CSS_DIR" 2>/dev/null | grep -v -E "(tokens|README)" || true)
if [ -z "$RADIUS_RAW" ]; then
  ok "All border-radius values use tokens"
else
  RADIUS_COUNT=$(echo "$RADIUS_RAW" | wc -l)
  warn "Found $RADIUS_COUNT raw border-radius values:"
  echo "$RADIUS_RAW" | head -5 | while IFS=: read -r file line content; do
    rel_path="${file#$ROOT/}"
    value=$(echo "$content" | grep -oE "[0-9]+px")
    echo "  • $rel_path:$line ($value → use --r-* token)"
  done
fi

echo ""
echo "🎨 Color Values:"
HEX_COLORS=$(grep -RnE "#[0-9a-fA-F]{3,6}\b" "$CSS_DIR" 2>/dev/null | grep -v -E "(tokens|color-tokens|README)" || true)
if [ -n "$HEX_COLORS" ]; then
  HEX_COUNT=$(echo "$HEX_COLORS" | wc -l)
  warn "Found $HEX_COUNT hardcoded hex colors (consider using color tokens):"
  echo "$HEX_COLORS" | head -5 | while IFS=: read -r file line content; do
    rel_path="${file#$ROOT/}"
    color=$(echo "$content" | grep -oE "#[0-9a-fA-F]{3,6}" | head -1)
    echo "  • $rel_path:$line ($color)"
  done
  [ "$HEX_COUNT" -gt 5 ] && echo "  ... and $((HEX_COUNT - 5)) more"
else
  ok "No hardcoded hex colors found"
fi

echo ""
echo "📊 Token Compliance Summary:"
echo "  ✅ Tokens properly defined in:"
[ -f "$CSS_DIR/spacing-tokens.css" ] && echo "    • spacing-tokens.css"
[ -f "$CSS_DIR/color-tokens.css" ] && echo "    • color-tokens.css"
[ -f "$CSS_DIR/sidebar-tokens.css" ] && echo "    • sidebar-tokens.css"

echo ""
echo "  ⚠️  Areas needing attention:"
[ -n "$RAW_PX" ] && echo "    • Raw pixel values for spacing"
[ -n "$RADIUS_RAW" ] && echo "    • Raw border-radius values"
[ -n "$HEX_COLORS" ] && echo "    • Hardcoded color values"

# Check for line-height values (often ok as raw)
echo ""
echo "📐 Line-height Analysis:"
LINE_HEIGHT=$(grep -r "line-height:" "$CSS_DIR" 2>/dev/null | wc -l | tr -d ' ' || echo 0)
LINE_HEIGHT_UNIT=$(grep -r "line-height:\s*[0-9]*px" "$CSS_DIR" 2>/dev/null | wc -l | tr -d ' ' || echo 0)
if [ "$LINE_HEIGHT_UNIT" -eq 0 ]; then
  ok "Line-heights use unitless values (good practice)"
else
  warn "$LINE_HEIGHT_UNIT line-heights with px units (prefer unitless)"
fi