Feature: Route Protection
  As the system
  I want to protect routes from unauthenticated access
  So that patient data remains secure

  Scenario: Unauthenticated users cannot access protected routes
    Given I am not logged in
    Then I should be redirected to login when accessing:
      | /dashboard     |
      | /patients      |
      | /appointments  |
      | /invoices      |
      | /invoices/gaps |
