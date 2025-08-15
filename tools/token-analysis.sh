#!/bin/bash
# Advanced token analysis script with pattern detection
# Shows px values that might need manual review

set -euo pipefail

echo "=== Advanced Token Analysis ==="
echo "Looking for complex patterns that might need manual review..."
echo

# 1. Find margin/padding shorthand with mixed values
echo "📊 Shorthand properties with multiple px values:"
grep -rn -E '(margin|padding):[[:space:]]*[0-9]+px[[:space:]]+[0-9]+px' frontend/src --include="*.css" | head -10 || echo "  None found"
echo

# 2. Find calc() expressions with px values
echo "📊 calc() expressions with px values:"
grep -rn 'calc([^)]*[0-9]px[^)]*)' frontend/src --include="*.css" | head -10 || echo "  None found"
echo

# 3. Find box-shadow with px values (need special handling)
echo "📊 box-shadow properties (may need shadow tokens):"
grep -rn 'box-shadow:[^;]*px' frontend/src --include="*.css" | head -10 || echo "  None found"
echo

# 4. Find negative margins/transforms
echo "📊 Negative px values:"
grep -rn '\-[0-9][0-9]*px' frontend/src --include="*.css" | head -10 || echo "  None found"
echo

# 5. Find line-height with px values
echo "📊 line-height with px (consider unitless or rem):"
grep -rn 'line-height:[[:space:]]*[0-9][0-9]*px' frontend/src --include="*.css" | head -10 || echo "  None found"
echo

# 6. Find font-size with px values
echo "📊 font-size with px (consider rem for accessibility):"
grep -rn 'font-size:[[:space:]]*[0-9][0-9]*px' frontend/src --include="*.css" | head -10 || echo "  None found"
echo

# 7. Find width/height with small px values that might be icons
echo "📊 Small fixed dimensions (might be icons/badges):"
grep -rn -E '(width|height):[[:space:]]*(4|8|12|16|20|24)px' frontend/src --include="*.css" | head -10 || echo "  None found"
echo

# 8. Find transition/animation durations
echo "📊 Animation durations in ms (consider duration tokens):"
grep -rn -E '(transition|animation)[^;]*[0-9]+ms' frontend/src --include="*.css" | head -10 || echo "  None found"
echo

# 9. Summary of unique px values
echo "📊 Unique px values found (sorted by frequency):"
grep -ro '[0-9][0-9]*px' frontend/src --include="*.css" | sort | uniq -c | sort -rn | head -20
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Recommendations:"
echo "  1. Run './tools/migrate-to-tokens.sh preview' for standard migrations"
echo "  2. Review box-shadow values for potential shadow token usage"
echo "  3. Consider font-size tokens for typography consistency"
echo "  4. Check calc() expressions after migration"
echo "  5. Test negative margin cases carefully"