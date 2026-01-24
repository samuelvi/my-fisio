Feature: Admin Routes Access (Unauthenticated)
    As a visitor
    I want admin routes to be protected
    So that I cannot access them without logging in

    Scenario: Unauthenticated users cannot access admin routes
        Given I am not logged in
        Then I should be redirected to login when accessing:
            | /dashboard     |
            | /patients      |
            | /patients/new  |
            | /appointments  |
            | /invoices      |
            | /invoices/new  |
            | /invoices/gaps |
            | /customers     |
            | /customers/new |
