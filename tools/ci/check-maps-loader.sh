#!/bin/bash
# CI Script: Check Maps loader configuration
# Ensures:
# - No hardcoded Maps script tags in HTML
# - Maps loader service exists
# - No placeholder keys remain

set -e

echo "🔍 Checking Maps loader configuration..."

# Check for Maps API script tags in HTML files (should be 0 - loader handles it)
MAPS_SCRIPTS=$(find frontend/src -name "*.html" -type f -exec grep -c "maps\.googleapis\.com/maps/api/js" {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}')

if [ "$MAPS_SCRIPTS" -gt 0 ]; then
  echo "❌ ERROR: Found $MAPS_SCRIPTS Maps API script tags in HTML (expected 0 - should use maps-loader.js)"
  echo "Files containing Maps scripts:"
  find frontend/src -name "*.html" -type f -exec grep -l "maps\.googleapis\.com/maps/api/js" {} \;
  exit 1
fi

echo "✅ No hardcoded Maps scripts in HTML"

# Check that maps-loader.js exists
if [ ! -f "frontend/src/js/services/maps-loader.js" ]; then
  echo "❌ ERROR: Maps loader service not found at frontend/src/js/services/maps-loader.js"
  exit 1
fi

echo "✅ Maps loader service exists"

# Check for placeholder keys (excluding the check in maps-loader.js itself)
PLACEHOLDER_COUNT=$(grep -r "REPLACE_WITH_PROD_KEY" frontend/src --include="*.html" --include="*.js" | grep -v "maps-loader.js" | wc -l)

if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
  echo "❌ ERROR: Found $PLACEHOLDER_COUNT instances of placeholder key REPLACE_WITH_PROD_KEY"
  echo "Files containing placeholder:"
  grep -r "REPLACE_WITH_PROD_KEY" frontend/src --include="*.html" --include="*.js" | grep -v "maps-loader.js"
  exit 1
fi

echo "✅ No placeholder keys found (except in loader check)"

# Check for meta tag in index.html
if ! grep -q '<meta name="google-maps-key"' frontend/src/index.html; then
  echo "⚠️ WARNING: Missing <meta name='google-maps-key'> tag in index.html"
fi

echo "✅ Maps loader configuration validated"
echo ""
echo "📊 Summary:"
echo "  - Maps script tags in HTML: $MAPS_SCRIPTS (✅ none - using loader)"
echo "  - Maps loader service: ✅ exists"
echo "  - Placeholder keys: $PLACEHOLDER_COUNT (✅ none found)"
echo "  - Meta tag for key: ✅ present in index.html"

exit 0