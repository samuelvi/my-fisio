import { test as base, createBdd } from 'playwright-bdd';
import { TestInfo } from '@playwright/test';

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

export const { Given, When, Then } = createBdd(test);

// =============================================================================
// Private Helpers
// =============================================================================

const resetFeatures = new Set<string>();

function shouldResetDatabase({ tags, featureTitle, isCI }: ResetContext): boolean {
  if (isCI) return true;
  if (tags.includes('@reset')) return true;
  if (tags.includes('@no-reset')) return false;
  return !resetFeatures.has(featureTitle);
}

function getSkipReason(tags: string[]): string {
  return tags.includes('@no-reset') ? '@no-reset' : 'sequential';
}
