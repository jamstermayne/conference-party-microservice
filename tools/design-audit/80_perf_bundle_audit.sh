#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_lib.sh"

h1 "Performance & Bundle Audit"

echo "📦 Bundle Analysis:"
# Check for built bundles
if [ -d "$DIST_FE" ]; then
  echo "  Distribution bundles:"
  find "$DIST_FE" -type f -name "*.js" -exec du -h {} \; | sort -rh | head -10 | while read -r size file; do
    basename=$(basename "$file")
    echo "    • $basename: $size"
  done
  
  # Check for oversized bundles
  LARGE_BUNDLES=$(find "$DIST_FE" -type f -name "*.js" -size +300k 2>/dev/null || true)
  if [ -z "$LARGE_BUNDLES" ]; then
    ok "No JavaScript bundles exceed 300KB"
  else
    warn "Large bundles detected (>300KB):"
    echo "$LARGE_BUNDLES" | while read -r file; do
      size=$(du -h "$file" | cut -f1)
      echo "    • $(basename "$file"): $size"
    done
  fi
else
  # Check public directory instead
  if [ -d "$PUBLIC_DIR/js" ]; then
    echo "  Public JavaScript files:"
    find "$PUBLIC_DIR/js" -type f -name "*.js" -exec du -h {} \; | sort -rh | head -10 | while read -r size file; do
      basename=$(basename "$file")
      echo "    • $basename: $size"
    done
    
    LARGE_PUBLIC=$(find "$PUBLIC_DIR/js" -type f -name "*.js" -size +100k 2>/dev/null || true)
    if [ -n "$LARGE_PUBLIC" ]; then
      warn "Large JavaScript files in public:"
      echo "$LARGE_PUBLIC" | while read -r file; do
        size=$(du -h "$file" | cut -f1)
        echo "    • $(basename "$file"): $size"
      done
    fi
  fi
fi

echo ""
echo "🌐 Production Performance:"
# Fetch and analyze production index
if curl -sS "$BASE_PROD" -o /tmp/_live_index.html 2>/dev/null; then
  INDEX_SIZE=$(du -h /tmp/_live_index.html | cut -f1)
  ok "Production index fetched: $INDEX_SIZE"
  
  # Count resource includes
  CSS_COUNT=$(grep -c '<link.*\.css' /tmp/_live_index.html || echo 0)
  JS_COUNT=$(grep -c '<script.*\.js' /tmp/_live_index.html || echo 0)
  
  echo "  Resources loaded:"
  echo "    • CSS files: $CSS_COUNT"
  echo "    • JS files: $JS_COUNT"
  
  # Check for duplicate includes
  echo ""
  echo "🔍 Duplicate Resource Check:"
  
  # Check for duplicate Maps API
  MAPS_COUNT=$(grep -o 'maps\.googleapis\.com/maps/api/js' /tmp/_live_index.html | wc -l)
  if [ "$MAPS_COUNT" -le 1 ]; then
    ok "Single Maps API include"
  else
    err "Multiple Maps API includes detected ($MAPS_COUNT)"
  fi
  
  # Check for duplicate jQuery or other libraries
  JQUERY_COUNT=$(grep -o 'jquery' /tmp/_live_index.html | wc -l || echo 0)
  if [ "$JQUERY_COUNT" -gt 1 ]; then
    warn "Multiple jQuery references ($JQUERY_COUNT)"
  fi
fi

echo ""
echo "⚡ Loading Performance:"
# Check for async/defer attributes
if [ -f /tmp/_live_index.html ]; then
  ASYNC_SCRIPTS=$(grep -c '<script.*async' /tmp/_live_index.html || echo 0)
  DEFER_SCRIPTS=$(grep -c '<script.*defer' /tmp/_live_index.html || echo 0)
  BLOCKING_SCRIPTS=$(grep '<script.*src=' /tmp/_live_index.html | grep -v -E '(async|defer)' | wc -l || echo 0)
  
  echo "  Script loading:"
  [ "$ASYNC_SCRIPTS" -gt 0 ] && echo "    ✓ Async scripts: $ASYNC_SCRIPTS"
  [ "$DEFER_SCRIPTS" -gt 0 ] && echo "    ✓ Deferred scripts: $DEFER_SCRIPTS"
  [ "$BLOCKING_SCRIPTS" -gt 0 ] && warn "    ⚠ Render-blocking scripts: $BLOCKING_SCRIPTS"
