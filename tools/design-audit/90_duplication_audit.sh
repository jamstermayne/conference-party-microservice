#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_lib.sh"

h1 "Duplication & Conflicts Audit"

echo "🔄 Checking for Duplicate Code Patterns:"

# Check for duplicate CSS selectors
echo ""
echo "📝 CSS Selector Duplication:"
DUPLICATE_SELECTORS=$(grep -h "^\.[a-z][a-z0-9-]*\s*{" "$CSS_DIR"/*.css 2>/dev/null | sort | uniq -d || true)
if [ -z "$DUPLICATE_SELECTORS" ]; then
  ok "No duplicate CSS selectors across files"
else
  DUPES_COUNT=$(echo "$DUPLICATE_SELECTORS" | wc -l)
  warn "Found $DUPES_COUNT duplicate CSS selectors:"
  echo "$DUPLICATE_SELECTORS" | head -10 | sed 's/^/    /'
fi

# Check for duplicate function names in JavaScript
echo ""
echo "🔧 JavaScript Function Duplication:"
if [ -d "$JS_DIR" ]; then
  FUNCTION_NAMES=$(grep -h "^function [a-zA-Z]" "$JS_DIR"/*.js 2>/dev/null | sed 's/function \([a-zA-Z0-9_]*\).*/\1/' | sort | uniq -d || true)
  EXPORT_FUNCTIONS=$(grep -h "^export function" "$JS_DIR"/*.js 2>/dev/null | sed 's/export function \([a-zA-Z0-9_]*\).*/\1/' | sort | uniq -d || true)
  
  ALL_DUPES=$(echo -e "$FUNCTION_NAMES\n$EXPORT_FUNCTIONS" | sort -u | grep -v "^$" || true)
  
  if [ -z "$ALL_DUPES" ]; then
    ok "No duplicate function names in JavaScript"
  else
    FUNC_COUNT=$(echo "$ALL_DUPES" | wc -l)
    warn "Found $FUNC_COUNT duplicate function names:"
    echo "$ALL_DUPES" | head -10 | sed 's/^/    • /'
  fi
fi

# Check for backend endpoint duplication
echo ""
echo "🌐 API Endpoint Duplication:"
if [ -d "$ROOT/functions/src" ]; then
  # Extract HTTP endpoints
  ENDPOINTS=$(grep -RnE "\.(get|post|put|delete|patch)\s*\(['\"]" "$ROOT/functions/src" 2>/dev/null | \
    sed -E "s/.*\.(get|post|put|delete|patch)\s*\(['\"]([^'\"]+).*/\U\1\E \2/" | \
    sort | uniq || true)
  
  if [ -n "$ENDPOINTS" ]; then
    # Check for duplicate verb+path combinations
    DUPLICATE_ENDPOINTS=$(echo "$ENDPOINTS" | uniq -d || true)
    
    if [ -z "$DUPLICATE_ENDPOINTS" ]; then
      ok "No duplicate API endpoints (verb + path)"
    else
      err "Duplicate API endpoints found:"
      echo "$DUPLICATE_ENDPOINTS" | sed 's/^/    • /'
    fi
    
    # Show endpoint summary
    ENDPOINT_COUNT=$(echo "$ENDPOINTS" | wc -l)
    echo "  Total unique endpoints: $ENDPOINT_COUNT"
  else
    warn "No HTTP endpoints found in functions/src"
  fi
else
  warn "Backend functions directory not found"
fi

# Check for exported function name collisions
echo ""
echo "📦 Exported Function Collisions:"
if [ -d "$ROOT/functions/src" ]; then
  # Find all exported functions
  EXPORTS=$(grep -RnE "exports?\.(default|[a-zA-Z0-9_]+)\s*=|export\s+(default\s+)?function\s+[a-zA-Z0-9_]+" "$ROOT/functions/src" 2>/dev/null | \
    sed -E 's/.*exports?\.(default|[a-zA-Z0-9_]+).*/\1/; s/.*export\s+(default\s+)?function\s+([a-zA-Z0-9_]+).*/\2/' | \
    grep -v "^$" | sort || true)
  
  if [ -n "$EXPORTS" ]; then
    DUPLICATE_EXPORTS=$(echo "$EXPORTS" | uniq -d || true)
    
    if [ -z "$DUPLICATE_EXPORTS" ]; then
      ok "No duplicate exported function names"
    else
      err "Duplicate exported functions:"
      echo "$DUPLICATE_EXPORTS" | sed 's/^/    • /'
    fi
  fi
fi

# Check for duplicate component files
echo ""
echo "🧩 Component File Duplication:"
COMPONENT_FILES=$(find "$JS_DIR" -name "*.js" -exec basename {} \; 2>/dev/null | sort | uniq -d || true)
if [ -z "$COMPONENT_FILES" ]; then
  ok "No duplicate component filenames"
else
  warn "Duplicate component filenames found:"
  echo "$COMPONENT_FILES" | sed 's/^/    • /'
fi

# Check for duplicate color definitions
echo ""
echo "🎨 Color Definition Duplication:"
COLOR_VARS=$(grep -h "^\s*--[a-z-]*color[a-z-]*:" "$CSS_DIR"/*.css 2>/dev/null | sed 's/:.*//' | sort | uniq -d || true)
if [ -z "$COLOR_VARS" ]; then
  ok "No duplicate color variable definitions"
else
  COLOR_COUNT=$(echo "$COLOR_VARS" | wc -l)
  warn "Found $COLOR_COUNT duplicate color variables:"
  echo "$COLOR_VARS" | head -5 | sed 's/^/    /'
fi

# Check for duplicate ID attributes
echo ""
echo "🏷️ HTML ID Duplication:"
ID_ATTRS=$(grep -oh 'id="[^"]*"' "$SRC_FE"/*.html 2>/dev/null | sed 's/id="//' | sed 's/"//' | sort | uniq -d || true)
if [ -z "$ID_ATTRS" ]; then
  ok "No duplicate HTML IDs found"
else
  ID_COUNT=$(echo "$ID_ATTRS" | wc -l)
  err "Found $ID_COUNT duplicate HTML IDs (must be unique):"
  echo "$ID_ATTRS" | head -10 | sed 's/^/    • #/'
fi

# Check for conflicting CSS files
echo ""
echo "📂 CSS File Organization:"
SIDEBAR_CSS=$(ls "$CSS_DIR"/sidebar*.css 2>/dev/null | wc -l || echo 0)
THEME_CSS=$(ls "$CSS_DIR"/theme*.css 2>/dev/null | wc -l || echo 0)
CALENDAR_CSS=$(ls "$CSS_DIR"/calendar*.css 2>/dev/null | wc -l || echo 0)

if [ "$SIDEBAR_CSS" -gt 3 ]; then
  warn "Multiple sidebar CSS files ($SIDEBAR_CSS) - consider consolidation"
  ls "$CSS_DIR"/sidebar*.css | sed 's/^/    • /'
fi

if [ "$THEME_CSS" -gt 2 ]; then
  warn "Multiple theme CSS files ($THEME_CSS) - potential conflicts"
  ls "$CSS_DIR"/theme*.css | sed 's/^/    • /'
fi

if [ "$CALENDAR_CSS" -gt 3 ]; then
  warn "Multiple calendar CSS files ($CALENDAR_CSS) - review for duplication"
  ls "$CSS_DIR"/calendar*.css | sed 's/^/    • /'
fi

# Check for duplicate import statements
echo ""
echo "📥 Import Statement Analysis:"
if [ -d "$JS_DIR" ]; then
  # Count imports per file
  for file in "$JS_DIR"/*.js; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      imports=$(grep -c "^import " "$file" 2>/dev/null || echo 0)
      if [ "$imports" -gt 10 ]; then
        warn "$filename has $imports imports (consider refactoring)"
      fi
    fi
  done | head -3
fi

echo ""
echo "📊 Duplication Summary:"
echo "  Code Quality Metrics:"
[ -z "$DUPLICATE_SELECTORS" ] && echo "    ✅ No duplicate CSS selectors"
[ -z "$ALL_DUPES" ] && echo "    ✅ No duplicate JS functions"
[ -z "$DUPLICATE_ENDPOINTS" ] && echo "    ✅ No duplicate API endpoints"
[ -z "$ID_ATTRS" ] && echo "    ✅ All HTML IDs are unique"

echo ""
echo "  Potential Issues:"
[ -n "$DUPLICATE_SELECTORS" ] && echo "    ⚠️  Duplicate CSS selectors found"
[ -n "$ALL_DUPES" ] && echo "    ⚠️  Duplicate function names"
[ "$SIDEBAR_CSS" -gt 3 ] && echo "    ⚠️  Too many sidebar CSS files"
[ "$THEME_CSS" -gt 2 ] && echo "    ⚠️  Multiple theme files"
[ -n "$ID_ATTRS" ] && echo "    ❌ Duplicate HTML IDs (critical)"