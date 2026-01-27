import { test as base, createBdd } from 'playwright-bdd';
import { TestInfo } from '@playwright/test';
import { spin } from './spin';

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

const bdd = createBdd(test);

// ---------------------------------------------------------------------------
// Spin-wrapped step registrars
//
// Every `Then` step is automatically wrapped with `spin`, so assertions are
// retried at 250 ms intervals for up to 10 minutes.  This eliminates flaky
// failures caused by backend/rendering latency without requiring per-step
// timeout tuning.
//
// `Given` and `When` are exported as-is — Playwright's built-in auto-waiting
// already handles action retries (clicks, fills, navigation).  If a setup or
// action step needs explicit polling, import `spin` directly:
//
//   import { spin } from '../common/bdd';
//   When('...', async ({ page }) => { await spin(async () => { ... }); });
// ---------------------------------------------------------------------------

export const Given = bdd.Given;
export const When = bdd.When;

/**
 * Register a `Then` step whose body is automatically retried via `spin`.
 *
 * The wrapper calls the original callback inside `spin()`, which polls at
 * 250 ms intervals for up to 10 minutes.  If the callback keeps throwing
 * after the timeout, the **last** error is surfaced to the test reporter.
 */
export const Then: typeof bdd.Then = ((
  pattern: any,
  fn: (...args: any[]) => any,
) => {
  const wrapped = (...args: any[]) => spin(() => fn(...args));
  return bdd.Then(pattern, wrapped as any);
}) as any;

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
