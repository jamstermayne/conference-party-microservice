#!/usr/bin/env bash
set -euo pipefail

red(){ printf "\033[31m%s\033[0m\n" "$*"; }
green(){ printf "\033[32m%s\033[0m\n" "$*"; }

# A) index.html must have exactly one module entry for router
if ! grep -qE '<script type="module" src="/js/router\.js\?v=b0[0-9]+"' frontend/src/index.html; then
  red "✖ Missing or unversioned router module tag in index.html"; exit 1
fi

# B) Router must mount #main (not #app)
if ! grep -q "getElementById(\"main\")" frontend/src/js/router.js; then
  red "✖ Router must mount #main"; exit 1
fi

# C) No CSS imports in JS
if grep -R "from '.*\.css" frontend/src/js --include="*.js" -n | grep -v '^$'; then
  red "✖ CSS imported from JS (MIME error risk). Move CSS to <link> in index.html."; exit 1
fi

# D) All JS imports must be versioned
UNV=$(grep -R "from '.*\.js'" frontend/src/js --include="*.js" -n | grep -v '\?v=b0' || true)
if [ -n "$UNV" ]; then
  red "✖ Unversioned JS imports found:\n$UNV"; exit 1
fi

green "✓ Preflight OK"
