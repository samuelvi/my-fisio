# Data and consistency

Part of the [PCMS System Design](system-architecture.md). **Implemented** below
means verified in mappings, migrations and call sites, not in a running database.

## Authoritative state and relationships

SQL entity tables hold current state. [ADR-009](../adr/0009-pragmatic-event-sourcing.md)
selects synchronous domain events for history/side effects, not reconstruction by
event replay. [StoredEvent](../../src/Domain/Entity/StoredEvent.php) and
[AuditTrail](../../src/Domain/Entity/AuditTrail.php) are additional SQL records.

| Relationship / state | Verified mapping |
| --- | --- |
| Patient → optional Customer; Patient → Records | [Patient](../../src/Domain/Entity/Patient.php); clinical identity is separate from billing identity |
| Record → optional Patient | [Record](../../src/Domain/Entity/Record.php); [RecordProcessor](../../src/Infrastructure/Api/State/RecordProcessor.php) supports updates, so records are not immutable |
| Appointment → optional Patient | [Appointment](../../src/Domain/Entity/Appointment.php); `userId` is a scalar integer, not a mapped User association |
| Invoice → optional Customer; Invoice → InvoiceLines | [Invoice](../../src/Domain/Entity/Invoice.php), [InvoiceLine](../../src/Domain/Entity/InvoiceLine.php); recipient fields are copied into invoice state; line deletion cascades |
| User → required Application | [User](../../src/Domain/Entity/User.php); not a tenant key on clinical/billing tables |
| Counter | [Counter](../../src/Domain/Entity/Counter.php); unique name and string value, not a JSON counter document |
| Audit/event identity | Entity type/name plus string ID; not foreign keys to each business aggregate |

The [baseline migration](../../src/Infrastructure/Persistence/Doctrine/Migrations/Version20260130190429.php)
and [application migration](../../src/Infrastructure/Persistence/Doctrine/Migrations/Version20260131080258.php)
are the schema evidence. They do not establish which migrations a deployment has
applied. Invoice amounts and line prices use floating-point columns/calculation;
no exact decimal-money guarantee is implied.

## Transaction boundaries

[Messenger configuration](../../config/packages/messenger.yaml) puts
`doctrine_transaction` on `command.bus` and `event.bus`; `query.bus` has validation
middleware only. Events use `sync://`, with no configured async worker/retry queue.
This does **not** wrap every HTTP request in a transaction.

| Entry path | Actual boundary and failure consequence |
| --- | --- |
| Patient create/update | [Command handlers](../../src/Application/Command/Patient/) save state and dispatch events inside the command transaction. An escaping event/handler exception rolls that transaction back. Repository flushes do not independently commit the outer transaction. |
| Customer create/update | [CustomerProcessor](../../src/Infrastructure/Api/State/CustomerProcessor.php) uses the command bus. Its delete branch writes directly and emits no deletion event. |
| Appointment create/update | [AppointmentProcessor](../../src/Infrastructure/Api/State/AppointmentProcessor.php) calls repository `save()`/`flush()` before dispatch. The later event transaction does not make the earlier write atomic with its audit. |
| Appointment delete | The same processor dispatches the deletion event before repository deletion. A failed delete can leave a committed deletion history entry. |
| Record create/update | [RecordProcessor](../../src/Infrastructure/Api/State/RecordProcessor.php) saves directly before event dispatch, with the same state/audit separation. |
| Invoice create | [Create processor](../../src/Infrastructure/Api/State/Processor/InvoiceCreateProcessor.php) allocates a counter in its own transaction, may separately save/audit a customer, then persists the invoice and dispatches its event. A later failure can leave a consumed number or customer. |
| Invoice update | [Update processor](../../src/Infrastructure/Api/State/Processor/InvoiceUpdateProcessor.php) may save a customer, then flushes invoice/line changes and dispatches events. No outer command transaction joins these operations. |
| Gap generation/deletion | [EmptySlotCreator](../../src/Application/Service/EmptySlotCreator.php) flushes each slot; a mid-loop failure can leave a partial range. [Bulk deletion](../../src/Infrastructure/Persistence/Doctrine/Repository/DoctrineAppointmentRepository.php) is one DQL DELETE. Neither path emits events. |

