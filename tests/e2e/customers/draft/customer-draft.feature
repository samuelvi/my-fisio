Feature: Customer Draft System
  As an administrator
  I want the system to save drafts when network errors occur
  So that I don't lose form data

  Background:
    Given I am logged in as an administrator
    And all customer drafts are cleared

  Scenario: Should NOT auto-save draft automatically
    When I navigate to "/customers/new"
    And I fill the customer form with:
      | First Name | No Auto Save |
      | Last Name  | Test         |
    And I wait for potential auto-save
    Then the customer draft should not exist

  @reset
  Scenario: Should save draft explicitly when clicking save and show alert on network error
    When I navigate to "/customers/new"
    And I fill the customer form with:
      | First Name     | Network Error Test |
      | Last Name      | Customer           |
      | Tax Identifier | NETWORK123         |
      | Address        | Error St 123       |
    And the browser goes offline
    And I click the save customer button
    Then I should see the draft alert
    And the customer draft should exist
    And the draft should have firstName "Network Error Test"
    And the draft should be marked as savedByError

  @reset
  Scenario: Should show draft alert on reload when savedByError is true
    Given a customer draft exists with savedByError true
    When I navigate to "/customers/new"
    Then I should see the draft alert

  @reset
  Scenario: Should restore draft and keep savedByError flag and panel visible
    Given a customer draft exists with savedByError true and data:
      | firstName      | Restore Me |
      | lastName       | Last       |
      | taxId          | 123        |
      | billingAddress | Addr       |
    When I navigate to "/customers/new"
    And I click the restore customer draft button
    And I confirm the customer draft restoration
    Then the customer first name field should have value "Restore Me"
    And I should see the draft alert

  @reset
  Scenario: Should NOT auto-save modifications after restoring draft from network error
    Given a customer draft exists with savedByError true and data:
      | firstName      | Original |
      | lastName       | Last     |
      | taxId          | 123      |
      | billingAddress | Addr     |
    When I navigate to "/customers/new"
    And I click the restore customer draft button
    And I confirm the customer draft restoration
    And I fill the customer form with:
      | First Name | Modified |
    And I wait for potential auto-save
    Then the draft should have firstName "Original"

  @reset
  Scenario: Should clear draft on successful save
    When I navigate to "/customers/new"
    And I fill the customer form with:
      | First Name     | Success      |
      | Last Name      | Test         |
      | Tax Identifier | SUCCESS123   |
      | Address        | Success Addr |
    And I save the customer
    Then I should be redirected to "/customers"
    And the customer draft should not exist
