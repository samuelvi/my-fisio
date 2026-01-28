import { Given, When } from '../../common/bdd';
import { invoiceFactory } from '../../factories/invoice.factory';

let invoicesSeeded = false;

// =============================================================================
// Invoice Data Setup
// =============================================================================

Given('invoices are seeded for search tests', async ({ page }) => {
  if (invoicesSeeded) return;

  const invoices = [
    invoiceFactory.build({ fullName: 'John Doe', taxId: '12345678L', amount: 100 }),
    invoiceFactory.build({ fullName: 'Maria Garcia', taxId: '87654321X', amount: 200 }),
  ];

  for (const invoice of invoices) {
    await page.evaluate(async (invoiceData) => {
      const token = localStorage.getItem('token');
      await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ld+json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceData),
      });
    }, invoice);
  }

  invoicesSeeded = true;
});

// =============================================================================
// Invoice Search Steps
// =============================================================================

When('I search for invoice customer {string}', async ({ page }, name: string) => {
  await page.getByRole('textbox').first().fill(name);
  await page.getByRole('button', { name: /Search|Buscar/i }).click();
  await page.waitForResponse(resp => resp.url().includes('/api/invoices') && resp.status() === 200);
  await page.waitForLoadState('networkidle');
});
