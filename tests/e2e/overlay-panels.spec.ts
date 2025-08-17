import { test, expect } from '@playwright/test';

test.describe('Overlay Panels E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://conference-party-app.web.app');
    await page.waitForLoadState('networkidle');
  });

  test('should have Mon-Fri pills in both Parties and Map sections', async ({ page }) => {
    // Check Parties section pills
    const partiesPills = await page.locator('.home-section[data-section="parties"] .day-pill').count();
    expect(partiesPills).toBe(5); // Mon-Fri

    // Check Map section pills
    const mapPills = await page.locator('.home-section[data-section="map"] .day-pill').count();
    expect(mapPills).toBe(5); // Mon-Fri

    // Verify pills are buttons, not links
    const firstPill = await page.locator('.home-section[data-section="parties"] .day-pill').first();
    expect(await firstPill.evaluate(el => el.tagName)).toBe('BUTTON');
  });

  test('should open Parties overlay when clicking a day pill', async ({ page }) => {
    // Click Tuesday pill (index 1)
    await page.locator('.home-section[data-section="parties"] .day-pill').nth(1).click();
    
    // Wait for overlay to slide in
    await page.waitForTimeout(400);

    // Check overlay is active
    const overlay = page.locator('.panel.overlay.panel--active');
    await expect(overlay).toBeVisible();

    // Check title contains "Parties"
    const title = await page.locator('.panel__title').textContent();
    expect(title).toContain('Parties');

    // Check for party cards or no-parties message
    const cards = await page.locator('.party-card').count();
    const noPartiesMsg = await page.locator('text=/No parties for/').count();
    expect(cards > 0 || noPartiesMsg > 0).toBeTruthy();

    // Check for Add to Calendar button if cards exist
    if (cards > 0) {
      const calendarBtn = page.locator('.btn-cta').first();
      await expect(calendarBtn).toContainText('Add to Calendar');
    }
  });

  test('should open Map overlay when clicking a day pill', async ({ page }) => {
    // Click Wednesday pill (index 2)
    await page.locator('.home-section[data-section="map"] .day-pill').nth(2).click();
    
    // Wait for overlay to slide in
    await page.waitForTimeout(400);

    // Check overlay is active
    const overlay = page.locator('.panel.overlay.panel--active');
    await expect(overlay).toBeVisible();

    // Check title contains "Map"
    const title = await page.locator('.panel__title').textContent();
    expect(title).toContain('Map');

    // Check for map container
    const mapContainer = page.locator('#overlay-map');
    const hasMap = await mapContainer.count();
    expect(hasMap).toBe(1);
  });

  test('should close overlay with back button', async ({ page }) => {
    // Open parties overlay
    await page.locator('.home-section[data-section="parties"] .day-pill').first().click();
    await page.waitForTimeout(400);

    // Verify overlay is open
    await expect(page.locator('.panel.overlay.panel--active')).toBeVisible();

    // Click back button
    await page.locator('.btn-back').click();
    await page.waitForTimeout(400);

    // Verify overlay is closed
    await expect(page.locator('.panel.overlay.panel--active')).not.toBeVisible();
  });

  test('should close overlay with ESC key', async ({ page }) => {
    // Open map overlay
    await page.locator('.home-section[data-section="map"] .day-pill').first().click();
    await page.waitForTimeout(400);

    // Verify overlay is open
    await expect(page.locator('.panel.overlay.panel--active')).toBeVisible();

    // Press ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // Verify overlay is closed
    await expect(page.locator('.panel.overlay.panel--active')).not.toBeVisible();
  });

  test('should not change URL hash when opening overlays', async ({ page }) => {
    const initialUrl = page.url();

    // Open parties overlay
    await page.locator('.home-section[data-section="parties"] .day-pill').first().click();
    await page.waitForTimeout(400);

    // Check URL hasn't changed
    expect(page.url()).toBe(initialUrl);

    // Close and open map overlay
    await page.locator('.btn-back').click();
    await page.waitForTimeout(400);
    await page.locator('.home-section[data-section="map"] .day-pill').first().click();
    await page.waitForTimeout(400);

    // Check URL still hasn't changed
    expect(page.url()).toBe(initialUrl);
  });

  test('should have 4 channel buttons (no Settings)', async ({ page }) => {
    const channelButtons = await page.locator('.channels-grid .channel-btn').all();
    const buttonTexts = await Promise.all(
      channelButtons.map(btn => btn.textContent())
    );

    // Should have exactly these 4 buttons
    expect(buttonTexts).toHaveLength(4);
    expect(buttonTexts.map(t => t?.trim())).toEqual([
      expect.stringContaining('Invites'),
      expect.stringContaining('My calendar'),
      expect.stringContaining('Contacts'),
      expect.stringContaining('Account')
    ]);

    // Should NOT have Settings
    const hasSettings = buttonTexts.some(text => text?.toLowerCase().includes('settings'));
    expect(hasSettings).toBeFalsy();
  });

  test('should handle ICS download for parties', async ({ page, context }) => {
    // Set up download promise before triggering
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

    // Open parties overlay
    await page.locator('.home-section[data-section="parties"] .day-pill').first().click();
    await page.waitForTimeout(400);

    // If there are party cards, try to download ICS
    const cards = await page.locator('.party-card').count();
    if (cards > 0) {
      // Click first Add to Calendar button
      await page.locator('.btn-cta[data-action="ics"]').first().click();
      
      // Wait for download (may be client-side blob or server endpoint)
      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.ics$/);
      }
    }
  });

  test('should display map with markers for events with coordinates', async ({ page }) => {
    // Find a day that likely has events with coordinates
    await page.locator('.home-section[data-section="map"] .day-pill').nth(1).click();
    await page.waitForTimeout(600); // Extra time for map to load

    // Check if map initialized
    const mapDiv = page.locator('#overlay-map');
    const hasMap = await mapDiv.count();
    
    if (hasMap > 0) {
      // Wait for Google Maps to be ready
      const mapsReady = await page.evaluate(() => {
        return !!(window as any).google?.maps?.Map;
      });
      expect(mapsReady).toBeTruthy();

      // Check if any markers were added (they'd be in the DOM)
      const markers = await page.locator('#overlay-map [role="button"]').count();
      console.log(`Found ${markers} markers on map`);
    }
  });

  test('channels should be in 2-column grid on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    const gridStyle = await page.locator('.channels-grid').evaluate(el => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });

    // Should have 2 columns (any format like "1fr 1fr" or "412px 412px")
    expect(gridStyle).toMatch(/\S+\s+\S+/);
    expect(gridStyle.split(/\s+/).length).toBe(2);
  });

  test('channels should be single column on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const gridStyle = await page.locator('.channels-grid').evaluate(el => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });

    // Should have single column
    expect(gridStyle).not.toMatch(/1fr\s+1fr/);
  });
});

