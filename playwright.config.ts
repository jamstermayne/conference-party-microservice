import { defineConfig, devices } from '@playwright/test';

// Choose base URL via env: PROD by default for now
const BASE_URL = process.env.BASE_URL || 'https://conference-party-app.web.app';
// Mock data by default to make tests deterministic (set E2E_MOCK=0 to hit live)
const E2E_MOCK = process.env.E2E_MOCK !== '0';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5000 },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI 
    ? [['line'], ['html', { open: 'never', outputFolder: 'e2e-report' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'mobile',
      use: { 
        ...devices['iPhone 13'],
      },
    },
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  preserveOutput: 'failures-only',
  updateSnapshots: 'missing',
});