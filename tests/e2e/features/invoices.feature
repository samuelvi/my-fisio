Feature: Invoice Management
  As an administrator
  I want to manage invoices
  So that I can issue bills to customers

  Background:
    Given the database is empty
    And I am logged in as an administrator

  Scenario: View empty invoice list
    When I navigate to the invoices list
    Then I should see a message saying "No invoices found"

  Scenario: Create a new invoice successfully
    When I navigate to the invoices list
    And I click the new invoice button
    And I fill the invoice form with:
      | Customer Name    | Test Invoice Customer |
      | Customer Tax ID  | 12345678X             |
      | Customer Address | Test Address 123      |
    And I add an invoice line with:
      | Concept | Physio Session |
      | Price   | 50             |
    And I save the invoice
    Then I should be redirected to the invoices list
    And I should see "Test Invoice Customer" in the list
    And I should see 1 invoice in the table
