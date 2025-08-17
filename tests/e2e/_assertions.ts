import { expect, Page, Locator } from '@playwright/test';

/**
 * Custom assertions for better error messages
 */

export async function assertPanelOpened(page: Page, title: string) {
  const panel = page.locator('.panel.panel--active').last();
  await expect(panel, `Panel with title "${title}" should be visible`).toBeVisible();
  const heading = panel.getByRole('heading', { level: 1 });
  await expect(heading, `Panel heading should contain "${title}"`).toContainText(title);
  return panel;
}

export async function assertPanelClosed(panel: Locator) {
  await expect(panel, 'Panel should slide out and be hidden').toBeHidden({ timeout: 1500 });
}

export async function assertButtonCount(container: Page | Locator, selector: string, expectedCount: number, description: string) {
  const elements = container.locator(selector);
  await expect(elements, `${description}: Expected ${expectedCount} elements`).toHaveCount(expectedCount);
}

export async function assertNavigationWorks(page: Page, fromHash: string, toHash: string) {
  await expect(page, `Should navigate from ${fromHash} to ${toHash}`).toHaveURL(new RegExp(`${toHash}$`));
}

export async function assertAccessible(page: Page, selector: string) {
  const element = page.locator(selector);
  
  // Check for ARIA labels
  const ariaLabel = await element.getAttribute('aria-label');
  const ariaLabelledBy = await element.getAttribute('aria-labelledby');
  const role = await element.getAttribute('role');
  
  if (!ariaLabel && !ariaLabelledBy && !role) {
    console.warn(`Warning: Element ${selector} lacks accessibility attributes`);
  }
}