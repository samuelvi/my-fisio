/**
 * Quick Draft System Test
 *
 * Run this in browser console on http://localhost/invoices/new
 * to verify draft functionality
 */

console.log('=== Draft System Quick Test ===\n');

// Test 1: Check localStorage access
console.log('1. Testing localStorage access...');
try {
  localStorage.setItem('test_draft', 'test');
  const value = localStorage.getItem('test_draft');
  localStorage.removeItem('test_draft');
  console.log('   ✅ localStorage works:', value === 'test');
} catch (error) {
  console.log('   ❌ localStorage error:', error.message);
}

// Test 2: Check draft storage structure
console.log('\n2. Checking for draft_invoice in localStorage...');
const draftData = localStorage.getItem('draft_invoice');
if (draftData) {
  try {
    const parsed = JSON.parse(draftData);
    console.log('   ✅ Draft found:');
    console.log('      - Type:', parsed.type);
    console.log('      - Timestamp:', new Date(parsed.timestamp).toLocaleString());
    console.log('      - FormId:', parsed.formId);
    console.log('      - Has data:', !!parsed.data);

    // Calculate age
    const ageMs = Date.now() - parsed.timestamp;
    const ageMin = Math.floor(ageMs / 60000);
    const ageSec = Math.floor((ageMs % 60000) / 1000);
    console.log(`      - Age: ${ageMin}m ${ageSec}s`);
  } catch (error) {
    console.log('   ⚠️  Draft exists but invalid JSON:', error.message);
  }
} else {
  console.log('   ℹ️  No draft found (this is OK if form is clean)');
}

// Test 3: Create a test draft
console.log('\n3. Creating test draft...');
const testDraft = {
  type: 'invoice',
  data: {
    date: new Date().toISOString().split('T')[0],
    customerName: 'Test Draft Customer',
    customerTaxId: '12345678X',
    customerAddress: 'Test Street 123',
    customerPhone: '',
    customerEmail: '',
    invoiceNumber: '',
    lines: [
      { concept: 'Test Service', description: '', quantity: 1, price: 100, amount: 100 }
    ]
  },
  timestamp: Date.now(),
  formId: 'test-draft-' + Date.now()
};

localStorage.setItem('draft_invoice', JSON.stringify(testDraft));
console.log('   ✅ Test draft created!');
console.log('   → Reload the page to see the draft alert');
console.log('   → Draft will be shown with "Recuperar" and "Descartar" buttons');

// Test 4: Check all storage keys
console.log('\n4. All localStorage keys:');
const allKeys = Object.keys(localStorage);
allKeys.forEach(key => {
  if (key.startsWith('draft_')) {
    console.log(`   🗂️  ${key}`);
  }
});

console.log('\n=== Tests Complete ===');
console.log('\nNext steps:');
console.log('1. Reload the page (F5) to see draft alert');
console.log('2. Test "Recuperar borrador" button');
console.log('3. Test "Descartar borrador" button');
console.log('4. Test auto-save by typing in form and waiting 10 seconds');
console.log('5. Check console for draft-related messages\n');

// Clean up function
console.log('To clean up test draft, run: localStorage.removeItem("draft_invoice")');
