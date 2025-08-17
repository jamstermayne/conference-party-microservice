import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly partiesSection: Locator;
  readonly mapSection: Locator;
  readonly channelButtons: Locator;
  readonly partiesPills: Locator;
  readonly mapPills: Locator;

  constructor(page: Page) {
    this.page = page;
    this.partiesSection = page.locator('.home-section[data-section="parties"]');
    this.mapSection = page.locator('.home-section[data-section="map"]');
    this.channelButtons = page.locator('.channels-grid .channel-btn, button').filter({ 
      hasText: /📍|📅|✉️|👥|👤|⚙️/
    });
    this.partiesPills = this.partiesSection.locator('.day-pills .day-pill');
    this.mapPills = this.mapSection.locator('.day-pills .day-pill');
  }

  async goto() {
    await this.page.goto('/#/home');
  }

  async clickPartiesPill(index: number = 0) {
    await this.partiesPills.nth(index).click();
  }

  async clickMapPill(index: number = 0) {
    await this.mapPills.nth(index).click();
  }

  async clickChannel(icon: string, label: string) {
    await this.page.getByRole('button', { 
      name: new RegExp(`${icon}.*${label}`, 'i') 
    }).click();
  }

  getPartiesHeading() {
    return this.partiesSection.getByRole('heading', { level: 2 });
  }

  getMapHeading() {
    return this.mapSection.getByRole('heading', { level: 2 });
  }
}