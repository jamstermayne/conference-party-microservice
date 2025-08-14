#!/bin/bash
# === Smart "Add to Calendar" Audit (read-only) ===
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC="$ROOT/frontend/src"
FUN="$ROOT/functions/src"

section(){ printf "\n--- %s ---\n" "$*"; }
have(){ [ -f "$1" ] && echo "✅ $1" || echo "❌ MISSING: $1"; }

section "Endpoints (live)"
BASE="https://conference-party-app.web.app"
printf "GET  %s -> " "$BASE/api/googleCalendar/status"; curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/googleCalendar/status" || true
printf "POST %s -> " "$BASE/api/googleCalendar/create"; curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/googleCalendar/create" || true

section "Functions router presence"
grep -RIn "googleCalendar" "$FUN" 2>/dev/null | head -5 || echo "❌ Could not find googleCalendar router references"

section "Callback returns HTML that can postMessage + close?"
grep -RIn "postMessage" "$FUN" 2>/dev/null | head -3 || echo "⚠️ No postMessage found (ok if we poll status, but popup UX is better)"

section "Frontend service/hooks files"
have "$SRC/js/services/gcal.js"
have "$SRC/js/gcal-hooks.js" || true
have "$SRC/js/services/ics.js" || echo "⚠️ No ICS helper (needed for Outlook button)"
grep -RIn "addToCalendar" "$SRC" 2>/dev/null | head -3 || echo "ℹ️ No central addToCalendar orchestrator found (we will add)"

section "CSS/modal capability for provider chooser"
grep -RIn "modal" "$SRC/assets/css" 2>/dev/null | head -3 || echo "ℹ️ No modal styles detected (we can add a minimal one)"

section "CSP (live) sanity for redirects"
curl -sSI "$BASE" 2>/dev/null | tr -d '\r' | awk 'BEGIN{IGNORECASE=1}/^content-security-policy:/ {print "CSP:",$0}'
echo "Note: We do NOT need script-src accounts.google.com because we use backend OAuth (redirect)."

section "Summary"
echo "• status endpoint must be 200 (even if connected:false)."
echo "• /create should be 200 when authed, 401/403 when not."
echo "• We will add: provider chooser modal, ICS helper, smart click handler, popup postMessage callback."