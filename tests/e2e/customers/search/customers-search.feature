Feature: Customer Search
  As an administrator
  I want to search customers
  So that I can quickly find customer information

  Background:
    Given I am logged in as an administrator
    And customers are seeded for search tests

  Scenario: Search by name is case-insensitive and partial
    When I navigate to "/customers"
    And I search for customer name "john"
    Then I should see "John Doe"

  @no-reset
  Scenario: Search by tax ID is partial
    When I navigate to "/customers"
    And I search for customer tax ID "12345"
    Then I should see "12345678L"

  @no-reset
  Scenario: Search by name with accents
    When I navigate to "/customers"
    And I search for customer name "gomez"
    Then I should see "Roberto Gomez"

  @no-reset
  Scenario: Clear button resets search
    When I navigate to "/customers"
    And I search for customer name "John"
    Then I should see 1 rows in the table
    When I click the clear button
    Then the search field should be empty
    And I should see 3 rows in the table
