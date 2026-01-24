Feature: Clinical Record Draft System
  As an administrator
  I want the system to save drafts when network errors occur
  So that I don't lose clinical record form data

  Background:
    Given I am logged in as an administrator
    And a test patient exists for records
    And all record drafts are cleared

  Scenario: Should NOT auto-save draft automatically
    When I navigate to the new record page for the test patient
    And I fill the record treatment with "No Auto Save"
    And I wait for potential auto-save
    Then the record draft should not exist

  @reset
  Scenario: Should save draft explicitly when clicking save and show alert on network error
    When I navigate to the new record page for the test patient
    And I fill the record draft form with:
      | consultationReason      | Network Error Reason    |
      | physiotherapyTreatment  | Network Error Treatment |
    And the browser goes offline
    And I click the save record draft button
    Then I should see the draft alert
    And the record draft should exist
    And the record draft should have treatment "Network Error Treatment"
    And the record draft should be marked as savedByError

  @reset
  Scenario: Should show draft alert on reload when savedByError is true
    Given a record draft exists with savedByError true for test patient
    When I navigate to the new record page for the test patient
    Then I should see the draft alert

  @reset
  Scenario: Should restore draft and keep savedByError flag and panel visible
    Given a record draft exists with savedByError true and data for test patient:
      | consultationReason     | Restore Me |
      | physiotherapyTreatment | Treatment  |
    When I navigate to the new record page for the test patient
    And I click the restore record draft button
    And I confirm the record draft restoration
    Then the record consultation reason field should have value "Restore Me"
    And I should see the draft alert

  @reset
  Scenario: Should clear draft on successful save
    When I navigate to the new record page for the test patient
    And I fill the record draft form with:
      | consultationReason     | Success Save      |
      | physiotherapyTreatment | Success Treatment |
    And I click the save record draft button
    Then I should be redirected to the patient detail page
    And the record draft should not exist
