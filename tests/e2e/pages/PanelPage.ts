import { Page, Locator } from '@playwright/test';

export class PanelPage {
  readonly page: Page;
  readonly panel: Locator;
  readonly heading: Locator;
  readonly backButton: Locator;
  readonly cards: Locator;
  readonly dayPills: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('.panel.panel--active').last();
    this.heading = this.panel.getByRole('heading', { level: 1 });
    this.backButton = this.panel.getByRole('button', { name: /back/i });
    this.cards = this.panel.locator('article, .card');
    this.dayPills = this.panel.locator('.panel__subnav .day-pill');
  }

  async getTitle() {
    return this.heading.textContent();
  }

  async goBack() {
    await this.backButton.click();
  }

  async waitForPanel() {
    await this.panel.waitFor({ state: 'visible' });
  }

  async waitForPanelHidden() {
    await this.panel.waitFor({ state: 'hidden', timeout: 1500 });
  }

  async getCardCount() {
    return this.cards.count();
  }

  async getCardText(index: number = 0) {
    return this.cards.nth(index).textContent();
  }
}