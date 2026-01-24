import { Given, When } from '../../common/bdd';

let invoicesSeeded = false;

// =============================================================================
// Invoice Data Setup
// =============================================================================

Given('invoices are seeded for search tests', async ({ page }) => {
  if (invoicesSeeded) return;

  const baseDate = new Date().toISOString();
  const invoices = [
    { fullName: 'John Doe', taxId: '12345678L', amount: 100 },
    { fullName: 'Maria Garcia', taxId: '87654321X', amount: 200 },
  ];

  for (const invoice of invoices) {
    await page.evaluate(async ({ invoiceData, baseDate }) => {
      const token = localStorage.getItem('token');
      await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ld+json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: invoiceData.fullName,
          taxId: invoiceData.taxId,
          address: 'Test Address',
          date: baseDate,
          lines: [{ concept: 'Test', quantity: 1, price: invoiceData.amount, amount: invoiceData.amount }],
          amount: invoiceData.amount
        }),
      });
    }, { invoiceData: invoice, baseDate });
  }

  invoicesSeeded = true;
});

// =============================================================================
// Invoice Search Steps
// =============================================================================

When('I search for invoice customer {string}', async ({ page }, name: string) => {
  await page.locator('input[type="text"]').first().fill(name);
  await page.locator('button[type="submit"]').click();
  await page.waitForLoadState('networkidle');
});
