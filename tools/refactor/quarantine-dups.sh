#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC="$ROOT/frontend/src"
GRAVE="$ROOT/frontend/_graveyard/dups-$(date +%Y%m%d-%H%M)"
MAP="$ROOT/reports/03_canonicals.json"

mkdir -p "$GRAVE"
declare -A canon
while read -r k; do
  v=$(jq -r --arg k "$k" '.[$k]' "$MAP")
  canon["$v"]=1
done < <(jq -r 'keys[]' "$MAP")

# Find basenames that repeat and move any non-canonical instances
find "$SRC" -type f -name '*.js' -printf "%f\t%p\n" \
| awk '{print $1}' | sort | uniq -d \
| while read -r base; do
  find "$SRC" -type f -name "$base" | while read -r f; do
    if [ -z "${canon[$f]+x}" ]; then
      dest="$GRAVE/${f#"$SRC/"}"
      mkdir -p "$(dirname "$dest")"
      git mv "$f" "$dest"
      echo "moved: $f -> $dest"
    fi
  done
done