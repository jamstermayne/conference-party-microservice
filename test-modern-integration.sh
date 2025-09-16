#!/bin/bash

# Test script for modern architecture integration

echo "🧪 Testing Modern Architecture Integration"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "📋 Test Plan:"
echo "1. Test with modern architecture OFF (legacy only)"
echo "2. Enable modern architecture gradually"
echo "3. Test compatibility between systems"
echo "4. Verify no breaking changes"
echo ""

echo -e "${YELLOW}Step 1: Testing Legacy Mode${NC}"
echo "----------------------------------------"
cat << 'EOF'
// In browser console:

// Ensure modern architecture is OFF
localStorage.setItem('ff_modern_architecture', 'false');
location.reload();

// Test legacy features still work
console.log('Legacy app exists:', !!window.UnifiedConferenceApp);
console.log('Modern core exists:', !!window.ModernCore);

// Should see:
// Legacy app exists: true
// Modern core exists: false
EOF
echo ""

echo -e "${YELLOW}Step 2: Enable Modern Architecture${NC}"
echo "----------------------------------------"
cat << 'EOF'
// Enable modern architecture
localStorage.setItem('ff_modern_architecture', 'true');
location.reload();

// Check both systems loaded
console.log('Legacy app:', !!window.UnifiedConferenceApp);
console.log('Modern core:', !!window.ModernCore);
console.log('Bridge active:', !!window.CompatibilityBridge);

// Should see:
// Legacy app: true
// Modern core: true
// Bridge active: true
EOF
echo ""

echo -e "${YELLOW}Step 3: Test Compatibility Bridge${NC}"
echo "----------------------------------------"
cat << 'EOF'
// Test data synchronization
if (window.UnifiedConferenceApp && window.ModernCore) {
  // Set user in legacy
  window.UnifiedConferenceApp.currentUser = {
    id: 'test123',
    profile: { name: 'Test User' }
  };
  
  // Check if synced to modern storage
  setTimeout(() => {
    const stored = window.UnifiedStorage?.get('user');
    console.log('User synced to modern:', stored);
  }, 100);
}

// Test API interception
fetch('/api/parties').then(r => r.json()).then(data => {
  console.log('API response (potentially enhanced):', data);
});
EOF
echo ""

echo -e "${YELLOW}Step 4: Enable Modern Features Gradually${NC}"
echo "----------------------------------------"
cat << 'EOF'
// Enable features one by one
const features = [
  'modern_data',     // Modern data layer
  'modern_ui',       // Modern UI components
  'modern_matching', // AI matching
  'modern_auth'      // Modern auth
];

features.forEach(feature => {
  console.log(`Testing ${feature}...`);
  
  // Enable feature
  window.FeatureFlags.enable(feature, true);
  
  // Check if loaded
  const status = window.ModernCore?.features?.[feature.replace('modern_', '')];
  console.log(`  ${feature}: ${status ? '✅' : '❌'}`);
});

// Reload to apply all features
console.log('Reload page to apply all modern features');
EOF
echo ""

echo -e "${YELLOW}Step 5: Verify No Breaking Changes${NC}"
echo "----------------------------------------"
cat << 'EOF'
// Test critical user flows
const tests = {
  'Save party': () => {
    const saveBtn = document.querySelector('.btn-save');
    return saveBtn ? '✅ Save button found' : '❌ Save button missing';
  },
  
  'User auth': () => {
    const user = window.UnifiedConferenceApp?.currentUser;
    return user ? '✅ User loaded' : '❌ No user';
  },
  
  'API calls': async () => {
    try {
      const response = await fetch('/api/health');
      return response.ok ? '✅ API working' : '❌ API error';
    } catch {
      return '❌ API failed';
    }
  },
  
  'Local storage': () => {
    try {
      localStorage.setItem('test', 'value');
      localStorage.removeItem('test');
      return '✅ Storage working';
    } catch {
      return '❌ Storage failed';
    }
  }
};

// Run tests
Object.entries(tests).forEach(async ([name, test]) => {
  const result = await test();
  console.log(`${name}: ${result}`);
});
EOF
echo ""

echo -e "${YELLOW}Step 6: Performance Comparison${NC}"
echo "----------------------------------------"
cat << 'EOF'
// Compare performance with and without modern features

// Measure with modern OFF
localStorage.setItem('ff_modern_architecture', 'false');
performance.mark('legacy-start');
// ... perform operations ...
performance.mark('legacy-end');
performance.measure('legacy', 'legacy-start', 'legacy-end');

// Measure with modern ON
localStorage.setItem('ff_modern_architecture', 'true');
performance.mark('modern-start');
// ... perform operations ...
performance.mark('modern-end');
performance.measure('modern', 'modern-start', 'modern-end');

// Compare
const legacyTime = performance.getEntriesByName('legacy')[0].duration;
const modernTime = performance.getEntriesByName('modern')[0].duration;
console.log(`Legacy: ${legacyTime}ms`);
console.log(`Modern: ${modernTime}ms`);
console.log(`Difference: ${((modernTime - legacyTime) / legacyTime * 100).toFixed(2)}%`);
EOF
echo ""

echo -e "${GREEN}✅ Test Commands Ready!${NC}"
echo ""
echo "📝 Quick Test Commands:"
echo ""
echo "1. Enable modern architecture:"
echo "   localStorage.setItem('ff_modern_architecture', 'true'); location.reload();"
echo ""
echo "2. Check status:"
echo "   console.log(window.ModernCore?.getStatus());"
echo ""
echo "3. Check bridge status:"
echo "   console.log(window.CompatibilityBridge?.getStatus());"
echo ""
echo "4. Enable all modern features:"
echo "   Object.keys(window.FeatureFlags.flags.features).filter(f => f.startsWith('modern_')).forEach(f => window.FeatureFlags.enable(f));"
echo ""
echo "5. Disable all modern features:"
echo "   Object.keys(window.FeatureFlags.flags.features).filter(f => f.startsWith('modern_')).forEach(f => window.FeatureFlags.disable(f));"
echo ""
echo "🚀 The hybrid architecture is ready for testing!"