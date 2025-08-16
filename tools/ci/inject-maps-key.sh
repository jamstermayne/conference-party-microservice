#!/usr/bin/env bash
set -euo pipefail
: "${MAPS_BROWSER_KEY:?MAPS_BROWSER_KEY secret is required}"

echo "🔐 Injecting Google Maps key into built assets (never into source)…"

changed=0
scan_dirs=(dist frontend/dist public build)
found_any=0

for DIR in "${scan_dirs[@]}"; do
  [ -d "$DIR" ] || continue
  found_any=1
  mapfile -t files < <(grep -RIl --include='*.html' --include='*.js' '__INJECT_AT_BUILD__' "$DIR" || true)
  if [ ${#files[@]} -gt 0 ]; then
    for f in "${files[@]}"; do
      sed -i "s|__INJECT_AT_BUILD__|${MAPS_BROWSER_KEY}|g" "$f"
      changed=$((changed+1))
    done
  fi
done

if [ "$found_any" -eq 0 ]; then
  echo "⚠️  No build output directories found. Ensure your build outputs to one of: ${scan_dirs[*]}"
  exit 1
fi

# Hard fail if any placeholder remains in built assets
if grep -R "__INJECT_AT_BUILD__" dist frontend/dist public build >/dev/null 2>&1; then
  echo "❌ Placeholder key still present in build output. Failing."
  exit 1
fi

echo "✅ Injection complete; files modified: $changed"