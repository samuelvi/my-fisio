Feature: Patient Draft System
  As an administrator
  I want the system to save drafts when network errors occur
  So that I don't lose patient form data

  Background:
    Given I am logged in as an administrator
    And all patient drafts are cleared

  Scenario: Should NOT auto-save draft automatically
    When I navigate to "/patients/new"
    And I fill the patient form with:
      | First Name | No Auto Save |
      | Last Name  | Test         |
    And I wait for potential auto-save
    Then the patient draft should not exist

  @reset
  Scenario: Should save draft explicitly when clicking save and show alert on network error
    When I navigate to "/patients/new"
    And I fill the patient form with:
      | First Name | Network Error Test |
      | Last Name  | Patient            |
    And I fill the patient allergies with "None"
    And the browser goes offline
    And I click the save patient button
    Then I should see the draft alert
    And the patient draft should exist
    And the patient draft should be marked as savedByError

  @reset
  Scenario: Should show draft alert on reload when savedByError is true
    Given a patient draft exists with savedByError true
    When I navigate to "/patients/new"
    Then I should see the draft alert

  @reset
  Scenario: Should restore draft and keep savedByError flag and panel visible
    Given a patient draft exists with savedByError true and data:
      | firstName | Restore Me |
      | lastName  | Last       |
      | allergies | None       |
    When I navigate to "/patients/new"
    And I click the restore patient draft button
    And I confirm the patient draft restoration
    Then the patient first name field should have value "Restore Me"
    And I should see the draft alert

  @reset
  Scenario: Should clear draft on successful save
    When I navigate to "/patients/new"
    And I fill the patient form with:
      | First Name | Success |
      | Last Name  | Test    |
    And I fill the patient allergies with "None"
    And I click the save patient button
    Then I should be redirected to "/patients"
    And the patient draft should not exist
