Feature: Appointment Patient Integration
  As an administrator
  I want to link appointments to patients
  So that I can manage patient schedules efficiently

  Background:
    Given I am logged in as an administrator
    And the database has fixture data

  Scenario: Create appointment with patient auto-fill
    Given a patient exists with name "Auto" and surname "Fill"
    When I navigate to "/appointments"
    And I click the new appointment button
    And I search for patient "Auto" in the appointment form
    And I select patient "Auto Fill" from the dropdown
    Then the appointment title should automatically be "Auto Fill"
    When I save the appointment
    Then the appointment "Auto Fill" should appear in the calendar

  @no-reset
  Scenario: Create appointment with manual title overriding patient name
    Given a patient exists with name "Manual" and surname "Title"
    When I navigate to "/appointments"
    And I click the new appointment button
    And I search for patient "Manual" in the appointment form
    And I select patient "Manual Title" from the dropdown
    And I fill the appointment form with:
      | Title | Custom Title |
    When I save the appointment
    Then the appointment "Custom Title" should appear in the calendar

  @no-reset
  Scenario: Patient selection validation
    Given a patient exists with name "Invalid" and surname "Test"
    When I navigate to "/appointments"
    And I click the new appointment button
    And I search for patient "Invalid" in the appointment form
    And I select patient "Invalid Test" from the dropdown
    And I type "Invalid" in the patient search input
    Then the patient input should show an error

  @no-reset
  Scenario: Patient association persistence
    Given a patient exists with name "Persistence" and surname "Check"
    When I navigate to "/appointments"
    And I click the new appointment button
    And I search for patient "Persistence" in the appointment form
    And I select patient "Persistence Check" from the dropdown
    And I save the appointment
    And I reload the page
    When I click on the appointment "Persistence Check" in the calendar
    Then the patient input should automatically be "Persistence Check"
