# Domain events and auditing

**SQL entity state is the source of truth.** PCMS uses domain events to record
changes and drive audit entries; it does not reconstruct entities by replaying events.

## Write flow

1. A command handler creates or updates an entity.
2. The repository persists the state.
3. The handler dispatches events collected by the entity's `AggregateRoot` trait.
4. `AuditEventHandler` appends the event through `EventStoreInterface`.
5. If auditing is enabled for that entity, the handler creates an `AuditTrail`
   with the operation, changes, user and request metadata.

`config/packages/messenger.yaml` configures synchronous event transport and
Doctrine transaction middleware for command and event buses. The write handler
owns event dispatch; there is no automatic Doctrine lifecycle audit listener.

## Source pointers

- Entity event collection: `src/Domain/Model/AggregateRoot.php`
- Example use case: `src/Application/Command/Patient/CreatePatientHandler.php`
- Events: `src/Domain/Event/`
- Persistence and audit: `src/Infrastructure/EventHandler/AuditEventHandler.php`
- Event store: `src/Infrastructure/Persistence/EventStore/DoctrineEventStore.php`

Audit switches affect the human-readable audit trail, not event persistence.
See [configuration](../operations/configuration.md#language-and-auditing) and
the [audit guide](../features/audit-system.md) for details.
