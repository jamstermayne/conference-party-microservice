/**
 * Test both API modes
 * Run this in browser console
 */

console.group('🔍 API Mode Testing');

// Check current mode
const urlParams = new URLSearchParams(window.location.search);
const isLocalMode = urlParams.get('local') === 'true';

console.log('Current Mode:', isLocalMode ? '🏠 LOCAL (Mock Data)' : '🌐 LIVE (Google Sheets)');
console.log('Current URL:', window.location.href);

// Test current API
console.log('\n📡 Testing Current API...');

(async () => {
  try {
    // Check which endpoints we're using
    const endpoints = window.API_ENDPOINTS || ['Check api-lite.js for endpoints'];
    console.log('Configured endpoints:', endpoints);
    
    // Try to fetch parties
    const partiesUrl = isLocalMode 
      ? '/api/parties'
      : 'https://us-central1-conference-party-app.cloudfunctions.net/apiFn/api/parties?conference=gamescom2025';
    
    console.log('Fetching from:', partiesUrl);
    
    const response = await fetch(partiesUrl);
    const data = await response.json();
    
    if (data.data && Array.isArray(data.data)) {
      console.log(`✅ Success! Loaded ${data.data.length} events`);
      console.log('First event:', data.data[0]?.title || data.data[0]?.name);
      console.log('Event date:', data.data[0]?.date || data.data[0]?.time);
    } else {
      console.error('❌ Unexpected data format:', data);
    }
    
  } catch (error) {
    console.error('❌ API Error:', error);
  }
  
  console.log('\n💡 To switch modes:');
  if (isLocalMode) {
    console.log('   Switch to LIVE data: Remove ?local=true from URL');
    console.log('   → window.location.href = "http://localhost:3000"');
  } else {
    console.log('   Switch to LOCAL mock: Add ?local=true to URL');
    console.log('   → window.location.href = "http://localhost:3000?local=true"');
  }
  
  console.groupEnd();
})();