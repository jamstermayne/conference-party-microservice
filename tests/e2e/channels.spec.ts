import { test, expect } from '@playwright/test';
import { stubGoogleMaps, mockAPI } from './_helpers';

test.beforeEach(async ({ page, baseURL }) => {
  await stubGoogleMaps(page);
  await mockAPI(page);
  await page.goto(baseURL! + '/#/home');
});

for (const [label, icon, route] of [
  ['Invites', '✉️', 'invites'],
  ['My calendar', '📅', 'calendar'],
  ['Contacts', '👥', 'contacts'],
  ['Me', '👤', 'me'],
  ['Settings', '⚙️', 'settings'],
]) {
  test(`Channel: ${label} opens slide-in panel`, async ({ page }) => {
    // Channels are <a> tags with data-route attribute
    const channel = page.locator(`.channel-btn[data-route="#/${route}"]`);
    await channel.click();
    // Use last() to get the most recent panel (the one that just opened)
    const panel = page.locator('.panel.panel--active').last();
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('heading', { level: 1 })).toBeVisible();
    await panel.getByRole('button', { name: /back/i }).click();
  });
}