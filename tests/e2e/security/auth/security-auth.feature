Feature: Authenticated Route Access
  As an authenticated administrator
  I want to access protected routes
  So that I can manage the clinic

  Scenario: Authenticated users can access protected routes
    Given I am logged in as an administrator
    Then I should be able to access the following routes:
      | /dashboard    |
      | /patients     |
      | /patients/new |
      | /appointments |
      | /invoices     |
      | /customers    |
