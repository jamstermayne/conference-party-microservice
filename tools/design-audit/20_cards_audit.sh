#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_lib.sh"

h1 "Cards System Audit"

echo "🃏 Card Component Analysis:"

# Check for card-related CSS files
CARD_CSS=$(find "$CSS_DIR" -name "*card*.css" 2>/dev/null || true)
if [ -n "$CARD_CSS" ]; then
  CARD_CSS_COUNT=$(echo "$CARD_CSS" | wc -l)
  ok "Found $CARD_CSS_COUNT card-related CSS files:"
  echo "$CARD_CSS" | while read -r file; do
    rel_path="${file#$ROOT/}"
    size=$(du -h "$file" | cut -f1)
    echo "  • $rel_path ($size)"
  done
else
  warn "No card-specific CSS files found"
fi

# Check for card classes in HTML/JS
echo ""
echo "📋 Card Class Usage:"
VCARD_USAGE=$(grep -Rn "vcard\|v-card" "$SRC_FE" 2>/dev/null | wc -l || echo 0)
CARD_USAGE=$(grep -Rn 'class="[^"]*card[^"]*"' "$SRC_FE" 2>/dev/null | wc -l || echo 0)

if [ "$VCARD_USAGE" -gt 0 ]; then
  ok "vcard class usage: $VCARD_USAGE instances"
fi
if [ "$CARD_USAGE" -gt 0 ]; then
  ok "General card classes: $CARD_USAGE instances"
fi

# Check card structure patterns
echo ""
echo "🏗️ Card Structure Patterns:"

# Check for flex-based cards
FLEX_CARDS=$(grep -Rn "\..*card.*{[^}]*display:\s*flex" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)
if [ "$FLEX_CARDS" -gt 0 ]; then
  ok "Flex-based card layouts: $FLEX_CARDS definitions"
fi

# Check for fixed heights (anti-pattern)
FIXED_HEIGHT=$(grep -RnE "\..*card[^}]*{[^}]*height:\s*[0-9]+px" "$CSS_DIR" 2>/dev/null || true)
if [ -z "$FIXED_HEIGHT" ]; then
  ok "No fixed heights on cards (good - allows flexible content)"
else
  FIXED_COUNT=$(echo "$FIXED_HEIGHT" | wc -l)
  warn "Found $FIXED_COUNT cards with fixed heights (use min-height instead):"
  echo "$FIXED_HEIGHT" | head -3 | while IFS=: read -r file line content; do
    rel_path="${file#$ROOT/}"
    echo "  • $rel_path:$line"
  done
fi

# Check for card body flex growth
echo ""
echo "📐 Card Body Flexibility:"
CARD_BODY_FLEX=$(grep -Rn "vcard__body\|card__body\|card-body" "$CSS_DIR" 2>/dev/null || true)
if [ -n "$CARD_BODY_FLEX" ]; then
  FLEX_GROW=$(echo "$CARD_BODY_FLEX" | xargs -I{} grep -l "flex:\s*1\|flex-grow:\s*1" {} 2>/dev/null | wc -l || echo 0)
  if [ "$FLEX_GROW" -gt 0 ]; then
    ok "Card bodies use flex-grow for flexible height"
  else
    warn "Card bodies don't use flex-grow (may cause layout issues)"
  fi
fi

# Check for card grids
echo ""
echo "🎯 Card Grid Layouts:"
CARD_GRIDS=$(grep -RnE "grid-template-columns.*card\|\.card.*grid-template-columns" "$CSS_DIR" 2>/dev/null || true)
PARTY_LIST=$(grep -Rn "party-list\|event-list\|card-grid" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)

if [ "$PARTY_LIST" -gt 0 ]; then
  ok "Card grid/list containers found: $PARTY_LIST"
fi

