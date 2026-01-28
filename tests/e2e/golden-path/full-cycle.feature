Feature: Golden Path Lifecycle
  As an administrator
  I want to manage the complete lifecycle of a patient interaction
  So that I can ensure all systems (Patient, Calendar, Billing) work together

  Background:
    Given I am logged in as an administrator

  @reset
  Scenario: Complete patient journey from creation to invoicing
    # 1. Create Patient
    Given I navigate to "/patients"
    When I click the "New Patient|Nuevo Paciente" link
    And I fill in "First Name|Nombre" with "GoldenPatient"
    And I fill in "Last Name|Apellidos" with "Cycle"
    And I fill in "ID Document|DNI" with "12345678Z"
    And I fill in "Phone Number|Teléfono" with "600123456"
    And I fill in "Email address|Email" with "golden@example.com"
    And I fill in "Address|Dirección" with "Golden St 1"
    And I fill the allergies field with "None"
    And I click the save patient button
    Then I should be redirected to "/patients"
    
    # 2. Schedule Appointment
    When I navigate to "/appointments"
    And I create a quick appointment with title "Physio Session"
    Then the appointment "Physio Session" appears in the calendar

    # 3. Create Invoice from Patient
    When I navigate to "/patients"
    And I search for patient "GoldenPatient"
    And I click on the patient link "GoldenPatient Cycle"
    And I click the "Generate Invoice|Generar Factura" link
    Then the invoice form should contain:
      | Customer Name | GoldenPatient Cycle |
    
    # 4. Finalize Invoice
    When I add an invoice line with:
      | Concept | Manual Therapy |
      | Price   | 60.00          |
    And I click the confirm issuance button
    Then I should be redirected to "/invoices"
    And I should see 1 rows in the table
