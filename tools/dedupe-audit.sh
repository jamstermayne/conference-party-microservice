#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
FN="$ROOT/functions/src"
FE="$ROOT/frontend/src"

section(){ printf "\n--- %s ---\n" "$*"; }
pass(){ printf "✅ %s\n" "$*"; }
fail(){ printf "❌ %s\n" "$*"; }
warn(){ printf "⚠️  %s\n" "$*"; }

section "1) Duplicate HTTP endpoints (verb + path)"
EP=$(grep -RInE "(\.get|\.post|\.put|\.delete)\s*\(\s*['\"][^'\"]+" "$FN" 2>/dev/null \
  | sed -E "s/^(.+):[0-9]+:.*(get|post|put|delete)\s*\(\s*['\"]([^'\"]+)['\"].*/\2 \3 \1/" || true)
echo "$EP"
DUP=$(echo "$EP" | awk '{print $1,$2}' | sort | uniq -d || true)
[ -z "$DUP" ] && pass "No duplicate endpoints" || { fail "Duplicate endpoints:"; echo "$EP" | awk '{print $1,$2,"->",$3}' | grep -F -f <(echo "$DUP"); }

section "2) Duplicate exported function names (backend)"
EX=$(grep -RInE "export\s+async?\s*function\s+[A-Za-z0-9_]+" "$FN" 2>/dev/null \
  | sed -E "s/^(.+):[0-9]+:.*export\s+async?\s*function\s+([A-Za-z0-9_]+).*/\2 \1/" || true)
echo "$EX"
DF=$(echo "$EX" | awk '{print $1}' | sort | uniq -d || true)
[ -z "$DF" ] && pass "No duplicate exports" || { fail "Duplicate export names:"; echo "$EX" | grep -E "^(($(echo "$DF" | tr '\n' '|' | sed 's/|$//'))) "; }

section "3) Frontend routes duplicated?"
RO="$FE/js/router.js"
if [ -f "$RO" ]; then
  RP=$(grep -nE "path\s*:\s*['\"][^'\"]+" "$RO" | sed -E "s/^.+path\s*:\s*['\"]([^'\"]+).*/\1/" || true)
  echo "$RP" | nl
  DR=$(echo "$RP" | sort | uniq -d || true)
  [ -z "$DR" ] && pass "No duplicate frontend paths" || fail "Duplicate frontend paths: $(echo "$DR" | xargs)"
else
  warn "router.js not found"
fi

section "4) Identical/near-identical files (normalized hash)"
TMP=$(mktemp -d)
find "$FN" "$FE" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.css" \) 2>/dev/null | while read -r f; do
  sed -E "s/\/\/.*$//; s:/\*([^*]|\*[^/])*\*/::g" "$f" | tr -d '[:space:]' | md5sum | awk -v F="$f" '{print $1, F}'
done | sort > "$TMP/h.txt" || true
DH=$(awk '{print $1}' "$TMP/h.txt" | sort | uniq -d || true)
if [ -z "$DH" ]; then pass "No identical-normalized files"
else
  fail "Possible duplicates:"; grep -F -f <(echo "$DH") "$TMP/h.txt"
fi

section "5) SUMMARY"
echo "Endpoints dup     : $( [ -z "$DUP" ] && echo PASS || echo FAIL )"
echo "Exports dup       : $( [ -z "$DF" ] && echo PASS || echo FAIL )"
echo "Routes dup        : $( [ -z "${DR:-}" ] && echo PASS || echo FAIL )"
echo "Identical files   : $( [ -z "$DH" ] && echo PASS || echo FAIL )"