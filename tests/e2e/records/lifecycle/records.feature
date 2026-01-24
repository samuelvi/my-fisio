Feature: Clinical Records Lifecycle
  As an administrator
  I want to manage clinical records
  So that I can track patient treatments

  Background:
    Given I am logged in as an administrator

  Scenario: Create patient and add clinical records
    When I navigate to patients via navigation
    And I click the "New Patient|Nuevo Paciente" link
    And I fill the patient name with unique values
    And I fill the allergies field with "None"
    And I click the save patient button
    Then I should be redirected to "/patients"
    When I search for the created patient
    And I click on the created patient link
    And I click the add first record button
    And I fill the record form with:
      | Physiotherapy Treatment | Full treatment session |
      | Consultation Reason     | Back pain              |
      | Notes                   | Private notes for physio |
    And I click the save record button
    Then I should see "Full treatment session"
    When I click the add record button
    And I fill the physiotherapy treatment with "Second session"
    And I click the save record button
    Then I should see 2 records in the list
