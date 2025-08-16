#!/bin/bash
# CI Script: Check for single Maps loader and no placeholder keys
# Fails if:
# - More than one maps.googleapis.com/maps/api/js script tag exists
# - Any __REPLACE_WITH_PROD_KEY__ placeholder remains

set -e

echo "🔍 Checking Maps loader configuration..."

# Check for multiple Maps API script tags in HTML files
MAPS_SCRIPTS=$(find frontend/src -name "*.html" -type f -exec grep -c "maps\.googleapis\.com/maps/api/js" {} \; | awk '{sum+=$1} END {print sum}')

if [ "$MAPS_SCRIPTS" -gt 1 ]; then
  echo "❌ ERROR: Found $MAPS_SCRIPTS Maps API script tags (expected exactly 1)"
  echo "Files containing Maps scripts:"
  find frontend/src -name "*.html" -type f -exec grep -l "maps\.googleapis\.com/maps/api/js" {} \;
  exit 1
fi

if [ "$MAPS_SCRIPTS" -eq 0 ]; then
  echo "❌ ERROR: No Maps API script tag found in HTML files"
  exit 1
fi

echo "✅ Single Maps loader found"

# Check for placeholder keys
PLACEHOLDER_COUNT=$(grep -r "__REPLACE_WITH_PROD_KEY__" frontend/src --include="*.html" --include="*.js" | wc -l)

if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
  echo "❌ ERROR: Found $PLACEHOLDER_COUNT instances of placeholder key __REPLACE_WITH_PROD_KEY__"
  echo "Files containing placeholder:"
  grep -r "__REPLACE_WITH_PROD_KEY__" frontend/src --include="*.html" --include="*.js" -l
  exit 1
fi

echo "✅ No placeholder keys found"

# Verify the single loader has correct attributes
LOADER_CHECK=$(grep -h "maps\.googleapis\.com/maps/api/js" frontend/src/index.html)

if ! echo "$LOADER_CHECK" | grep -q 'id="maps-loader"'; then
  echo "⚠️ WARNING: Maps loader missing id='maps-loader' attribute"
fi

if ! echo "$LOADER_CHECK" | grep -q 'defer'; then
  echo "⚠️ WARNING: Maps loader missing 'defer' attribute"
fi

if ! echo "$LOADER_CHECK" | grep -q 'loading=async'; then
  echo "⚠️ WARNING: Maps loader missing 'loading=async' parameter"
fi

echo "✅ Maps loader configuration validated"
echo ""
echo "📊 Summary:"
echo "  - Maps script tags: $MAPS_SCRIPTS (✅ exactly 1)"
echo "  - Placeholder keys: $PLACEHOLDER_COUNT (✅ none found)"
echo "  - Loader location: frontend/src/index.html"

exit 0