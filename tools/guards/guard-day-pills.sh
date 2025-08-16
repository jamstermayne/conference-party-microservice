#!/usr/bin/env bash
set -euo pipefail
# Fail if any anchor uses the day-pill class anywhere in active source.
PATTERN='<a[^>]*class=[^"]*\bday-pill\b'
if grep -RIn --include="*.html" --include="*.js" --include="*.mjs" --include="*.ts" \
  -E "$PATTERN" frontend/src 2>/dev/null; then
  echo "❌ Found .day-pill on an <a>. Day pills must be <button> only."
  exit 1
fi
echo "✅ No anchors with .day-pill found (buttons-only confirmed)."