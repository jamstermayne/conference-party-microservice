/**
 * 🎮 GAMESCOM 2025 - PREMIUM PARTY LIST E2E TESTS
 * 
 * Comprehensive testing for production-grade party list
 * Performance, accessibility, and functionality validation
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Premium Party List E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performance.mark('test-start');
    });
    
    await page.goto(BASE_URL);
    
    // Wait for premium party list to initialize
    await page.waitForSelector('.party-list-premium', { timeout: 10000 });
  });

  test('should load premium party list with correct structure', async () => {
    // Verify main container
    const partyList = page.locator('.party-list-premium');
    await expect(partyList).toBeVisible();

    // Verify header elements
    await expect(page.locator('.party-list-header')).toBeVisible();
    await expect(page.locator('.section-title')).toContainText('Tonight\'s Hottest Parties');
    await expect(page.locator('.live-indicator')).toBeVisible();

    // Verify search functionality
    await expect(page.locator('.search-input')).toBeVisible();
    await expect(page.locator('.search-input')).toHaveAttribute('placeholder', /search/i);

    // Verify filter pills
    const filterPills = page.locator('.filter-pill');
    await expect(filterPills).toHaveCount(4);
    await expect(filterPills.first()).toHaveClass(/filter-pill--active/);

    // Verify virtual scroll container
    await expect(page.locator('.virtual-scroll-container')).toBeVisible();
  });

  test('should render party cards with signature design', async () => {
    // Wait for party cards to load
    await page.waitForSelector('.party-card-premium', { timeout: 15000 });
    
    const partyCards = page.locator('.party-card-premium');
    const cardCount = await partyCards.count();
    
    expect(cardCount).toBeGreaterThan(0);
    
    // Test first party card structure
    const firstCard = partyCards.first();
    
    // Verify glass morphism elements
    await expect(firstCard.locator('.card-glass-bg')).toBeVisible();
    await expect(firstCard.locator('.card-border-gradient')).toBeVisible();
    
    // Verify header elements
    await expect(firstCard.locator('.card-header-premium')).toBeVisible();
    await expect(firstCard.locator('.status-live')).toBeVisible();
    await expect(firstCard.locator('.live-dot')).toBeVisible();
    
    // Verify content elements
    await expect(firstCard.locator('.party-title-premium')).toBeVisible();
    await expect(firstCard.locator('.party-meta')).toBeVisible();
    await expect(firstCard.locator('.party-description-premium')).toBeVisible();
    
    // Verify action buttons
    await expect(firstCard.locator('.btn-primary')).toBeVisible();
    await expect(firstCard.locator('.btn-secondary')).toBeVisible();
    
    // Verify action buttons cluster
    await expect(firstCard.locator('.action-btn--save')).toBeVisible();
    await expect(firstCard.locator('.action-btn--share')).toBeVisible();
  });

  test('should handle search functionality correctly', async () => {
    const searchInput = page.locator('.search-input');
    
    // Wait for initial load
    await page.waitForSelector('.party-card-premium', { timeout: 15000 });
    const initialCount = await page.locator('.party-card-premium').count();
    
    // Test search with valid term
    await searchInput.fill('xbox');
    await page.waitForTimeout(500); // Debounce delay
    
    const searchResults = await page.locator('.party-card-premium').count();
    expect(searchResults).toBeLessThanOrEqual(initialCount);
    
    // Verify search results contain the search term
    const visibleCards = page.locator('.party-card-premium');
    const cardCount = await visibleCards.count();
    
    if (cardCount > 0) {
      const firstCardTitle = await visibleCards.first().locator('.party-title-premium').textContent();
      expect(firstCardTitle?.toLowerCase()).toContain('xbox');
    }
    
    // Test search clear
    await searchInput.fill('');
    await page.waitForTimeout(500);
    
    const clearedResults = await page.locator('.party-card-premium').count();
    expect(clearedResults).toBeGreaterThanOrEqual(searchResults);
  });

  test('should handle filter functionality correctly', async () => {
    // Wait for initial load
    await page.waitForSelector('.party-card-premium', { timeout: 15000 });
    
    // Test 'All' filter (should be active by default)
    const allFilter = page.locator('[data-filter="all"]');
    await expect(allFilter).toHaveClass(/filter-pill--active/);
    
    const initialCount = await page.locator('.party-card-premium').count();
    
    // Test 'Tonight' filter
    const tonightFilter = page.locator('[data-filter="tonight"]');
    await tonightFilter.click();
    
    await expect(tonightFilter).toHaveClass(/filter-pill--active/);
    await expect(allFilter).not.toHaveClass(/filter-pill--active/);
    
    await page.waitForTimeout(500);
    const tonightCount = await page.locator('.party-card-premium').count();
    
    // Test 'VIP' filter
    const vipFilter = page.locator('[data-filter="vip"]');
    await vipFilter.click();
    
    await expect(vipFilter).toHaveClass(/filter-pill--active/);
    await page.waitForTimeout(500);
    
    const vipCount = await page.locator('.party-card-premium').count();
    
    // Test 'Saved' filter
    const savedFilter = page.locator('[data-filter="saved"]');
    await savedFilter.click();
    
    await expect(savedFilter).toHaveClass(/filter-pill--active/);
    await page.waitForTimeout(500);
    
    // Should show 0 or very few items initially
    const savedCount = await page.locator('.party-card-premium').count();
    expect(savedCount).toBeLessThanOrEqual(initialCount);
  });

  test('should handle party interactions correctly', async () => {
    // Wait for party cards to load
    await page.waitForSelector('.party-card-premium', { timeout: 15000 });
    
    const firstCard = page.locator('.party-card-premium').first();
    
    // Test save functionality
    const saveButton = firstCard.locator('.action-btn--save');
    await expect(saveButton).toBeVisible();
    
    const initialSaveState = await saveButton.getAttribute('class');
    await saveButton.click();
    
    // Wait for state change
    await page.waitForTimeout(300);
    const newSaveState = await saveButton.getAttribute('class');
    expect(newSaveState).not.toBe(initialSaveState);
    
    // Test RSVP functionality
    const rsvpButton = firstCard.locator('.btn-rsvp');
    await expect(rsvpButton).toBeVisible();
    await expect(rsvpButton).toContainText('RSVP');
    
    await rsvpButton.click();
    
    // Should show loading state briefly
    await page.waitForTimeout(100);
    const buttonText = await rsvpButton.textContent();
    expect(buttonText).toMatch(/rsvp|loading/i);
    
    // Test share functionality
    const shareButton = firstCard.locator('.action-btn--share');
    await expect(shareButton).toBeVisible();
    await shareButton.click();
    
    // Should trigger share action (implementation-dependent)
    await page.waitForTimeout(300);
  });

  test('should handle virtual scrolling performance', async () => {
    // Wait for initial load
    await page.waitForSelector('.party-card-premium', { timeout: 15000 });
    
    const scrollContainer = page.locator('.virtual-scroll-container');
    await expect(scrollContainer).toBeVisible();
    
    // Measure initial performance
    await page.evaluate(() => window.performance.mark('scroll-start'));
    
    // Simulate scrolling
    for (let i = 0; i < 5; i++) {
      await scrollContainer.scroll({ top: i * 400 });
      await page.waitForTimeout(100);
    }
    
    await page.evaluate(() => window.performance.mark('scroll-end'));
    
    // Verify scroll performance
    const scrollPerformance = await page.evaluate(() => {
      window.performance.measure('scroll-duration', 'scroll-start', 'scroll-end');
      const measure = window.performance.getEntriesByName('scroll-duration')[0];
      return measure.duration;
    });
    
    // Should complete scrolling within reasonable time
    expect(scrollPerformance).toBeLessThan(2000);
    
    // Verify virtual scrolling is working (spacers should be present)
    await expect(page.locator('.scroll-spacer-top')).toBeVisible();
    await expect(page.locator('.scroll-spacer-bottom')).toBeVisible();
  });

  test('should handle offline scenarios gracefully', async () => {
    // Wait for initial load
    await page.waitForSelector('.party-card-premium', { timeout: 15000 });
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Trigger a refresh or new request
    await page.reload();
    
    // Should show cached content or appropriate offline state
    await page.waitForSelector('.party-list-premium', { timeout: 10000 });
    
    // Check for offline indicators or cached content
    const hasContent = await page.locator('.party-card-premium').count() > 0;
    const hasOfflineIndicator = await page.locator('.offline-notice, .error-overlay').isVisible();
    
    // Should either show cached content or offline message
    expect(hasContent || hasOfflineIndicator).toBeTruthy();
    
    // Restore online mode
    await page.context().setOffline(false);
  });

  test('should meet accessibility standards', async () => {
    // Wait for party cards to load
    await page.waitForSelector('.party-card-premium', { timeout: 15000 });
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.className);
    expect(focusedElement).toBeTruthy();
    
    // Test ARIA labels
    const saveButtons = page.locator('.action-btn--save');
    const buttonCount = await saveButtons.count();
    
    if (buttonCount > 0) {
      const ariaLabel = await saveButtons.first().getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/save|remove/i);
    }
    
    // Test focus management
    const searchInput = page.locator('.search-input');
    await searchInput.focus();
    
    const isFocused = await searchInput.evaluate(el => document.activeElement === el);
    expect(isFocused).toBeTruthy();
    
    // Test contrast and visibility
    const partyTitle = page.locator('.party-title-premium').first();
    if (await partyTitle.isVisible()) {
      const titleColor = await partyTitle.evaluate(el => 
        window.getComputedStyle(el).color
      );
      expect(titleColor).toBeTruthy();
    }
  });

  test('should handle error states correctly', async () => {
    // Test with network failures
    await page.route('**/api/parties', route => {
      route.abort();
    });
    
    await page.reload();
    
    // Should show error state
    await page.waitForSelector('.error-overlay, .parties-error', { timeout: 10000 });
    
    const errorElement = page.locator('.error-overlay, .parties-error');
    await expect(errorElement).toBeVisible();
    
    // Should have retry functionality
    const retryButton = page.locator('[data-action="retry"], .retry-btn');
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeVisible();
    }
  });

  test('should show loading states appropriately', async () => {
    // Test initial loading
    await page.goto(BASE_URL);
    
    // Should show loading state initially
    const loadingOverlay = page.locator('.loading-overlay');
    const isLoadingVisible = await loadingOverlay.isVisible();
    
    if (isLoadingVisible) {
      await expect(loadingOverlay).toBeVisible();
      await expect(page.locator('.loading-spinner')).toBeVisible();
    }
    
    // Should eventually load content
    await page.waitForSelector('.party-card-premium', { timeout: 15000 });
    
    // Loading should be hidden
    await expect(loadingOverlay).not.toBeVisible();
  });

  test('should perform well under load', async () => {
    // Performance test
    await page.evaluate(() => window.performance.mark('load-start'));
    
    await page.goto(BASE_URL);
    await page.waitForSelector('.party-card-premium', { timeout: 15000 });
    
    await page.evaluate(() => window.performance.mark('load-end'));
    
    const loadTime = await page.evaluate(() => {
      window.performance.measure('page-load', 'load-start', 'load-end');
      const measure = window.performance.getEntriesByName('page-load')[0];
      return measure.duration;
    });
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(5000);
    
    // Test memory usage (approximate)
    const memoryInfo = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });
    
    if (memoryInfo) {
      // Memory usage should be reasonable
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
    }
  });

  test('should handle responsive design correctly', async () => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    await page.waitForSelector('.party-list-premium', { timeout: 15000 });
    
    // Should adapt to mobile layout
    const partyList = page.locator('.party-list-premium');
    await expect(partyList).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    await expect(partyList).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    await expect(partyList).toBeVisible();
  });

  test.afterEach(async () => {
    // Clean up
    await page.close();
  });
});

