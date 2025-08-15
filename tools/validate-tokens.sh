#!/bin/bash
# Validate that all used tokens are defined and loaded correctly
# Usage: ./validate-tokens.sh

set -euo pipefail

echo "🔍 Token Validation Tool"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# Check if spacing-tokens.css is loaded in index.html
echo "📄 Checking if spacing-tokens.css is loaded..."
if grep -q "spacing-tokens.css" frontend/src/index.html; then
    echo "✅ spacing-tokens.css is loaded in index.html"
else
    echo "⚠️  spacing-tokens.css not found in index.html"
    echo "   Add: <link rel=\"stylesheet\" href=\"/assets/css/spacing-tokens.css\">"
fi
echo

# Find all token usage in CSS files
echo "📊 Token usage summary:"
echo

# Spacing tokens
echo "Spacing tokens (--s-*):"
grep -roh "var(--s-[0-9]*)" frontend/src --include="*.css" | sort | uniq -c | sort -rn || echo "  None found"
echo

# Radius tokens
echo "Radius tokens (--r-*):"
grep -roh "var(--r-[a-z0-9]*)" frontend/src --include="*.css" | sort | uniq -c | sort -rn || echo "  None found"
echo

# Shadow tokens
echo "Shadow tokens (--shadow-*):"
grep -roh "var(--shadow-[a-z0-9-]*)" frontend/src --include="*.css" | sort | uniq -c | sort -rn || echo "  None found"
echo

# Check for undefined tokens
echo "🔎 Checking for undefined tokens..."
TOKENS_FILE="frontend/src/assets/css/spacing-tokens.css"
UNDEFINED_COUNT=0

for token in $(grep -roh "var(--[a-z0-9-]*)" frontend/src --include="*.css" | sort | uniq); do
    token_name=$(echo "$token" | sed 's/var(//;s/)//')
    
    # Skip known system tokens
    if [[ "$token_name" =~ ^--(bg-|text-|accent|surface|border|error|warning|success|ease-|rail-|panel|card-|v-) ]]; then
        continue
    fi
    
    # Check if token is defined
    if ! grep -q "$token_name:" "$TOKENS_FILE" 2>/dev/null; then
        if [ $UNDEFINED_COUNT -eq 0 ]; then
            echo "⚠️  Undefined tokens found:"
        fi
        echo "   $token"
        ((UNDEFINED_COUNT++))
    fi
done

if [ $UNDEFINED_COUNT -eq 0 ]; then
    echo "✅ All tokens are defined"
fi
echo

# Check for remaining hardcoded values
echo "📈 Remaining hardcoded px values:"
COMMON_PX="8px|12px|16px|20px|24px|32px|40px"
COUNT=$(grep -rE "(\s|:)($COMMON_PX)" frontend/src --include="*.css" | wc -l)
echo "   Found $COUNT instances of common px values ($COMMON_PX)"
echo "   Run './tools/migrate-to-tokens.sh preview' to see details"
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Validation complete!"