Feature: Appointments Calendar Management
  As an administrator
  I want to manage appointments in the calendar
  So that I can schedule and track patient appointments

  Background:
    Given I am logged in as an administrator
    And I navigate to "/appointments"
    And I should see a heading matching "Clinic Calendar|Calendario de la Cl.nica"

  Scenario: Create a new appointment
    When I click the new appointment button
    And I should see a heading matching "New Appointment|Nueva Cita"
    And I fill the appointment form with:
      | Title | Slot Test A   |
      | Type  | Appointment   |
      | Notes | Initial notes |
    And I set the appointment start time to today at 9:00
    And I set the appointment end time to today at 10:00
    And I save the appointment
    Then the appointment "Slot Test A" should appear in the calendar
    And the appointment "Slot Test A" should be scheduled for today

  @no-reset
  Scenario: Modify an existing appointment
    When I click on the appointment "Slot Test A" in the calendar
    And I fill the appointment form with:
      | Title | Slot Test B |
      | Type  | Other       |
    And I set the appointment start time to today at 11:00
    And I set the appointment end time to today at 12:15
    And I save the appointment
    And I reload the page
    Then the appointment "Slot Test B" should appear in the calendar

  @no-reset
  Scenario: Delete an appointment
    When I click on the appointment "Slot Test B" in the calendar
    And I click the delete appointment button
    And I confirm the deletion
    Then the appointment "Slot Test B" should not appear in the calendar
