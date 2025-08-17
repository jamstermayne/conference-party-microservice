import { test, expect } from '@playwright/test';
import { stubGoogleMaps, mockAPI } from './_helpers';
import { HomePage } from './pages/HomePage';
import { PanelPage } from './pages/PanelPage';
import { assertPanelOpened, assertPanelClosed, assertButtonCount } from './_assertions';

test.describe('Home Page - Optimized', () => {
  test.beforeEach(async ({ page }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
    await page.goto('/#/home');
  });

  test('displays correct structure and navigation elements', async ({ page }) => {
    const home = new HomePage(page);
    
    // Check headings
    await expect(home.getPartiesHeading()).toBeVisible();
    await expect(home.getMapHeading()).toBeVisible();
    
    // Check pill counts with better assertion
    await assertButtonCount(home.partiesSection, '.day-pill', 6, 'Parties section pills');
    await assertButtonCount(home.mapSection, '.day-pill', 6, 'Map section pills');
    
    // Verify buttons are actual button elements
    const firstPill = home.partiesPills.first();
    await expect(firstPill).toHaveJSProperty('tagName', 'BUTTON');
  });

  test('channel navigation grid has all required channels', async ({ page }) => {
    const home = new HomePage(page);
    
    const expectedChannels = [
      { icon: '📍', label: 'Map' },
      { icon: '📅', label: 'calendar' },
      { icon: '✉️', label: 'Invites' },
      { icon: '👥', label: 'Contacts' },
      { icon: '👤', label: 'Me' },
      { icon: '⚙️', label: 'Settings' },
    ];
    
    for (const channel of expectedChannels) {
      const button = page.getByRole('button', { 
        name: new RegExp(`${channel.icon}.*${channel.label}`, 'i') 
      });
      await expect(button, `Channel ${channel.label} should exist`).toBeVisible();
    }
  });

  test('parties panel interaction flow', async ({ page }) => {
    const home = new HomePage(page);
    const panel = new PanelPage(page);
    
    // Click first day pill
    await home.clickPartiesPill(0);
    
    // Verify panel opened with correct title
    await assertPanelOpened(page, 'Parties');
    
    // Check cards are rendered
    const cardCount = await panel.getCardCount();
    expect(cardCount, 'Should have mocked party cards').toBe(2);
    
    // Verify first card content
    const firstCardText = await panel.getCardText(0);
    expect(firstCardText).toContain('Party A');
    
    // Test back navigation
    await panel.goBack();
    await assertPanelClosed(panel.panel);
  });

  test('map panel interaction flow', async ({ page }) => {
    const home = new HomePage(page);
    const panel = new PanelPage(page);
    
    // Click a middle day pill for variety
    await home.clickMapPill(2);
    
    // Verify panel opened
    await assertPanelOpened(page, 'Map');
    
    // Test back navigation
    await panel.goBack();
    await assertPanelClosed(panel.panel);
  });
});

test.describe('Channel Navigation - Optimized', () => {
  test.beforeEach(async ({ page }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
    await page.goto('/#/home');
  });

  const channels = [
    { icon: '✉️', label: 'Invites', expectedTitle: 'Invites' },
    { icon: '📅', label: 'My calendar', expectedTitle: 'calendar' },
    { icon: '👥', label: 'Contacts', expectedTitle: 'Contacts' },
    { icon: '👤', label: 'Me', expectedTitle: 'Me' },
    { icon: '⚙️', label: 'Settings', expectedTitle: 'Settings' },
  ];

  for (const channel of channels) {
    test(`${channel.label} channel opens correct panel`, async ({ page }) => {
      const home = new HomePage(page);
      const panel = new PanelPage(page);
      
      await home.clickChannel(channel.icon, channel.label);
      await panel.waitForPanel();
      
      const title = await panel.getTitle();
      expect(title).toContain(channel.expectedTitle);
      
      await panel.goBack();
      await panel.waitForPanelHidden();
    });
  }
});