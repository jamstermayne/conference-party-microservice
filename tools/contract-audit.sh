#!/usr/bin/env bash
set -euo pipefail

echo "== LOCAL CONTRACT AUDIT =="

fail=0

# 1) Shell & router exist and use the single mount
for f in frontend/src/js/shell.js frontend/src/js/router.js frontend/src/index.html; do
  [ -f "$f" ] || { echo "❌ missing $f"; fail=1; }
done

grep -q 'id="main"' frontend/src/index.html || { echo "❌ index.html missing #main mount"; fail=1; }
grep -q 'type="module"' frontend/src/index.html || { echo "❌ index.html missing module script tag(s)"; fail=1; }

# 2) View exports: each view must export renderX(mount)
views=(events-controller.js contacts-panel.js calendar-view.js invite-panel.js me-panel.js settings-panel.js hotspots.js map-controller.js)
for v in "${views[@]}"; do
  p="frontend/src/js/$v"
  [ -f "$p" ] || { echo "❌ missing $p"; fail=1; continue; }
  base="${v%%.*}"
  # heuristic: require an exported function renderSomething(
  grep -Eq 'export (async )?function render[A-Za-z]+' "$p" || { echo "❌ $v does not export a render* function"; fail=1; }
done

# 3) Versioned imports everywhere (?v=…)
unver=$(grep -RIn --include="*.js" "import .*\.js['\"]" frontend/src/js | grep -v '\?v=' || true)
if [ -n "$unver" ]; then
  echo "❌ Unversioned imports found:"
  echo "$unver" | sed -n '1,50p'
  [ "$(echo "$unver" | wc -l)" -le 50 ] || echo "… (truncated)"
  fail=1
else
  echo "✅ All JS imports are versioned (?v=…)"
fi

# 4) Service worker MUST NOT cache HTML/JS
if [ -f frontend/src/sw.js ]; then
  if grep -Eq 'caches\.open|cache\.put' frontend/src/sw.js; then
    if grep -Eq "request\.destination\s*===\s*'document'|text/html" frontend/src/sw.js; then
      echo "❌ sw.js may cache HTML (document)"; fail=1
    fi
    if grep -Eq "\.js'|application/javascript" frontend/src/sw.js; then
      echo "❌ sw.js may cache JS"; fail=1
    fi
  fi
fi

# 5) Router must mount into #main and import views with ?v=
grep -q 'document.getElementById('\''main'\'')' frontend/src/js/router.js || { echo "❌ router does not mount into #main"; fail=1; }
grep -q '\?v=' frontend/src/js/router.js || { echo "❌ router has unversioned dynamic imports"; fail=1; }

if [ $fail -eq 0 ]; then
  echo "🎯 LOCAL CONTRACT: PASS"
  exit 0
else
  echo "🚫 LOCAL CONTRACT: FAIL"
  exit 1
fi
