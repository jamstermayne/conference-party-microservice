#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_lib.sh"

h1 "Layout & Sidebar Audit"

# Check for grid-template-columns usage
echo "📐 Grid Layout Analysis:"
GRID_FILES=$(grep -Rl --include="*.css" --include="*.html" --include="*.js" "grid-template-columns" "$SRC_FE" 2>/dev/null || true)
if [ -n "$GRID_FILES" ]; then
  GRID_COUNT=$(echo "$GRID_FILES" | wc -l)
  ok "Found grid-template-columns in $GRID_COUNT files:"
  echo "$GRID_FILES" | while read -r file; do
    rel_path="${file#$ROOT/}"
    echo "  • $rel_path"
    grep -n "grid-template-columns" "$file" | head -1 | sed 's/^/    Line /'
  done | head -20
else
  warn "No grid-template-columns found"
fi

echo ""
echo "🚫 Third Rail Detection:"
# Check for potential third rail (3-column layouts that might break sidebar)
BAD_GRIDS=$(grep -RnE "grid-template-columns:[^;]*(1fr\s+[0-9]+fr\s+1fr|repeat\(3|3fr)" "$CSS_DIR" 2>/dev/null || true)
if [ -z "$BAD_GRIDS" ]; then
  ok "No 3-column grid layouts detected"
else
  err "Potential 3-rail grids found (may conflict with sidebar):"
  echo "$BAD_GRIDS" | while IFS=: read -r file line content; do
    rel_path="${file#$ROOT/}"
    echo "  • $rel_path:$line"
    echo "    $content" | head -c 80
    echo
  done | head -10
fi

echo ""
echo "📍 Subnav Implementation:"
# Check subnav implementation (should be inside sidebar, not separate column)
SUBNAV_FILES=$(grep -Rl "v-day-subnav\|subnav\|sub-nav" "$SRC_FE" 2>/dev/null || true)
if [ -n "$SUBNAV_FILES" ]; then
  SUBNAV_COUNT=$(echo "$SUBNAV_FILES" | wc -l)
  ok "Subnav references found in $SUBNAV_COUNT files:"
  echo "$SUBNAV_FILES" | while read -r file; do
    rel_path="${file#$ROOT/}"
    echo "  • $rel_path"
  done | head -10
  
  # Check if subnav is properly contained
  SUBNAV_CSS=$(grep -n "\.v-day-subnav" "$CSS_DIR/day-subnav.css" 2>/dev/null | head -3 || true)
  if [ -n "$SUBNAV_CSS" ]; then
    echo "  Day subnav CSS:"
    echo "$SUBNAV_CSS" | sed 's/^/    /'
  fi
else
  warn "No subnav implementation found"
fi

echo ""
echo "🎯 Sidebar Structure:"
# Check sidebar implementation
SIDEBAR_FILES=$(grep -Rl "sidebar\|v-sidebar\|v-nav" "$CSS_DIR" 2>/dev/null || true)
if [ -n "$SIDEBAR_FILES" ]; then
  SIDEBAR_COUNT=$(echo "$SIDEBAR_FILES" | wc -l)
  ok "Sidebar styles in $SIDEBAR_COUNT CSS files"
  
  # Check for proper sidebar width constraints
  WIDTH_CHECK=$(grep -n "width:\|inline-size:" "$CSS_DIR/sidebar-modern.css" 2>/dev/null | head -3 || true)
  if [ -n "$WIDTH_CHECK" ]; then
    echo "  Sidebar width settings:"
    echo "$WIDTH_CHECK" | sed 's/^/    /'
  fi
else
  err "No sidebar styles found"
fi

echo ""
echo "🔤 Icon Usage Analysis:"
# Check for icon usage (prefer text/emoji over icon fonts)
ICON_CLASSES=$(grep -RnE "class=['\"][^'\"]*\b(icon|lucide|material-icons|feather|fa-)" "$SRC_FE" 2>/dev/null || true)
ICON_COUNT=$(echo "$ICON_CLASSES" | grep -c . || echo 0)

if [ "$ICON_COUNT" -gt 0 ]; then
  warn "Found $ICON_COUNT icon class references:"
  echo "$ICON_CLASSES" | head -5 | while IFS=: read -r file line content; do
    rel_path="${file#$ROOT/}"
    echo "  • $rel_path:$line"
  done
  echo "  (Consider using text/emoji for better performance)"
else
  ok "No icon font classes detected"
fi

# Check for SVG icons (preferred over icon fonts)
SVG_COUNT=$(grep -Ro "<svg" "$SRC_FE" 2>/dev/null | wc -l || echo 0)
if [ "$SVG_COUNT" -gt 0 ]; then
  ok "Using $SVG_COUNT inline SVG icons (good practice)"
fi

echo ""
echo "📊 Layout Summary:"
echo "  Grid layouts: $(grep -Rl "display:\s*grid" "$CSS_DIR" 2>/dev/null | wc -l || echo 0) files"
echo "  Flexbox layouts: $(grep -Rl "display:\s*flex" "$CSS_DIR" 2>/dev/null | wc -l || echo 0) files"
echo "  Position fixed: $(grep -R "position:\s*fixed" "$CSS_DIR" 2>/dev/null | wc -l || echo 0) instances"
echo "  Position sticky: $(grep -R "position:\s*sticky" "$CSS_DIR" 2>/dev/null | wc -l || echo 0) instances"

# Check for z-index conflicts
echo ""
echo "🔝 Z-Index Analysis:"
Z_INDICES=$(grep -RnE "z-index:\s*[0-9]+" "$CSS_DIR" 2>/dev/null | sort -t: -k3 -rn || true)
if [ -n "$Z_INDICES" ]; then
  echo "  Highest z-indices:"
  echo "$Z_INDICES" | head -5 | while IFS=: read -r file line content; do
    rel_path="${file#$ROOT/}"
    value=$(echo "$content" | grep -oE "[0-9]+")
    echo "    $value - $rel_path:$line"
  done
fi

echo ""
h1 "Recommendations"
echo "✅ Good practices found:"
[ "$SVG_COUNT" -gt 0 ] && echo "  - Using inline SVGs for icons"
[ -z "$BAD_GRIDS" ] && echo "  - No problematic 3-column grids"
[ -n "$SUBNAV_FILES" ] && echo "  - Subnav system implemented"

echo ""
echo "⚠️  Areas for review:"
[ "$ICON_COUNT" -gt 0 ] && echo "  - Consider replacing icon fonts with SVG/text"
[ -n "$BAD_GRIDS" ] && echo "  - Review 3-column grids for sidebar compatibility"

# Final check for mobile responsiveness
echo ""
echo "📱 Mobile Responsiveness:"
MEDIA_QUERIES=$(grep -R "@media" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)
if [ "$MEDIA_QUERIES" -gt 0 ]; then
  ok "$MEDIA_QUERIES media queries found (responsive design)"
else
  err "No media queries found (mobile responsiveness missing?)"
fi