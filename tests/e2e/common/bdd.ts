import { test as base, createBdd } from 'playwright-bdd';
import { Page, BrowserContext, request as playwrightRequest } from '@playwright/test';

// Define custom fixtures
type MyFixtures = {
  dbReset: void;
  // You can add more fixtures here (e.g., authenticatedPage)
};

export const test = base.extend<MyFixtures>({
  dbReset: [
    async ({ request }, use) => {
      console.log('Resetting database...');
      const response = await request.post('/api/test/reset-db-empty');
      if (!response.ok()) {
        throw new Error(`Failed to reset DB: ${response.status()} ${response.statusText()}`);
      }
      await use();
    },
    { scope: 'test', auto: true } // auto: true means it runs for every test/scenario
  ]
});

export const { Given, When, Then } = createBdd(test);
