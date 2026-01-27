import { test as base, createBdd } from 'playwright-bdd';
import { TestInfo } from '@playwright/test';

// Re-export so step files can `import { spin } from '../common/bdd'`.
export type { SpinOptions } from './spin';
export { spin } from './spin';

// =============================================================================
// Types
// =============================================================================

type ResetContext = {
  tags: string[];
  featureTitle: string;
  isCI: boolean;
};

type MyFixtures = {
  dbReset: void;
};

// =============================================================================
// Public API
// =============================================================================

export const test = base.extend<MyFixtures>({
  dbReset: [
    async ({ request }, use, testInfo: TestInfo) => {
      const context: ResetContext = {
        tags: testInfo.tags || [],
        featureTitle: testInfo.titlePath[0] || 'unknown',
        isCI: process.env.CI === 'true',
      };

      if (!shouldResetDatabase(context)) {
        console.log(`Reusing database for: ${context.featureTitle} (${getSkipReason(context.tags)})`);
        await use();
        return;
      }

      console.log(`Resetting database for: ${context.featureTitle}`);
      const response = await request.post('/api/test/reset-db-empty');
      if (!response.ok()) {
        throw new Error(`Failed to reset DB: ${response.status()} ${response.statusText()}`);
      }
      resetFeatures.add(context.featureTitle);
      await use();
    },
    { scope: 'test', auto: true }
  ]
});

// ---------------------------------------------------------------------------
// Step registrars
//
// Playwright's locator-based assertions (toBeVisible, toHaveText, toHaveCount…)
// already poll internally, governed by `expect.timeout` in playwright.config.ts.
//
// For non-locator assertions that need polling (e.g. API responses, counters),
// use `spin` explicitly:
//
//   import { spin } from '../common/bdd';
//   Then('...', async ({ page }) => {
//     await spin(async () => {
//       const count = await fetchCount(page);
//       expect(count).toBeGreaterThan(0);
//     });
//   });
// ---------------------------------------------------------------------------

export const { Given, When, Then } = createBdd(test);

// =============================================================================
// Private Helpers
// =============================================================================

const resetFeatures = new Set<string>();

function shouldResetDatabase({ tags, featureTitle }: ResetContext): boolean {
  if (tags.includes('@no-reset')) return false;
  if (tags.includes('@reset')) return true;
  return !resetFeatures.has(featureTitle);
}

function getSkipReason(tags: string[]): string {
  return tags.includes('@no-reset') ? '@no-reset' : 'sequential';
}
