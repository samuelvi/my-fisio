import { When } from '../../common/bdd';
import { AUTH_CREDENTIALS } from '../../common/constants';

// =============================================================================
// Login-specific steps (credentials)
// =============================================================================

When('I enter valid credentials', async ({ page }) => {
  await page.getByPlaceholder('admin@example.com').fill(AUTH_CREDENTIALS.username);
  await page.getByPlaceholder('••••••••').fill(AUTH_CREDENTIALS.password);
});

When('I enter invalid credentials', async ({ page }) => {
  await page.getByPlaceholder('admin@example.com').fill('wrong@user.com');
  await page.getByPlaceholder('••••••••').fill('wrongpassword');
});
