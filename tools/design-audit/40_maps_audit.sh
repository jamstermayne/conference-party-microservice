#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_lib.sh"

h1 "Maps Integration Audit"

echo "🗺️  Google Maps API Analysis:"

# Check production index for Maps script
if curl -sS "$BASE_PROD" -o /tmp/_live_index.html 2>/dev/null; then
  MAPS_TAG=$(grep -Eo '<script[^>]+maps\.googleapis\.com/maps/api/js[^>]*>' /tmp/_live_index.html || true)
  if [ -n "$MAPS_TAG" ]; then
    ok "Maps API script found in production"
    echo "  Script tag: $(echo "$MAPS_TAG" | head -c 100)..."
    
    # Check for async loading
    if grep -q "loading=async" <<<"$MAPS_TAG"; then
      ok "Async loading enabled (good for performance)"
    else
      warn "Missing loading=async attribute"
    fi
    
    # Check for marker library
    if grep -q "libraries=marker" <<<"$MAPS_TAG"; then
      ok "Advanced Marker library loaded"
    else
      warn "Marker library not specified"
    fi
    
    # Check for deprecated libraries
    if grep -q "visualization" <<<"$MAPS_TAG"; then
      err "Deprecated visualization library still loaded (remove heatmap)"
    else
      ok "No deprecated libraries loaded"
    fi
  else
    warn "No Maps script tag found in production index"
  fi
else
  err "Could not fetch production index"
fi

echo ""
echo "🔑 API Key Security:"
# Check for hardcoded API keys
API_KEYS=$(grep -RnE "AIza[0-9A-Za-z_\-]{33,}" "$SRC_FE" 2>/dev/null || true)
if [ -z "$API_KEYS" ]; then
  ok "No exposed Google API keys in source"
else
  err "Exposed API keys found in source:"
  echo "$API_KEYS" | while IFS=: read -r file line content; do
    rel_path="${file#$ROOT/}"
    key=$(echo "$content" | grep -oE "AIza[0-9A-Za-z_\-]{33,}" | head -1)
    echo "  • $rel_path:$line"
    echo "    Key: ${key:0:10}...${key: -4} (masked)"
  done
fi

echo ""
echo "📍 Map Implementation:"
# Check for map initialization code
MAP_INIT=$(grep -Rn "new google\.maps\.Map" "$JS_DIR" 2>/dev/null || true)
if [ -n "$MAP_INIT" ]; then
  MAP_COUNT=$(echo "$MAP_INIT" | wc -l)
  ok "Found $MAP_COUNT map initialization(s)"
  
  # Check for mapId vs styles conflict
  MAPID_USAGE=$(grep -RnE "mapId\s*:" "$JS_DIR" 2>/dev/null || true)
  STYLES_USAGE=$(grep -RnE "styles\s*:" "$JS_DIR" 2>/dev/null | grep -v "// " || true)
  
  if [ -n "$MAPID_USAGE" ] && [ -n "$STYLES_USAGE" ]; then
    warn "Both mapId and styles used (cloud styles override local)"
    echo "  MapId usage:"
    echo "$MAPID_USAGE" | head -2 | sed 's/^/    • /'
    echo "  Styles usage:"
    echo "$STYLES_USAGE" | head -2 | sed 's/^/    • /'
  elif [ -n "$MAPID_USAGE" ]; then
    ok "Using cloud-based styling with mapId"
  elif [ -n "$STYLES_USAGE" ]; then
    ok "Using local styles configuration"
  fi
else
  warn "No map initialization found"
fi

echo ""
echo "🎯 Marker Implementation:"
# Check for marker types
LEGACY_MARKER=$(grep -Rn "new google\.maps\.Marker" "$JS_DIR" 2>/dev/null || true)
ADV_MARKER=$(grep -Rn "new google\.maps\.marker\.AdvancedMarkerElement" "$JS_DIR" 2>/dev/null || true)

if [ -n "$ADV_MARKER" ]; then
  ADV_COUNT=$(echo "$ADV_MARKER" | wc -l)
  ok "Using AdvancedMarkerElement ($ADV_COUNT instances) - modern approach"
fi

if [ -n "$LEGACY_MARKER" ]; then
  LEGACY_COUNT=$(echo "$LEGACY_MARKER" | wc -l)
  warn "Still using legacy Marker ($LEGACY_COUNT instances) - consider migrating"
  echo "$LEGACY_MARKER" | head -3 | while IFS=: read -r file line content; do
    rel_path="${file#$ROOT/}"
    echo "  • $rel_path:$line"
  done
fi

echo ""
echo "📊 Maps Summary:"
echo "  Configuration:"
[ -n "$MAPS_TAG" ] && echo "    ✅ Maps API loaded in production"
[ -z "$API_KEYS" ] && echo "    ✅ No exposed API keys"
[ -n "$ADV_MARKER" ] && echo "    ✅ Using modern AdvancedMarkerElement"

echo ""
echo "  Potential Issues:"
[ -z "$MAPS_TAG" ] && echo "    ⚠️  No Maps script in production"
[ -n "$API_KEYS" ] && echo "    ❌ Exposed API keys in source"
[ -n "$LEGACY_MARKER" ] && echo "    ⚠️  Legacy markers still in use"