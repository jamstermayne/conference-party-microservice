import { test, expect } from '@playwright/test';

test.describe('PWA Smoke', () => {
  test('boots and shows sidebar', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Velocity|Gamescom/i);
    await expect(page.locator('aside [data-route="parties"]')).toBeVisible();
  });

  test('routes render headers', async ({ page }) => {
    await page.goto('/#parties');
    await page.waitForLoadState('domcontentloaded');

    const routes = ['parties', 'hotspots', 'opportunities', 'calendar', 'invites', 'me', 'settings'];
    for (const r of routes) {
      await page.locator(`aside [data-route="${r}"]`).click();
      await page.waitForTimeout(150); // small view transition
      // Expect a visible main header (we allow different titles per route)
      const header = page.locator('main h1, main .page-title, [data-route].active h1');
      await expect(header).toBeVisible();
    }
  });

  test('parties list or empty state', async ({ page }) => {
    await page.goto('/#parties');
    const cards = page.locator('.party-card, .event-card');
    const empty = page.locator('.inv-empty, .card-empty, [role="status"]:has-text("Nothing to show")');
    await expect(cards.or(empty)).toBeVisible();
  });

  test('install CTA is operable (mock beforeinstallprompt)', async ({ page }) => {
    await page.addInitScript(() => {
      // Minimal beforeinstallprompt mock
      const e = new Event('beforeinstallprompt') as any;
      e.prompt = () => Promise.resolve();
      e.userChoice = Promise.resolve({ outcome: 'accepted' });
      window.addEventListener('load', () => setTimeout(() => window.dispatchEvent(e), 200));
    });
    await page.goto('/');
    // Either a button with install text or the card CTA
    const cta = page.locator('button:has-text("Install"), [data-action="install"], .install-card button');
    await expect(cta).toBeVisible({ timeout: 5000 });
    await cta.first().click();
    // Expect some visible confirmation toast/aria-live update
    const toast = page.locator('#aria-live');
    await expect(toast).toContainText(/installed|install|added/i, { timeout: 3000 });
  });

  test('calendar .ics link triggers download UX', async ({ page }) => {
    await page.goto('/#calendar');
    // Accept either "Add to Apple Calendar" or generic "Add to Calendar"
    const ics = page.locator('a[href$=".ics"], a:has-text("Apple Calendar"), a:has-text("Outlook")');
    await expect(ics).toBeVisible();
    const href = await ics.first().getAttribute('href');
    expect(href).toBeTruthy();
  });
});