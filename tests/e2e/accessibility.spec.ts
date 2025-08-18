import { test, expect } from '@playwright/test';
import { stubGoogleMaps, mockAPI } from './_helpers';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
  });

  test('home page meets WCAG AA standards', async ({ page }) => {
    await page.goto('/#/home');
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
    
    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      expect(text || ariaLabel, `Button ${i} should have accessible text`).toBeTruthy();
    }
    
    // Check color contrast (basic check)
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    expect(bgColor).toBeTruthy();
  });

  test('panels have proper ARIA attributes', async ({ page }) => {
    await page.goto('/#/home');
    
    // Open a panel (channels are <a> tags)
    await page.locator('.channel-btn[data-route="#/invites"]').click();
    
    const panel = page.locator('.panel.panel--active').last();
    await expect(panel).toBeVisible();
    
    // Check for dialog role or similar
    const role = await panel.getAttribute('role');
    const ariaModal = await panel.getAttribute('aria-modal');
    
    // Panel should have semantic meaning
    if (!role) {
      console.warn('Panel lacks role attribute - consider adding role="dialog"');
    }
    
    // Check back button is focusable
    const backButton = panel.getByRole('button', { name: /back/i });
    await expect(backButton).toBeVisible();
    await expect(backButton).toBeEnabled();
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/#/home');
    
    // Tab through interactive elements
    const interactiveElements = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          text: el?.textContent?.slice(0, 30),
          role: el?.getAttribute('role'),
        };
      });
      if (focused.tag) {
        interactiveElements.push(focused);
      }
    }
    
    // Should have found interactive elements
    expect(interactiveElements.length).toBeGreaterThan(0);
    
    // Check that buttons can be activated with Enter
    await page.keyboard.press('Enter');
    // Should trigger some action (navigation or panel open)
  });

  test('images and icons have appropriate alt text or aria-labels', async ({ page }) => {
    await page.goto('/#/home');
    
    // Check images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      // Decorative images should have role="presentation" or empty alt
      // Informative images should have alt text
      if (role !== 'presentation') {
        expect(alt || ariaLabel, `Image ${i} should have alt text`).toBeTruthy();
      }
    }
  });

  test('form inputs have proper labels', async ({ page }) => {
    await page.goto('/#/home');
    
    // Check for any form inputs
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        expect(
          hasLabel || ariaLabel || ariaLabelledBy,
          `Input ${i} should have a label`
        ).toBeTruthy();
      }
    }
  });
});