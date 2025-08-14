#!/bin/bash
# === Apply Targeted Design Changes ===
# Usage: ./apply-design-changes.sh [--preview]

set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PREVIEW="${1:-}"

# NEW DESIGN TOKENS - EDIT THESE
NEW_PRIMARY="#6e5ef6"        # Current purple - change to new primary
NEW_PRIMARY_HOVER="#5d4dd8"  # Hover state
NEW_BG_BODY="#0a0c10"       # Body background
NEW_BG_CARD="#12141a"       # Card background
NEW_BG_ELEVATED="#1c2030"   # Elevated elements
NEW_BORDER="#293042"        # Default border
NEW_BORDER_SUBTLE="#2b2f3c" # Subtle border
NEW_TEXT="#e6ebff"          # Primary text
NEW_TEXT_MUTED="#8892b0"    # Muted text
NEW_RADIUS_SM="8px"         # Small radius
NEW_RADIUS_MD="12px"        # Medium radius
NEW_RADIUS_LG="16px"        # Large radius

# Files to update
CALENDAR_MODAL="$ROOT/frontend/src/assets/css/calendar-modal.css"
CALENDAR_MODAL_PUB="$ROOT/public/assets/css/calendar-modal.css"

if [ "$PREVIEW" = "--preview" ]; then
  echo "=== PREVIEW MODE - No changes will be made ==="
  echo ""
fi

echo "Design Token Changes:"
echo "  Primary: #6e5ef6 → $NEW_PRIMARY"
echo "  Primary Hover: #5d4dd8 → $NEW_PRIMARY_HOVER"
echo "  BG Body: #0a0c10 → $NEW_BG_BODY"
echo "  BG Card: #12141a → $NEW_BG_CARD"
echo "  BG Elevated: #1c2030 → $NEW_BG_ELEVATED"
echo "  Border: #293042 → $NEW_BORDER"
echo "  Border Subtle: #2b2f3c → $NEW_BORDER_SUBTLE"
echo "  Text: #e6ebff → $NEW_TEXT"
echo "  Text Muted: #8892b0 → $NEW_TEXT_MUTED"
echo ""

# Function to update file
update_file() {
  local file=$1
  if [ ! -f "$file" ]; then
    echo "  ⚠️  File not found: $file"
    return
  fi
  
  if [ "$PREVIEW" = "--preview" ]; then
    echo "  Would update: $file"
    # Show what would change
    grep -E "#6e5ef6|#5d4dd8|#12141a|#1c2030|#293042|#2b2f3c|#e6ebff|#8892b0" "$file" 2>/dev/null | head -3 || true
  else
    # Backup original
    cp "$file" "${file}.bak"
    
    # Apply changes
    sed -i.tmp \
      -e "s/#6e5ef6/$NEW_PRIMARY/g" \
      -e "s/#5d4dd8/$NEW_PRIMARY_HOVER/g" \
      -e "s/#0a0c10/$NEW_BG_BODY/g" \
      -e "s/#12141a/$NEW_BG_CARD/g" \
      -e "s/#1c2030/$NEW_BG_ELEVATED/g" \
      -e "s/#293042/$NEW_BORDER/g" \
      -e "s/#2b2f3c/$NEW_BORDER_SUBTLE/g" \
      -e "s/#e6ebff/$NEW_TEXT/g" \
      -e "s/#8892b0/$NEW_TEXT_MUTED/g" \
      "$file"
    
    # Update border radius if different
    if [ "$NEW_RADIUS_LG" != "16px" ]; then
      sed -i.tmp -e "s/border-radius:16px/border-radius:$NEW_RADIUS_LG/g" "$file"
    fi
    if [ "$NEW_RADIUS_MD" != "12px" ]; then
      sed -i.tmp -e "s/border-radius:12px/border-radius:$NEW_RADIUS_MD/g" "$file"
    fi
    
    rm "${file}.tmp"
    echo "  ✅ Updated: $file"
  fi
}

echo ""
echo "Updating calendar modal CSS..."
update_file "$CALENDAR_MODAL"
update_file "$CALENDAR_MODAL_PUB"

echo ""
echo "Finding other CSS files to update..."
find "$ROOT/frontend/src/assets/css" "$ROOT/public/assets/css" -name "*.css" 2>/dev/null | while read -r f; do
  if grep -q "#6e5ef6\|#12141a\|#293042" "$f" 2>/dev/null; then
    update_file "$f"
  fi
done

echo ""
if [ "$PREVIEW" = "--preview" ]; then
  echo "=== Preview complete. Run without --preview to apply changes ==="
else
  echo "=== Design changes applied! ==="
  echo ""
  echo "Next steps:"
  echo "1. Review changes: git diff"
  echo "2. Test locally: npm run dev"
  echo "3. Deploy: firebase deploy --only hosting"
  echo ""
  echo "To revert: find . -name '*.css.bak' -exec sh -c 'mv {} ${%.bak}' \;"
fi