Feature: User Login
  As a user
  I want to log in to the application
  So that I can access protected features

  Scenario: Successful login redirects to dashboard
    Given I am on the login page
    When I enter valid credentials
    And I click the "Sign in|Entrar" button
    Then I should be redirected to "/dashboard"

  @no-reset
  Scenario: Failed login shows error message
    Given I am on the login page
    When I enter invalid credentials
    And I click the "Sign in|Entrar" button
    Then I should be on "/login"
    And I should see text matching "Invalid credentials|Credenciales inv"
