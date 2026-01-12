---
name: cqrs-pattern
description: Command Query Responsibility Segregation (CQRS) implementation pattern for Symfony applications.
  Separates write operations (Commands) from read operations (Queries) for better scalability and maintainability.
---

# CQRS Pattern (Command Query Responsibility Segregation)

## Overview

CQRS is an architectural pattern that separates write operations (Commands) from read operations (Queries). This separation allows for independent optimization, scaling, and evolution of each side.

## Problem Statement

Traditional CRUD applications often mix:
- Data modification logic with read logic
- Business rules validation with data retrieval
- Transaction management with query optimization

This leads to:
- Complex, hard-to-test methods
- Difficult performance optimization
- Unclear separation of concerns
- Scalability challenges

## Solution

**CQRS separates concerns:**
- **Write Side (Commands)**: Modifies state, enforces business rules, emits events
- **Read Side (Queries)**: Retrieves data, optimized for specific views
- **No Overlap**: Write operations don't return data, read operations don't modify state

## Implementation in Symfony

### Prerequisites

```bash
composer require symfony/messenger
```

### Directory Structure

```
src/
├── Application/
│   ├── Command/              # Write operations
│   │   ├── CreatePatientCommand.php
│   │   └── UpdatePatientCommand.php
│   ├── Handler/              # Command handlers
│   │   ├── CreatePatientHandler.php
│   │   └── UpdatePatientHandler.php
│   └── Query/                # Read operations (optional)
│       └── FindPatientQuery.php
├── Domain/
│   ├── Entity/
│   │   └── Patient.php
│   ├── Repository/           # Repository interfaces
│   │   └── PatientRepositoryInterface.php
│   └── Event/                # Domain events
│       └── PatientCreatedEvent.php
└── Infrastructure/
    └── Persistence/
        └── Repository/       # Repository implementations
            └── DoctrinePatientRepository.php
```

### Step-by-Step Guide

#### 1. Create Command (Write Operation)

```php
<?php
// src/Application/Command/CreatePatientCommand.php

declare(strict_types=1);

namespace App\Application\Command;

final readonly class CreatePatientCommand
{
    private function __construct(
        public string $fullName,
        public string $taxId,
        public string $email,
        public ?string $phone,
    ) {
    }

    public static function create(
        string $fullName,
        string $taxId,
        string $email,
        ?string $phone = null,
    ): self {
        return new self($fullName, $taxId, $email, $phone);
    }
}
```

#### 2. Create Command Handler

```php
<?php
// src/Application/Handler/CreatePatientHandler.php

declare(strict_types=1);

namespace App\Application\Handler;

use App\Application\Command\CreatePatientCommand;
use App\Domain\Entity\Patient;
use App\Domain\Event\PatientCreatedEvent;
use App\Domain\Repository\PatientRepositoryInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsMessageHandler]
final readonly class CreatePatientHandler
{
    public function __construct(
        private PatientRepositoryInterface $patientRepository,
        private MessageBusInterface $eventBus,
    ) {
    }

    public function __invoke(CreatePatientCommand $command): void
    {
        // Create entity using named constructor
        $patient = Patient::create(
            fullName: $command->fullName,
            taxId: $command->taxId,
            email: $command->email,
            phone: $command->phone,
        );

        // Persist entity
        $this->patientRepository->save($patient);

        // Dispatch domain event
        $event = PatientCreatedEvent::create(
            patientId: $patient->getId(),
            fullName: $patient->getFullName(),
            occurredOn: new \DateTimeImmutable(),
        );

        $this->eventBus->dispatch($event);
    }
}
```

#### 3. Configure Message Bus

```yaml
# config/packages/messenger.yaml
framework:
    messenger:
        default_bus: command.bus

        buses:
            # Command bus (synchronous, transactional)
            command.bus:
                middleware:
                    - doctrine_transaction
                    - validation

            # Event bus (asynchronous recommended)
            event.bus:
                default_middleware: allow_no_handlers
                middleware:
                    - doctrine_ping_connection

        transports:
            async: '%env(MESSENGER_TRANSPORT_DSN)%'

        routing:
            # Commands go to sync handler
            'App\Application\Command\*': command.bus

            # Events can be async
            'App\Domain\Event\*': event.bus
```

