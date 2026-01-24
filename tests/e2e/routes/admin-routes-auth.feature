Feature: Admin Routes Access (Authenticated)
    As an administrator
    I want to access all admin routes
    So that the admin UI is available when logged in

    Scenario: Authenticated users can access admin routes
        Given I am logged in as an administrator
        Then I should be able to access admin routes with status 200 and visible content:
            | /dashboard     | Panel de Control   |
            | /patients      | Pacientes          |
            | /patients/new  | Nuevo Paciente     |
            | /appointments  | Citas              |
            | /invoices      | Facturas           |
            | /invoices/new  | Nueva Factura      |
            | /invoices/gaps | Huecos de Facturas |
            | /customers     | Clientes           |
            | /customers/new | Nuevo Cliente      |
