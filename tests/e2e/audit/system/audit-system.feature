Feature: Audit System
  As an administrator
  I want the system to capture audit trails
  So that I can track all database changes

  Background:
    Given I am logged in as an administrator

  Scenario: Audit trail captures customer creation
    Given I note the current audit trail count
    When I navigate to "/customers"
    And I click the "New Customer|Nuevo Cliente" link
    And I fill the customer form with:
      | First Name     | John       |
      | Last Name      | AuditTest  |
      | Tax Identifier | AUDIT001   |
      | Address        | 123 Audit St |
    And I click the "Save|Guardar" button
    Then I should be redirected to "/customers"
    And the audit trail count should have increased
    And the latest audit trail for "Customer" should have operation "created"

  @reset
  Scenario: Audit trail captures customer updates
    When I navigate to "/customers"
    And I click the "New Customer|Nuevo Cliente" link
    And I fill the customer form with:
      | First Name     | Jane        |
      | Last Name      | UpdateTest  |
      | Tax Identifier | UPDATE001   |
      | Address        | 456 Update St |
    And I click the "Save|Guardar" button
    And I should be redirected to "/customers"
    And I note the current audit trail count
    And I click edit on the row containing "Jane"
    And I fill the customer form with:
      | First Name | Janet |
    And I click the "Save|Guardar" button
    Then the audit trail count should have increased

  @reset
  Scenario: Audit trail captures patient creation
    Given I note the current audit trail count
    When I navigate to "/patients"
    And I click the new patient button
    And I fill in "First Name|Nombre" with "Alice"
    And I fill in "Last Name|Apellidos" with "PatientAudit"
    And I fill the allergies field with "None"
    And I click the save patient button
    Then I should be redirected to "/patients"
    And the audit trail count should have increased
