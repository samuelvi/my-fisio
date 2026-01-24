Feature: Appointment Network & Server Error Handling
  As an administrator
  I want to see error alerts when network or server errors occur
  So that I know when operations fail

  Background:
    Given I am logged in as an administrator
    And I navigate to "/appointments"
    And the calendar is loaded

  Scenario: Show error alert when clicking new appointment button while offline
    Given the browser is offline
    When I click the new appointment button
    Then I should see the status alert with connection error
    And the appointment modal should not be visible

  @reset
  Scenario: Show error alert when creating appointment fails due to network
    When I click the new appointment button
    And I fill the appointment title with "Network Error Test"
    And the browser goes offline
    And I click save appointment
    Then I should see the status alert with connection error
    When I dismiss the alert
    Then the status alert should not be visible

  @reset
  Scenario: Show error alert when server returns 500 on creation
    Given the server will return 500 on appointment creation
    When I click the new appointment button
    And I fill the appointment title with "Server Error Test"
    And I click save appointment
    Then I should see the status alert with server error
    And the alert should contain "Server Error Simulated"

  @reset
  Scenario: Show error alert when dragging appointment fails due to network
    When I create a quick appointment with title "DragTarget"
    And the appointment "DragTarget" appears in the calendar
    And the browser goes offline
    And I drag the appointment "DragTarget" to another time slot
    Then I should see the status alert

  @reset
  Scenario: Show error alert when editing appointment fails due to network
    When I create a quick appointment with title "EditTarget"
    And the appointment "EditTarget" appears in the calendar
    And I click on the appointment "EditTarget" in the calendar
    And I should see the edit appointment heading
    And I fill the appointment title with "EditModified"
    And the browser goes offline
    And I click save appointment
    Then I should see the status alert

  @reset
  Scenario: Show error alert when deleting appointment fails due to network
    When I create a quick appointment with title "DeleteTarget"
    And the appointment "DeleteTarget" appears in the calendar
    And I click on the appointment "DeleteTarget" in the calendar
    And I should see the edit appointment heading
    And I click the delete appointment button
    And I should see the delete confirmation dialog
    And the browser goes offline
    And I confirm the deletion
    Then I should see the status alert
