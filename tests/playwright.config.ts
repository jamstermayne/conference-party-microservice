import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: process.env.PREVIEW_URL || 'https://conference-party-app.web.app',
    trace: 'on-first-retry',
    viewport: { width: 390, height: 844 } // iPhone-ish
  },
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'WebKit', use: { ...devices['Desktop Safari'] } }
  ]
});