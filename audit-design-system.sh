#!/bin/bash
# === Design System Audit for Targeted Changes ===
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC="$ROOT/frontend/src"
PUB="$ROOT/public"

section(){ printf "\n\033[1;36m=== %s ===\033[0m\n" "$*"; }
subsection(){ printf "\n\033[1;33m--- %s ---\033[0m\n" "$*"; }

section "COLOR PALETTE USAGE"
subsection "Primary Colors (Purple/Violet)"
grep -Rh "#6e5ef6\|#5d4dd8\|#4f46e5\|#6366f1" "$SRC" "$PUB" 2>/dev/null | sort -u | head -10 || echo "None found"

subsection "Background Colors (Dark)"
grep -Rh "#0a0c10\|#12141a\|#1c2030\|#1f2937" "$SRC" "$PUB" 2>/dev/null | sort -u | head -10 || echo "None found"

subsection "Border Colors"
grep -Rh "#293042\|#2b2f3c\|#374151\|border:" "$SRC" "$PUB" 2>/dev/null | grep -E "border|#[0-9a-f]{6}" | sort -u | head -10

section "COMPONENT CLASSES"
subsection "Buttons"
grep -Rh "class=\".*btn.*\"" "$SRC" "$PUB" 2>/dev/null | grep -oE 'btn[^"]*' | sort -u | head -15

subsection "Cards/Modals"
grep -Rh "class=\".*\(card\|modal\).*\"" "$SRC" "$PUB" 2>/dev/null | grep -oE '(card|modal)[^"]*' | sort -u | head -15

subsection "Form Elements"
grep -Rh "class=\".*\(input\|select\|form\).*\"" "$SRC" "$PUB" 2>/dev/null | grep -oE '(input|select|form)[^"]*' | sort -u | head -10

section "TYPOGRAPHY"
subsection "Font Families"
grep -Rh "font-family:" "$SRC" "$PUB" 2>/dev/null | sort -u | head -5

subsection "Font Sizes"
grep -Rh "font-size:" "$SRC" "$PUB" 2>/dev/null | grep -oE "font-size:\s*[^;]+" | sort -u | head -10

subsection "Font Weights"
grep -Rh "font-weight:" "$SRC" "$PUB" 2>/dev/null | grep -oE "font-weight:\s*[^;]+" | sort -u | head -5

section "SPACING SYSTEM"
subsection "Padding Values"
grep -Rh "padding:" "$SRC" "$PUB" 2>/dev/null | grep -oE "padding:\s*[^;]+" | sort -u | head -10

subsection "Margin Values"
grep -Rh "margin:" "$SRC" "$PUB" 2>/dev/null | grep -oE "margin:\s*[^;]+" | sort -u | head -10

subsection "Border Radius"
grep -Rh "border-radius:" "$SRC" "$PUB" 2>/dev/null | grep -oE "border-radius:\s*[^;]+" | sort -u | head -10

section "RESPONSIVE BREAKPOINTS"
grep -Rh "@media" "$SRC" "$PUB" 2>/dev/null | grep -oE "@media[^{]+" | sort -u | head -10

section "CSS FILES STRUCTURE"
subsection "Main CSS Files"
find "$SRC/assets/css" "$PUB/assets/css" -name "*.css" 2>/dev/null | while read -r f; do
  size=$(wc -c < "$f" 2>/dev/null || echo "0")
  lines=$(wc -l < "$f" 2>/dev/null || echo "0")
  printf "%-50s %6d bytes, %4d lines\n" "$(basename "$f")" "$size" "$lines"
done | sort -k2 -rn | head -15

section "COMPONENT INVENTORY"
subsection "UI Components (JS)"
find "$SRC/js/ui" "$PUB/js/ui" -name "*.js" 2>/dev/null | while read -r f; do
  echo "$(basename "$f" .js)"
done | sort -u

subsection "Service Modules"
find "$SRC/js/services" "$PUB/js/services" -name "*.js" 2>/dev/null | while read -r f; do
  echo "$(basename "$f" .js)"
done | sort -u

section "DESIGN TOKENS IN USE"
subsection "Z-Index Layers"
grep -Rh "z-index:" "$SRC" "$PUB" 2>/dev/null | grep -oE "z-index:\s*[^;]+" | sort -u

subsection "Transitions/Animations"
grep -Rh "transition:\|animation:" "$SRC" "$PUB" 2>/dev/null | grep -oE "(transition|animation):\s*[^;]+" | sort -u | head -10

subsection "Box Shadows"
grep -Rh "box-shadow:" "$SRC" "$PUB" 2>/dev/null | grep -oE "box-shadow:\s*[^;]+" | sort -u | head -5

section "CURRENT DESIGN PATTERNS"
subsection "Dark Theme Elements"
echo "Background: #0a0c10 (body), #12141a (cards), #1c2030 (elevated)"
echo "Text: #e6ebff (primary), #8892b0 (secondary), #6b7280 (muted)"
echo "Borders: #293042 (default), #2b2f3c (subtle)"
echo "Accent: #6e5ef6 (purple primary), #5d4dd8 (hover)"

subsection "Component Patterns"
echo "• Buttons: .btn, .btn-primary, .btn-ghost"
echo "• Cards: 16px radius, 1px border, 20px padding"
echo "• Modals: .modal-wrap (overlay), .modal (dialog)"
echo "• Forms: Minimal styling, dark backgrounds"

section "RECOMMENDATIONS FOR DESIGN CHANGES"
echo ""
echo "1. COLOR SYSTEM:"
echo "   - Primary: #6e5ef6 → [NEW_PRIMARY]"
echo "   - Backgrounds: #12141a → [NEW_BG]"
echo "   - Borders: #293042 → [NEW_BORDER]"
echo ""
echo "2. TYPOGRAPHY:"
echo "   - Font: system-ui → [NEW_FONT]"
echo "   - Sizes: Consistent scale (12px, 14px, 16px, 18px, 24px)"
echo ""
echo "3. SPACING:"
echo "   - Use 4px grid (4, 8, 12, 16, 20, 24, 32px)"
echo "   - Border radius: 8px (small), 12px (medium), 16px (large)"
echo ""
echo "4. KEY FILES TO UPDATE:"
echo "   - calendar-modal.css (9 lines, easy to change)"
echo "   - Main app CSS files (check largest files above)"
echo "   - Component-specific styles in JS files"
echo ""
echo "5. QUICK WINS:"
echo "   - Update CSS variables if present"
echo "   - Find/replace hex colors globally"
echo "   - Update border-radius values"
echo "   - Adjust padding/margin scale"