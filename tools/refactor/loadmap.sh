#!/usr/bin/env bash
set -euo pipefail
BASE="https://conference-party-app.web.app"
curl -sS "$BASE" -o /tmp/_live_index.html
echo "=== HTML script tags ==="
grep -Eo '<script[^>]+src="[^"]+"' /tmp/_live_index.html | sed -E 's/.*src="([^"]+)".*/\1/' | sort -u
echo
echo "=== HTML CSS links ==="
grep -Eo '<link[^>]+href="[^"]+\.css[^"]*"' /tmp/_live_index.html | sed -E 's/.*href="([^"]+)".*/\1/' | sort -u