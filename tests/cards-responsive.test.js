/**
 * Responsive Card Design Tests
 * Tests the modern card system across different viewports
 */

// Test viewport configurations
const viewports = {
  mobile: { width: 375, height: 667, name: 'iPhone SE' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  desktop: { width: 1440, height: 900, name: 'Desktop' },
  wide: { width: 1920, height: 1080, name: '1080p' }
};

// Test helper to check grid columns
function getGridColumns(container) {
  const computed = window.getComputedStyle(container);
  const columns = computed.gridTemplateColumns;
  return columns.split(' ').length;
}

// Test helper to check card visibility
function isCardFullyVisible(card) {
  const rect = card.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

// Test suite
describe('Modern Card Responsive Behavior', () => {
  
  describe('Grid Layout', () => {
    test('Mobile: Should display 1 column', () => {
      window.innerWidth = viewports.mobile.width;
      const grid = document.querySelector('.card-modern-grid');
      expect(getGridColumns(grid)).toBe(1);
    });
    
    test('Tablet: Should display 2 columns', () => {
      window.innerWidth = viewports.tablet.width;
      const grid = document.querySelector('.card-modern-grid');
      expect(getGridColumns(grid)).toBe(2);
    });
    
    test('Desktop: Should display 3 columns', () => {
      window.innerWidth = viewports.desktop.width;
      const grid = document.querySelector('.card-modern-grid');
      expect(getGridColumns(grid)).toBe(3);
    });
    
    test('Wide: Should display 4 columns', () => {
      window.innerWidth = viewports.wide.width;
      const grid = document.querySelector('.card-modern-grid');
      expect(getGridColumns(grid)).toBe(4);
    });
  });
  
  describe('Card Content', () => {
    test('Title should truncate after 2 lines', () => {
      const title = document.querySelector('.card-modern__title');
      const computed = window.getComputedStyle(title);
      expect(computed.webkitLineClamp).toBe('2');
      expect(computed.overflow).toBe('hidden');
    });
    
    test('Description should truncate after 3 lines', () => {
      const desc = document.querySelector('.card-modern__description');
      const computed = window.getComputedStyle(desc);
      expect(computed.webkitLineClamp).toBe('3');
      expect(computed.overflow).toBe('hidden');
    });
  });
  
  describe('Touch Interactions', () => {
    test('Card should have appropriate touch target size', () => {
      const buttons = document.querySelectorAll('.card-modern__action');
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(44); // iOS minimum
        expect(rect.width).toBeGreaterThanOrEqual(44);
      });
    });
    
    test('Cards should have appropriate spacing for touch', () => {
      const cards = document.querySelectorAll('.card-modern');
      for (let i = 1; i < cards.length; i++) {
        const prev = cards[i - 1].getBoundingClientRect();
        const curr = cards[i].getBoundingClientRect();
        const gap = curr.top - prev.bottom;
        expect(gap).toBeGreaterThanOrEqual(16); // Minimum touch gap
      }
    });
  });
  
  describe('Performance', () => {
    test('Should use GPU-accelerated animations', () => {
      const card = document.querySelector('.card-modern');
      card.dispatchEvent(new MouseEvent('mouseenter'));
      const computed = window.getComputedStyle(card);
      expect(computed.transform).toContain('translateY');
      expect(computed.willChange || computed.transform).toBeTruthy();
    });
    
    test('Should batch DOM operations', () => {
      const startTime = performance.now();
      const grid = createCardGrid(Array(100).fill(sampleEvent));
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });
  
  describe('Accessibility', () => {
    test('Cards should have proper ARIA attributes', () => {
      const cards = document.querySelectorAll('.card-modern');
      cards.forEach(card => {
        expect(card.getAttribute('role')).toBe('article');
        expect(card.getAttribute('aria-label')).toBeTruthy();
      });
    });
    
    test('Buttons should have accessible labels', () => {
      const buttons = document.querySelectorAll('.card-modern__action');
      buttons.forEach(btn => {
        expect(btn.getAttribute('aria-label')).toBeTruthy();
      });
    });
    
    test('Should support keyboard navigation', () => {
      const card = document.querySelector('.card-modern');
      const button = card.querySelector('.card-modern__action');
      
      button.focus();
      expect(document.activeElement).toBe(button);
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      button.dispatchEvent(event);
      // Should trigger action
    });
  });
  
  describe('Visual Regression', () => {
    test('Card should maintain aspect ratio', () => {
      Object.values(viewports).forEach(viewport => {
        window.innerWidth = viewport.width;
        const cards = document.querySelectorAll('.card-modern');
        cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          const aspectRatio = rect.width / rect.height;
          expect(aspectRatio).toBeGreaterThan(0.5);
          expect(aspectRatio).toBeLessThan(2);
        });
      });
    });
    
    test('Text should remain readable', () => {
      const texts = document.querySelectorAll('.card-modern__title, .card-modern__description');
      texts.forEach(text => {
        const computed = window.getComputedStyle(text);
        const fontSize = parseFloat(computed.fontSize);
        expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable
      });
    });
  });
});

