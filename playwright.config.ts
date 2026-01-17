import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const bddDir = defineBddConfig({
  rootDir: 'tests/e2e',
  paths: ['tests/e2e/**/*.feature'],
  require: ['tests/e2e/common/bdd.ts', 'tests/e2e/**/*.steps.ts'], 
  outputDir: 'tests/e2e',
});

export default defineConfig({
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: [['html', { outputFolder: './var/log/playwright/report', open: 'never' }], ['list']],
  outputDir: './var/log/playwright/test-results',
  use: {
    baseURL: 'http://127.0.0.1:8081',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  expect: {
    timeout: 30000,
  },
  timeout: 120000,
  projects: [
    {
      name: 'bdd',
      testDir: bddDir,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      testMatch: '**/*.spec.ts',
      testIgnore: ['**/bdd-gen/**', '**/features/.gen/**'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
