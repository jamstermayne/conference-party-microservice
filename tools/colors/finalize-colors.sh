#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
DIR="$ROOT/frontend/src"
REPORT="/tmp/_hex_left.tsv"

echo "🔎 Scanning for remaining hex colors…"
# Use grep instead of rg for better compatibility
grep -rn --include="*.css" --include="*.html" --include="*.js" \
     --exclude-dir="backup" --exclude-dir="tokens" \
     -E '#[0-9a-fA-F]{3,8}\b' "$DIR" 2>/dev/null | sort > "$REPORT" || true

LEFT=$(wc -l < "$REPORT" | xargs)
echo "Remaining hex instances: $LEFT"
[ "$LEFT" = "0" ] && { echo "✅ No hex left"; exit 0; }

echo -e "file\tline\thex" > /tmp/_hex_group.tsv
awk -F: '{print $1"\t"$2"\t"$3}' "$REPORT" >> /tmp/_hex_group.tsv

echo "🗂 Top colors by frequency:"
grep -oE '#[0-9a-fA-F]{3,8}\b' "$REPORT" | tr '[:upper:]' '[:lower:]' | sort | uniq -c | sort -nr | head -30

# Extended mappings based on our token system
declare -A MAP=(
  # White/Black
  ["#ffffff"]="var(--white)"
  ["#fff"]="var(--white)"
  ["#FFFFFF"]="var(--white)"
  ["#FFF"]="var(--white)"
  ["#000000"]="var(--black)"
  ["#000"]="var(--black)"
  
  # Brand colors
  ["#6b7bff"]="var(--brand-500)"
  ["#8a6bff"]="var(--brand-400)"
  ["#6b8cff"]="var(--brand-500)"
  ["#5b7bff"]="var(--brand-600)"
  
  # Neutrals/Backgrounds
  ["#1a1d21"]="var(--neutral-100)"
  ["#1A1D21"]="var(--neutral-100)"
  ["#15151a"]="var(--neutral-75)"
  ["#1a1a1f"]="var(--neutral-100)"
  ["#0f0f12"]="var(--neutral-0)"
  ["#0f1116"]="var(--neutral-0)"
  ["#12141a"]="var(--neutral-50)"
  ["#15171e"]="var(--neutral-75)"
  ["#1f232a"]="var(--neutral-150)"
  ["#232831"]="var(--neutral-200)"
  
  # Borders
  ["#2a2a35"]="var(--border-primary)"
  ["#2a2f3a"]="var(--neutral-300)"
  ["#2a2e36"]="var(--neutral-300)"
  ["#2b2f45"]="var(--neutral-300)"
  
  # Text colors
  ["#a5a7ad"]="var(--text-secondary)"
  ["#9aa7bf"]="var(--text-muted)"
  ["#c8cfdb"]="var(--neutral-900)"
  ["#8b92a6"]="var(--neutral-700)"
  ["#748199"]="var(--neutral-700)"
  
  # Semantic colors
  ["#22c55e"]="var(--success)"
  ["#ef4444"]="var(--error)"
  ["#f44336"]="var(--error)"
  ["#fde047"]="var(--warning-weak)"
  ["#f59e0b"]="var(--warning)"
  ["#3b82f6"]="var(--info)"
  ["#38bdf8"]="var(--info)"
  ["#10b981"]="var(--success)"
  
  # Additional colors found
  ["#333"]="var(--neutral-300)"
  ["#111827"]="var(--neutral-50)"
  ["#1f2937"]="var(--neutral-150)"
  ["#ffd700"]="var(--warning)"
  ["#dc2626"]="var(--error)"
)

echo "✍️  Replacing known mappings…"
for HEX in "${!MAP[@]}"; do
  TOKEN="${MAP[$HEX]}"
  echo "  Mapping $HEX → $TOKEN"
  
  # Find files containing the hex color
  FILES=$(grep -rl --include="*.css" --include="*.html" --include="*.js" \
               --exclude-dir="backup" --exclude-dir="tokens" \
               -F "$HEX" "$DIR" 2>/dev/null || true)
  
  if [ -n "$FILES" ]; then
    echo "$FILES" | while read -r FILE; do
      # Use sed with case-insensitive flag for replacement
      sed -i "s/${HEX}/${TOKEN}/gi" "$FILE" 2>/dev/null || true
    done
  fi
done

echo ""
echo "📊 Summary after replacements:"
echo "================================"

# Re-scan for remaining hex colors
grep -rn --include="*.css" --include="*.html" --include="*.js" \
     --exclude-dir="backup" --exclude-dir="tokens" \
     -E '#[0-9a-fA-F]{3,8}\b' "$DIR" 2>/dev/null > "$REPORT" || true

NEW_LEFT=$(wc -l < "$REPORT" | xargs)
echo "Hex colors before: $LEFT"
echo "Hex colors after: $NEW_LEFT"
echo "Replaced: $((LEFT - NEW_LEFT)) instances"

if [ "$NEW_LEFT" -gt "0" ]; then
  echo ""
  echo "🔍 Remaining unique hex colors:"
  grep -oE '#[0-9a-fA-F]{3,8}\b' "$REPORT" | tr '[:upper:]' '[:lower:]' | sort | uniq -c | sort -nr | head -20
  
  echo ""
  echo "📍 Sample locations (first 10):"
  head -10 "$REPORT" | while IFS=: read -r FILE LINE CONTENT; do
    echo "  $(basename "$FILE"):$LINE - $(echo "$CONTENT" | grep -oE '#[0-9a-fA-F]{3,8}\b' | head -1)"
  done
else
  echo "✅ All hex colors have been replaced with tokens!"
fi