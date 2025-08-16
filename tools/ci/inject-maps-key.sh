#!/usr/bin/env bash
set -euo pipefail
: "${MAPS_BROWSER_KEY:?MAPS_BROWSER_KEY secret is required}"
echo "🔐 Injecting Google Maps key into built assets…"
changed=0
out_dirs=(dist frontend/dist public build)
found=0
for D in "${out_dirs[@]}"; do
  [ -d "$D" ] || continue
  found=1
  mapfile -t files < <(grep -RIl --include='*.html' --include='*.js' '__INJECT_AT_BUILD__' "$D" || true)
  for f in "${files[@]:-}"; do
    sed -i "s|__INJECT_AT_BUILD__|${MAPS_BROWSER_KEY}|g" "$f"
    changed=$((changed+1))
  done
done
[ "$found" -eq 1 ] || echo "ℹ️  No build dir yet (ok if run pre-build)."

# guards
if grep -R "__INJECT_AT_BUILD__" "${out_dirs[@]}" >/dev/null 2>&1; then
  echo "❌ Placeholder key remains in build output."; exit 1; fi
echo "✅ Injection done; files modified: $changed"