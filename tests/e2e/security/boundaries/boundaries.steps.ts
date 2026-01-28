import { When } from '../../common/bdd';

When('I fill the notes field with a very long string', async ({ page }) => {
  const longText = 'A'.repeat(5000);
  await page.getByLabel(/Notes|Observaciones/i).fill(longText);
});
