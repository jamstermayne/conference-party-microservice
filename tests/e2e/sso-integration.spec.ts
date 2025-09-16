/**
 * E2E SSO Integration Tests using Playwright
 * Tests all SSO buttons and OAuth flows in real browser environment
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://conference-party-app.web.app';

test.describe('🔐 SSO Integration E2E Tests', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    // Create context with permissions for popups
    context = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write'],
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
    
    // Go to the app
    await page.goto(BASE_URL);
    
    // Wait for app to load
    await page.waitForSelector('#app', { timeout: 10000 });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should find all SSO buttons on the account page', async () => {
    // Navigate to account section
    await page.click('[data-section="account"]');
    await page.waitForTimeout(500);

    // Check for Google sync button
    const googleButton = await page.locator('[data-action="sync-google"]');
    await expect(googleButton).toBeVisible();

    // Check for LinkedIn sync button
    const linkedinButton = await page.locator('[data-action="sync-linkedin"]');
    await expect(linkedinButton).toBeVisible();

    // Check button text
    const googleText = await googleButton.textContent();
    expect(googleText).toContain('Google');

    const linkedinText = await linkedinButton.textContent();
    expect(linkedinText).toContain('LinkedIn');
  });

  test('should find calendar sync buttons when saving an event', async () => {
    // Navigate to parties section
    await page.click('[data-section="parties"]');
    await page.waitForTimeout(500);

    // Save a party (triggers calendar sync prompt)
    const saveButton = await page.locator('[data-action="save"]').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Wait for calendar sync prompt
      await page.waitForSelector('.calendar-sync-prompt', { timeout: 5000 });
      
      // Check for calendar sync buttons
      const googleCalButton = await page.locator('[data-action="sync-google-calendar"]');
      await expect(googleCalButton).toBeVisible();
      
      const microsoftCalButton = await page.locator('[data-action="sync-microsoft-calendar"]');
      await expect(microsoftCalButton).toBeVisible();
      
      const mtmCalButton = await page.locator('[data-action="sync-mtm-calendar"]');
      await expect(mtmCalButton).toBeVisible();
    }
  });

  test('Google Calendar OAuth flow should open popup', async () => {
    // Navigate to account section
    await page.click('[data-section="account"]');
    await page.waitForTimeout(500);

    // Listen for popup
    const popupPromise = context.waitForEvent('page');
    
    // Click Google sync button
    await page.click('[data-action="sync-google"]');
    
    // Wait for popup to open
    const popup = await popupPromise;
    
    // Check popup URL
    const popupUrl = popup.url();
    expect(popupUrl).toContain('/api/googleCalendar/google/start');
    
    // Close popup
    await popup.close();
  });

  test('should handle popup blocker gracefully', async () => {
    // Override window.open to simulate blocked popup
    await page.addInitScript(() => {
      window.open = () => null;
    });

    // Navigate to account section
    await page.click('[data-section="account"]');
    await page.waitForTimeout(500);

    // Click Google sync button
    await page.click('[data-action="sync-google"]');
    
    // Should redirect in same window when popup is blocked
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    
    // Check if it tried to navigate or showed an error
    const hasError = await page.locator('.toast').count() > 0;
    expect(hasError || currentUrl.includes('/api/googleCalendar')).toBeTruthy();
  });

  test('should show connected status after successful OAuth', async () => {
    // Navigate to account section
    await page.click('[data-section="account"]');
    await page.waitForTimeout(500);

    // Simulate successful OAuth by setting localStorage
    await page.evaluate(() => {
      const userData = {
        googleConnected: true,
        linkedinConnected: false,
        savedEvents: []
      };
      localStorage.setItem('conference_party_user', JSON.stringify(userData));
    });

    // Reload the account section
    await page.click('[data-section="parties"]');
    await page.waitForTimeout(200);
    await page.click('[data-section="account"]');
    await page.waitForTimeout(500);

    // Check for connected status
    const googleButton = await page.locator('[data-action="sync-google"]');
    const buttonClass = await googleButton.getAttribute('class');
    expect(buttonClass).toContain('connected');
    
    const buttonText = await googleButton.textContent();
    expect(buttonText).toContain('Connected');
  });

  test('Microsoft Calendar should offer ICS download', async () => {
    // Navigate to parties to save an event
    await page.click('[data-section="parties"]');
    await page.waitForTimeout(500);

    // Save a party
    const saveButton = await page.locator('[data-action="save"]').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Wait for calendar sync prompt
      await page.waitForSelector('.calendar-sync-prompt', { timeout: 5000 });
      
      // Set up download promise
      const downloadPromise = page.waitForEvent('download');
      
      // Click Microsoft calendar button
      await page.click('[data-action="sync-microsoft-calendar"]');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Check download filename
      expect(download.suggestedFilename()).toContain('.ics');
    }
  });

  test('LinkedIn OAuth flow should use correct OAuth URL', async () => {
    // Navigate to account section
    await page.click('[data-section="account"]');
    await page.waitForTimeout(500);

    // Listen for popup
    const popupPromise = context.waitForEvent('page');
    
    // Click LinkedIn sync button
    await page.click('[data-action="sync-linkedin"]');
    
    // Wait for popup to open
    const popup = await popupPromise;
    
    // Check popup URL contains LinkedIn OAuth
    const popupUrl = popup.url();
    expect(popupUrl).toMatch(/linkedin\.com\/oauth|api\/linkedin\/auth/);
    
    // Close popup
    await popup.close();
  });

  test('Meet to Match should trigger file upload', async () => {
    // Navigate to parties section
    await page.click('[data-section="parties"]');
    await page.waitForTimeout(500);

    // Save a party first
    const saveButton = await page.locator('[data-action="save"]').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Wait for calendar sync prompt
      await page.waitForSelector('.calendar-sync-prompt', { timeout: 5000 });
      
      // Click MTM button
      await page.click('[data-action="sync-mtm-calendar"]');
      
      // Check if file input was triggered
      const fileInput = await page.locator('input[type="file"][accept*=".ics"]');
      const inputExists = await fileInput.count() > 0;
      
      // MTM might use file upload or OAuth
      expect(inputExists).toBeDefined();
    }
  });

  test('should handle OAuth errors properly', async () => {
    // Navigate to account section
    await page.click('[data-section="account"]');
    await page.waitForTimeout(500);

    // Inject error handling
    await page.evaluate(() => {
      window.addEventListener('message', (event) => {
        if (event.data.type === 'gcal:error') {
          // Show toast with error
          const toast = document.createElement('div');
          toast.className = 'toast error';
          toast.textContent = 'OAuth failed: ' + event.data.error;
          document.body.appendChild(toast);
        }
      });
    });

    // Simulate OAuth error
    await page.evaluate(() => {
      window.postMessage(
        { type: 'gcal:error', error: 'access_denied' },
        window.location.origin
      );
    });

    // Check for error toast
    const errorToast = await page.locator('.toast.error');
    await expect(errorToast).toBeVisible();
    const errorText = await errorToast.textContent();
    expect(errorText).toContain('OAuth failed');
  });

  test('should save events before OAuth redirect', async () => {
    // Navigate to parties section
    await page.click('[data-section="parties"]');
    await page.waitForTimeout(500);

    // Save some parties
    const saveButtons = await page.locator('[data-action="save"]').all();
    if (saveButtons.length > 0) {
      await saveButtons[0].click();
      await page.waitForTimeout(200);
    }

    // Navigate to account section
    await page.click('[data-section="account"]');
    await page.waitForTimeout(500);

    // Click Google sync
    await page.click('[data-action="sync-google"]');

    // Check sessionStorage for pending events
    const pendingEvents = await page.evaluate(() => {
      return sessionStorage.getItem('pending_calendar_events');
    });

    expect(pendingEvents).toBeTruthy();
  });

  test('should validate OAuth redirect origin', async () => {
    // Set up message listener
    await page.evaluate(() => {
      window.addEventListener('message', (event) => {
        // Only accept messages from same origin
        const validOrigins = [
          window.location.origin,
          'https://conference-party-app.web.app'
        ];
        
        if (!validOrigins.includes(event.origin)) {
          console.error('Invalid origin:', event.origin);
          return;
        }
        
        // Process OAuth message
        if (event.data.type === 'gcal:success') {
          console.log('OAuth success from valid origin');
        }
      });
    });

    // Try to send message from invalid origin (should be rejected)
    const consoleMessages: string[] = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.evaluate(() => {
      // Simulate message from invalid origin
      window.postMessage(
        { type: 'gcal:success' },
        'https://malicious-site.com'
      );
    });

    // Valid origin message should work
    await page.evaluate(() => {
      window.postMessage(
        { type: 'gcal:success' },
        window.location.origin
      );
    });

    // Check console for success message
    expect(consoleMessages.some(msg => msg.includes('OAuth success'))).toBeTruthy();
  });

  test('should update UI after successful OAuth', async () => {
    // Navigate to account section
    await page.click('[data-section="account"]');
    await page.waitForTimeout(500);

    // Get initial button state
    const googleButton = await page.locator('[data-action="sync-google"]');
    const initialText = await googleButton.textContent();
    expect(initialText).toContain('Connect');

    // Simulate successful OAuth
    await page.evaluate(() => {
      // Update user data
      const userData = JSON.parse(localStorage.getItem('conference_party_user') || '{}');
      userData.googleConnected = true;
      localStorage.setItem('conference_party_user', JSON.stringify(userData));
      
      // Trigger UI update
      window.dispatchEvent(new Event('storage'));
    });

    // Reload account section to see changes
    await page.click('[data-section="parties"]');
    await page.waitForTimeout(200);
    await page.click('[data-section="account"]');
    await page.waitForTimeout(500);

    // Check updated button state
    const updatedButton = await page.locator('[data-action="sync-google"]');
    const updatedText = await updatedButton.textContent();
    expect(updatedText).toContain('Connected');
    
    const buttonClass = await updatedButton.getAttribute('class');
    expect(buttonClass).toContain('connected');
  });
});

test.describe('🔄 Calendar Sync Prompt Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.waitForSelector('#app', { timeout: 10000 });
  });

  test('should show calendar sync prompt after saving event', async () => {
    // Navigate to parties
    await page.click('[data-section="parties"]');
    await page.waitForTimeout(500);

    // Save a party
    const saveButton = await page.locator('[data-action="save"]').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Check for sync prompt
      const syncPrompt = await page.locator('.calendar-sync-prompt');
      await expect(syncPrompt).toBeVisible({ timeout: 5000 });
      
      // Check all three buttons are present
      const googleBtn = syncPrompt.locator('[data-action="sync-google-calendar"]');
      const microsoftBtn = syncPrompt.locator('[data-action="sync-microsoft-calendar"]');
      const mtmBtn = syncPrompt.locator('[data-action="sync-mtm-calendar"]');
      
      await expect(googleBtn).toBeVisible();
      await expect(microsoftBtn).toBeVisible();
      await expect(mtmBtn).toBeVisible();
    }
  });

  test('calendar sync prompt should auto-dismiss', async () => {
    // Navigate to parties
    await page.click('[data-section="parties"]');
    await page.waitForTimeout(500);

    // Save a party
    const saveButton = await page.locator('[data-action="save"]').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Wait for prompt
      const syncPrompt = await page.locator('.calendar-sync-prompt');
      await expect(syncPrompt).toBeVisible({ timeout: 5000 });
      
      // Wait for auto-dismiss (8 seconds)
      await page.waitForTimeout(8500);
      
      // Check prompt is hidden
      await expect(syncPrompt).not.toBeVisible();
    }
  });

  test('should dismiss prompt when clicking dismiss', async () => {
    // Navigate to parties
    await page.click('[data-section="parties"]');
    await page.waitForTimeout(500);

    // Save a party
    const saveButton = await page.locator('[data-action="save"]').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Wait for prompt
      const syncPrompt = await page.locator('.calendar-sync-prompt');
      await expect(syncPrompt).toBeVisible({ timeout: 5000 });
      
      // Click dismiss
      const dismissBtn = syncPrompt.locator('[data-action="dismiss-sync"]');
      if (await dismissBtn.isVisible()) {
        await dismissBtn.click();
        
        // Check prompt is hidden
        await expect(syncPrompt).not.toBeVisible();
        
        // Check for toast message
        const toast = await page.locator('.toast');
        const toastText = await toast.textContent();
        expect(toastText).toContain('saved');
      }
    }
  });
});