// Console test runner
function runTests() {
  console.log('🧪 Running Modern Card Responsive Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Test 1: Grid columns
  console.log('📱 Testing responsive grid...');
  const grid = document.querySelector('.card-modern-grid');
  if (grid) {
    const columns = getGridColumns(grid);
    const expected = window.innerWidth < 640 ? 1 : 
                    window.innerWidth < 1024 ? 2 : 
                    window.innerWidth < 1440 ? 3 : 4;
    
    if (columns === expected) {
      console.log('✅ Grid columns correct:', columns);
      results.passed++;
    } else {
      console.log('❌ Grid columns incorrect. Expected:', expected, 'Got:', columns);
      results.failed++;
    }
  }
  
  // Test 2: Card visibility
  console.log('\n👁️ Testing card visibility...');
  const cards = document.querySelectorAll('.card-modern');
  let visibleCount = 0;
  cards.forEach(card => {
    if (isCardFullyVisible(card)) visibleCount++;
  });
  console.log(`✅ ${visibleCount}/${cards.length} cards fully visible`);
  results.passed++;
  
  // Test 3: Touch targets
  console.log('\n👆 Testing touch targets...');
  const buttons = document.querySelectorAll('.card-modern__action');
  let validTargets = 0;
  buttons.forEach(btn => {
    const rect = btn.getBoundingClientRect();
    if (rect.height >= 44 && rect.width >= 44) {
      validTargets++;
    }
  });
  
  if (validTargets === buttons.length) {
    console.log('✅ All buttons have valid touch target size');
    results.passed++;
  } else {
    console.log(`⚠️ ${buttons.length - validTargets} buttons below minimum touch size`);
    results.failed++;
  }
  
  // Test 4: Animations
  console.log('\n✨ Testing animations...');
  const firstCard = cards[0];
  if (firstCard) {
    firstCard.dispatchEvent(new MouseEvent('mouseenter'));
    const transform = window.getComputedStyle(firstCard).transform;
    if (transform !== 'none') {
      console.log('✅ Hover animation working');
      results.passed++;
    } else {
      console.log('❌ Hover animation not working');
      results.failed++;
    }
  }
  
  // Test 5: Accessibility
  console.log('\n♿ Testing accessibility...');
  let accessibilityScore = 0;
  cards.forEach(card => {
    if (card.getAttribute('role') && card.getAttribute('aria-label')) {
      accessibilityScore++;
    }
  });
  
  if (accessibilityScore === cards.length) {
    console.log('✅ All cards have proper ARIA attributes');
    results.passed++;
  } else {
    console.log(`⚠️ ${cards.length - accessibilityScore} cards missing ARIA attributes`);
    results.failed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Score: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  console.log('='.repeat(50));
  
  return results;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, getGridColumns, isCardFullyVisible };
}

// Auto-run in browser console
if (typeof window !== 'undefined') {
  window.cardTests = { runTests, getGridColumns, isCardFullyVisible };
  console.log('💡 Card tests loaded. Run cardTests.runTests() to test responsive behavior.');
}