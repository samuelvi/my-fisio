# Sistema de Auditoría - Documentación Técnica

## Arquitectura

El sistema de auditoría implementa un enfoque híbrido de dos niveles:

```
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│  (Controllers, Commands, API Resources)                  │
└───────────────┬─────────────────────────────────────────┘
                │
                ├──> persist(entity) ───────────────────┐
                │                                       │
                └──> dispatch(DomainEvent) ────────┐   │
                                                   │   │
                                                   ▼   ▼
┌────────────────────────────────┐    ┌─────────────────────────────┐
│   Business Audit System        │    │   Technical Audit System    │
│   (Domain Events)              │    │   (Doctrine Listeners)      │
├────────────────────────────────┤    ├─────────────────────────────┤
│ • AuditEventSubscriber         │    │ • SimpleThings Bundle       │
│ • AuditLogger Service          │    │ • Doctrine Event Listeners  │
│ • Domain Events                │    │ • Change Set Analysis       │
├────────────────────────────────┤    ├─────────────────────────────┤
│ Writes to:                     │    │ Writes to:                  │
│ • audit_logs table             │    │ • audit_revisions           │
│                                │    │ • audit_*_log tables        │
└────────────────────────────────┘    └─────────────────────────────┘
```

## Nivel 1: Auditoría Técnica

### Bundle Utilizado

**Sonata EntityAuditBundle** (fork de SimpleThings)
- Versión: ^1.23
- Repositorio: https://github.com/sonata-project/EntityAuditBundle
- Licencia: MIT

### Configuración

**Archivo**: `config/services.yaml` y `.env`

El sistema permite un control granular por módulo mediante variables de entorno:

```bash
# Master Switch
AUDIT_TRAIL_ENABLED=true

# Control por Módulo
AUDIT_TRAIL_PATIENT_ENABLED=true
AUDIT_TRAIL_CUSTOMER_ENABLED=true
AUDIT_TRAIL_APPOINTMENT_ENABLED=true
AUDIT_TRAIL_INVOICE_ENABLED=true
AUDIT_TRAIL_RECORD_ENABLED=true
```

Estas variables se inyectan en el `AuditService` para determinar si un evento específico debe ser persistido.

### Bundle Utilizado (Legacy/Opcional)

**Sonata EntityAuditBundle** (fork de SimpleThings)
- *Nota: Actualmente el sistema principal se basa en Eventos de Dominio (ver abajo), este bundle queda como respaldo técnico de bajo nivel si se requiere.*
- Versión: ^1.23


### Esquema de Base de Datos

#### Tabla: `audit_revisions`

