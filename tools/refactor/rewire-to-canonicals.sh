#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC="$ROOT/frontend/src"
MAP="$ROOT/reports/03_canonicals.json"

req() { command -v jq >/dev/null || { echo "jq required"; exit 1; }; }
req

for base in $(jq -r 'keys[]' "$MAP"); do
  canon=$(jq -r --arg k "$base" '.[$k]' "$MAP")
  # escape slashes for sed
  canon_esc=$(printf "%s" "$canon" | sed 's~/~\\/~g')

  # Replace in HTML
  grep -RIl --include="*.html" "$base" "$SRC" | while read -r f; do
    sed -i -E "s~(src=\")([^\"]*\/)?$base(\")~\1${canon_esc}\3~g" "$f"
  done

  # Replace in JS import specifiers
  grep -RIl --include="*.js" "$base" "$SRC" | while read -r f; do
    sed -i -E "s~(from\\s+[\"'])([^\"']*\\/)?$base([\"'])~\\1${canon_esc}\\3~g" "$f"
    sed -i -E "s~(import\\s+[\"'])([^\"']*\\/)?$base([\"'])~\\1${canon_esc}\\3~g" "$f"
  done
done