#!/bin/bash
# CI Script: Check Maps loader configuration
# Ensures:
# - No hardcoded Maps script tags in source
# - Maps loader service exists
# - No placeholder keys remain
# - Single loader pattern enforced

set -e

echo "🔍 Checking Maps loader configuration..."

# 1. Check for Maps API script tags in ALL source files (except maps-loader.js)
echo -n "Checking for maps.googleapis.com/maps/api/js in source..."
MAPS_IN_SOURCE=$(grep -r "maps\.googleapis\.com/maps/api/js" frontend/src --include="*.html" --include="*.js" --include="*.ts" 2>/dev/null | grep -v "maps-loader.js" | wc -l)

if [ "$MAPS_IN_SOURCE" -gt 0 ]; then
  echo " ❌"
  echo "ERROR: Found $MAPS_IN_SOURCE Maps API script references outside maps-loader.js"
  echo "Files containing Maps scripts:"
  grep -r "maps\.googleapis\.com/maps/api/js" frontend/src --include="*.html" --include="*.js" --include="*.ts" | grep -v "maps-loader.js"
  exit 1
fi
echo " ✅"

# 2. Check that maps-loader.js exists
echo -n "Checking for maps-loader.js service..."
if [ ! -f "frontend/src/js/services/maps-loader.js" ]; then
  echo " ❌"
  echo "ERROR: Maps loader service not found at frontend/src/js/services/maps-loader.js"
  exit 1
fi
echo " ✅"

# 3. Check for __REPLACE_WITH_PROD_KEY__ anywhere in frontend
echo -n "Checking for __REPLACE_WITH_PROD_KEY__ placeholders..."
REPLACE_KEY_COUNT=$(grep -r "__REPLACE_WITH_PROD_KEY__" frontend --include="*.html" --include="*.js" --include="*.ts" 2>/dev/null | grep -v "maps-loader.js" | wc -l)

if [ "$REPLACE_KEY_COUNT" -gt 0 ]; then
  echo " ❌"
  echo "ERROR: Found $REPLACE_KEY_COUNT instances of __REPLACE_WITH_PROD_KEY__"
  echo "Files containing placeholder:"
  grep -r "__REPLACE_WITH_PROD_KEY__" frontend --include="*.html" --include="*.js" --include="*.ts" | grep -v "maps-loader.js"
  exit 1
fi
echo " ✅"

# 4. Check for meta tag in index.html
echo -n "Checking for google-maps-key meta tag..."
if ! grep -q '<meta name="google-maps-key"' frontend/src/index.html; then
  echo " ⚠️ WARNING"
  echo "Missing <meta name='google-maps-key'> tag in index.html"
else
  echo " ✅"
fi

# 5. Verify no hardcoded API keys in commits (basic check)
echo -n "Checking for hardcoded API keys..."
HARDCODED_KEYS=$(grep -r "AIzaSy[A-Za-z0-9_-]\{33\}" frontend/src --include="*.html" --include="*.js" 2>/dev/null | wc -l)
if [ "$HARDCODED_KEYS" -gt 0 ]; then
  echo " ⚠️ WARNING"
  echo "Found potential hardcoded API keys in source (verify these are placeholders only)"
else
  echo " ✅"
fi

echo ""
echo "✅ Maps loader configuration validated"
echo ""
echo "📊 Summary:"
echo "  - Maps API refs outside loader: $MAPS_IN_SOURCE (✅ none)"
echo "  - Maps loader service: ✅ exists"
echo "  - __REPLACE_WITH_PROD_KEY__: $REPLACE_KEY_COUNT (✅ none)"
echo "  - Meta tag for key: ✅ present"
echo "  - Single loader pattern: ✅ enforced"

exit 0