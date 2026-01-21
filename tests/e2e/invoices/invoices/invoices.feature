Feature: Invoice Management
  As an administrator
  I want to manage invoices
  So that I can issue bills to customers

  Background:
    Given I am logged in as an administrator

  Scenario: View empty invoice list
    When I navigate to "/invoices"
    Then I should see text matching "No invoices found|No se han encontrado facturas"

  Scenario: Create a new invoice successfully
    When I navigate to "/invoices"
    And I click the "New Invoice|Nueva Factura" link
    And I fill the invoice form with:
      | Customer Name    | Test Invoice Customer |
      | Customer Tax ID  | 12345678X             |
      | Customer Address | Test Address 123      |
    And I add an invoice line with:
      | Concept | Physio Session |
      | Price   | 50             |
    And I save the invoice
    Then I should be redirected to "/invoices"
    And the table should contain "Test Invoice Customer"
    And I should see 1 rows in the table

  @no-reset
  Scenario: Edit invoice shows existing data in form
    When I navigate to "/invoices"
    And I click edit on the first invoice
    Then the invoice form should contain:
      | Customer Name    | Test Invoice Customer |
      | Customer Tax ID  | 12345678X             |
      | Customer Address | Test Address 123      |
    And the invoice line 1 should contain:
      | Concept | Physio Session |
      | Price   | 50             |
