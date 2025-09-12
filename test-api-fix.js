/**
 * Test Script: Verify API fixes
 * Run this in browser console at http://localhost:3000
 */

console.log('🧪 Testing API Fixes');
console.log('===================');

// Test 1: Check local API endpoints
console.log('\n📡 Test 1: Local API Endpoints');
(async () => {
  try {
    // Test health endpoint
    const health = await fetch('/api/health').then(r => r.json());
    console.log('✅ Health endpoint:', health.status === 'ok' ? 'Working' : 'Failed');
    
    // Test parties endpoint
    const parties = await fetch('/api/parties').then(r => r.json());
    console.log('✅ Parties endpoint:', parties.data?.length > 0 ? `${parties.data.length} parties loaded` : 'No data');
    
    // Test feature flags
    const flags = await fetch('/api/feature-flags').then(r => r.json());
    console.log('✅ Feature flags:', flags.features ? 'Loaded' : 'Failed');
    
    // Test invites status
    const invites = await fetch('/api/invites/status').then(r => r.json());
    console.log('✅ Invites status:', invites.data?.available ? `${invites.data.available} invites available` : 'Failed');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
})();

// Test 2: Check app data loading
console.log('\n📱 Test 2: App Data Loading');
setTimeout(() => {
  if (window.UnifiedConferenceApp) {
    const app = window.UnifiedConferenceApp;
    console.log('✅ App loaded');
    console.log('   Current user:', app.currentUser ? 'Loaded' : 'Not loaded');
    console.log('   Cache size:', app.cache?.size || 0);
  } else {
    console.log('⚠️ App not loaded yet');
  }
  
  // Check if parties are displayed
  const partyCards = document.querySelectorAll('.party-card');
  console.log(`✅ Party cards displayed: ${partyCards.length}`);
  
}, 2000);

// Test 3: Test API fallback
console.log('\n🔄 Test 3: API Configuration');
console.log('Primary endpoint:', window.location.hostname === 'localhost' ? 'Using local mock API' : 'Using production API');

// Summary
console.log('\n📊 Summary:');
console.log('===========');
console.log('1. Refresh the page to see parties load');
console.log('2. Check console for any errors');
console.log('3. Mock data should display 4 parties');
console.log('4. No more 404 errors should appear');