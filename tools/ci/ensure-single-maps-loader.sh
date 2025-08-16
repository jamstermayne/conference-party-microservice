#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Checking for single Maps loader pattern..."

# Check for any placeholder keys in source
if grep -r "__REPLACE_WITH_PROD_KEY__" frontend/src --include="*.js" --include="*.html" 2>/dev/null; then
  echo "❌ Found old placeholder key __REPLACE_WITH_PROD_KEY__ - must use __INJECT_AT_BUILD__"
  exit 1
fi

# Check for duplicate Maps script tags in HTML
script_count=$(grep -c "maps.googleapis.com/maps/api/js" frontend/src/index.html || echo "0")
if [ "$script_count" -gt 0 ]; then
  echo "❌ Found hardcoded Maps script tag in index.html - use maps-loader.js instead"
  exit 1
fi

# Ensure meta tag with placeholder exists
if ! grep -q '<meta name="google-maps-key" content="__INJECT_AT_BUILD__">' frontend/src/index.html; then
  echo "❌ Missing Maps key meta tag with __INJECT_AT_BUILD__ placeholder"
  exit 1
fi

# Check for any direct Maps API loading outside of maps-loader.js
if grep -r "maps.googleapis.com/maps/api/js" frontend/src/js --include="*.js" | grep -v "maps-loader.js" | grep -v "^[[:space:]]*//"; then
  echo "❌ Found Maps API loading outside of maps-loader.js"
  exit 1
fi

# Ensure maps-loader.js exists and has the tiny API
if [ ! -f "frontend/src/js/services/maps-loader.js" ]; then
  echo "❌ Missing frontend/src/js/services/maps-loader.js"
  exit 1
fi

# Check for required exports in maps-loader.js
for fn in "getMapsKey" "loadGoogleMaps" "ensureMapsReady"; do
  if ! grep -q "export.*function.*$fn" frontend/src/js/services/maps-loader.js; then
    echo "❌ Missing required export: $fn"
    exit 1
  fi
done

echo "✅ Single Maps loader pattern enforced"
echo "✅ No placeholder keys in source"
echo "✅ Meta tag with __INJECT_AT_BUILD__ found"
echo "✅ All checks passed"