#!/usr/bin/env bash
# === Click & API Wiring Audit (READ-ONLY) ===
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC_FE="$ROOT/frontend/src"
SRC_JS="$SRC_FE/js"
BASE="https://conference-party-app.web.app"

section(){ printf "\n\033[1;36m=== %s ===\033[0m\n" "$*"; }
ok(){ printf "✅ %s\n" "$*"; }
warn(){ printf "⚠️  %s\n" "$*"; }
err(){ printf "❌ %s\n" "$*"; }
info(){ printf "• %s\n" "$*"; }

SEL=(
  ".btn-add-to-calendar"
  ".btn-cal-google"
  ".btn-cal-outlook"
  ".btn-cal-m2m"
  ".btn-pin"
  ".day-pill"
)

DELEG_PAT='(addEventListener\(\s*[\"\x27]click|\bonclick\s*=)'
MATCH_PAT='\.matches\(\s*[\"\x27]([^\"\x27]+)[\"\x27]\s*\)|querySelector(All)?\(\s*[\"\x27]([^\"\x27]+)[\"\x27]\s*\)'

section "1) Files in scope"
[ -d "$SRC_JS" ] && ok "JS at $SRC_JS" || err "JS folder missing: $SRC_JS"
info "Router:";          grep -RIn --include="*.js" "ROUTES|router" "$SRC_JS" | head -8 || true
info "Calendar modules:";grep -RIn --include="*.js" -E "gcal|calendar|googleCalendar" "$SRC_JS" | head -12 || true
info "Map modules:";     grep -RIn --include="*.js" -E "map\.js|maps|AdvancedMarker" "$SRC_JS" | head -12 || true

section "2) Selector ↔ Handler mapping (static scan)"
for s in "${SEL[@]}"; do
  echo
  printf "▶ %s\n" "$s"
  # Where selector appears (HTML/JS)
  HITS=$(grep -RIn --include="*.{html,js}" -E "$(printf "%s" "$s" | sed 's/\./\\./g')" "$SRC_FE" 2>/dev/null || true)
  [ -n "$HITS" ] && echo "$HITS" | sed 's/^/  · /' | head -12 || warn "No occurrences found in source"

  # Direct addEventListener on element
  DIRECT=$(grep -RIn --include="*.js" -E "${s//./\\.}[^;]*${DELEG_PAT}" "$SRC_JS" 2>/dev/null || true)
  [ -n "$DIRECT" ] && ok "Direct listener(s):" && echo "$DIRECT" | sed 's/^/    - /' | head -8

  # Delegated handlers checking .matches(selector)
  DELEG=$(grep -RIn --include="*.js" -E "${DELEG_PAT}.*" "$SRC_JS" 2>/dev/null \
    | grep -E "${s//./\\.}|matches\(|closest\(" || true)
  [ -n "$DELEG" ] && ok "Delegated handler context:" && echo "$DELEG" | sed 's/^/    - /' | head -12

  # Function names typically used
  FUN=$(grep -RIn --include="*.js" -E "addToCalendar|startOAuth|startOAuthInPopup|disconnect|openMap|openPin|gotoDay|setDay|renderParties|renderCalendar" "$SRC_JS" 2>/dev/null || true)
  [ -n "$FUN" ] && info "Related functions nearby (sample):" && echo "$FUN" | sed 's/^/    - /' | head -10
done

section "3) Endpoint usage (relative vs absolute)"
ABS=$(grep -RIn --include="*.js" -E "https?://[^\"']+/(api|googleapis|gsi|run\.app)" "$SRC_JS" 2>/dev/null || true)
REL=$(grep -RIn --include="*.js" -E "[^:]/api/[^\"']+" "$SRC_JS" 2>/dev/null || true)

[ -n "$ABS" ] && warn "Absolute endpoints in frontend (review):" && echo "$ABS" | sed 's/^/  · /' | head -20 || ok "No absolute API endpoints"
[ -n "$REL" ] && ok "Relative /api calls found:" && echo "$REL" | sed 's/^/  · /' | head -20 || warn "No relative /api usage found"

section "4) Hosting rewrites"
if [ -f "$ROOT/firebase.json" ]; then
  RW=$(grep -nE '"rewrites"|/api/\*\*|function' "$ROOT/firebase.json" || true)
  echo "$RW" | sed 's/^/  · /'
  echo "$RW" | grep -q '/api/\*\*' && ok "Rewrite /api/** → Functions present" || err "Missing /api/** rewrite"
else
  err "firebase.json not found"
fi

section "5) Live CSP header snapshot"
# HEAD only, read-only
curl -sSI "$BASE" | tr -d '\r' | awk 'BEGIN{IGNORECASE=1}/^content-security-policy:/ {print;exit}' || warn "No CSP header seen (may be meta tag)."

section "6) Live endpoint smoke check (no auth)"
printf "GET %s/api/health -> " "$BASE";  curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/health" || true
printf "GET %s/api/parties?conference=gamescom2025 -> " "$BASE"; curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/parties?conference=gamescom2025" || true
printf "POST %s/api/googleCalendar/create -> " "$BASE"; curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/googleCalendar/create" || true

section "7) Summary (actionable, still NO CHANGES)"
echo "• For each selector above, confirm at least one DIRECT or DELEGATED click handler exists."
echo "• Prefer RELATIVE /api paths. Flag any absolute run.app/googleapis calls used from UI."
echo "• Ensure firebase.json has /api/** rewrite to the Functions entry."
echo "• Compare CSP connect-src with the actual hosts seen in (3)."