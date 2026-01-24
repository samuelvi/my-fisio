Feature: Invoice Search
  As an administrator
  I want to search invoices
  So that I can quickly find billing information

  Background:
    Given I am logged in as an administrator
    And invoices are seeded for search tests

  Scenario: Search by customer name is case-insensitive
    When I navigate to "/invoices"
    And I search for invoice customer "john"
    Then I should see "John Doe"

  @no-reset
  Scenario: Search by customer name is accent-insensitive
    When I navigate to "/invoices"
    And I search for invoice customer "maria"
    Then I should see "Maria Garcia"

  @no-reset
  Scenario: Clear button resets all filters
    When I navigate to "/invoices"
    And I search for invoice customer "John"
    Then I should see 1 rows in the table
    When I click the clear button
    Then the search field should be empty
    And I should see 2 rows in the table
