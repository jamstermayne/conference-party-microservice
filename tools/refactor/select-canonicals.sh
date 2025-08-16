#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC="$ROOT/frontend/src"

targets=("calendar.js" "events.js" "invites.js" "app.js" "api.js")

echo "{"
first=1
for base in "${targets[@]}"; do
  mapfile -t candidates < <(find "$SRC" -type f -name "$base" | sort)
  [ ${#candidates[@]} -eq 0 ] && continue
  # pick by size (desc) then prefer path with /js/
  pick=$(printf "%s\n" "${candidates[@]}" | xargs -I{} bash -lc 'stat -c "%s {}" "{}"' | sort -nr | awk '{print $2}' \
    | awk 'BEGIN{best=""} /\/js\// && best==""{best=$0} END{if(best!="") print best; else print FILENAME}' FILENAME="$(printf "%s\n" "${candidates[@]}" | head -n1 )")
  # JSON map: base -> canonical path
  if [ $first -eq 0 ]; then echo ","; fi
  first=0
  printf "  \"%s\": \"%s\"" "$base" "$pick"
done
echo
echo "}"