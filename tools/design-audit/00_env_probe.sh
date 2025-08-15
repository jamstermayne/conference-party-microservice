#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_lib.sh"

h1 "Environment Probe"
printf "ROOT: %s\n" "$ROOT"
printf "FE src: %s\n" "$SRC_FE"
printf "Prod base: %s\n" "$BASE_PROD"

if [ -d "$DIST_FE" ]; then
  ok "frontend/dist exists"
  find "$DIST_FE" -maxdepth 1 -type f -printf "%f\t%k KB\n" | sort -rk2 -n | head -n 10
else
  warn "frontend/dist missing (ok if SPA is served from /src)"
fi

# Check for public directory (since this app uses public/ instead of dist/)
if [ -d "$PUBLIC_DIR" ]; then
  ok "public/ directory exists (main serving directory)"
  echo "  Main files:"
  ls -lah "$PUBLIC_DIR"/*.html 2>/dev/null | head -5 | awk '{print "    " $9 " (" $5 ")"}'
  echo "  JS files:"
  find "$PUBLIC_DIR/js" -maxdepth 1 -name "*.js" 2>/dev/null | head -5 | while read -r f; do
    size=$(du -h "$f" | cut -f1)
    echo "    $(basename "$f") ($size)"
  done
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo ""
  git --no-pager log -1 --pretty='Commit: %h %ad  %s' --date=short || true
  echo "Branch: $(git branch --show-current)"
fi

echo ""
echo "Testing production endpoints..."
if curl -sS "$BASE_PROD" -o /tmp/_live_index.html 2>/dev/null; then
  ok "Fetched $BASE_PROD"
  echo "  Index size: $(du -h /tmp/_live_index.html | cut -f1)"
  echo "  Assets found:"
  grep -Eo '(src|href)="[^"]+\.(js|css)[^"]*"' /tmp/_live_index.html | head -n 5 | sed 's/^/    /'
else
  err "Cannot fetch $BASE_PROD"
fi

# Test API health
if curl -sS "$API_PROD/health" -o /tmp/_api_health.json 2>/dev/null; then
  ok "API health check passed"
  echo "  Response: $(cat /tmp/_api_health.json | head -c 100)"
else
  err "API health check failed"
fi

# Check for design token files
echo ""
echo "Design Token Files:"
if [ -f "$CSS_DIR/spacing-tokens.css" ]; then
  ok "spacing-tokens.css exists ($(wc -l < "$CSS_DIR/spacing-tokens.css") lines)"
else
  err "spacing-tokens.css missing"
fi

if [ -f "$CSS_DIR/color-tokens.css" ]; then
  ok "color-tokens.css exists ($(wc -l < "$CSS_DIR/color-tokens.css") lines)"
else
  err "color-tokens.css missing"
fi

# Summary
echo ""
h1 "Environment Summary"
echo "📁 Project Structure:"
echo "  - Frontend source: $SRC_FE"
echo "  - Public assets: $PUBLIC_DIR"
echo "  - CSS files: $(find "$CSS_DIR" -name "*.css" 2>/dev/null | wc -l)"
echo "  - JS files: $(find "$JS_DIR" -name "*.js" 2>/dev/null | wc -l)"
echo ""
echo "🌐 Production Status:"
if [ -f /tmp/_live_index.html ]; then
  echo "  - Site: ✅ Online"
else
  echo "  - Site: ❌ Offline"
fi
if [ -f /tmp/_api_health.json ]; then
  echo "  - API: ✅ Healthy"
else
  echo "  - API: ❌ Unhealthy"
fi