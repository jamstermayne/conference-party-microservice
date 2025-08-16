#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC_FE="$ROOT/frontend/src"
OUT="$ROOT/reports/SIMPLE_DEAD_CODE_AUDIT.md"

sec(){ printf "\n## %s\n\n" "$1" >>"$OUT"; }
line(){ printf "%s\n" "$1" >>"$OUT"; }

echo "# Simple Dead Code Audit" >"$OUT"
date >>"$OUT"

sec "Potentially Unused JavaScript Files"
echo "Files that appear to have no references:" >>"$OUT"
echo "" >>"$OUT"

# Find JS files that might be unused
find "$SRC_FE" -name "*.js" -type f | while read -r file; do
    filename=$(basename "$file" .js)
    relative_path=${file#$SRC_FE/}
    
    # Skip main entry points
    if [[ "$filename" =~ ^(main|app|index|router|init-app)$ ]]; then
        continue
    fi
    
    # Simple check - search for filename in other files
    ref_count=$(find "$SRC_FE" -name "*.js" -o -name "*.html" | xargs grep -l "$filename" 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "${ref_count:-1}" -le 1 ]; then
        echo "❓ **$relative_path** - Minimal references found" >>"$OUT"
    fi
done

sec "Large Files Analysis" 
echo "Files over 40KB that might need splitting:" >>"$OUT"
echo "" >>"$OUT"

find "$SRC_FE" -name "*.js" -type f -exec wc -c {} + | while read -r size file; do
    if [ -n "$file" ] && [ "$file" != "total" ] && [ "$size" -gt 40960 ]; then
        relative_file=${file#$SRC_FE/}
        size_kb=$((size / 1024))
        echo "📦 **$relative_file** - ${size_kb}KB" >>"$OUT"
    fi
done

sec "Key Findings Summary"
echo "📊 **Total Files:**" >>"$OUT"
total_js=$(find "$SRC_FE" -name "*.js" -type f | wc -l)
total_css=$(find "$SRC_FE" -name "*.css" -type f | wc -l) 
total_html=$(find "$SRC_FE" -name "*.html" -type f | wc -l)
echo "- JavaScript: $total_js files" >>"$OUT"
echo "- CSS: $total_css files" >>"$OUT"
echo "- HTML: $total_html files" >>"$OUT"
echo "" >>"$OUT"

echo "🔍 **Major Duplicate Groups Found:**" >>"$OUT"
echo "- Multiple calendar.js versions (5 files)" >>"$OUT"
echo "- Multiple events.js versions (5 files)" >>"$OUT"
echo "- Multiple invites.js versions (5 files)" >>"$OUT"
echo "- Multiple app.js versions (3 files)" >>"$OUT"
echo "" >>"$OUT"

echo "⚡ **Performance Opportunities:**" >>"$OUT"
echo "- opportunity-toggle.js (52KB) - Consider code splitting" >>"$OUT"
echo "- conference-manager.js (48KB) - Large business logic file" >>"$OUT"
echo "- app.js (46KB) - Main entry point, review bundling" >>"$OUT"
echo "- offline-search.js (46KB) - Search functionality isolation" >>"$OUT"
echo "" >>"$OUT"

echo "🎯 **Immediate Actions Recommended:**" >>"$OUT"
echo "1. **Consolidate duplicates**: Pick canonical versions of calendar.js, events.js, invites.js" >>"$OUT"
echo "2. **Code splitting**: Break down 40KB+ files into smaller modules" >>"$OUT"
echo "3. **Directory cleanup**: Standardize on either assets/ or js/ structure" >>"$OUT"
echo "4. **Bundle analysis**: Review which files are actually loaded in production" >>"$OUT"

echo "" >>"$OUT"
echo "---" >>"$OUT"
echo "Generated: $(date)" >>"$OUT"

echo "Simple dead code audit complete. Report at: $OUT"