#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_lib.sh"

h1 "Accessibility Audit"

echo "🎯 Interactive Elements:"
# Check button vs link usage
BUTTON_COUNT=$(grep -Rn "<button" "$SRC_FE" 2>/dev/null | wc -l || echo 0)
LINK_COUNT=$(grep -Rn "<a " "$SRC_FE" 2>/dev/null | wc -l || echo 0)
echo "  Elements found:"
echo "    • <button> elements: $BUTTON_COUNT"
echo "    • <a> links: $LINK_COUNT"

# Check for buttons that look like links
BUTTON_LINKS=$(grep -RnE "<button[^>]*class=['\"][^'\"]*link" "$SRC_FE" 2>/dev/null || true)
if [ -n "$BUTTON_LINKS" ]; then
  warn "Buttons styled as links (consider using <a> for navigation):"
  echo "$BUTTON_LINKS" | head -3 | while IFS=: read -r file line content; do
    rel_path="${file#$ROOT/}"
    echo "  • $rel_path:$line"
  done
fi

echo ""
echo "♿ ARIA Attributes:"
# Check for ARIA labels
ARIA_LABEL=$(grep -Rn "aria-label" "$SRC_FE" 2>/dev/null | wc -l || echo 0)
ARIA_LABELLEDBY=$(grep -Rn "aria-labelledby" "$SRC_FE" 2>/dev/null | wc -l || echo 0)
ARIA_DESCRIBEDBY=$(grep -Rn "aria-describedby" "$SRC_FE" 2>/dev/null | wc -l || echo 0)

echo "  ARIA usage:"
[ "$ARIA_LABEL" -gt 0 ] && ok "aria-label: $ARIA_LABEL instances" || warn "No aria-label attributes"
[ "$ARIA_LABELLEDBY" -gt 0 ] && echo "    • aria-labelledby: $ARIA_LABELLEDBY instances"
[ "$ARIA_DESCRIBEDBY" -gt 0 ] && echo "    • aria-describedby: $ARIA_DESCRIBEDBY instances"

# Check for toggle states
ARIA_PRESSED=$(grep -Rn "aria-pressed" "$SRC_FE" 2>/dev/null | wc -l || echo 0)
ARIA_EXPANDED=$(grep -Rn "aria-expanded" "$SRC_FE" 2>/dev/null | wc -l || echo 0)
ARIA_SELECTED=$(grep -Rn "aria-selected" "$SRC_FE" 2>/dev/null | wc -l || echo 0)

echo ""
echo "  State indicators:"
[ "$ARIA_PRESSED" -gt 0 ] && echo "    ✓ aria-pressed: $ARIA_PRESSED (toggle buttons)"
[ "$ARIA_EXPANDED" -gt 0 ] && echo "    ✓ aria-expanded: $ARIA_EXPANDED (collapsibles)"
[ "$ARIA_SELECTED" -gt 0 ] && echo "    ✓ aria-selected: $ARIA_SELECTED (selections)"

if [ "$ARIA_PRESSED" -eq 0 ] && [ "$ARIA_EXPANDED" -eq 0 ]; then
  warn "No ARIA state attributes found (needed for toggles/accordions)"
fi

echo ""
echo "📝 Semantic HTML:"
# Check heading hierarchy
H1_COUNT=$(grep -Rn "<h1" "$SRC_FE" 2>/dev/null | wc -l || echo 0)
H2_COUNT=$(grep -Rn "<h2" "$SRC_FE" 2>/dev/null | wc -l || echo 0)
H3_COUNT=$(grep -Rn "<h3" "$SRC_FE" 2>/dev/null | wc -l || echo 0)

echo "  Heading hierarchy:"
echo "    • <h1>: $H1_COUNT"
echo "    • <h2>: $H2_COUNT"
echo "    • <h3>: $H3_COUNT"

if [ "$H1_COUNT" -gt "$H2_COUNT" ]; then
  warn "More h1 than h2 elements (check heading hierarchy)"
fi

# Check for nav elements
NAV_ELEMENTS=$(grep -Rn "<nav" "$SRC_FE" 2>/dev/null || true)
if [ -n "$NAV_ELEMENTS" ]; then
  NAV_COUNT=$(echo "$NAV_ELEMENTS" | wc -l)
  ok "Semantic <nav> elements: $NAV_COUNT"