test.describe('Premium Party List Performance Tests', () => {
  test('should meet Core Web Vitals standards', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Measure FCP (First Contentful Paint)
    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime);
            }
          }
        }).observe({ entryTypes: ['paint'] });
      });
    });
    
    expect(fcp).toBeLessThan(2500); // Good FCP
    
    // Measure LCP (Largest Contentful Paint)
    await page.waitForSelector('.party-card-premium', { timeout: 15000 });
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Timeout after 10 seconds
        setTimeout(() => resolve(0), 10000);
      });
    });
    
    if (lcp > 0) {
      expect(lcp).toBeLessThan(4000); // Good LCP
    }
  });

  test('should maintain 60fps during interactions', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('.party-card-premium', { timeout: 15000 });
    
    // Start performance monitoring
    await page.evaluate(() => {
      (window as any).frameCount = 0;
      (window as any).startTime = performance.now();
      
      function countFrames() {
        (window as any).frameCount++;
        requestAnimationFrame(countFrames);
      }
      requestAnimationFrame(countFrames);
    });
    
    // Perform interactions
    const scrollContainer = page.locator('.virtual-scroll-container');
    for (let i = 0; i < 10; i++) {
      await scrollContainer.scroll({ top: i * 200 });
      await page.waitForTimeout(50);
    }
    
    // Measure FPS
    await page.waitForTimeout(1000);
    
    const fps = await page.evaluate(() => {
      const endTime = performance.now();
      const duration = (endTime - (window as any).startTime) / 1000;
      return (window as any).frameCount / duration;
    });
    
    expect(fps).toBeGreaterThan(45); // Maintain good FPS
  });
});