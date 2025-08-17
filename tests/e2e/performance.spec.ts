import { test, expect } from '@playwright/test';
import { stubGoogleMaps, mockAPI } from './_helpers';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
  });

  test('page load performance metrics', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/#/home');
    
    // Wait for main content
    await page.waitForSelector('.home-section', { timeout: 5000 });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime, 'Page should load within 3 seconds').toBeLessThan(3000);
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
    
    // Performance assertions
    expect(metrics.firstContentfulPaint, 'FCP should be under 1.5s').toBeLessThan(1500);
    expect(metrics.domContentLoaded, 'DOM should be ready quickly').toBeLessThan(500);
  });

  test('panel animation performance', async ({ page }) => {
    await page.goto('/#/home');
    
    // Measure panel open animation
    const openStart = Date.now();
    await page.locator('.channel-btn[data-route="#/invites"]').click();
    await page.locator('.panel.panel--active').last().waitFor({ state: 'visible' });
    const openTime = Date.now() - openStart;
    
    expect(openTime, 'Panel should open within 700ms').toBeLessThan(700);
    
    // Measure panel close animation
    const closeStart = Date.now();
    await page.getByRole('button', { name: /back/i }).click();
    await page.waitForTimeout(300); // Wait for animation
    const closeTime = Date.now() - closeStart;
    
    expect(closeTime, 'Panel should close smoothly').toBeLessThan(800);
  });

  test('no memory leaks on navigation', async ({ page }) => {
    await page.goto('/#/home');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Perform multiple navigations
    for (let i = 0; i < 5; i++) {
      await page.locator('.channel-btn[data-route="#/invites"]').click();
      await page.waitForTimeout(100);
      const backButton = page.locator('.panel__back').first();
      if (await backButton.isVisible()) {
        await backButton.click();
      }
      await page.waitForTimeout(100);
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if (typeof window.gc === 'function') window.gc();
    });
    
    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory;
      const percentIncrease = (memoryIncrease / initialMemory) * 100;
      
      // Allow for some memory growth but flag potential leaks
      if (percentIncrease > 50) {
        console.warn(`Memory increased by ${percentIncrease.toFixed(1)}% - potential leak`);
      }
    }
  });

  test('resource loading optimization', async ({ page }) => {
    const resources: any[] = [];
    
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      const size = response.headers()['content-length'];
      
      if (url.includes('.js') || url.includes('.css')) {
        resources.push({
          url: url.split('/').pop(),
          status,
          size: size ? parseInt(size) : 0,
        });
      }
    });
    
    await page.goto('/#/home');
    await page.waitForLoadState('networkidle');
    
    // Check resource counts
    const jsFiles = resources.filter(r => r.url.endsWith('.js'));
    const cssFiles = resources.filter(r => r.url.endsWith('.css'));
    
    expect(jsFiles.length, 'Should have reasonable number of JS files').toBeLessThanOrEqual(10);
    expect(cssFiles.length, 'Should have reasonable number of CSS files').toBeLessThanOrEqual(5);
    
    // Check for compression
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    expect(totalSize, 'Total resource size should be under 500KB').toBeLessThan(500000);
  });

  test('smooth scrolling performance', async ({ page }) => {
    await page.goto('/#/home');
    
    // Add many items to create scrollable content
    await page.evaluate(() => {
      const container = document.querySelector('.home-wrap');
      if (container) {
        for (let i = 0; i < 50; i++) {
          const div = document.createElement('div');
          div.style.height = '100px';
          div.textContent = `Item ${i}`;
          container.appendChild(div);
        }
      }
    });
    
    // Measure scroll performance
    const scrollStart = Date.now();
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
    await page.waitForTimeout(500);
    const scrollTime = Date.now() - scrollStart;
    
    expect(scrollTime, 'Scrolling should be smooth').toBeLessThan(600);
    
    // Check for janky frames
    const frameMetrics = await page.evaluate(() => {
      const observer = new PerformanceObserver(() => {});
      observer.observe({ entryTypes: ['frame'] });
      const entries = observer.takeRecords();
      return entries.length;
    });
    
    // Note: This is a simplified check - real frame metrics require more setup
    console.log(`Rendered ${frameMetrics} frames during test`);
  });
});