Within a dispatched event, the
[event-store append and optional audit write](../../src/Infrastructure/EventHandler/AuditEventHandler.php)
share the event-bus transaction. Exceptions propagate synchronously; disabling
audit skips `AuditTrail`, not `StoredEvent`. No end-to-end failure-injection or
rollback experiment was run for this design review.

## Invoice numbering and concurrency

- [Create](../../src/Infrastructure/Api/State/Processor/InvoiceCreateProcessor.php)
  chooses `invoices_<invoice-date-year>` and starts at `<year>000001`.
  [DoctrineCounterRepository](../../src/Infrastructure/Persistence/Doctrine/Repository/DoctrineCounterRepository.php)
  uses `wrapInTransaction` and `PESSIMISTIC_WRITE` for the lookup/increment.
- Existing counter rows are locked; simultaneous first creation of a missing
  counter has no explicit conflict retry. The unique counter name is not a
  guarantee that every competing request succeeds.
- Allocation precedes invoice persistence. Numbers can be consumed without an
  invoice; this is not a gapless sequence guarantee.
- [Update validation](../../src/Application/Service/InvoiceNumberValidator.php)
  accepts a ten-digit number with a positive suffix that fills a gap or is the
  next sequence, excluding the edited invoice. This read-before-write check is
  not a database uniqueness constraint and does not update the counter.
- **Known deviation:** neither the Invoice mapping nor the baseline migration
  declares `invoices.number` unique. Concurrent edits and counter/manual-number
  divergence must not be described as duplicate-proof.
- [GET /api/invoice-gaps](../../src/Infrastructure/Api/Controller/InvoiceNumberGapsController.php)
  reports gaps; it does not reserve numbers or repair the sequence.

[Counter tests](../../tests/Integration/Infrastructure/Persistence/Doctrine/Repository/DoctrineCounterRepositoryTest.php)
exercise initial allocation, sequential increment and independent keys.
[Validator tests](../../tests/Application/Service/InvoiceNumberValidatorTest.php)
exercise format/gap/duplicate rules. Neither is a concurrent-allocation test.

## Audit completeness and known deviations

Event persistence depends on explicit dispatch, not Doctrine lifecycle listeners.
The [AggregateRoot trait](../../src/Domain/Model/AggregateRoot.php) only collects
events until the caller pulls them. Important source-level limitations:

- [Appointment creation](../../src/Infrastructure/Api/State/AppointmentProcessor.php)
  and [record creation](../../src/Infrastructure/Api/State/RecordProcessor.php)
  call `recordCreatedEvent()` before the generated ID is assigned by `save()`.
  Their events capture `(string) $this->id` then; later persistence does not
  rewrite that captured aggregate ID. Creation history cannot be assumed to
  carry the assigned entity ID.
- [Invoice.update](../../src/Domain/Entity/Invoice.php) tracks selected header
  changes. The processor changes `number` and replaces lines outside that method;
  line-only/number-only edits need not produce an update event. A customer created
  by invoice update is saved without a `CustomerCreatedEvent` dispatch.
- Bulk gaps and direct customer deletion bypass the event path described above.
  Audit disabling is a separate, intentional configuration mechanism.

The [coverage test](../../tests/Functional/Audit/AuditTrailCoverageTest.php) looks
up creation audits by type/operation and checks selected values. It does not
establish complete identity linkage or full field-level history.

## Read consistency

Reads use SQL queries, array hydration or DTO mapping, not event projections.
[Patient search](../../src/Infrastructure/Persistence/Doctrine/Repository/DoctrinePatientRepository.php)
and [customer search](../../src/Infrastructure/Persistence/Doctrine/Repository/DoctrineCustomerRepository.php)
fetch one extra row for pagination; other lists use different contracts.
Explicit SQL queries do not bypass transaction isolation or guarantee a globally
fresh snapshot. Write-side `get()` paths still use managed entities.

The browser may retain data: [TanStack Query defaults](../../assets/presentation/query/queryClient.ts)
use a 30-second stale time and no focus refetch, while calendar writes explicitly
refetch events. A successful SQL write is not a guarantee that every open screen
or browser tab has refreshed.
