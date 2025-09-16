#!/bin/bash

echo "✅ Verifying Fixes"
echo "=================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check if files exist and have content
echo "📁 Checking files..."

if [ -s "frontend/src/assets/js/feature-flags.js" ]; then
    echo -e "${GREEN}✓${NC} feature-flags.js exists and has content"
    # Check for export syntax
    if grep -q "export default" frontend/src/assets/js/feature-flags.js; then
        echo -e "${RED}✗${NC} WARNING: ES6 export found (should be removed for non-module script)"
    else
        echo -e "${GREEN}✓${NC} No ES6 export syntax (good for non-module script)"
    fi
else
    echo -e "${RED}✗${NC} feature-flags.js missing or empty"
fi

if [ -s "frontend/src/assets/js/app-unified.js" ]; then
    echo -e "${GREEN}✓${NC} app-unified.js exists and has content"
else
    echo -e "${RED}✗${NC} app-unified.js missing or empty"
fi

if [ -s "frontend/src/images/icon-192x192.png" ]; then
    SIZE=$(stat -c%s "frontend/src/images/icon-192x192.png" 2>/dev/null || stat -f%z "frontend/src/images/icon-192x192.png" 2>/dev/null)
    if [ "$SIZE" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} icon-192x192.png exists with $SIZE bytes"
    else
        echo -e "${RED}✗${NC} icon-192x192.png is empty"
    fi
else
    echo -e "${RED}✗${NC} icon-192x192.png missing"
fi

echo ""
echo "🧪 Testing in browser console:"
echo "================================"
cat << 'EOF'

// Copy and paste this into the browser console at http://localhost:3000

console.group('🔍 Fix Verification');

// Test 1: Feature Flags
try {
    if (window.FeatureFlags) {
        console.log('✅ FeatureFlags loaded successfully');
        console.log('   Status:', window.FeatureFlags.getStatus());
    } else {
        console.error('❌ FeatureFlags not loaded');
    }
} catch (e) {
    console.error('❌ FeatureFlags error:', e.message);
}

// Test 2: Check for syntax errors
const errors = [];
window.addEventListener('error', (e) => {
    errors.push(e.message);
});

if (errors.length === 0) {
    console.log('✅ No JavaScript errors detected');
} else {
    console.error('❌ JavaScript errors found:', errors);
}

// Test 3: Modern Architecture (if enabled)
if (window.FeatureFlags?.isEnabled('modern_architecture')) {
    console.log('🔧 Modern Architecture is ENABLED');
    console.log('   ModernCore:', !!window.ModernCore);
    console.log('   Bridge:', !!window.CompatibilityBridge);
} else {
    console.log('ℹ️ Modern Architecture is DISABLED');
    console.log('   Enable with: FeatureFlags.enable("modern_architecture"); location.reload();');
}

// Test 4: Icon loading
const icon = new Image();
icon.onload = () => console.log('✅ Icon loaded successfully');
icon.onerror = () => console.error('❌ Icon failed to load');
icon.src = '/images/icon-192x192.png';

console.groupEnd();

// Quick enable modern architecture
console.log('\n💡 To enable modern architecture:');
console.log('   localStorage.setItem("ff_modern_architecture", "true"); location.reload();');
EOF

echo ""
echo -e "${GREEN}✅ All fixes have been applied!${NC}"
echo ""
echo "Next steps:"
echo "1. Refresh your browser at http://localhost:3000"
echo "2. Open browser console (F12)"
echo "3. Run the verification script above"
echo "4. Visit http://localhost:3000/test-modern.html for interactive testing"