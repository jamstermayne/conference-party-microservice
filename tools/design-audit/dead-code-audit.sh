#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC_FE="$ROOT/frontend/src"
OUT="$ROOT/reports/DEAD_CODE_AUDIT.md"

sec(){ printf "\n## %s\n\n" "$1" >>"$OUT"; }
line(){ printf "%s\n" "$1" >>"$OUT"; }

echo "# Dead Code Audit" >"$OUT"
date >>"$OUT"

sec "Unused JavaScript Files"
echo "Files that are never imported or referenced:" >>"$OUT"
echo "" >>"$OUT"

# Find all JS files
ALL_JS=$(find "$SRC_FE" -name "*.js" -type f | grep -v node_modules | sort)

# Check each JS file for references
for file in $ALL_JS; do
    filename=$(basename "$file" .js)
    relative_path=${file#$SRC_FE/}
    
    # Skip certain files that might be referenced differently
    if [[ "$filename" =~ ^(main|router|init-app|app|index)$ ]]; then
        continue
    fi
    
    # Check if file is imported anywhere
    import_count=$(grep -r "import.*['\"].*${filename}" "$SRC_FE" 2>/dev/null | wc -l | tr -d ' ' || echo 0)
    require_count=$(grep -r "require.*['\"].*${filename}" "$SRC_FE" 2>/dev/null | wc -l | tr -d ' ' || echo 0)
    script_count=$(grep -r "src=.*${filename}" "$SRC_FE" 2>/dev/null | wc -l | tr -d ' ' || echo 0)
    
    total_refs=$((${import_count:-0} + ${require_count:-0} + ${script_count:-0}))
    
    if [ "$total_refs" -eq 0 ]; then
        echo "❌ **$relative_path** - No imports found" >>"$OUT"
    fi
done

sec "Unused CSS Files"
echo "CSS files that are never linked or imported:" >>"$OUT"
echo "" >>"$OUT"

# Find all CSS files
ALL_CSS=$(find "$SRC_FE" -name "*.css" -type f | sort)

for file in $ALL_CSS; do
    filename=$(basename "$file")
    relative_path=${file#$SRC_FE/}
    
    # Check if CSS file is referenced
    link_count=$(grep -r "href=.*${filename}" "$SRC_FE" 2>/dev/null | wc -l | tr -d ' ' || echo 0)
    import_count=$(grep -r "@import.*${filename}" "$SRC_FE" 2>/dev/null | wc -l | tr -d ' ' || echo 0)
    
    total_refs=$((${link_count:-0} + ${import_count:-0}))
    
    if [ "$total_refs" -eq 0 ]; then
        echo "❌ **$relative_path** - No links found" >>"$OUT"
    fi
done

sec "Unreferenced Functions and Exports"
echo "Functions that are exported but never imported:" >>"$OUT"
echo "" >>"$OUT"

# Find exported functions
grep -r "^export.*function\|^export.*=\|^export.*{" "$SRC_FE" --include="*.js" | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    export_line=$(echo "$line" | cut -d: -f2-)
    
    # Extract function/variable name
    if [[ "$export_line" =~ export[[:space:]]+function[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*) ]]; then
        func_name="${BASH_REMATCH[1]}"
    elif [[ "$export_line" =~ export[[:space:]]+const[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*) ]]; then
        func_name="${BASH_REMATCH[1]}"
    elif [[ "$export_line" =~ export[[:space:]]+\{[[:space:]]*([a-zA-Z_][a-zA-Z0-9_]*) ]]; then
        func_name="${BASH_REMATCH[1]}"
    else
        continue
    fi
    
    # Check if function is imported anywhere else
    import_count=$(grep -r "import.*${func_name}" "$SRC_FE" --include="*.js" | grep -v "$(basename "$file")" | wc -l | tr -d ' ' || echo 0)
    
    if [ "${import_count:-0}" -eq 0 ]; then
        relative_file=${file#$SRC_FE/}
        echo "❌ **$func_name** in $relative_file - Never imported" >>"$OUT"
    fi
done

sec "Duplicate File Names"
echo "Files with identical names in different directories:" >>"$OUT"
echo "" >>"$OUT"

# Find duplicate filenames
find "$SRC_FE" -name "*.js" -o -name "*.css" | xargs basename -a | sort | uniq -d | while read -r duplicate; do
    echo "⚠️ **$duplicate** appears in multiple locations:" >>"$OUT"
    find "$SRC_FE" -name "$duplicate" | while read -r file; do
        relative_path=${file#$SRC_FE/}
        echo "  - $relative_path" >>"$OUT"
    done
    echo "" >>"$OUT"
done

sec "Large Unused Directories"
echo "Directories that might contain obsolete code:" >>"$OUT"
echo "" >>"$OUT"

# Check for large directories with minimal cross-references
LARGE_DIRS=$(find "$SRC_FE" -type d -name "*old*" -o -name "*backup*" -o -name "*deprecated*" -o -name "*legacy*" 2>/dev/null || true)

if [ -n "$LARGE_DIRS" ]; then
    for dir in $LARGE_DIRS; do
        file_count=$(find "$dir" -type f | wc -l)
        relative_dir=${dir#$SRC_FE/}
        echo "⚠️ **$relative_dir** - $file_count files (potential legacy code)" >>"$OUT"
    done
else
    echo "✅ No obvious legacy directories found" >>"$OUT"
fi

sec "TODO and FIXME Comments"
echo "Code marked for cleanup or removal:" >>"$OUT"
echo "" >>"$OUT"

# Find TODO/FIXME comments that might indicate dead code
grep -r "TODO.*remove\|TODO.*delete\|FIXME.*remove\|FIXME.*delete" "$SRC_FE" --include="*.js" --include="*.css" | head -20 | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    line_num=$(echo "$line" | cut -d: -f2)
    comment=$(echo "$line" | cut -d: -f3-)
    relative_file=${file#$SRC_FE/}
    echo "🔧 **$relative_file:$line_num** - $comment" >>"$OUT"
done || echo "✅ No removal TODOs found" >>"$OUT"

sec "Bundle Size Analysis"
echo "Largest files that might need review:" >>"$OUT"
echo "" >>"$OUT"

# Find largest JS files
find "$SRC_FE" -name "*.js" -type f -exec wc -c {} + | sort -nr | head -10 | while read -r size file; do
    if [ -n "$file" ] && [ "$file" != "total" ]; then
        relative_file=${file#$SRC_FE/}
        size_kb=$((size / 1024))
        echo "📦 **$relative_file** - ${size_kb}KB" >>"$OUT"
    fi
done

sec "Unused HTML Templates"
echo "HTML files that might be obsolete:" >>"$OUT"
echo "" >>"$OUT"

# Find HTML files that aren't the main index
find "$SRC_FE" -name "*.html" -type f | grep -v index.html | while read -r file; do
    relative_file=${file#$SRC_FE/}
    # Check if HTML file is referenced
    ref_count=$(grep -r "$(basename "$file")" "$SRC_FE" --include="*.js" 2>/dev/null | wc -l | tr -d ' ' || echo 0)
    if [ "${ref_count:-0}" -eq 0 ]; then
        echo "❌ **$relative_file** - No references found" >>"$OUT"
    fi
done

sec "Summary and Recommendations"
echo "## Analysis Summary" >>"$OUT"
echo "" >>"$OUT"

# Count total files
total_js=$(find "$SRC_FE" -name "*.js" -type f | wc -l)
total_css=$(find "$SRC_FE" -name "*.css" -type f | wc -l)
total_html=$(find "$SRC_FE" -name "*.html" -type f | wc -l)

echo "📊 **File Inventory:**" >>"$OUT"
echo "- JavaScript files: $total_js" >>"$OUT"
echo "- CSS files: $total_css" >>"$OUT"
echo "- HTML files: $total_html" >>"$OUT"
echo "" >>"$OUT"

echo "🎯 **Recommended Actions:**" >>"$OUT"
echo "1. Review files marked with ❌ for potential removal" >>"$OUT"
echo "2. Consolidate duplicate filenames to avoid confusion" >>"$OUT"
echo "3. Address TODO/FIXME comments related to code removal" >>"$OUT"
echo "4. Consider splitting large files (>50KB) for maintainability" >>"$OUT"
echo "5. Remove or archive unused HTML templates" >>"$OUT"
echo "" >>"$OUT"

echo "---" >>"$OUT"
echo "Generated: $(date)" >>"$OUT"
echo "**Note:** This is a static analysis. Some files may be loaded dynamically or via unconventional methods." >>"$OUT"

echo "Dead code audit complete. Report at: $OUT"