#### 4. Use Command in Controller (Write Side)

```php
<?php
// src/Infrastructure/Api/Controller/PatientController.php

declare(strict_types=1);

namespace App\Infrastructure\Api\Controller;

use App\Application\Command\CreatePatientCommand;
use App\Infrastructure\Api\Resource\PatientResource;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/patients', name: 'api_patients_')]
final class PatientController extends AbstractController
{
    public function __construct(
        private readonly MessageBusInterface $commandBus,
    ) {
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        #[MapRequestPayload] PatientResource $resource,
    ): JsonResponse {
        // Create command from resource
        $command = CreatePatientCommand::create(
            fullName: $resource->fullName,
            taxId: $resource->taxId,
            email: $resource->email,
            phone: $resource->phone,
        );

        // Dispatch command (no return value)
        $this->commandBus->dispatch($command);

        // Return 201 Created without body (or with location header)
        return new JsonResponse(
            data: null,
            status: Response::HTTP_CREATED,
        );
    }
}
```

#### 5. Use Repository for Reads (Read Side)

```php
<?php
// src/Infrastructure/Api/Controller/PatientController.php

#[Route('/{id}', name: 'get', methods: ['GET'])]
public function get(
    int $id,
    PatientRepositoryInterface $repository,
): JsonResponse {
    // Read side: Direct repository query (no command)
    $patientData = $repository->findForDisplay($id);

    if ($patientData === null) {
        throw $this->createNotFoundException();
    }

    return new JsonResponse($patientData);
}

#[Route('', name: 'list', methods: ['GET'])]
public function list(
    PatientRepositoryInterface $repository,
): JsonResponse {
    // Read side: Optimized for listing
    $patients = $repository->findAllForList();

    return new JsonResponse($patients);
}
```

## Configuration

### Service Configuration

```yaml
# config/services.yaml
services:
    # Command handlers are auto-registered
    App\Application\Handler\:
        resource: '../src/Application/Handler'
        tags: ['messenger.message_handler']

    # Inject command bus where needed
    App\Infrastructure\Api\Controller\:
        resource: '../src/Infrastructure/Api/Controller'
        arguments:
            $commandBus: '@command.bus'
```

## Testing

### Unit Test for Command Handler

```php
<?php
// tests/Unit/Application/Handler/CreatePatientHandlerTest.php

declare(strict_types=1);

namespace App\Tests\Unit\Application\Handler;

use App\Application\Command\CreatePatientCommand;
use App\Application\Handler\CreatePatientHandler;
use App\Domain\Repository\PatientRepositoryInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Messenger\MessageBusInterface;

final class CreatePatientHandlerTest extends TestCase
{
    public function testHandleCreatesPatientAndDispatchesEvent(): void
    {
        // Arrange
        $repository = $this->createMock(PatientRepositoryInterface::class);
        $eventBus = $this->createMock(MessageBusInterface::class);

        $handler = new CreatePatientHandler($repository, $eventBus);

        $command = CreatePatientCommand::create(
            fullName: 'John Doe',
            taxId: '12345678A',
            email: 'john@example.com',
        );

        // Assert
        $repository->expects($this->once())
            ->method('save');

        $eventBus->expects($this->once())
            ->method('dispatch');

        // Act
        $handler($command);
    }
}
```

### Integration Test with Command Bus

```php
<?php
// tests/Integration/Application/Command/CreatePatientCommandTest.php

declare(strict_types=1);

namespace App\Tests\Integration\Application\Command;

use App\Application\Command\CreatePatientCommand;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Messenger\MessageBusInterface;

final class CreatePatientCommandTest extends KernelTestCase
{
    public function testDispatchCommandCreatesPatient(): void
    {
        // Arrange
        self::bootKernel();
        $commandBus = self::getContainer()->get('command.bus');

        $command = CreatePatientCommand::create(
            fullName: 'Jane Smith',
            taxId: '87654321B',
            email: 'jane@example.com',
        );

        // Act
        $commandBus->dispatch($command);

        // Assert - check database
        $em = self::getContainer()->get('doctrine')->getManager();
        $patient = $em->getRepository(Patient::class)
            ->findOneBy(['taxId' => '87654321B']);

        $this->assertNotNull($patient);
        $this->assertSame('Jane Smith', $patient->getFullName());
    }
}
```

