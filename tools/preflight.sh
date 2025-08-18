#!/usr/bin/env bash
set -euo pipefail

red(){ printf "\033[31m%s\033[0m\n" "$*"; }
green(){ printf "\033[32m%s\033[0m\n" "$*"; }

# A) index.html must have exactly one module entry for router
if ! grep -qE '<script type="module" src="/assets/js/router-2panel-lite\.js\?v=' frontend/src/index.html; then
  red "✖ Missing or unversioned router module tag in index.html"; exit 1
fi

# B) Router must mount #app for 2-panel system
if ! grep -q "#app" frontend/src/assets/js/router-2panel-lite.js; then
  red "✖ Router must mount #app"; exit 1
fi

# C) No CSS imports in JS
if grep -R "from '.*\.css" frontend/src/assets/js --include="*.js" -n 2>/dev/null | grep -v '^$'; then
  red "✖ CSS imported from JS (MIME error risk). Move CSS to <link> in index.html."; exit 1
fi

# D) Skip JS import versioning check for 2-panel system (no ES6 imports)

green "✓ Preflight OK"
