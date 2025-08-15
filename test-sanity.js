// Sanity check script - run in browser console at https://conference-party-app.web.app

console.log('=== SANITY CHECKS ===\n');

// 1. Palette Check
console.log('1. PALETTE CHECK:');
const testCard = document.createElement('div');
testCard.className = 'hero-card';
document.body.appendChild(testCard);
const cardStyle = getComputedStyle(testCard);
const cardBg = cardStyle.backgroundColor;
document.body.removeChild(testCard);
console.log(`  Card background: ${cardBg} (should be rgb(18, 21, 27) = #12151b)`);

const testBtn = document.createElement('button');
testBtn.className = 'v-btn v-btn--primary';
document.body.appendChild(testBtn);
const btnStyle = getComputedStyle(testBtn);
const btnBg = btnStyle.backgroundColor;
document.body.removeChild(testBtn);
console.log(`  Button background: ${btnBg} (should be rgb(107, 123, 255) = #6b7bff)`);

const bodyStyle = getComputedStyle(document.body);
const textColor = bodyStyle.color;
console.log(`  Text color: ${textColor} (should be rgb(232, 236, 241) = #e8ecf1)`);

// 2. Panel Check
console.log('\n2. PANEL CHECK:');
const activePanels = document.querySelectorAll('.v-panel.is-active');
console.log(`  Active panels: ${activePanels.length} (should be 1)`);
if (activePanels.length > 0) {
  console.log(`  Active panel ID: ${activePanels[0].id || 'no-id'}`);
}

// 3. Calendar Button Check
console.log('\n3. CALENDAR BUTTONS:');
const calButtons = document.querySelectorAll('[data-action="add-to-calendar"]');
console.log(`  Calendar buttons found: ${calButtons.length}`);
if (calButtons.length > 0) {
  console.log(`  First button provider: ${calButtons[0].dataset.provider || 'not-set'}`);
  console.log(`  First button party ID: ${calButtons[0].dataset.id || 'not-set'}`);
}

// 4. Inline CSS Check
console.log('\n4. INLINE CSS CHECK:');
const elementsWithInlineStyles = document.querySelectorAll('[style*="color"], [style*="background"]');
console.log(`  Elements with inline color/background: ${elementsWithInlineStyles.length} (should be 0 or minimal)`);
if (elementsWithInlineStyles.length > 0 && elementsWithInlineStyles.length < 5) {
  elementsWithInlineStyles.forEach(el => {
    console.log(`    - ${el.tagName}.${el.className}: ${el.style.cssText.substring(0, 50)}...`);
  });
}

// 5. Token Values
console.log('\n5. CSS VARIABLE CHECK:');
const root = document.documentElement;
const rootStyle = getComputedStyle(root);
console.log(`  --card-bg: ${rootStyle.getPropertyValue('--card-bg').trim()}`);
console.log(`  --btn-primary-bg: ${rootStyle.getPropertyValue('--btn-primary-bg').trim()}`);
console.log(`  --text-primary: ${rootStyle.getPropertyValue('--text-primary').trim()}`);
console.log(`  --bg-app: ${rootStyle.getPropertyValue('--bg-app').trim()}`);

console.log('\n=== CHECKS COMPLETE ===');