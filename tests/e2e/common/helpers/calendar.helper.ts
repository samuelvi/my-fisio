import { Page, Locator, expect } from '@playwright/test';

export class CalendarHelper {
  static getEvent(page: Page, title: string): Locator {
    return page.locator('.fc-event').filter({ hasText: title });
  }

  static async clickEvent(page: Page, title: string) {
    const event = this.getEvent(page, title).first();
    await expect(event).toBeVisible({ timeout: 10000 });
    await event.click({ force: true });
  }

  static async verifyEventVisible(page: Page, title: string) {
    await expect(this.getEvent(page, title).first()).toBeVisible({ timeout: 15000 });
  }

  static async verifyEventHidden(page: Page, title: string) {
    await expect(this.getEvent(page, title)).toHaveCount(0);
  }

  static async getEventSlotInfo(page: Page, titleText: string) {
    return await page.evaluate((title) => {
      const eventEl = Array.from(document.querySelectorAll('.fc-event'))
        .find((el) => el.textContent && el.textContent.includes(title));
      if (!eventEl) return null;
      const timeEl = eventEl.querySelector('.fc-event-time');
      const timeText = (timeEl?.textContent || eventEl.textContent || '').trim();
      const column = eventEl.closest('.fc-timegrid-col');
      return {
        timeText,
        date: column?.getAttribute('data-date') || null,
      };
    }, titleText);
  }

  static async dragEvent(page: Page, title: string) {
      const event = this.getEvent(page, title).first();
      const target = page.locator('.fc-timegrid-col').last();
      await event.dragTo(target, { force: true });
  }
}
