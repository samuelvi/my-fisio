Feature: Input Limits and Sanitization
  As a security officer
  I want to ensure the system handles invalid or malicious input gracefully
  So that the application remains stable and secure

  Background:
    Given I am logged in as an administrator

  @reset
  Scenario: Patient name sanitization (XSS)
    Given I navigate to "/patients/new"
    When I fill in "First Name|Nombre" with "<script>alert('XSS')</script>"
    And I fill in "Last Name|Apellidos" with "Hacker"
    And I fill the allergies field with "None"
    And I click the save patient button
    Then I should be redirected to "/patients"
    # Verify it renders as text, not executable code (Playwright's getByText checks visible text)
    And I should see text matching "<script>alert"

  @no-reset @ignore
  Scenario: Long text handling in notes
    Given I navigate to "/patients"
    And I click on the patient link "Hacker"
    And I click the edit details button
    # 5000 characters string
    When I fill the notes field with a very long string
    And I click the save patient button
    Then I should be redirected to "/patients"
    # Ensure it didn't crash
