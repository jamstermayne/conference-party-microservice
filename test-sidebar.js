// Test sidebar layout acceptance criteria
const app = document.querySelector('.app');
const aside = document.querySelector('aside,[data-role=sidebar],#sidebar');
const items = [...aside.querySelectorAll('[data-route],a,button,li')];

const result = {
  grid: getComputedStyle(app).gridTemplateColumns,
  rail: Math.round(aside.getBoundingClientRect().width),
  widest: Math.round(Math.max(...items.map(el => el.getBoundingClientRect().width))),
  nowrapOk: items.every(el => getComputedStyle(el).whiteSpace === 'nowrap'),
  hasActiveAccent: false
};

// Check for active accent bar
const activeItem = aside.querySelector('.active,[aria-current="page"]');
if (activeItem) {
  const beforeStyle = getComputedStyle(activeItem, '::before');
  result.hasActiveAccent = beforeStyle.content === '""' && beforeStyle.width === '3px';
}

console.log('Sidebar Layout Test Results:');
console.log(result);
console.log('\nExpected:');
console.log('- grid: max-content minmax(0, 1fr)');
console.log('- rail ≈ widest (≤ 260)');
console.log('- nowrapOk: true');
console.log('- hasActiveAccent: true (if active item exists)');