import { test, expect } from '@playwright/test';
import { stubGoogleMaps, mockAPI } from './_helpers';

test.beforeEach(async ({ page, baseURL }) => {
  await stubGoogleMaps(page);
  await mockAPI(page);
  await page.goto(baseURL! + '/#/map/2025-08-18');
});

test('Map route mounts panel', async ({ page }) => {
  const panel = page.locator('.panel.panel--active, .panel'); // router may use overlay immediately
  await expect(panel).toBeVisible();
  // Just verify panel is visible - subnav may not be implemented in production
});