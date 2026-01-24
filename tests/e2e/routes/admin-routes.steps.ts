import { expect } from '@playwright/test';
import { Then } from '../common/bdd';

Then('I should be able to access admin routes with status 200 and visible content:', async ({ page }, dataTable) => {
  const rows = dataTable.raw().map((row) => ({
    route: row[0],
    text: row[1],
  }));

  for (const { route, text } of rows) {
    const response = await page.goto(route);
    await page.waitForLoadState('networkidle');

    if (!response) {
      throw new Error(`No response for route: ${route}`);
    }

    expect(response.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(route.replaceAll('/', '\\/')));
    const textPattern = new RegExp(escapeRegex(text), 'i');
    const heading = page.getByRole('heading', { name: textPattern });
    if (await heading.count()) {
      await expect(heading.first()).toBeVisible();
    } else {
      await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
    }
  }
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
