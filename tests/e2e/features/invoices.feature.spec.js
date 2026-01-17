// Generated from: tests/e2e/features/invoices.feature
import { test } from "../common/bdd.ts";

test.describe('Invoice Management', () => {

  test.beforeEach('Background', async ({ Given, And, context, page }, testInfo) => { if (testInfo.error) return;
    await Given('the database is empty'); 
    await And('I am logged in as an administrator', null, { context, page }); 
  });
  
  test('View empty invoice list', async ({ When, Then, page }) => { 
    await When('I navigate to the invoices list', null, { page }); 
    await Then('I should see a message saying "No invoices found"', null, { page }); 
  });

  test('Create a new invoice successfully', async ({ When, Then, And, page }) => { 
    await When('I navigate to the invoices list', null, { page }); 
    await And('I click the new invoice button', null, { page }); 
    await And('I fill the invoice form with:', {"dataTable":{"rows":[{"cells":[{"value":"Customer Name"},{"value":"Test Invoice Customer"}]},{"cells":[{"value":"Customer Tax ID"},{"value":"12345678X"}]},{"cells":[{"value":"Customer Address"},{"value":"Test Address 123"}]}]}}, { page }); 
    await And('I add an invoice line with:', {"dataTable":{"rows":[{"cells":[{"value":"Concept"},{"value":"Physio Session"}]},{"cells":[{"value":"Price"},{"value":"50"}]}]}}, { page }); 
    await And('I save the invoice', null, { page }); 
    await Then('I should be redirected to the invoices list', null, { page }); 
    await And('I should see "Test Invoice Customer" in the list', null, { page }); 
    await And('I should see 1 invoice in the table', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('tests/e2e/features/invoices.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":10,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given the database is empty","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"And I am logged in as an administrator","isBg":true,"stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"When I navigate to the invoices list","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then I should see a message saying \"No invoices found\"","stepMatchArguments":[{"group":{"start":30,"value":"\"No invoices found\"","children":[{"start":31,"value":"No invoices found","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":16,"pickleLine":14,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given the database is empty","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"And I am logged in as an administrator","isBg":true,"stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":15,"keywordType":"Action","textWithKeyword":"When I navigate to the invoices list","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"And I click the new invoice button","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"And I fill the invoice form with:","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"And I add an invoice line with:","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"And I save the invoice","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"Then I should be redirected to the invoices list","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"And I should see \"Test Invoice Customer\" in the list","stepMatchArguments":[{"group":{"start":13,"value":"\"Test Invoice Customer\"","children":[{"start":14,"value":"Test Invoice Customer","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":24,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"And I should see 1 invoice in the table","stepMatchArguments":[{"group":{"start":13,"value":"1","children":[]},"parameterTypeName":"int"}]}]},
]; // bdd-data-end