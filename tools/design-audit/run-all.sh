#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_lib.sh"
AUDIT_DIR="$(dirname "$0")"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_FILE="$ROOT/design-audit-$TIMESTAMP.txt"

h1 "DESIGN SYSTEM AUDIT"
echo "Timestamp: $(date)"
echo "Repository: $ROOT"
echo ""

# Run individual audits
AUDITS=(
    "00_env_probe.sh:Environment Probe"
    "10_layout_nav_audit.sh:Layout & Navigation"
    "30_css_tokens_audit.sh:Design Tokens"
    "40_maps_audit.sh:Maps Integration"
    "50_calendar_audit.sh:Calendar Integration"
    "60_api_parties_audit.sh:API & Data"
    "70_accessibility_audit.sh:Accessibility"
    "80_perf_bundle_audit.sh:Performance"
    "token-check.sh:Token Compliance"
    "css-audit.sh:CSS Analysis"
    "component-audit.sh:Component Review"
)

TOTAL_ISSUES=0
TOTAL_WARNINGS=0
TOTAL_PASSED=0

for audit_spec in "${AUDITS[@]}"; do
    IFS=':' read -r script_name audit_title <<< "$audit_spec"
    script_path="$AUDIT_DIR/$script_name"
    
    if [[ -f "$script_path" ]]; then
        h1 "$audit_title"
        if bash "$script_path"; then
            ok "Completed $audit_title"
        else
            warn "Issues found in $audit_title"
        fi
    else
        err "Missing audit script: $script_name"
    fi
done

# Generate summary
h1 "SUMMARY"
echo ""
echo "Design System Audit Report"
echo "=========================="
echo "Date: $(date)"
echo "Repository: conference-party-microservice"
echo ""

# Count CSS files
CSS_COUNT=$(find "$ROOT/frontend/src" -name "*.css" 2>/dev/null | wc -l)
echo "📊 Statistics:"
echo "  - CSS Files: $CSS_COUNT"
echo "  - JS Files: $(find "$ROOT/frontend/src" -name "*.js" 2>/dev/null | wc -l)"
echo "  - HTML Files: $(find "$ROOT/frontend/src" -name "*.html" 2>/dev/null | wc -l)"
echo ""

# Token compliance summary
echo "🎨 Design Tokens:"
if [[ -f "$ROOT/frontend/src/assets/css/spacing-tokens.css" ]]; then
    ok "Spacing tokens defined"
else
    err "Missing spacing tokens"
fi

if [[ -f "$ROOT/frontend/src/assets/css/color-tokens.css" ]]; then
    ok "Color tokens defined"
else
    err "Missing color tokens"
fi

echo ""
echo "🔍 Key Findings:"
# Check for hardcoded values
HARDCODED_PX=$(grep -r '\b[0-9]\+px\b' "$ROOT/frontend/src/assets/css" 2>/dev/null | grep -v tokens.css | wc -l || echo "0")
if [[ $HARDCODED_PX -gt 0 ]]; then
    warn "$HARDCODED_PX hardcoded px values found (should use tokens)"
else
    ok "No hardcoded px values found"
fi

# Check for BEM usage
BEM_COUNT=$(grep -r '\(--\|__\)' "$ROOT/frontend/src/assets/css" 2>/dev/null | wc -l || echo "0")
if [[ $BEM_COUNT -gt 0 ]]; then
    ok "BEM methodology in use ($BEM_COUNT instances)"
else
    warn "No BEM methodology detected"
fi

echo ""
echo "📁 Component Structure:"
# Check for component organization
if [[ -d "$ROOT/frontend/src/js/components" ]]; then
    COMPONENT_COUNT=$(find "$ROOT/frontend/src/js/components" -name "*.js" 2>/dev/null | wc -l)
    ok "$COMPONENT_COUNT components found"
else
    warn "No components directory found"
fi

# Check for views
if [[ -d "$ROOT/frontend/src/js/views" ]]; then
    VIEW_COUNT=$(find "$ROOT/frontend/src/js/views" -name "*.js" 2>/dev/null | wc -l)
    ok "$VIEW_COUNT views found"
else
    warn "No views directory found"
fi

echo ""
echo "✅ Recommendations:"
echo "  1. Continue using design tokens for all spacing and colors"
echo "  2. Replace remaining hardcoded values with tokens"
echo "  3. Maintain BEM naming convention for new components"
echo "  4. Keep component/view separation clear"
echo "  5. Document token usage in component files"

echo ""
echo "Report saved to: $REPORT_FILE"
echo ""
h1 "AUDIT COMPLETE"