else
  warn "No <nav> elements found (use for navigation areas)"
fi

# Check for main element
MAIN_ELEMENT=$(grep -Rn "<main" "$SRC_FE" 2>/dev/null | wc -l || echo 0)
if [ "$MAIN_ELEMENT" -gt 0 ]; then
  ok "Semantic <main> element present"
else
  warn "No <main> element (important for screen readers)"
fi

echo ""
echo "🖼️ Image Accessibility:"
# Check for alt attributes
IMG_TAGS=$(grep -Rn "<img" "$SRC_FE" 2>/dev/null || true)
if [ -n "$IMG_TAGS" ]; then
  IMG_COUNT=$(echo "$IMG_TAGS" | wc -l)
  IMG_WITH_ALT=$(echo "$IMG_TAGS" | grep -c "alt=" || echo 0)
  
  if [ "$IMG_WITH_ALT" -eq "$IMG_COUNT" ]; then
    ok "All $IMG_COUNT images have alt attributes"
  else
    NO_ALT=$((IMG_COUNT - IMG_WITH_ALT))
    warn "$NO_ALT of $IMG_COUNT images missing alt attributes"
  fi
else
  echo "  No <img> tags found"
fi

echo ""
echo "⌨️ Keyboard Navigation:"
# Check for tabindex
TABINDEX=$(grep -Rn "tabindex" "$SRC_FE" 2>/dev/null || true)
if [ -n "$TABINDEX" ]; then
  POSITIVE_TABINDEX=$(echo "$TABINDEX" | grep -c 'tabindex="[1-9]' || echo 0)
  if [ "$POSITIVE_TABINDEX" -gt 0 ]; then
    warn "Found positive tabindex values (disrupts natural tab order)"
  else
    ok "tabindex usage appears correct (0 or -1 only)"
  fi
fi

# Check for focus styles
FOCUS_STYLES=$(grep -Rn ":focus" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)
if [ "$FOCUS_STYLES" -gt 0 ]; then
  ok "Focus styles defined ($FOCUS_STYLES instances)"
else
  err "No :focus styles found (critical for keyboard navigation)"
fi

echo ""
echo "🎨 Color Contrast:"
# Check for color definitions
COLORS=$(grep -RnE "color:\s*#|color:\s*rgb|color:\s*var\(--" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)
BG_COLORS=$(grep -RnE "background(-color)?:\s*#|background(-color)?:\s*rgb" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)

echo "  Color usage:"
echo "    • Text colors defined: $COLORS"
echo "    • Background colors defined: $BG_COLORS"
echo "    • Note: Manual contrast testing recommended"

echo ""
echo "📱 Mobile/Touch Accessibility:"
# Check for touch target sizes
MIN_HEIGHT=$(grep -RnE "min-height:\s*(44px|48px|var\(--s-12\)|var\(--s-13\))" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)
if [ "$MIN_HEIGHT" -gt 0 ]; then
  ok "Touch-friendly minimum heights found ($MIN_HEIGHT instances)"
else
  warn "Check touch target sizes (minimum 44px recommended)"
fi

echo ""
echo "📊 Accessibility Summary:"
echo "  ✅ Good practices:"
[ "$ARIA_LABEL" -gt 0 ] && echo "    • ARIA labels in use"
[ "$NAV_ELEMENTS" ] && echo "    • Semantic navigation elements"
[ "$FOCUS_STYLES" -gt 0 ] && echo "    • Focus styles defined"
[ "$IMG_WITH_ALT" -eq "$IMG_COUNT" ] 2>/dev/null && echo "    • All images have alt text"

echo ""
echo "  ⚠️  Areas for improvement:"
[ "$ARIA_PRESSED" -eq 0 ] && echo "    • Add aria-pressed for toggle buttons"
[ "$MAIN_ELEMENT" -eq 0 ] && echo "    • Add <main> landmark"
[ "$FOCUS_STYLES" -eq 0 ] && echo "    • Add :focus styles"
[ "$MIN_HEIGHT" -eq 0 ] && echo "    • Review touch target sizes"