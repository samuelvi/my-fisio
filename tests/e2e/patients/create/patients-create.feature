Feature: Patient Creation
  As an administrator
  I want to create and manage patients
  So that I can track patient information

  Background:
    Given I am logged in as an administrator

  Scenario: View empty patient list
    When I navigate to "/patients"
    Then I should see text matching "No patients found|No se encontraron pacientes"

  @no-reset
  Scenario: Server validation shows errors for empty required fields
    When I navigate to "/patients"
    And I click the new patient button
    And I wait for navigation to "/patients/new"
    And I disable form validation
    And I clear the first name field
    And I clear the last name field
    And I click the save patient button
    Then I should see text matching "This value should not be blank|Este valor no deber.a estar vac.o"

  @no-reset
  Scenario: Create patient with required fields only
    When I navigate to "/patients/new"
    And I fill in "First Name|Nombre" with "TestFirst"
    And I fill in "Last Name|Apellidos" with "TestLast"
    And I fill the allergies field with "None"
    And I click the save patient button
    Then I should be redirected to "/patients"
    When I search for patient "TestFirst"
    Then I should see "TestFirst TestLast"

  @no-reset
  Scenario: Edit patient and verify all fields
    When I navigate to "/patients"
    And I search for patient "TestFirst"
    And I click on the patient link "TestFirst TestLast"
    And I click the edit details button
    Then the URL should contain "/edit"
    When I fill all patient fields with test data
    And I click the save patient button
    Then the URL should contain "/patients/"
    When I click the edit details button
    Then the patient DNI field should have value "12345678A"
