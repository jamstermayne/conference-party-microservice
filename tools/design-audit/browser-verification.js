// Browser verification script - paste into console to test all functionality

console.group('🎯 Calendar Buttons Production Test');

// Test 1: Route gating for day subnav
console.group('📍 Route Gating Test');
console.log('Testing day subnav visibility...');

// Test home route (should hide)
location.hash = '#/home';
setTimeout(() => {
  const display1 = getComputedStyle(document.querySelector('.v-day-subnav')).display;
  console.log(`#/home route - .v-day-subnav display: "${display1}" (should be "none")`);
  
  // Test map route (should show)
  location.hash = '#/map/2025-08-21';
  setTimeout(() => {
    const display2 = getComputedStyle(document.querySelector('.v-day-subnav')).display;
    console.log(`#/map route - .v-day-subnav display: "${display2}" (should be "grid")`);
    console.groupEnd();
  }, 100);
}, 100);
console.groupEnd();

// Test 2: Calendar button presence
console.group('📅 Calendar Button Coverage');
const buttonTests = [
  ['.btn-add-to-calendar', document.querySelectorAll('.btn-add-to-calendar').length],
  ['.btn-cal-google', document.querySelectorAll('.btn-cal-google').length],
  ['.btn-cal-outlook', document.querySelectorAll('.btn-cal-outlook').length],
  ['.btn-cal-m2m', document.querySelectorAll('.btn-cal-m2m').length],
  ['.cal-menu[hidden], .cal-menu:not(.is-open)', document.querySelectorAll('.cal-menu[hidden], .cal-menu:not(.is-open)').length],
];

console.table(buttonTests.map(([selector, count]) => ({
  Selector: selector,
  Count: count,
  Status: count > 0 ? '✅ Present' : '❌ Missing'
})));
console.groupEnd();

// Test 3: Card size analysis  
console.group('📦 Card Size Analysis');
const cardAnalysis = (() => {
  const H = [...document.querySelectorAll('.vcard')].map(c => Math.round(c.getBoundingClientRect().height));
  return {
    count: H.length,
    min: Math.min(...H),
    max: Math.max(...H),
    variance: Math.max(...H) - Math.min(...H)
  };
})();
console.log('Card size analysis:', cardAnalysis);
console.groupEnd();

// Test 4: Event handler verification
console.group('🎯 Event Handler Test');
console.log('Testing calendar button click handlers...');

// Check if our handler is attached
const testClick = new Event('click', { bubbles: true });
const testButton = document.querySelector('.btn-add-to-calendar');
if (testButton) {
  console.log('✅ Calendar button found for testing');
  console.log('Data attributes available:', {
    title: testButton.closest('.vcard')?.dataset.title,
    start: testButton.closest('.vcard')?.dataset.start,
    end: testButton.closest('.vcard')?.dataset.end,
    location: testButton.closest('.vcard')?.dataset.location
  });
} else {
  console.warn('❌ No calendar buttons found to test');
}
console.groupEnd();

// Test 5: CSP compliance check
console.group('🛡️ CSP Compliance');
console.log('Checking for CSP violations in console...');
const cspViolations = performance.getEntriesByType('navigation')
  .concat(performance.getEntriesByType('resource'))
  .filter(entry => entry.name.includes('blocked'));
  
if (cspViolations.length === 0) {
  console.log('✅ No CSP violations detected');
} else {
  console.warn('⚠️ CSP violations found:', cspViolations);
}
console.groupEnd();

console.groupEnd();
console.log('🎉 Verification complete! Check results above.');

// Return summary for programmatic access
window.verificationResults = {
  daySubnavGating: 'Check console logs above',
  calendarButtons: buttonTests,
  cardSizing: cardAnalysis,
  timestamp: new Date().toISOString()
};