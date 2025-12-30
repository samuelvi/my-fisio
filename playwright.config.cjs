// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  workers: 1,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry failed tests (helps with flaky tests due to timing issues) */
  retries: process.env.CI ? 2 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { outputFolder: './var/log/playwright/report', open: 'never' }], ['list']],
  /* Directory for artifacts like screenshots, videos, traces, etc. */
  outputDir: './var/log/playwright/test-results',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://127.0.0.1:8081',

    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 15000, // 15 seconds

    /* Maximum time for navigation. Defaults to 0 (no limit). */
    navigationTimeout: 15000, // 15 seconds

    /* Collect screenshot when a test fails. */
    screenshot: 'only-on-failure',

    /* Collect video when a test fails. */
    video: 'retain-on-failure',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Expect configuration for assertions */
  expect: {
    /* Maximum time expect() should wait for the condition to be met */
    timeout: 5000, // 5 seconds for assertions (with automatic retries)
  },

  /* Maximum time one test can run for. */
  timeout: 1200000, // 120 seconds per test

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
