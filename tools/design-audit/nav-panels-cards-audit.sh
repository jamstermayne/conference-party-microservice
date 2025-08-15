#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC_FE="$ROOT/frontend/src"
CSS_DIR="$SRC_FE/assets/css"
JS_DIR="$SRC_FE/js"
OUT="$ROOT/reports/NAV_PANELS_CARDS.md"

sec(){ printf "\n## %s\n\n" "$1" >>"$OUT"; }
line(){ printf "%s\n" "$1" >>"$OUT"; }

echo "# Nav/Panels/Cards Audit" >"$OUT"
date >>"$OUT"

sec "Files touching nav/panels/cards"
grep -RIl --include="*.css" -E "(v-sidenav|v-sidebar|v-day-subnav|subnav|vcard|card-actions|cal-menu)" "$CSS_DIR" 2>/dev/null | sed 's/^/- /' >>"$OUT" || true
grep -RIl --include="*.js"  -E "(sidenav|sidebar|subnav|panel|router|vcard|calendar|map)" "$JS_DIR" 2>/dev/null | sed 's/^/- /' >>"$OUT" || true

sec "Inline styles that can override tokens (index.html)"
grep -nE "style=|<style" "$SRC_FE/index.html" 2>/dev/null | sed 's/^/  · /' >>"$OUT" || echo "None" >>"$OUT"

sec "Grid/columns definitions for app shell"
grep -RIn --include="*.css" -E "(^|[^-])grid-template-columns" "$CSS_DIR" | sed 's/^/  · /' >>"$OUT" || echo "None" >>"$OUT"
grep -RIn --include="*.js"  -E "gridTemplateColumns|getComputedStyle\(.+\)\.gridTemplateColumns" "$JS_DIR" | sed 's/^/  · /' >>"$OUT" || echo "None" >>"$OUT"

sec "Specificity & conflicts (.v-sidenav, .v-day-subnav)"
for sel in ".v-sidenav" ".v-day-subnav" ".subnav" ".cal-menu" ".btn-add-to-calendar" ".day-pill" ".vcard"; do
  echo "### Selector: $sel" >>"$OUT"
  grep -RIn --include="*.css" -E "[^a-zA-Z0-9_-]${sel:1}[^a-zA-Z0-9_-]*\s*\{" "$CSS_DIR" 2>/dev/null \
    | sed 's/^/  · /' >>"$OUT" || echo "  · (not found)" >>"$OUT"
done

sec "Use of !important (should be near-zero)"
grep -RIn --include="*.css" -E "!important" "$CSS_DIR" 2>/dev/null | sed 's/^/  · /' >>"$OUT" || echo "None" >>"$OUT"

sec "Design tokens in nav/panels"
grep -RIn --include="*.css" -E "(--s-|--r-|--color-|--brand-)" "$CSS_DIR" | grep -E "sidenav|sidebar|subnav|panel|vcard|cal-menu|day-pill" \
 | sed 's/^/  · /' >>"$OUT" || echo "No token usage found in these areas" >>"$OUT"

sec "Hardcoded px still present (nav/panels/cards only)"
grep -RIn --include="*.css" -E ":\s*[0-9.]+px" "$CSS_DIR" | grep -E "sidenav|sidebar|subnav|panel|vcard|cal-menu|day-pill" \
 | sed 's/^/  · /' >>"$OUT" || echo "None" >>"$OUT"

sec "Anchor vs Button for day pills (accessibility)"
grep -RIn --include="*.html" -E "v-day-subnav" "$SRC_FE" 2>/dev/null | sed 's/^/  · /' >>"$OUT" || true
grep -RIn --include="*.html" -E "<a[^>]+class=[\"'][^\"']*day-pill" "$SRC_FE" 2>/dev/null | sed 's/^/  · anchor: /' >>"$OUT" || echo "No anchors" >>"$OUT"
grep -RIn --include="*.html" -E "<button[^>]+class=[\"'][^\"']*day-pill" "$SRC_FE" 2>/dev/null | sed 's/^/  · button: /' >>"$OUT" || echo "No buttons" >>"$OUT"

sec "Handlers present (no rewiring yet)"
grep -RIn --include="*.js" -E "addEventListener\\([^)]*click|\\.matches\\(.day-pill|\\.matches\\(.btn-(add-to-calendar|cal-)" "$JS_DIR" \
 | sed 's/^/  · /' >>"$OUT" || echo "No click handlers found" >>"$OUT"

sec "firebase.json rewrites"
[ -f "$ROOT/firebase.json" ] && jq '.hosting.rewrites' "$ROOT/firebase.json" 2>/dev/null >>"$OUT" || echo "firebase.json missing" >>"$OUT"

echo -e "\n---\nRaw counts:" >>"$OUT"
echo "CSS files: $(find "$CSS_DIR" -type f -name "*.css" | wc -l | xargs)  | JS files: $(find "$JS_DIR" -type f -name "*.js" | wc -l | xargs)" >>"$OUT"

echo -e "\nOK. Report at: $OUT"