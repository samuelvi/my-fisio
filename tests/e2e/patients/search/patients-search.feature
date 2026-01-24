Feature: Patient Search
  As an administrator
  I want to search patients
  So that I can quickly find patient information

  Background:
    Given I am logged in as an administrator
    And the database has fixture data

  Scenario: Normal search is case-insensitive
    When I navigate to "/patients"
    And I search for patient "afirst"
    Then the table should contain "AFirst"

  @no-reset
  Scenario: Search without accent finds accented name
    When I navigate to "/patients"
    And I search for patient "jose"
    Then the table should contain "Jos"

  @no-reset
  Scenario: Clear button resets search
    When I navigate to "/patients"
    And I search for patient "jose"
    Then I should see 1 patient rows in the table
    When I click the clear button
    Then the search field should be empty
    And I should see 4 patient rows in the table
