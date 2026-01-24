Feature: Customer Creation
  As an administrator
  I want to create and manage customers
  So that I can track billing information

  Background:
    Given I am logged in as an administrator

  Scenario: View empty customer list and create first customer
    When I navigate to "/customers"
    Then I should see text matching "No customers found|No se han encontrado clientes"
    When I click the "New Customer|Nuevo Cliente" link
    And I fill the customer form with:
      | First Name     | John            |
      | Last Name      | Doe             |
      | Tax Identifier | 12345678L       |
      | Address        | 123 Billing St, City |
    And I save the customer
    Then I should be redirected to "/customers"
    And I should see 1 rows in the table
    And I should see "John Doe"

  @no-reset
  Scenario: Duplicate tax ID shows error
    When I navigate to "/customers"
    And I click the "New Customer|Nuevo Cliente" link
    And I fill the customer form with:
      | First Name     | Duplicate    |
      | Last Name      | TaxID        |
      | Tax Identifier | 12345678L    |
      | Address        | Some address |
    And I try to save the customer expecting error
    Then I should see text matching "already a customer|existe un cliente"

  @no-reset
  Scenario: Update existing customer
    When I navigate to "/customers"
    And I click edit on the row containing "John"
    And I fill the customer form with:
      | First Name | Johnny |
    And I save the customer expecting update
    Then I should be redirected to "/customers"
    And I should see "Johnny"
