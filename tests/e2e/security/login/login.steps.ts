import { When } from '../../common/bdd';

// =============================================================================
// Login-specific steps (credentials)
// =============================================================================

When('I enter valid credentials', async ({ page }) => {
  await page.getByPlaceholder('admin@example.com').fill('tina@tinafisio.com');
  await page.getByPlaceholder('••••••••').fill('password');
});

When('I enter invalid credentials', async ({ page }) => {
  await page.getByPlaceholder('admin@example.com').fill('wrong@user.com');
  await page.getByPlaceholder('••••••••').fill('wrongpassword');
});
