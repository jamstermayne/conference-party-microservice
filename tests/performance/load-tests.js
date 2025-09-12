/**
 * Performance and Load Testing Suite
 * Ensures the application meets performance requirements under various load conditions
 */

const { test, expect } = require('@playwright/test');

// Performance budgets
const PERFORMANCE_BUDGETS = {
  pageLoad: {
    desktop: 2000,  // 2 seconds
    mobile: 3000    // 3 seconds
  },
  apiResponse: {
    matching: 3000,     // 3 seconds for matching
    chat: 500,          // 500ms for chat messages
    gatherings: 2000    // 2 seconds for gathering operations
  },
  metrics: {
    firstContentfulPaint: 1500,
    largestContentfulPaint: 2500,
    timeToInteractive: 3500,
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100
  }
};

// Utility to measure performance
class PerformanceMonitor {
  constructor(page) {
    this.page = page;
    this.metrics = [];
  }
  
  async startMeasurement(name) {
    await this.page.evaluate((measureName) => {
      window.performance.mark(`${measureName}-start`);
    }, name);
  }
  
  async endMeasurement(name) {
    const duration = await this.page.evaluate((measureName) => {
      window.performance.mark(`${measureName}-end`);
      window.performance.measure(
        measureName,
        `${measureName}-start`,
        `${measureName}-end`
      );
      
      const measure = window.performance.getEntriesByName(measureName)[0];
      return measure ? measure.duration : null;
    }, name);
    
    this.metrics.push({ name, duration });
    return duration;
  }
  
  async getCoreWebVitals() {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        let metrics = {};
        
        // First Contentful Paint
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) metrics.firstContentfulPaint = fcp.startTime;
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.largestContentfulPaint = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          metrics.cumulativeLayoutShift = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Time to Interactive (simplified)
        metrics.timeToInteractive = performance.timing.domInteractive - performance.timing.navigationStart;
        
        // First Input Delay (simulated)
        metrics.firstInputDelay = 50; // Would need real user input to measure
        
        setTimeout(() => resolve(metrics), 2000);
      });
    });
  }
  
  getReport() {
    return {
      metrics: this.metrics,
      summary: {
        totalMeasurements: this.metrics.length,
        averageDuration: this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length,
        slowest: this.metrics.sort((a, b) => b.duration - a.duration)[0]
      }
    };
  }
}

// Load simulation utilities
class LoadSimulator {
  constructor() {
    this.results = [];
  }
  
  async simulateConcurrentUsers(testFn, userCount, options = {}) {
    const promises = [];
    const startTime = Date.now();
    
    for (let i = 0; i < userCount; i++) {
      promises.push(
        testFn(i).then(result => ({
          userId: i,
          success: true,
          duration: Date.now() - startTime,
          ...result
        })).catch(error => ({
          userId: i,
          success: false,
          error: error.message,
          duration: Date.now() - startTime
        }))
      );
      
      // Stagger requests if specified
      if (options.staggerMs) {
        await new Promise(resolve => setTimeout(resolve, options.staggerMs));
      }
    }
    
    const results = await Promise.all(promises);
    this.results.push({
      test: testFn.name,
      userCount,
      results,
      summary: this.calculateSummary(results)
    });
    
    return results;
  }
  
  calculateSummary(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const durations = successful.map(r => r.duration);
    
    return {
      totalRequests: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / results.length) * 100,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99)
    };
  }
  
  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
  
  getReport() {
    return this.results;
  }
}