fi

echo ""
echo "🖼️ Asset Optimization:"
# Check for image optimization
IMG_FILES=$(find "$SRC_FE" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" \) 2>/dev/null || true)
if [ -n "$IMG_FILES" ]; then
  IMG_COUNT=$(echo "$IMG_FILES" | wc -l)
  echo "  Image assets: $IMG_COUNT files"
  
  # Check for large images
  LARGE_IMAGES=$(find "$SRC_FE" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -size +500k 2>/dev/null || true)
  if [ -n "$LARGE_IMAGES" ]; then
    warn "Large images found (>500KB):"
    echo "$LARGE_IMAGES" | while read -r file; do
      size=$(du -h "$file" | cut -f1)
      echo "    • $(basename "$file"): $size"
    done | head -5
  else
    ok "No oversized images detected"
  fi
fi

echo ""
echo "💾 Caching Strategy:"
# Check for service worker
SW_FILE=$(find "$PUBLIC_DIR" -name "sw.js" -o -name "service-worker.js" 2>/dev/null | head -1)
if [ -n "$SW_FILE" ]; then
  SW_SIZE=$(du -h "$SW_FILE" | cut -f1)
  ok "Service worker present: $(basename "$SW_FILE") ($SW_SIZE)"
  
  # Check for cache strategies
  CACHE_STRATEGIES=$(grep -E "cache\.(match|put|delete|addAll)" "$SW_FILE" | wc -l || echo 0)
  if [ "$CACHE_STRATEGIES" -gt 0 ]; then
    echo "    • Cache strategies implemented: $CACHE_STRATEGIES operations"
  fi
else
  warn "No service worker found (offline support missing)"
fi

# Check for manifest
MANIFEST=$(find "$PUBLIC_DIR" -name "manifest.json" 2>/dev/null | head -1)
if [ -n "$MANIFEST" ]; then
  ok "Web manifest present for PWA support"
else
  warn "No manifest.json found (PWA support incomplete)"
fi

echo ""
echo "📊 CSS Performance:"
# Check CSS file sizes
CSS_FILES=$(find "$CSS_DIR" -name "*.css" -exec du -h {} \; | sort -rh | head -10)
echo "  Largest CSS files:"
echo "$CSS_FILES" | while read -r size file; do
  basename=$(basename "$file")
  echo "    • $basename: $size"
done

# Check for unused CSS (basic check)
UNUSED_CLASSES=$(grep -oh '\.[a-z][a-z0-9-]*' "$CSS_DIR"/*.css 2>/dev/null | sort -u | while read -r class; do
  class_name="${class#.}"
  if ! grep -q "class=.*$class_name" "$SRC_FE"/*.html 2>/dev/null && \
     ! grep -q "classList.*$class_name" "$JS_DIR"/*.js 2>/dev/null; then
    echo "$class"
  fi
done | head -10)

if [ -n "$UNUSED_CLASSES" ]; then
  warn "Potentially unused CSS classes:"
  echo "$UNUSED_CLASSES" | head -5 | sed 's/^/    /'
fi

echo ""
echo "🚀 Performance Summary:"
echo "  ✅ Optimizations found:"
[ "$ASYNC_SCRIPTS" -gt 0 ] && echo "    • Async script loading"
[ "$DEFER_SCRIPTS" -gt 0 ] && echo "    • Deferred script loading"
[ -n "$SW_FILE" ] && echo "    • Service worker caching"
[ -n "$MANIFEST" ] && echo "    • PWA manifest"

echo ""
echo "  ⚠️  Optimization opportunities:"
[ "$BLOCKING_SCRIPTS" -gt 0 ] && echo "    • Reduce render-blocking scripts"
[ -n "$LARGE_BUNDLES" ] && echo "    • Split large JavaScript bundles"
[ -n "$LARGE_IMAGES" ] && echo "    • Optimize large images"
[ -z "$SW_FILE" ] && echo "    • Add service worker for offline support"