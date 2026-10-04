# PCMS documentation

Start with the [project README](../README.md). Use `make help` for the command catalog.

## Development and operations

- [Installation](operations/installation.md): local setup, services and troubleshooting.
- [Configuration](operations/configuration.md): calendar, invoice branding, translations and auditing.
- [Testing](testing/e2e.md): PHPUnit, Vitest, Playwright and test data.
- [Dependencies](security/dependency-installation.md): checked frontend package installation.
- [Deployment](operations/deployment.md): release workflow.

## Architecture and features

- [PCMS System Design](architecture/system-architecture.md): context/containers, critical flows, consistency and runtime boundaries.
- [Frontend](architecture/frontend.md)
- [Domain events and auditing](architecture/event-driven-strategy.md)
- [Current data and consistency](architecture/data-consistency.md); historical [data model](architecture/data-model.md) and [schema narrative](architecture/database-schema.md).
- [Patients](features/patients.md), [appointments](features/appointments.md), [invoices](features/invoices.md)
- [Audit system](features/audit-system.md) and [draft recovery](features/draft-system.md)

## Project context

- [Agent instructions](../AGENTS.md) explain how to load context selectively.
- [Memory bank](../memory-bank/product-context.md) records verified implementation facts and current work.
- [Decisions](adr/) and [implementation plans](superpowers/) preserve development history.
- [Original specifications](specifications/) and [archive](archive/) retain historical detail. They may describe planned or superseded behavior; verify against the code before using them as implementation requirements.

Keep each subject in one guide and link to it. Do not copy command catalogs or
architecture descriptions into additional indexes.