// Performance Tests
test.describe('Performance Tests', () => {
  test('app should load within performance budget', async ({ page }) => {
    const monitor = new PerformanceMonitor(page);
    
    await monitor.startMeasurement('page-load');
    await page.goto('http://localhost:3000');
    
    // Wait for app to be interactive
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 5000 });
    
    const loadTime = await monitor.endMeasurement('page-load');
    
    // Check against budget
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.pageLoad.desktop);
    
    // Get Core Web Vitals
    const vitals = await monitor.getCoreWebVitals();
    
    expect(vitals.firstContentfulPaint).toBeLessThan(PERFORMANCE_BUDGETS.metrics.firstContentfulPaint);
    expect(vitals.largestContentfulPaint).toBeLessThan(PERFORMANCE_BUDGETS.metrics.largestContentfulPaint);
    expect(vitals.timeToInteractive).toBeLessThan(PERFORMANCE_BUDGETS.metrics.timeToInteractive);
    expect(vitals.cumulativeLayoutShift).toBeLessThan(PERFORMANCE_BUDGETS.metrics.cumulativeLayoutShift);
  });
  
  test('matching should complete within budget', async ({ page }) => {
    const monitor = new PerformanceMonitor(page);
    
    await page.goto('http://localhost:3000/matches.html');
    await page.waitForSelector('[data-testid="matches-container"]');
    
    await monitor.startMeasurement('matching');
    await page.click('[data-testid="refresh-matches"]');
    await page.waitForSelector('[data-testid="matches-loaded"]', { timeout: 5000 });
    const matchTime = await monitor.endMeasurement('matching');
    
    expect(matchTime).toBeLessThan(PERFORMANCE_BUDGETS.apiResponse.matching);
    
    // Verify matches were actually loaded
    const matchCount = await page.locator('[data-testid="match-card"]').count();
    expect(matchCount).toBeGreaterThan(0);
  });
  
  test('chat messages should send quickly', async ({ page }) => {
    const monitor = new PerformanceMonitor(page);
    
    await page.goto('http://localhost:3000/test-chat.html');
    
    // Create a test conversation
    await page.evaluate(() => {
      window.RealTimeChatSystem.startConversation('user1', 'user2');
    });
    
    // Measure message send time
    await monitor.startMeasurement('send-message');
    
    await page.evaluate(() => {
      return window.RealTimeChatSystem.sendMessage(
        'user1_user2',
        'user1',
        'Performance test message'
      );
    });
    
    const sendTime = await monitor.endMeasurement('send-message');
    
    expect(sendTime).toBeLessThan(PERFORMANCE_BUDGETS.apiResponse.chat);
  });
  
  test('gathering creation should be responsive', async ({ page }) => {
    const monitor = new PerformanceMonitor(page);
    
    await page.goto('http://localhost:3000/gatherings.html');
    
    await monitor.startMeasurement('gathering-create');
    
    // Open create modal
    await page.click('[data-testid="create-gathering-btn"]');
    await page.waitForSelector('[data-testid="gathering-modal"]');
    
    // Fill in gathering details
    await page.click('[data-testid="gathering-type-coffee"]');
    await page.fill('[data-testid="gathering-title"]', 'Performance Test Gathering');
    await page.fill('[data-testid="gathering-description"]', 'Testing performance');
    await page.selectOption('[data-testid="gathering-venue"]', 'starbucks-hall-6');
    
    // Create gathering
    await page.click('[data-testid="next-button"]');
    await page.click('[data-testid="create-gathering-button"]');
    
    // Wait for success
    await page.waitForSelector('[data-testid="gathering-created-success"]', { timeout: 5000 });
    
    const createTime = await monitor.endMeasurement('gathering-create');
    
    expect(createTime).toBeLessThan(PERFORMANCE_BUDGETS.apiResponse.gatherings);
  });
  
  test('should handle rapid navigation without performance degradation', async ({ page }) => {
    const monitor = new PerformanceMonitor(page);
    
    await page.goto('http://localhost:3000');
    
    const routes = [
      '/matches.html',
      '/gatherings.html',
      '/test-chat.html',
      '/register.html',
      '/'
    ];
    
    const navigationTimes = [];
    
    for (const route of routes) {
      await monitor.startMeasurement(`nav-to-${route}`);
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForLoadState('domcontentloaded');
      const navTime = await monitor.endMeasurement(`nav-to-${route}`);
      navigationTimes.push(navTime);
    }
    
    // Average navigation time should be fast
    const avgNavTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    expect(avgNavTime).toBeLessThan(1000); // 1 second average
    
    // No single navigation should be too slow
    navigationTimes.forEach(time => {
      expect(time).toBeLessThan(2000); // 2 seconds max
    });
  });
});

