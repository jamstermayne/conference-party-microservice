#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC="$ROOT/frontend/src"
MAP="$ROOT/reports/03_canonicals.json"

# Track changes
CHANGES=0

echo "=== Rewiring imports to canonical files ==="

# For each of the big five
for base in calendar.js events.js invites.js app.js api.js; do
  echo "Processing $base..."
  
  # Get canonical path from JSON
  canon_full=$(jq -r --arg k "$base" '.[$k]' "$MAP")
  # Make it relative to frontend/src
  canon_rel=${canon_full#$SRC/}
  canon_rel=${canon_rel#/}
  
  # Find all duplicates (not the canonical one)
  find "$SRC" -name "$base" -type f | while read -r dup; do
    if [ "$dup" != "$canon_full" ]; then
      echo "  Found duplicate: $dup"
      
      # Find files that import this duplicate
      dup_rel=${dup#$SRC/}
      dup_rel=${dup_rel#/}
      
      # Search for imports of this specific duplicate path
      grep -r "from.*['\"].*${dup_rel}['\"]" "$SRC" --include="*.js" 2>/dev/null | cut -d: -f1 | sort -u | while read -r file; do
        echo "    Updating import in: ${file#$SRC/}"
        # Replace the import path
        sed -i "s|${dup_rel}|${canon_rel}|g" "$file"
        ((CHANGES++))
      done
      
      # Also check for script tags in HTML
      grep -r "src=.*['\"].*${dup_rel}['\"]" "$SRC" --include="*.html" 2>/dev/null | cut -d: -f1 | sort -u | while read -r file; do
        echo "    Updating script tag in: ${file#$SRC/}"
        sed -i "s|${dup_rel}|${canon_rel}|g" "$file"
        ((CHANGES++))
      done
    fi
  done
done

echo "=== Rewiring complete ==="
echo "Total changes made: check git diff"