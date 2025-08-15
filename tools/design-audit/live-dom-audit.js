// Live DOM Audit Script - Run in browser console
// Checks day pills, card sizing, and calendar button implementation

console.group('🔍 Live DOM Audit');

// A. Day Pills Tag Verification
console.group('📅 Day Pills Check');
const dayPills = [...document.querySelectorAll('.day-pill')];
const dayPillTags = dayPills.map(x => x.tagName);
console.log('Day pills found:', dayPills.length);
console.log('Tag names:', dayPillTags);
console.log('All buttons?', dayPillTags.every(tag => tag === 'BUTTON'));
if (dayPills.length > 0) {
  console.log('Sample pill:', dayPills[0]);
  console.log('Sample attributes:', {
    class: dayPills[0].className,
    'data-href': dayPills[0].dataset.href,
    'aria-pressed': dayPills[0].getAttribute('aria-pressed'),
    textContent: dayPills[0].textContent
  });
}
console.groupEnd();

// B. Card Sizing Analysis
console.group('📦 Card Sizing Analysis');
const cards = [...document.querySelectorAll('.vcard')];
if (cards.length > 0) {
  const heights = cards.map(c => Math.round(c.getBoundingClientRect().height));
  const cardSizeAnalysis = {
    count: heights.length,
    min: Math.min(...heights),
    max: Math.max(...heights),
    variance: Math.max(...heights) - Math.min(...heights),
    average: Math.round(heights.reduce((a, b) => a + b, 0) / heights.length),
    distribution: heights.reduce((acc, h) => {
      const range = Math.floor(h / 50) * 50; // Group by 50px ranges
      acc[`${range}-${range + 49}px`] = (acc[`${range}-${range + 49}px`] || 0) + 1;
      return acc;
    }, {})
  };
  console.log('Card size analysis:', cardSizeAnalysis);
  
  // Check for outliers (cards significantly different from average)
  const outliers = cards.filter((c, i) => {
    const height = heights[i];
    return Math.abs(height - cardSizeAnalysis.average) > 100;
  });
  if (outliers.length > 0) {
    console.warn('Size outliers (>100px from average):', outliers.map(c => ({
      element: c,
      height: Math.round(c.getBoundingClientRect().height),
      classes: c.className
    })));
  }
} else {
  console.log('No .vcard elements found');
}
console.groupEnd();

// C. Calendar Buttons Implementation Check
console.group('📅 Calendar Buttons Check');
const calendarButtonsCheck = [
  ['.btn-add-to-calendar', document.querySelectorAll('.btn-add-to-calendar').length],
  ['.btn-cal-google', document.querySelectorAll('.btn-cal-google').length],
  ['.btn-cal-outlook', document.querySelectorAll('.btn-cal-outlook').length],
  ['.btn-cal-m2m', document.querySelectorAll('.btn-cal-m2m').length],
  ['.cal-menu[hidden], .cal-menu:not(.is-open)', document.querySelectorAll('.cal-menu[hidden], .cal-menu:not(.is-open)').length],
  ['.cal-menu.is-open', document.querySelectorAll('.cal-menu.is-open').length],
];

console.table(calendarButtonsCheck.map(([selector, count]) => ({
  Selector: selector,
  Count: count,
  Status: count > 0 ? '✅ Present' : '❌ Missing'
})));

// Check calendar menu states
const calMenus = [...document.querySelectorAll('.cal-menu')];
if (calMenus.length > 0) {
  console.log('Calendar menu details:', calMenus.map(menu => ({
    element: menu,
    hidden: menu.hasAttribute('hidden'),
    isOpen: menu.classList.contains('is-open'),
    parentCard: menu.closest('.vcard, .party-card')?.className || 'No parent card'
  })));
}
console.groupEnd();

// D. Event Handler Coverage Check
console.group('🎯 Event Handler Coverage');
const handlersCheck = {
  'wire-buttons.js loaded': typeof wireGlobalButtons !== 'undefined',
  'wire-calendar.js loaded': typeof wireCalendarButtons !== 'undefined',
  'Click handlers on document': !!document.onclick || document._events?.click,
  'Delegated listeners': document.querySelectorAll('[data-action]').length
};
console.table(handlersCheck);
console.groupEnd();

// E. CSS Token Usage Check
console.group('🎨 CSS Token Usage');
const tokenUsage = {
  '--s-* tokens': document.documentElement.style.getPropertyValue('--s-1') || 'Check computed styles',
  '--r-* tokens': document.documentElement.style.getPropertyValue('--r-md') || 'Check computed styles',
  '--color-* tokens': document.documentElement.style.getPropertyValue('--color-primary') || 'Check computed styles'
};

// Check computed styles on sample elements
const sampleCard = document.querySelector('.vcard');
if (sampleCard) {
  const computedStyle = getComputedStyle(sampleCard);
  tokenUsage['Sample card padding'] = computedStyle.padding;
  tokenUsage['Sample card border-radius'] = computedStyle.borderRadius;
  tokenUsage['Sample card background'] = computedStyle.backgroundColor;
}

console.log('Token usage analysis:', tokenUsage);
console.groupEnd();

// F. Summary Report
console.group('📋 Summary Report');
const summary = {
  'Day Pills': dayPills.length > 0 && dayPillTags.every(tag => tag === 'BUTTON') ? '✅ Buttons' : '❌ Issues',
  'Card Count': cards.length,
  'Calendar Buttons': calendarButtonsCheck.reduce((sum, [, count]) => sum + count, 0),
  'Hidden Menus': document.querySelectorAll('.cal-menu[hidden], .cal-menu:not(.is-open)').length,
  'Overall Status': 'Check individual sections above for details'
};
console.table(summary);
console.groupEnd();

console.groupEnd();

// Return summary for programmatic access
window.auditSummary = {
  dayPills: { count: dayPills.length, allButtons: dayPillTags.every(tag => tag === 'BUTTON') },
  cards: cards.length > 0 ? {
    count: cards.length,
    minHeight: Math.min(...cards.map(c => c.getBoundingClientRect().height)),
    maxHeight: Math.max(...cards.map(c => c.getBoundingClientRect().height))
  } : { count: 0 },
  calendarButtons: Object.fromEntries(calendarButtonsCheck),
  timestamp: new Date().toISOString()
};

console.log('🎯 Audit complete! Summary available at window.auditSummary');