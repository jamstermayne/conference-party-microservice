#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC_FE="$ROOT/frontend/src"
TMP=$(mktemp -d)

echo "=== Basename collisions (JS) ==="
find "$SRC_FE" -type f -name '*.js' -printf "%f\t%p\n" | sort | awk '{print $1}' | uniq -d | while read -r base; do
  echo "— $base"
  grep -RIl --include="$base" . "$SRC_FE" | sed 's/^/   · /'
done

echo
echo "=== Normalized content duplicates (JS+CSS) ==="
while read -r f; do
  norm=$(sed -E 's://.*$::; s:/\*([^*]|\*[^/])*\*/::g' "$f" | tr -d '[:space:]' )
  hash=$(printf "%s" "$norm" | md5sum | awk '{print $1}')
  printf "%s  %s\n" "$hash" "$f"
done < <(find "$SRC_FE" -type f \( -name '*.js' -o -name '*.css' \)) | sort > "$TMP/hashes.txt"

awk '{print $1}' "$TMP/hashes.txt" | sort | uniq -d | while read -r h; do
  echo "— hash $h"
  grep "^$h " "$TMP/hashes.txt" | awk '{print "   · " $2}'
done