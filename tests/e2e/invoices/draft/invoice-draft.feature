Feature: Invoice Draft System
  As an administrator
  I want the system to save drafts when network errors occur
  So that I don't lose invoice form data

  Background:
    Given I am logged in as an administrator
    And all invoice drafts are cleared

  Scenario: Should NOT auto-save draft automatically
    When I navigate to "/invoices/new"
    And I fill the invoice customer name with "No Auto Save"
    And I fill the invoice line concept with "Item"
    And I wait for potential auto-save
    Then the invoice draft should not exist

  @reset
  Scenario: Should save draft explicitly when clicking save and show alert on network error
    When I navigate to "/invoices/new"
    And I fill the invoice draft form with:
      | customerName    | Network Error Test |
      | customerTaxId   | 12345678A          |
      | customerAddress | Error St 123       |
    And I fill the invoice line with:
      | concept | Service |
      | price   | 100     |
    And the browser goes offline
    And I click the confirm issuance button
    Then I should see the draft alert
    And the invoice draft should exist
    And the invoice draft should be marked as savedByError

  @reset
  Scenario: Should show draft alert on reload when savedByError is true
    Given an invoice draft exists with savedByError true
    When I navigate to "/invoices/new"
    Then I should see the draft alert

  @reset
  Scenario: Should restore draft when clicking restore button
    Given an invoice draft exists with savedByError true and data:
      | customerName    | Restore Me    |
      | customerTaxId   | 123           |
      | customerAddress | Addr          |
    And the invoice draft has line:
      | concept  | Restored Item |
      | quantity | 1             |
      | price    | 50            |
      | amount   | 50            |
    When I navigate to "/invoices/new"
    And I click the restore invoice draft button
    And I confirm the invoice draft action
    Then the invoice customer name field should have value "Restore Me"
    And the invoice line concept should have value "Restored Item"

  @reset
  Scenario: Should allow modifying form and then recovering draft without error
    Given an invoice draft exists with savedByError true and data:
      | customerName | Recoverable |
    When I navigate to "/invoices/new"
    And I fill the invoice customer name with "Dirty"
    And I click the restore invoice draft button
    And I confirm the invoice draft action
    Then the invoice customer name field should have value "Recoverable"

  @reset
  Scenario: Should discard draft when clicking discard button
    Given an invoice draft exists with savedByError true and data:
      | customerName | Discard |
    When I navigate to "/invoices/new"
    And I click the discard invoice draft button
    And I confirm the invoice draft action
    Then I should not see the draft alert
    And the invoice draft should not exist

  @reset
  Scenario: Should clear draft on successful save
    When I navigate to "/invoices/new"
    And I fill the invoice draft form with:
      | customerName    | Success Save |
      | customerTaxId   | 12345678X    |
      | customerAddress | Addr         |
    And I fill the invoice line with:
      | concept | Item |
      | price   | 50   |
    And I click the confirm issuance button
    Then I should be redirected to "/invoices"
    And the invoice draft should not exist
