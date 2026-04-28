Feature: Appointment Draft Recovery
  As an administrator
  I want appointment modal drafts to be recoverable on network failures
  So that I do not lose appointment form data

  Background:
    Given I am logged in as an administrator
    And all appointment drafts are cleared
    And I navigate to "/appointments"
    And the calendar is loaded

  @reset
  Scenario: Save appointment draft on network failure from modal submit
    When I click the new appointment button
    And I fill the appointment draft form with:
      | title | Appointment Draft Error |
      | notes | Keep this draft         |
    And the browser goes offline
    And I click save appointment
    Then I should see the draft alert
    And the appointment draft should exist
    And the appointment draft should be marked as savedByError

  @reset
  Scenario: Restore appointment draft repopulates modal form
    Given an appointment draft exists with savedByError true and data:
      | title    | Restored Appointment |
      | notes    | Restored Notes       |
      | type     | appointment          |
      | startsAt | 2030-01-15T09:00:00  |
      | endsAt   | 2030-01-15T10:00:00  |
      | allDay   | false                |
      | patientId|                      |
    When I click the restore appointment draft button
    And I confirm the appointment draft action
    Then I should see a heading matching "New Appointment|Nueva Cita"
    And the appointment title field should have value "Restored Appointment"
    And the appointment notes field should have value "Restored Notes"

  @reset
  Scenario: Successful save clears restored appointment draft
    Given an appointment draft exists with savedByError true and data:
      | title    | Draft To Clear       |
      | notes    | Clear me on success  |
      | type     | appointment          |
      | startsAt | 2030-01-15T11:00:00  |
      | endsAt   | 2030-01-15T12:00:00  |
      | allDay   | false                |
      | patientId|                      |
    When I click the restore appointment draft button
    And I confirm the appointment draft action
    And I click save appointment
    Then the appointment draft should not exist

  @reset
  Scenario: Discard appointment draft hides draft alert
    Given an appointment draft exists with savedByError true and data:
      | title    | Draft To Discard      |
      | notes    | Discard me            |
      | type     | appointment           |
      | startsAt | 2030-01-15T13:00:00   |
      | endsAt   | 2030-01-15T14:00:00   |
      | allDay   | false                 |
      | patientId|                       |
    When I click the discard appointment draft button
    And I confirm the appointment draft action
    Then the appointment draft should not exist
    And I should not see the appointment draft alert