# Check responsive card layouts
CARD_MEDIA=$(grep -B2 -A2 "\..*card" "$CSS_DIR"/*.css 2>/dev/null | grep "@media" | wc -l || echo 0)
if [ "$CARD_MEDIA" -gt 0 ]; then
  ok "Responsive card layouts: $CARD_MEDIA media queries"
else
  warn "No responsive card layouts found"
fi

# Check for card animations
echo ""
echo "✨ Card Interactions:"
CARD_HOVER=$(grep -Rn "\..*card.*:hover" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)
CARD_TRANSITION=$(grep -Rn "\..*card.*transition" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)

if [ "$CARD_HOVER" -gt 0 ]; then
  echo "  • Hover effects: $CARD_HOVER definitions"
fi
if [ "$CARD_TRANSITION" -gt 0 ]; then
  echo "  • Transitions: $CARD_TRANSITION definitions"
fi

# Check for card action buttons
echo ""
echo "🔘 Card Actions:"
CARD_ACTIONS=$(grep -Rn "card.*action\|action.*card\|vcard__actions" "$SRC_FE" 2>/dev/null | wc -l || echo 0)
if [ "$CARD_ACTIONS" -gt 0 ]; then
  ok "Card action areas: $CARD_ACTIONS references"
  
  # Check for specific action types
  SAVE_ACTIONS=$(grep -Rn "save\|bookmark" "$JS_DIR" 2>/dev/null | wc -l || echo 0)
  SYNC_ACTIONS=$(grep -Rn "sync\|calendar" "$JS_DIR" 2>/dev/null | wc -l || echo 0)
  
  echo "  Action types found:"
  [ "$SAVE_ACTIONS" -gt 0 ] && echo "    • Save/Bookmark: $SAVE_ACTIONS"
  [ "$SYNC_ACTIONS" -gt 0 ] && echo "    • Sync/Calendar: $SYNC_ACTIONS"
fi

# Check for skeleton/loading states
echo ""
echo "⏳ Loading States:"
SKELETON=$(grep -Rn "skeleton\|shimmer\|loading.*card" "$CSS_DIR" 2>/dev/null | wc -l || echo 0)
if [ "$SKELETON" -gt 0 ]; then
  ok "Skeleton/loading states: $SKELETON definitions"
else
  warn "No skeleton loading states for cards"
fi

# Check for card accessibility
echo ""
echo "♿ Card Accessibility:"
CARD_ROLES=$(grep -Rn 'role="article"\|role="listitem"' "$SRC_FE" 2>/dev/null | wc -l || echo 0)
CARD_HEADINGS=$(grep -Rn "<h[2-3].*card\|card.*<h[2-3]" "$SRC_FE" 2>/dev/null | wc -l || echo 0)

if [ "$CARD_ROLES" -gt 0 ]; then
  ok "Semantic roles on cards: $CARD_ROLES"
else
  warn "No semantic roles (role='article') on cards"
fi

if [ "$CARD_HEADINGS" -gt 0 ]; then
  ok "Proper heading hierarchy in cards: $CARD_HEADINGS"
fi

echo ""
echo "📊 Card System Summary:"
echo "  ✅ Good practices:"
[ "$FLEX_CARDS" -gt 0 ] && echo "    • Flexible card layouts with flexbox"
[ -z "$FIXED_HEIGHT" ] && echo "    • No fixed heights (content-flexible)"
[ "$CARD_MEDIA" -gt 0 ] && echo "    • Responsive card designs"
[ "$CARD_HOVER" -gt 0 ] && echo "    • Interactive hover states"

echo ""
echo "  ⚠️  Improvements needed:"
[ -n "$FIXED_HEIGHT" ] && echo "    • Remove fixed heights from cards"
[ "$SKELETON" -eq 0 ] && echo "    • Add skeleton loading states"
[ "$CARD_ROLES" -eq 0 ] && echo "    • Add semantic roles to cards"
[ "$CARD_MEDIA" -eq 0 ] && echo "    • Add responsive breakpoints"