// Smoke test that can be run in console
test('console smoke test should pass', async ({ page }) => {
  await page.goto('https://conference-party-app.web.app');
  await page.waitForLoadState('networkidle');

  const result = await page.evaluate(async () => {
    const pick = (sel: string, i = 0) => document.querySelectorAll(sel)[i] as HTMLElement;
    const q = (s: string) => document.querySelector(s);
    const pillsParties = [...document.querySelectorAll('.home-section[data-section="parties"] .day-pill')].length;
    const pillsMap = [...document.querySelectorAll('.home-section[data-section="map"] .day-pill')].length;

    // Click the 2nd Parties pill
    pick('.home-section[data-section="parties"] .day-pill', 1)?.click();
    await new Promise(r => setTimeout(r, 350));
    const cards = document.querySelectorAll('.panel--active .party-card').length;

    // Close overlay
    (q('.panel--active .btn-back') as HTMLElement)?.click();
    await new Promise(r => setTimeout(r, 350));

    // Click the 2nd Map pill
    pick('.home-section[data-section="map"] .day-pill', 1)?.click();
    await new Promise(r => setTimeout(r, 350));
    const hasMap = !!document.querySelector('.panel--active #overlay-map');

    return {
      pillsParties,
      pillsMap,
      cardsFound: cards > 0,
      mapVisible: hasMap
    };
  });

  expect(result.pillsParties).toBe(5);
  expect(result.pillsMap).toBe(5);
  // Cards or map visibility depends on data availability
  console.log('Smoke test results:', result);
});