## Performance Considerations

### Write Side Optimization
- **Transactional**: Commands run in transactions (via `doctrine_transaction` middleware)
- **Synchronous by default**: Ensures consistency
- **Single responsibility**: Each handler does one thing
- **Event emission**: Decouple side effects via domain events

### Read Side Optimization
- **Direct repository access**: No command overhead
- **Optimized queries**: Use `getArrayResult()`, select only needed fields
- **Custom projections**: Create specialized read methods for each view
- **Caching**: Cache read results (not write operations)

### Scalability
```
Write Side                Read Side
┌─────────────┐          ┌─────────────┐
│  Commands   │          │  Queries    │
│  (1 server) │          │ (N servers) │
└──────┬──────┘          └──────┬──────┘
       │                        │
       ▼                        ▼
┌─────────────┐          ┌─────────────┐
│   Master    │  Sync    │  Read       │
│   Database  ├─────────►│  Replicas   │
└─────────────┘          └─────────────┘
```

## Troubleshooting

### Command handler not found
```
Error: No handler for message "App\Application\Command\CreatePatientCommand"
```

**Solution**: Ensure handler is tagged with `#[AsMessageHandler]` or registered in services.yaml

### Command returns a value
```php
// ❌ Bad: Commands should not return values
public function __invoke(CreatePatientCommand $command): int
{
    $patient = ...;
    return $patient->getId(); // DON'T DO THIS
}

// ✅ Good: Commands return void
public function __invoke(CreatePatientCommand $command): void
{
    $patient = ...;
    // Emit event if other parts need to know
    $this->eventBus->dispatch(new PatientCreatedEvent($patient->getId()));
}
```

### Read operations in command handler
```php
// ❌ Bad: Don't query in command handler to return data
public function __invoke(CreatePatientCommand $command): array
{
    $patient = ...;
    $this->repository->save($patient);

    return $this->repository->findForDisplay($patient->getId()); // DON'T
}

// ✅ Good: Commands don't return data
public function __invoke(CreatePatientCommand $command): void
{
    $patient = ...;
    $this->repository->save($patient);
    // Controller will make separate read query if needed
}
```

## Best Practices

### Command Naming
- Use imperative verbs: `CreatePatient`, `UpdatePatient`, `DeletePatient`
- Be specific: `ActivatePatient` not `ChangePatientStatus`
- One action per command: `UpdatePatientEmail` not `UpdatePatient`

### Handler Responsibilities
- ✅ Validate business rules
- ✅ Create/modify entities
- ✅ Persist changes
- ✅ Emit domain events
- ❌ Query for display purposes
- ❌ Return data to caller

### Read Side
- Use repositories directly (no commands for reads)
- Optimize queries for specific UI needs
- Consider read models (projections) for complex views
- Cache aggressively (reads > writes typically)

### Event-Driven Architecture
```php
// Command Handler emits event
$this->eventBus->dispatch(
    new PatientCreatedEvent($patient->getId())
);

// Other parts of system react independently
// - Send welcome email
// - Update statistics
// - Notify administrators
// - Sync to external systems
```

## References

- [CQRS Pattern by Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [Symfony Messenger Documentation](https://symfony.com/doc/current/messenger.html)
- Related skills:
  - [repository-pattern-v1.0.md](./repository-pattern-v1.0.md)
  - [event-sourcing-v1.0.md](./event-sourcing-v1.0.md)
- Related agents:
  - [.agents/core/symfony-ddd-agent-v1.0.md](../../.agents/core/symfony-ddd-agent-v1.0.md)

## Examples in MyPhysio Project

```bash
# See real implementations:
src/Application/Command/Patient/
src/Application/Handler/Patient/
src/Infrastructure/Api/Controller/PatientController.php
```