// Load Tests
test.describe('Load Tests', () => {
  test('should handle concurrent matching requests', async ({ browser }) => {
    const simulator = new LoadSimulator();
    
    const matchingTest = async (userId) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto('http://localhost:3000/matches.html');
      
      const startTime = Date.now();
      
      await page.evaluate((id) => {
        localStorage.setItem('userId', `user_${id}`);
        return fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: `user_${id}`, limit: 10 })
        }).then(r => r.json());
      }, userId);
      
      const duration = Date.now() - startTime;
      
      await context.close();
      
      return { duration };
    };
    
    // Simulate 20 concurrent users
    const results = await simulator.simulateConcurrentUsers(matchingTest, 20, {
      staggerMs: 100 // Stagger by 100ms to avoid overwhelming
    });
    
    const summary = simulator.calculateSummary(results);
    
    // Performance assertions
    expect(summary.successRate).toBeGreaterThan(95); // 95% success rate
    expect(summary.p95).toBeLessThan(5000); // 95th percentile under 5 seconds
    expect(summary.averageDuration).toBeLessThan(3000); // Average under 3 seconds
  });
  
  test('should handle concurrent chat connections', async ({ browser }) => {
    const simulator = new LoadSimulator();
    
    const chatTest = async (userId) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto('http://localhost:3000/test-chat.html');
      
      const startTime = Date.now();
      
      // Simulate chat operations
      await page.evaluate((id) => {
        const chatSystem = window.RealTimeChatSystem;
        chatSystem.userId = `user_${id}`;
        
        // Start a conversation
        return chatSystem.startConversation(`user_${id}`, `user_${id + 1}`);
      }, userId);
      
      const duration = Date.now() - startTime;
      
      await context.close();
      
      return { duration };
    };
    
    // Simulate 50 concurrent chat users
    const results = await simulator.simulateConcurrentUsers(chatTest, 50, {
      staggerMs: 50
    });
    
    const summary = simulator.calculateSummary(results);
    
    expect(summary.successRate).toBeGreaterThan(90);
    expect(summary.p99).toBeLessThan(3000); // 99th percentile under 3 seconds
  });
  
  test('should maintain performance under sustained load', async ({ page }) => {
    const monitor = new PerformanceMonitor(page);
    const measurements = [];
    
    await page.goto('http://localhost:3000');
    
    // Simulate sustained load for 30 seconds
    const endTime = Date.now() + 30000;
    let requestCount = 0;
    
    while (Date.now() < endTime) {
      await monitor.startMeasurement(`request-${requestCount}`);
      
      // Simulate various operations
      const operation = requestCount % 3;
      
      switch (operation) {
        case 0:
          // Navigate to matches
          await page.goto('http://localhost:3000/matches.html');
          break;
        case 1:
          // Navigate to chat
          await page.goto('http://localhost:3000/test-chat.html');
          break;
        case 2:
          // Navigate to gatherings
          await page.goto('http://localhost:3000/gatherings.html');
          break;
      }
      
      const duration = await monitor.endMeasurement(`request-${requestCount}`);
      measurements.push(duration);
      
      requestCount++;
      
      // Small delay between requests
      await page.waitForTimeout(500);
    }
    
    // Calculate performance over time
    const firstThird = measurements.slice(0, Math.floor(measurements.length / 3));
    const lastThird = measurements.slice(-Math.floor(measurements.length / 3));
    
    const avgFirst = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
    const avgLast = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;
    
    // Performance should not degrade significantly over time
    const degradation = ((avgLast - avgFirst) / avgFirst) * 100;
    expect(degradation).toBeLessThan(20); // Less than 20% degradation
  });
});

// Memory Leak Tests
test.describe('Memory Leak Tests', () => {
  test('should not leak memory during repeated operations', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Perform repeated operations
    for (let i = 0; i < 50; i++) {
      // Create and destroy chat conversations
      await page.evaluate(() => {
        const chatSystem = window.RealTimeChatSystem;
        const convId = chatSystem.startConversation('user1', 'user2');
        chatSystem.sendMessage(convId, 'user1', 'Test message ' + Date.now());
      });
      
      // Navigate between pages
      await page.goto('http://localhost:3000/matches.html');
      await page.goto('http://localhost:3000/gatherings.html');
      await page.goto('http://localhost:3000');
      
      // Small delay
      await page.waitForTimeout(100);
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });
    
    // Wait for memory to stabilize
    await page.waitForTimeout(2000);
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Memory increase should be reasonable (less than 50MB)
    const memoryIncrease = finalMemory - initialMemory;
    const increaseInMB = memoryIncrease / (1024 * 1024);
    
    expect(increaseInMB).toBeLessThan(50);
  });
});

// Export utilities for reuse
module.exports = {
  PerformanceMonitor,
  LoadSimulator,
  PERFORMANCE_BUDGETS
};