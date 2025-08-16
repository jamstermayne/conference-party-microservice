#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
OUT="$ROOT/reports/DOM_CHECK.md"

echo "# DOM State Check" > "$OUT"
echo "$(date)" >> "$OUT"
echo "" >> "$OUT"

echo "## A. Day Pills Implementation Status" >> "$OUT"
echo "" >> "$OUT"
echo "Based on code analysis:" >> "$OUT"

# Check if day-subnav.js creates buttons
if grep -q "createElement('button')" "$ROOT/frontend/src/js/day-subnav.js" 2>/dev/null; then
    echo "✅ Day pills created as BUTTON elements in day-subnav.js" >> "$OUT"
    echo "✅ Tag name: BUTTON (verified in code)" >> "$OUT"
else
    echo "❌ Day pills implementation not found" >> "$OUT"
fi

# Check data attributes
if grep -q "dataset.href" "$ROOT/frontend/src/js/day-subnav.js" 2>/dev/null; then
    echo "✅ data-href attribute set correctly" >> "$OUT"
else
    echo "❌ data-href attribute missing" >> "$OUT"
fi

# Check aria-pressed
if grep -q "aria-pressed" "$ROOT/frontend/src/js/day-subnav.js" 2>/dev/null; then
    echo "✅ aria-pressed accessibility attribute present" >> "$OUT"
else
    echo "❌ aria-pressed attribute missing" >> "$OUT"
fi

echo "" >> "$OUT"
echo "## B. Card Implementation Check" >> "$OUT"
echo "" >> "$OUT"

# Check vcard classes in party card template
if grep -q "vcard" "$ROOT/frontend/src/js/ui/partyCard.js" 2>/dev/null; then
    echo "✅ vcard class found in party card template" >> "$OUT"
    VCARD_COUNT=$(grep -c "vcard" "$ROOT/frontend/src/assets/css"/*.css 2>/dev/null || echo "0")
    echo "📊 vcard CSS definitions: $VCARD_COUNT files" >> "$OUT"
else
    echo "❌ vcard class not found in party card template" >> "$OUT"
fi

echo "" >> "$OUT"
echo "## C. Calendar Buttons Implementation" >> "$OUT"
echo "" >> "$OUT"

# Check for calendar button classes in party card template
PARTY_CARD="$ROOT/frontend/src/js/ui/partyCard.js"
if [ -f "$PARTY_CARD" ]; then
    echo "Calendar button classes in party card template:" >> "$OUT"
    for btn_class in "btn-add-to-calendar" "btn-cal-google" "btn-cal-outlook" "btn-cal-m2m" "cal-menu"; do
        if grep -q "$btn_class" "$PARTY_CARD" 2>/dev/null; then
            echo "✅ .$btn_class - Present in template" >> "$OUT"
        else
            echo "❌ .$btn_class - Missing from template" >> "$OUT"
        fi
    done
else
    echo "❌ Party card template not found" >> "$OUT"
fi

echo "" >> "$OUT"
echo "## D. CSS Coverage Analysis" >> "$OUT"
echo "" >> "$OUT"

# Check CSS coverage for calendar buttons
CSS_DIR="$ROOT/frontend/src/assets/css"
echo "CSS coverage for calendar components:" >> "$OUT"
for component in "btn-add-to-calendar" "cal-menu" "day-pill" "vcard"; do
    if grep -r "$component" "$CSS_DIR" >/dev/null 2>&1; then
        COUNT=$(grep -r "$component" "$CSS_DIR" 2>/dev/null | wc -l)
        echo "✅ .$component - $COUNT CSS rules" >> "$OUT"
    else
        echo "❌ .$component - No CSS found" >> "$OUT"
    fi
done

echo "" >> "$OUT"
echo "## E. Event Handler Wiring" >> "$OUT"
echo "" >> "$OUT"

# Check for event handlers in wire files
WIRE_BUTTONS="$ROOT/frontend/src/js/wire-buttons.js"
WIRE_CALENDAR="$ROOT/frontend/src/js/wiring/wire-calendar.js"

if [ -f "$WIRE_BUTTONS" ]; then
    echo "wire-buttons.js coverage:" >> "$OUT"
    for btn in "day-pill" "btn-add-to-calendar" "btn-cal-"; do
        if grep -q "$btn" "$WIRE_BUTTONS" 2>/dev/null; then
            echo "✅ $btn - Handler present" >> "$OUT"
        else
            echo "❌ $btn - No handler found" >> "$OUT"
        fi
    done
else
    echo "❌ wire-buttons.js not found" >> "$OUT"
fi

if [ -f "$WIRE_CALENDAR" ]; then
    echo "" >> "$OUT"
    echo "wire-calendar.js coverage:" >> "$OUT"
    for btn in "day-pill" "btn-add-to-calendar" "btn-cal-"; do
        if grep -q "$btn" "$WIRE_CALENDAR" 2>/dev/null; then
            echo "✅ $btn - Handler present" >> "$OUT"
        else
            echo "❌ $btn - No handler found" >> "$OUT"
        fi
    done
else
    echo "❌ wire-calendar.js not found" >> "$OUT"
fi

echo "" >> "$OUT"
echo "## F. Integration Status" >> "$OUT"
echo "" >> "$OUT"

# Check router integration
ROUTER="$ROOT/frontend/src/js/router.js"
if [ -f "$ROUTER" ]; then
    if grep -q "wireCalendarButtons" "$ROUTER" 2>/dev/null; then
        echo "✅ Calendar wiring integrated in router.js" >> "$OUT"
    else
        echo "❌ Calendar wiring not integrated in router.js" >> "$OUT"
    fi
    
    if grep -q "wireGlobalButtons" "$ROUTER" 2>/dev/null; then
        echo "✅ Global button wiring integrated in router.js" >> "$OUT"
    else
        echo "❌ Global button wiring not integrated in router.js" >> "$OUT"
    fi
else
    echo "❌ router.js not found" >> "$OUT"
fi

echo "" >> "$OUT"
echo "---" >> "$OUT"
echo "Generated: $(date)" >> "$OUT"
echo "Run in browser: copy tools/design-audit/live-dom-audit.js to console for live DOM check" >> "$OUT"

echo "DOM check complete. Report at: $OUT"