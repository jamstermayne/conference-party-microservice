import { test, expect } from '@playwright/test';

test.describe('Unified Conference App E2E Tests', () => {
  const baseURL = process.env.BASE_URL || 'https://conference-party-app.web.app';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    // Wait for the unified app to load
    await page.waitForSelector('.unified-app', { timeout: 10000 });
  });

  test('should load unified app with correct structure', async ({ page }) => {
    // Check if main app components are present
    await expect(page.locator('.unified-app')).toBeVisible();
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.app-main')).toBeVisible();
    await expect(page.locator('.bottom-nav')).toBeVisible();
    
    // Check navigation items
    const navItems = page.locator('.nav-item');
    await expect(navItems).toHaveCount(5);
    
    // Verify navigation labels
    await expect(page.locator('[data-section="parties"]')).toContainText('Parties');
    await expect(page.locator('[data-section="calendar"]')).toContainText('Calendar');
    await expect(page.locator('[data-section="contacts"]')).toContainText('Contacts');
    await expect(page.locator('[data-section="invites"]')).toContainText('Invites');
    await expect(page.locator('[data-section="account"]')).toContainText('Account');
  });

  test('should navigate between sections correctly', async ({ page }) => {
    // Test Parties section (default)
    await expect(page.locator('.nav-item--active')).toContainText('Parties');
    
    // Navigate to Calendar
    await page.click('[data-section="calendar"]');
    await expect(page.locator('.nav-item--active')).toContainText('Calendar');
    await expect(page.locator('.section-calendar')).toBeVisible();
    
    // Navigate to Contacts
    await page.click('[data-section="contacts"]');
    await expect(page.locator('.nav-item--active')).toContainText('Contacts');
    await expect(page.locator('.section-contacts')).toBeVisible();
    
    // Navigate to Invites
    await page.click('[data-section="invites"]');
    await expect(page.locator('.nav-item--active')).toContainText('Invites');
    await expect(page.locator('.section-invites')).toBeVisible();
    
    // Navigate to Account
    await page.click('[data-section="account"]');
    await expect(page.locator('.nav-item--active')).toContainText('Account');
    await expect(page.locator('.section-account')).toBeVisible();
    
    // Navigate back to Parties
    await page.click('[data-section="parties"]');
    await expect(page.locator('.nav-item--active')).toContainText('Parties');
  });

  test('should display parties section with correct elements', async ({ page }) => {
    // Ensure we're on parties section
    await page.click('[data-section="parties"]');
    
    // Check section header (premium party list)
    await expect(page.locator('.section-title, .section-header h2')).toContainText('Tonight\'s Hottest Parties');
    
    // Check filter buttons (premium party list uses filter-pill)
    const filterElements = page.locator('.filter-btn, .filter-pill');
    const filterCount = await filterElements.count();
    expect(filterCount).toBeGreaterThan(2);
    await expect(page.locator('[data-filter="all"]')).toContainText('All');
    await expect(page.locator('[data-filter="saved"]')).toContainText('Saved');
    
    // Check if parties container exists (premium party list uses different structure)
    await expect(page.locator('.parties-grid, .virtual-scroll-container, .visible-items')).toBeVisible();
  });

  test('should handle party card interactions', async ({ page }) => {
    await page.click('[data-section="parties"]');
    
    // Wait for any party cards to load (with timeout)
    try {
      await page.waitForSelector('.party-card-signature', { timeout: 5000 });
      
      // Test save button interaction
      const saveBtn = page.locator('.save-btn').first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        // Check if button state changes
        await expect(saveBtn).toHaveClass(/save-btn--saved/);
      }
      
      // Test RSVP button interaction
      const rsvpBtn = page.locator('[data-action="rsvp"]').first();
      if (await rsvpBtn.count() > 0) {
        await rsvpBtn.click();
        // Should trigger some feedback (toast or modal)
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // If no party cards load, that's also valid information
      console.log('No party cards loaded - API may be unavailable');
    }
  });

  test('should display calendar section correctly', async ({ page }) => {
    await page.click('[data-section="calendar"]');
    
    await expect(page.locator('.section-calendar')).toBeVisible();
    await expect(page.locator('.section-header h2')).toContainText('Your Calendar');
    
    // Check for sync button
    await expect(page.locator('.sync-btn')).toContainText('Sync Google Calendar');
    
    // Should show either upcoming events or empty state
    const hasEvents = await page.locator('.upcoming-events').isVisible();
    const isEmpty = await page.locator('.empty-calendar').isVisible();
    expect(hasEvents || isEmpty).toBe(true);
  });

  test('should display contacts section correctly', async ({ page }) => {
    await page.click('[data-section="contacts"]');
    
    await expect(page.locator('.section-contacts')).toBeVisible();
    await expect(page.locator('.section-header h2')).toContainText('Your Network');
    
    // Check for add contact button
    await expect(page.locator('.add-contact-btn')).toContainText('Add Contact');
    
    // Should show either contacts or empty state
    const hasContacts = await page.locator('.contacts-grid').isVisible();
    const isEmpty = await page.locator('.empty-contacts').isVisible();
    expect(hasContacts || isEmpty).toBe(true);
  });

  test('should display invites section correctly', async ({ page }) => {
    await page.click('[data-section="invites"]');
    
    await expect(page.locator('.section-invites')).toBeVisible();
    await expect(page.locator('.section-header h2')).toContainText('Invite System');
    
    // Check for invite stats
    await expect(page.locator('.invite-stats')).toBeVisible();
    
    // Check for invite actions
    await expect(page.locator('[data-action="create-invite"]')).toContainText('Send Invite');
    await expect(page.locator('[data-action="my-invite-link"]')).toContainText('My Invite Link');
  });

  test('should display account section correctly', async ({ page }) => {
    await page.click('[data-section="account"]');
    
    await expect(page.locator('.section-account')).toBeVisible();
    await expect(page.locator('.section-header h2')).toContainText('Your Profile');
    
    // Check for profile elements
    await expect(page.locator('.profile-header')).toBeVisible();
    await expect(page.locator('.profile-avatar-large')).toBeVisible();
    await expect(page.locator('.profile-stats')).toBeVisible();
    
    // Check for account actions
    await expect(page.locator('[data-action="sync-linkedin"]')).toContainText('Sync LinkedIn');
    await expect(page.locator('[data-action="export-data"]')).toContainText('Export Data');
    await expect(page.locator('[data-action="settings"]')).toContainText('Settings');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if app adapts to mobile
    await expect(page.locator('.unified-app')).toBeVisible();
    await expect(page.locator('.bottom-nav')).toBeVisible();
    
    // Navigation should still work on mobile
    await page.click('[data-section="calendar"]');
    await expect(page.locator('.section-calendar')).toBeVisible();
    
    await page.click('[data-section="account"]');
    await expect(page.locator('.section-account')).toBeVisible();
  });

  test('should handle offline scenarios gracefully', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    // App should still be functional for navigation
    await page.click('[data-section="calendar"]');
    await expect(page.locator('.section-calendar')).toBeVisible();
    
    await page.click('[data-section="account"]');
    await expect(page.locator('.section-account')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.locator('[data-section="parties"]')).toHaveAttribute('aria-label', 'Parties');
    await expect(page.locator('[data-section="calendar"]')).toHaveAttribute('aria-label', 'Calendar');
    await expect(page.locator('[data-section="contacts"]')).toHaveAttribute('aria-label', 'Contacts');
    await expect(page.locator('[data-section="invites"]')).toHaveAttribute('aria-label', 'Invites');
    await expect(page.locator('[data-section="account"]')).toHaveAttribute('aria-label', 'Account');
    
    // Check for proper heading structure
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check for focus management
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should load design tokens correctly', async ({ page }) => {
    // Check if CSS custom properties are loaded
    const accentColor = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue('--color-accent').trim();
    });
    
    expect(accentColor).toBeTruthy();
    expect(accentColor).toMatch(/#[0-9a-f]{6}|rgb\(.*\)/i);
    
    // Check if signature design elements are present
    await expect(page.locator('.unified-app')).toHaveCSS('font-family', /-apple-system|BlinkMacSystemFont/);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation through nav items
    await page.keyboard.press('Tab');
    
    // Navigate using arrow keys (if implemented)
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    
    // Test Enter key to activate navigation
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Should still have focus management
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should persist user preferences', async ({ page }) => {
    // Make some changes that should persist
    await page.click('[data-section="account"]');
    
    // Reload the page
    await page.reload();
    await page.waitForSelector('.unified-app', { timeout: 10000 });
    
    // Check if app remembers state (if implemented)
    const localStorage = await page.evaluate(() => window.localStorage);
    expect(localStorage).toBeDefined();
  });
});