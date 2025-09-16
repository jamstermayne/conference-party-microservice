/**
 * Console Test Script for Modern Architecture
 * Run this in the browser console at http://localhost:3000
 */

console.log('🧪 Testing Modern Architecture Integration');
console.log('==========================================');

// Test 1: Check Feature Flags
console.log('\n📋 Test 1: Feature Flags System');
if (window.FeatureFlags) {
    console.log('✅ Feature Flags loaded');
    console.log('Current status:', window.FeatureFlags.getStatus());
} else {
    console.log('❌ Feature Flags not loaded');
}

// Test 2: Check Modern Architecture
console.log('\n📋 Test 2: Modern Architecture');
const modernEnabled = window.FeatureFlags?.isEnabled('modern_architecture');
console.log('Modern architecture enabled:', modernEnabled);

if (modernEnabled) {
    console.log('Checking Modern Core:', !!window.ModernCore);
    console.log('Checking Compatibility Bridge:', !!window.CompatibilityBridge);
    
    if (window.ModernCore) {
        console.log('Modern Core Status:', window.ModernCore.getStatus());
    }
    
    if (window.CompatibilityBridge) {
        console.log('Bridge Status:', window.CompatibilityBridge.getStatus());
    }
} else {
    console.log('ℹ️ Modern architecture is disabled. Enable with:');
    console.log("  localStorage.setItem('ff_modern_architecture', 'true');");
    console.log("  location.reload();");
}

// Test 3: Check Existing App
console.log('\n📋 Test 3: Legacy App Compatibility');
if (window.UnifiedConferenceApp) {
    console.log('✅ Legacy app loaded');
    console.log('Current user:', window.UnifiedConferenceApp.currentUser);
} else {
    console.log('⚠️ Legacy app not loaded (may need to navigate to main page)');
}

// Test 4: Storage Bridge
console.log('\n📋 Test 4: Storage Bridge');
if (window.UnifiedStorage) {
    console.log('✅ Unified Storage available');
    window.UnifiedStorage.set('test', { value: 'test123' });
    const retrieved = window.UnifiedStorage.get('test');
    console.log('Storage test:', retrieved?.value === 'test123' ? '✅ PASS' : '❌ FAIL');
} else {
    console.log('ℹ️ Unified Storage not available (modern architecture may be disabled)');
}

// Test 5: Performance Check
console.log('\n📋 Test 5: Performance');
const perfEntries = performance.getEntriesByType('resource');
const jsFiles = perfEntries.filter(e => e.name.includes('.js'));
const totalSize = jsFiles.reduce((sum, e) => sum + (e.transferSize || 0), 0);
console.log(`Loaded ${jsFiles.length} JS files`);
console.log(`Total size: ${(totalSize / 1024).toFixed(2)} KB`);

// Summary
console.log('\n📊 Summary:');
console.log('============');
const summary = {
    'Feature Flags': !!window.FeatureFlags,
    'Modern Core': !!window.ModernCore,
    'Bridge': !!window.CompatibilityBridge,
    'Legacy App': !!window.UnifiedConferenceApp,
    'Unified Storage': !!window.UnifiedStorage
};

Object.entries(summary).forEach(([key, value]) => {
    console.log(`${key}: ${value ? '✅' : '❌'}`);
});

console.log('\n💡 Quick Commands:');
console.log('Enable modern: FeatureFlags.enable("modern_architecture"); location.reload();');
console.log('Check status: ModernCore?.getStatus()');
console.log('Test page: window.open("/test-modern.html")');