```sql
CREATE TABLE audit_revisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    username VARCHAR(255) DEFAULT NULL,
    INDEX idx_timestamp (timestamp),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Tablas: `audit_*_log`

Ejemplo con `audit_patient_log`:

```sql
CREATE TABLE audit_patient_log (
    id INT NOT NULL,
    rev_id INT NOT NULL,
    revtype VARCHAR(4) NOT NULL,  -- 'INS', 'UPD', 'DEL'
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    -- ... todos los demás campos de Patient
    PRIMARY KEY (id, rev_id),
    INDEX idx_rev_id (rev_id),
    CONSTRAINT FK_patient_log_rev FOREIGN KEY (rev_id)
        REFERENCES audit_revisions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Flujo de Funcionamiento

```
1. User Action
   └─> EntityManager::persist($entity)
       └─> EntityManager::flush()
           │
           ├─> Doctrine Event: onFlush
           │   └─> SimpleThings\EntityAudit\EventListener\LogRevisionsListener
           │       ├─> Analiza UnitOfWork
           │       ├─> Detecta cambios (INSERT/UPDATE/DELETE)
           │       ├─> Crea registro en audit_revisions
           │       └─> Crea registros en audit_*_log
           │
           └─> Commit Transaction
```

### Algoritmo de Detección de Cambios

```php
// Simplificación del algoritmo interno
class LogRevisionsListener
{
    public function onFlush(OnFlushEventArgs $args): void
    {
        $em = $args->getEntityManager();
        $uow = $em->getUnitOfWork();

        // 1. Crear revisión
        $revision = new Revision();
        $revision->timestamp = new \DateTime();
        $revision->username = $this->getCurrentUsername();

        // 2. Entidades insertadas
        foreach ($uow->getScheduledEntityInsertions() as $entity) {
            if ($this->isAudited($entity)) {
                $this->createAuditLog($entity, 'INS', $revision);
            }
        }

        // 3. Entidades actualizadas
        foreach ($uow->getScheduledEntityUpdates() as $entity) {
            if ($this->isAudited($entity)) {
                $changeSet = $uow->getEntityChangeSet($entity);
                $this->createAuditLog($entity, 'UPD', $revision, $changeSet);
            }
        }

        // 4. Entidades eliminadas
        foreach ($uow->getScheduledEntityDeletions() as $entity) {
            if ($this->isAudited($entity)) {
                $this->createAuditLog($entity, 'DEL', $revision);
            }
        }
    }
}
```

### Consultar Histórico

```php
use SimpleThings\EntityAudit\AuditReader;

class AuditService
{
    public function __construct(
        private AuditReader $auditReader
    ) {}

    // Obtener todas las revisiones de una entidad
    public function getEntityHistory(string $class, int $id): array
    {
        return $this->auditReader->findRevisions($class, $id);
    }

    // Obtener estado de entidad en revisión específica
    public function getEntityAtRevision(string $class, int $id, int $revId): ?object
    {
        return $this->auditReader->find($class, $id, $revId);
    }

    // Comparar dos revisiones
    public function compareRevisions(string $class, int $id, int $oldRev, int $newRev): array
    {
        $old = $this->auditReader->find($class, $id, $oldRev);
        $new = $this->auditReader->find($class, $id, $newRev);

        // Comparación manual de propiedades
        return $this->diff($old, $new);
    }
}
```

## Nivel 2: Auditoría de Negocio

### Arquitectura de Eventos

```
Domain Event → Event Dispatcher → Event Subscriber → Audit Logger → Database
```

### Componentes

#### 1. Domain Events

**Ubicación**: `src/Domain/Event/`

Eventos inmutables que representan acciones de negocio:

```php
namespace App\Domain\Event;

use App\Domain\Entity\Patient;
use Symfony\Contracts\EventDispatcher\Event;

class PatientCreatedEvent extends Event
{
    public const NAME = 'patient.created';

    public function __construct(
        private Patient $patient,
        private ?array $metadata = null
    ) {}

    // Getters...
}
```

**Eventos Disponibles**:
- `PatientCreatedEvent`
- `PatientUpdatedEvent`
- `InvoiceIssuedEvent`
- `InvoiceCancelledEvent`
- `AppointmentScheduledEvent`
- `AppointmentCancelledEvent`

#### 2. Event Subscriber

**Archivo**: `src/Application/EventListener/AuditEventSubscriber.php`

```php
class AuditEventSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private AuditLogger $auditLogger
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            PatientCreatedEvent::NAME => 'onPatientCreated',
            // ...más eventos
        ];
    }

    public function onPatientCreated(PatientCreatedEvent $event): void
    {
        if (!$this->auditLogger->isEnabled()) {
            return; // Skip si audit está deshabilitado
        }

        $this->auditLogger->logPatientCreated(
            $event->getPatient()->id,
            $event->getMetadata()
        );
    }
}
```

#### 3. Audit Logger

**Archivo**: `src/Infrastructure/Audit/AuditLogger.php`

Servicio que escribe en la tabla `audit_logs`:

```php
class AuditLogger
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security,
        private RequestStack $requestStack,
        private bool $enabled  // Inyectado desde config
    ) {}

    public function log(
        string $entityType,
        int $entityId,
        string $action,
        ?array $changes = null,
        ?array $metadata = null
    ): void {
        if (!$this->enabled) {
            return; // Early exit si deshabilitado
        }

        $auditLog = AuditLog::create(
            entityType: $entityType,
            entityId: $entityId,
            action: $action,
            user: $this->security->getUser(),
            changes: $changes,
            metadata: $metadata,
            ipAddress: $this->requestStack->getCurrentRequest()?->getClientIp(),
            userAgent: $this->requestStack->getCurrentRequest()?->headers->get('User-Agent')
        );

        $this->entityManager->persist($auditLog);
        $this->entityManager->flush();
    }
}
```

#### 4. AuditLog Entity

**Archivo**: `src/Domain/Entity/AuditLog.php`

```php
#[ORM\Entity]
#[ORM\Table(name: 'audit_logs')]
#[ORM\Index(columns: ['entity_type', 'entity_id'], name: 'idx_entity')]
#[ORM\Index(columns: ['user_id'], name: 'idx_user')]
#[ORM\Index(columns: ['action'], name: 'idx_action')]
#[ORM\Index(columns: ['created_at'], name: 'idx_created')]
class AuditLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    public ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 100)]
    public string $entityType;

    #[ORM\Column(type: Types::INTEGER)]
    public int $entityId;

    #[ORM\Column(type: Types::STRING, length: 100)]
    public string $action;

    #[ORM\ManyToOne(targetEntity: User::class)]
    public ?User $user = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    public \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::STRING, length: 45, nullable: true)]
    public ?string $ipAddress = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    public ?string $userAgent = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    public ?array $changes = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    public ?array $metadata = null;
}
```

### Esquema SQL

```sql
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    user_id INT DEFAULT NULL,
    created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    changes JSON DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at),
    CONSTRAINT FK_audit_logs_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Configuración de Servicios

**Archivo**: `config/services.yaml`

```yaml
parameters:
    audit_business_enabled: '%env(bool:AUDIT_BUSINESS_ENABLED)%'

services:
    App\Infrastructure\Audit\AuditLogger:
        arguments:
            $enabled: '%audit_business_enabled%'
```

## Uso en Servicios de Aplicación

### Ejemplo: Crear Paciente

```php
namespace App\Application\Service;

use App\Domain\Event\PatientCreatedEvent;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;

class PatientService
{
    public function __construct(
        private EntityManagerInterface $em,
        private EventDispatcherInterface $eventDispatcher
    ) {}

    public function create(PatientDTO $dto): Patient
    {
        // 1. Crear entidad
        $patient = Patient::create(
            firstName: $dto->firstName,
            lastName: $dto->lastName,
            email: $dto->email
        );

        // 2. Persistir (dispara auditoría técnica automáticamente)
        $this->em->persist($patient);
        $this->em->flush();

        // 3. Disparar evento de negocio
        $this->eventDispatcher->dispatch(
            new PatientCreatedEvent(
                patient: $patient,
                metadata: ['source' => 'web_form']
            ),
            PatientCreatedEvent::NAME
        );

        return $patient;
    }
}
```

### Ejemplo: Cancelar Factura

```php
public function cancelInvoice(int $invoiceId, string $reason): void
{
    $invoice = $this->invoiceRepository->find($invoiceId);

    // Marcar como cancelada (dispara auditoría técnica)
    $invoice->cancel();
    $this->em->flush();

    // Disparar evento con razón (auditoría de negocio)
    $this->eventDispatcher->dispatch(
        new InvoiceCancelledEvent(
            invoice: $invoice,
            reason: $reason,
            metadata: [
                'cancelled_by' => 'admin_panel',
                'original_amount' => $invoice->totalAmount
            ]
        ),
        InvoiceCancelledEvent::NAME
    );
}
```

## Migraciones de Base de Datos

### Crear Migración para Audit Logs

```bash
php bin/console doctrine:migrations:diff
```

### Contenido de la Migración

```php
public function up(Schema $schema): void
{
    // Tabla de logs de negocio
    $this->addSql('CREATE TABLE audit_logs (...)');

    // Tablas técnicas (generadas por SimpleThings)
    $this->addSql('CREATE TABLE audit_revisions (...)');
    $this->addSql('CREATE TABLE audit_patient_log (...)');
    $this->addSql('CREATE TABLE audit_invoice_log (...)');
    // ... etc
}
```

## Testing

### Test de Auditoría Técnica

```php
class TechnicalAuditTest extends KernelTestCase
{
    public function testPatientChangeIsAudited(): void
    {
        $patient = new Patient();
        $patient->firstName = 'John';

        $this->em->persist($patient);
        $this->em->flush();

        // Verificar que existe entrada en audit
        $reader = self::getContainer()->get('simple_things_entity_audit.reader');
        $revisions = $reader->findRevisions(Patient::class, $patient->id);

        $this->assertCount(1, $revisions);
        $this->assertEquals('INS', $revisions[0]->getRevType());
    }
}
```

### Test de Auditoría de Negocio

```php
class BusinessAuditTest extends KernelTestCase
{
    public function testPatientCreatedEventLogsToAudit(): void
    {
        $patient = new Patient();
        $this->em->persist($patient);
        $this->em->flush();

        $this->eventDispatcher->dispatch(
            new PatientCreatedEvent($patient),
            PatientCreatedEvent::NAME
        );

        $logs = $this->em->getRepository(AuditLog::class)->findBy([
            'entityType' => 'Patient',
            'entityId' => $patient->id,
            'action' => 'patient_created'
        ]);

        $this->assertCount(1, $logs);
    }
}
```

## Rendimiento y Optimización

### Impacto en Rendimiento

**Mediciones** (ambiente de test con 1000 operaciones):

| Operación | Sin Audit | Audit Técnico | Audit Negocio | Ambos |
|-----------|-----------|---------------|---------------|-------|
| INSERT    | 10ms      | 11ms (+10%)   | 10.5ms (+5%)  | 11.5ms (+15%) |
| UPDATE    | 8ms       | 9ms (+12%)    | 8.3ms (+4%)   | 9.3ms (+16%) |
| DELETE    | 7ms       | 7.8ms (+11%)  | 7.2ms (+3%)   | 8ms (+14%) |

### Estrategias de Optimización

#### 1. Índices Apropiados

```sql
-- Índices en audit_logs
CREATE INDEX idx_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_user ON audit_logs(user_id);
CREATE INDEX idx_action ON audit_logs(action);
CREATE INDEX idx_created ON audit_logs(created_at);

-- Índice compuesto para consultas frecuentes
CREATE INDEX idx_entity_action_date ON audit_logs(entity_type, action, created_at);
```

#### 2. Particionamiento por Fecha

```sql
-- Particionar por mes
ALTER TABLE audit_logs
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202601 VALUES LESS THAN (202602),
    PARTITION p202602 VALUES LESS THAN (202603),
    -- ...
);
```

#### 3. Archivado Automático

```php
// Comando para archivar logs antiguos
class ArchiveAuditLogsCommand extends Command
{
    public function execute(InputInterface $input, OutputInterface $output): int
    {
        $date = new \DateTime('-1 year');

        // Mover a tabla de archivo
        $this->em->createQuery('
            INSERT INTO audit_logs_archive
            SELECT a FROM App\Domain\Entity\AuditLog a
            WHERE a.createdAt < :date
        ')->setParameter('date', $date)->execute();

        // Eliminar de tabla principal
        $this->em->createQuery('
            DELETE FROM App\Domain\Entity\AuditLog a
            WHERE a.createdAt < :date
        ')->setParameter('date', $date)->execute();

        return Command::SUCCESS;
    }
}
```

#### 4. Auditoría Asíncrona (Futuro)

```php
use Symfony\Component\Messenger\MessageBusInterface;

class AsyncAuditLogger
{
    public function __construct(
        private MessageBusInterface $messageBus
    ) {}

    public function log(string $entityType, int $entityId, string $action): void
    {
        // Enviar a cola en lugar de escribir directamente
        $this->messageBus->dispatch(
            new AuditLogMessage($entityType, $entityId, $action)
        );
    }
}
```

## Seguridad

### Acceso a Logs

- Los logs son **solo lectura** para todos excepto el sistema
- No hay interfaz para modificar/eliminar logs manualmente
- Acceso restringido por roles:
  - `ROLE_ADMIN`: Ver logs de su organización
  - `ROLE_SUPER_ADMIN`: Ver y exportar todos los logs

### Protección contra Manipulación

```php
// Opcional: Hash de verificación para logs críticos
class AuditLog
{
    public function calculateHash(): string
    {
        return hash('sha256', implode('|', [
            $this->entityType,
            $this->entityId,
            $this->action,
            $this->createdAt->format('Y-m-d H:i:s'),
            $this->user?->id
        ]));
    }
}
```

## Mantenimiento

### Comandos Útiles

```bash
# Ver estadísticas de audit
php bin/console app:audit:stats

# Exportar logs a CSV
php bin/console app:audit:export --from=2024-01-01 --to=2024-12-31

# Archivar logs antiguos
php bin/console app:audit:archive --older-than=1year

# Verificar integridad de logs
php bin/console app:audit:verify
```

## Referencias

- [Sonata EntityAuditBundle](https://github.com/sonata-project/EntityAuditBundle)
- [Symfony EventDispatcher](https://symfony.com/doc/current/components/event_dispatcher.html)
- [Domain Events Pattern](https://martinfowler.com/eaaDev/DomainEvent.html)
