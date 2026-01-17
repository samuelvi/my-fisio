#!/bin/bash
# Initialize Playwright BDD testing project structure

set -e

PROJECT_NAME=${1:-"e2e-tests"}

echo "🚀 Initializing Playwright BDD project: $PROJECT_NAME"

# Create directory structure
mkdir -p "$PROJECT_NAME"/{tests/{features/{auth,products,common},steps/{common,auth,products},fixtures,factories,support/{pages,utils}},scripts}

echo "📁 Creating directory structure..."

# Create package.json
cat > "$PROJECT_NAME/package.json" << 'PKGJSON'
{
  "name": "e2e-tests",
  "version": "1.0.0",
  "scripts": {
    "test": "npx bddgen && npx playwright test",
    "test:headed": "npx bddgen && npx playwright test --headed",
    "test:debug": "npx bddgen && npx playwright test --debug",
    "test:ui": "npx bddgen && npx playwright test --ui",
    "bddgen": "npx bddgen",
    "report": "npx playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "playwright-bdd": "^7.0.0",
    "@cucumber/cucumber": "^10.0.0",
    "@faker-js/faker": "^8.0.0",
    "fishery": "^2.2.0",
    "typescript": "^5.0.0"
  }
}
PKGJSON

echo "📦 Created package.json"

# Create TypeScript config
cat > "$PROJECT_NAME/tsconfig.json" << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["@playwright/test", "@cucumber/cucumber"]
  },
  "include": ["tests/**/*"],
  "exclude": ["node_modules"]
}
TSCONFIG

echo "⚙️  Created tsconfig.json"

# Create Playwright config
cat > "$PROJECT_NAME/playwright.config.ts" << 'PWCONFIG'
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  paths: ['tests/features/**/*.feature'],
  require: ['tests/steps/**/*.ts'],
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
PWCONFIG

echo "⚙️  Created playwright.config.ts"

# Create example feature
cat > "$PROJECT_NAME/tests/features/common/example.feature" << 'FEATURE'
Feature: Example Feature

  Scenario: Basic navigation
    Given I am on the home page
    When I navigate to "/about"
    Then I should see "About Us"
FEATURE

echo "📝 Created example feature file"

# Create example step definitions
cat > "$PROJECT_NAME/tests/steps/common/navigation.steps.ts" << 'STEPS'
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

Given('I am on the home page', async ({ page }) => {
  await page.goto('/');
});

When('I navigate to {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

Then('I should see {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});
STEPS

echo "📝 Created example step definitions"

# Create database fixture
cat > "$PROJECT_NAME/tests/fixtures/database.fixture.ts" << 'DBFIXTURE'
import { test as base } from 'playwright-bdd';

// TODO: Import your database connection
// import { db } from '../support/database';

export const test = base.extend<{}, { dbReset: void }>({
  dbReset: [
    async ({}, use) => {
      // TODO: Initialize database
      // await db.migrate.latest();
      
      await use();
      
      // NO cleanup - leave data for debugging
    },
    { scope: 'test', auto: true }
  ]
});

export { expect } from '@playwright/test';
DBFIXTURE

echo "📝 Created database fixture template"

# Create example factory
cat > "$PROJECT_NAME/tests/factories/userFactory.ts" << 'FACTORY'
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

interface User {
  id?: string;
  email: string;
  name: string;
  password: string;
}

export const userFactory = Factory.define<User>(() => ({
  email: faker.internet.email(),
  name: faker.person.fullName(),
  password: faker.internet.password({ length: 20 })
}));
FACTORY

echo "📝 Created example factory"

# Create gitignore
cat > "$PROJECT_NAME/.gitignore" << 'GITIGNORE'
node_modules/
playwright-report/
test-results/
.env
*.log
.DS_Store
GITIGNORE

echo "📝 Created .gitignore"

# Create README
cat > "$PROJECT_NAME/README.md" << 'README'
# E2E Tests with Playwright BDD

## Setup

```bash
npm install
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm test

# Run in headed mode
npm run test:headed

# Debug mode
npm run test:debug

# Interactive UI mode
npm run test:ui
```

## Project Structure

- `tests/features/` - Gherkin feature files
- `tests/steps/` - Step definitions
- `tests/fixtures/` - Playwright fixtures & hooks
- `tests/factories/` - Test data factories
- `tests/support/` - Page Objects and utilities

## Best Practices

- Use visual content selectors (getByRole, getByText)
- Initialize database before each test (never cleanup after)
- Use factories for test data (avoid hardcoded IDs)
- Keep steps reusable and composable
- Write tests as executable specifications
README

echo "📝 Created README.md"

echo ""
echo "✅ Project initialized successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. cd $PROJECT_NAME"
echo "   2. npm install"
echo "   3. npx playwright install"
echo "   4. Configure your database connection in tests/fixtures/database.fixture.ts"
echo "   5. npm test"
echo ""
