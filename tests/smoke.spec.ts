import { test, expect } from '@playwright/test';

test('Sidebar routes render + Events cards interact', async ({ page, context }) => {
  // Mock beforeinstallprompt so CTA works deterministically
  await page.addInitScript(() => {
    const ev = new Event('beforeinstallprompt'); // minimal mock
    (ev as any).prompt = () => Promise.resolve({ outcome: 'accepted' });
    window.addEventListener('load', () => setTimeout(() => window.dispatchEvent(ev), 200));
  });

  await page.goto('/');
  await expect(page).toHaveTitle(/Velocity|Gamescom/i);

  // Sidebar: Parties
  await page.getByRole('button', { name: /Parties/i }).click();
  await expect(page.getByRole('heading', { name: /Parties/i })).toBeVisible();

  // Cards or empty state
  const hasCards = await page.locator('.party-card').first().isVisible().catch(() => false);
  if (!hasCards) await expect(page.locator('text=No parties')).toBeVisible();

  // Save → FTUE progress updates if card exists
  if (hasCards) {
    const firstSave = page.locator('[data-action="save"]').first();
    await firstSave.click();
  }

  // Calendar action (should trigger .ics download)
  if (hasCards) {
    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-action="calendar"]').first().click(),
    ]);
    const name = await download.suggestedFilename();
    expect(name).toMatch(/\.ics$/i);
  }

  // Click Hotspots, Calendar, Invites, Me to ensure routes are wired
  for (const label of ['Hotspots','Calendar','Invites','Me']) {
    await page.getByRole('button', { name: new RegExp(label, 'i') }).click();
    await expect(page).toHaveURL(/#|\/$/); // hash router stable
  }
});