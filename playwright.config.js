/**
 * Playwright Configuration
 * Defines test settings, projects, and reporters for E2E testing
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory
  testDir: './tests',
  
  // Test match patterns
  testMatch: [
    '**/e2e/**/*.spec.js',
    '**/integration/**/*.test.js',
    '**/performance/**/*.test.js'
  ],
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Maximum time the whole test suite can run
  globalTimeout: 60 * 60 * 1000, // 1 hour
  
  // Number of workers for parallel execution
  workers: process.env.CI ? 2 : 4,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line']
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for all tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Emulate viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Timeout for each action
    actionTimeout: 10 * 1000,
    
    // Timeout for navigation
    navigationTimeout: 30 * 1000
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Custom Chrome settings
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        }
      },
    },
    
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
    },
    
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile viewport
        viewport: { width: 393, height: 851 }
      },
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // iOS viewport
        viewport: { width: 390, height: 844 }
      },
    },
    
    // Performance testing project
    {
      name: 'Performance',
      testMatch: '**/performance/**/*.test.js',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--js-flags=--expose-gc'
          ]
        }
      },
      timeout: 60 * 1000, // Longer timeout for performance tests
    },
    
    // Load testing project
    {
      name: 'Load Testing',
      testMatch: '**/performance/load-tests.js',
      workers: 1, // Run load tests serially
      timeout: 120 * 1000, // 2 minutes for load tests
    }
  ],
  
  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 1,
  
  // Fail the build on test failure in CI
  forbidOnly: !!process.env.CI,
  
  // Global setup
  globalSetup: './tests/setup/global-setup.js',
  
  // Global teardown
  globalTeardown: './tests/setup/global-teardown.js',
});