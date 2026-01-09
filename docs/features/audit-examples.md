# Sistema de Auditoría - Ejemplos de Uso

Este documento proporciona ejemplos prácticos del sistema de auditoría implementado.

## Tabla de Contenidos

- [Configuración](#configuración)
- [Dos Niveles de Auditoría](#dos-niveles-de-auditoría)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Consultas Comunes](#consultas-comunes)
- [Tests](#tests)

## Configuración

### Activar Auditoría

```bash
# En .env o .env.local
AUDIT_TRAIL_ENABLED=true      # Auditoría técnica automática
DOMAIN_EVENTS_ENABLED=true    # Auditoría de eventos de negocio
```

### Tablas Creadas

El sistema utiliza dos tablas:

- **`audit_trail`**: Captura automática de cambios en entidades (INSERT/UPDATE/DELETE)
- **`domain_events`**: Registro manual de eventos de negocio

## Dos Niveles de Auditoría

### Nivel 1: Auditoría Técnica Automática (DoctrineAuditListener)

Se activa automáticamente al hacer `flush()` en Doctrine:

```php
$patient = Patient::create('John', 'Doe', null, null, '123456789');
$patient->email = 'john@example.com';

$entityManager->persist($patient);
$entityManager->flush(); // ✅ Auditoría automática creada en audit_trail
```

**Entidades auditadas automáticamente:**
- Patient
- Invoice
- Appointment
- Customer
- Record
- User

### Nivel 2: Auditoría de Negocio (AuditLogger)

Registro manual de eventos de negocio importantes:

```php
use App\Infrastructure\Audit\AuditLogger;

$this->auditLogger->logPatientCreated(
    patientId: $patient->id,
    metadata: ['source' => 'registration_form', 'campaign' => 'summer2024']
);
```

## Ejemplos Prácticos

### Ejemplo 1: Crear Paciente con Auditoría Completa

```php
use App\Infrastructure\Audit\AuditLogger;
use App\Domain\Entity\Patient;

class PatientService
{
    public function __construct(
        private EntityManagerInterface $em,
        private AuditLogger $auditLogger
    ) {}

    public function createPatient(array $data): Patient
    {
        // 1. Crear paciente
        $patient = Patient::create(
            $data['firstName'],
            $data['lastName'],
            $data['dateOfBirth'] ?? null,
            $data['taxId'] ?? null,
            $data['phone']
        );
        $patient->email = $data['email'];

        // 2. Persistir (auditoría técnica automática)
        $this->em->persist($patient);
        $this->em->flush();

        // 3. Registrar evento de negocio (opcional, para contexto adicional)
        $this->auditLogger->logPatientCreated(
            patientId: $patient->id,
            metadata: [
                'source' => 'web_registration',
                'referral_code' => $data['referralCode'] ?? null,
                'marketing_consent' => $data['marketingConsent'] ?? false
            ]
        );

        return $patient;
    }
}
```

**Resultado en Base de Datos:**

Tabla `audit_trail`:
```
| id | entity_type | entity_id | operation | changes                  | changed_by | ip_address    | changed_at          |
|----|-------------|-----------|-----------|--------------------------|------------|---------------|---------------------|
| 1  | Patient     | 1         | created   | {"firstName":{"before... | 1          | 192.168.1.100 | 2024-01-15 10:30:00 |
```

Tabla `domain_events`:
```
| id | event_id | event_name      | aggregate_type | aggregate_id | payload | user_id | occurred_at         |
|----|----------|-----------------|----------------|--------------|---------|---------|---------------------|
| 1  | uuid...  | patient.created | Patient        | 1            | {}      | 1       | 2024-01-15 10:30:00 |
```

### Ejemplo 2: Actualizar Paciente

```php
public function updatePatient(int $id, array $data): Patient
{
    $patient = $this->em->getRepository(Patient::class)->find($id);

    // Guardar valores anteriores para el evento
    $changes = [];

    if (isset($data['email']) && $patient->email !== $data['email']) {
        $changes['email'] = [
            'before' => $patient->email,
            'after' => $data['email']
        ];
        $patient->email = $data['email'];
    }

    if (isset($data['phone']) && $patient->phone !== $data['phone']) {
        $changes['phone'] = [
            'before' => $patient->phone,
            'after' => $data['phone']
        ];
        $patient->phone = $data['phone'];
    }

    // Auditoría técnica automática
    $this->em->flush();

    // Auditoría de negocio con cambios específicos
    if (!empty($changes)) {
        $this->auditLogger->logPatientUpdated(
            patientId: $patient->id,
            changes: $changes,
            metadata: [
                'reason' => 'Contact information update',
                'fields_updated' => array_keys($changes)
            ]
        );
    }

    return $patient;
}
```

### Ejemplo 3: Cancelar Factura con Razón

```php
public function cancelInvoice(int $id, string $reason): void
{
    $invoice = $this->em->getRepository(Invoice::class)->find($id);

    $invoice->cancel();

    // Auditoría técnica automática
    $this->em->flush();

    // Auditoría de negocio con razón
    $this->auditLogger->logInvoiceCancelled(
        invoiceId: $invoice->id,
        reason: $reason,
        metadata: [
            'original_amount' => $invoice->totalAmount,
            'customer' => $invoice->customer->fullName,
            'cancelled_by' => $this->security->getUser()->getEmail()
        ]
    );
}
```

### Ejemplo 4: Eventos Disponibles en AuditLogger

```php
// Pacientes
$auditLogger->logPatientCreated($patientId, $metadata);
$auditLogger->logPatientUpdated($patientId, $changes, $metadata);

// Facturas
$auditLogger->logInvoiceIssued($invoiceId, $metadata);
$auditLogger->logInvoiceCancelled($invoiceId, $reason, $metadata);

// Citas
$auditLogger->logAppointmentScheduled($appointmentId, $metadata);
$auditLogger->logAppointmentCancelled($appointmentId, $reason, $metadata);

// Clientes
$auditLogger->logCustomerCreated($customerId, $metadata);
$auditLogger->logCustomerUpdated($customerId, $changes, $metadata);

// Registros médicos
$auditLogger->logRecordCreated($recordId, $metadata);
```

## Consultas Comunes

### Consulta 1: Obtener Historial Completo de un Paciente

```php
use App\Domain\Entity\AuditTrail;
use App\Domain\Entity\DomainEvent;

public function getPatientHistory(int $patientId): array
{
    $history = [];

    // 1. Auditoría técnica (cambios de base de datos)
    $technicalAudit = $this->em->getRepository(AuditTrail::class)->findBy([
        'entityType' => 'Patient',
        'entityId' => (string) $patientId
    ], ['changedAt' => 'ASC']);

    foreach ($technicalAudit as $audit) {
        $history[] = [
            'type' => 'technical',
            'date' => $audit->changedAt,
            'operation' => $audit->operation, // created, updated, deleted
            'changes' => $audit->changes,
            'user' => $audit->changedBy?->email,
            'ip' => $audit->ipAddress
        ];
    }

    // 2. Eventos de negocio
    $businessEvents = $this->em->getRepository(DomainEvent::class)->findBy([
        'aggregateType' => 'Patient',
        'aggregateId' => (string) $patientId
    ], ['occurredAt' => 'ASC']);

    foreach ($businessEvents as $event) {
        $history[] = [
            'type' => 'business',
            'date' => $event->occurredAt,
            'event' => $event->eventName,
            'payload' => $event->payload,
            'metadata' => $event->metadata,
            'user' => $event->user?->email
        ];
    }

    // Ordenar por fecha
    usort($history, fn($a, $b) => $a['date'] <=> $b['date']);

    return $history;
}
```

### Consulta 2: Verificar Quién Modificó una Factura

```php
public function whoModifiedInvoice(int $invoiceId): array
{
    return $this->em->getRepository(AuditTrail::class)
        ->createQueryBuilder('a')
        ->where('a.entityType = :type')
        ->andWhere('a.entityId = :id')
        ->andWhere('a.operation = :op')
        ->setParameter('type', 'Invoice')
        ->setParameter('id', (string) $invoiceId)
        ->setParameter('op', 'updated')
        ->orderBy('a.changedAt', 'DESC')
        ->getQuery()
        ->getResult();
}
```

### Consulta 3: Actividad Reciente por Usuario

```php
public function getUserRecentActivity(User $user, int $limit = 50): array
{
    return $this->em->getRepository(DomainEvent::class)
        ->createQueryBuilder('e')
        ->where('e.user = :user')
        ->setParameter('user', $user)
        ->orderBy('e.occurredAt', 'DESC')
        ->setMaxResults($limit)
        ->getQuery()
        ->getResult();
}
```

### Consulta 4: Cambios en un Periodo de Tiempo

```php
public function getChangesInPeriod(\DateTimeInterface $from, \DateTimeInterface $to): array
{
    return [
        'technical' => $this->em->getRepository(AuditTrail::class)
            ->createQueryBuilder('a')
            ->where('a.changedAt BETWEEN :from AND :to')
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->orderBy('a.changedAt', 'DESC')
            ->getQuery()
            ->getResult(),

        'business' => $this->em->getRepository(DomainEvent::class)
            ->createQueryBuilder('e')
            ->where('e.occurredAt BETWEEN :from AND :to')
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->orderBy('e.occurredAt', 'DESC')
            ->getQuery()
            ->getResult()
    ];
}
```

## Tests

### Ejecutar Tests de Auditoría

```bash
# Todos los tests de auditoría
php bin/phpunit tests/Unit/Infrastructure/Audit/
php bin/phpunit tests/Unit/Domain/Entity/AuditTrail*.php
php bin/phpunit tests/Unit/Domain/Entity/DomainEvent*.php
php bin/phpunit tests/Integration/Audit/

# Tests específicos
php bin/phpunit tests/Unit/Infrastructure/Audit/DoctrineAuditListenerTest.php
php bin/phpunit tests/Unit/Infrastructure/Audit/AuditLoggerTest.php
php bin/phpunit tests/Integration/Audit/AuditSystemIntegrationTest.php
```

### Estructura de Tests

- **Unit Tests (44 tests):**
  - `DoctrineAuditListenerTest.php` - Auditoría automática
  - `AuditLoggerTest.php` - Registro de eventos
  - `AuditTrailTest.php` - Entidad de auditoría técnica
  - `DomainEventTest.php` - Entidad de eventos de negocio

- **Integration Tests (1 test):**
  - `AuditSystemIntegrationTest.php` - Test end-to-end

### Nota sobre Tests

La auditoría automática vía `DoctrineAuditListener` está completamente verificada mediante tests unitarios. En tests de integración con `KernelTestCase` existen limitaciones conocidas con event listeners de Doctrine, por lo que se recomienda usar `AuditLogger` directamente en tests.

## Mejores Prácticas

### 1. Siempre Proporcionar Contexto en Eventos de Negocio

```php
// ❌ Malo: Sin metadata
$this->auditLogger->logPatientCreated($patient->id);

// ✅ Bueno: Con contexto útil
$this->auditLogger->logPatientCreated(
    patientId: $patient->id,
    metadata: [
        'source' => 'mobile_app',
        'version' => '2.1.0',
        'referral_code' => 'PROMO2024'
    ]
);
```

### 2. Registrar Razones para Acciones Críticas

```php
// ✅ Siempre incluir razón en cancelaciones
$this->auditLogger->logInvoiceCancelled(
    invoiceId: $invoice->id,
    reason: 'Duplicate invoice - original is #456',
    metadata: ['related_invoice_id' => 456]
);
```

### 3. La Auditoría Técnica es Automática

```php
// ✅ No necesitas hacer nada especial
$patient->email = 'new@example.com';
$this->em->flush(); // Auditoría automática se crea aquí
```

### 4. Usa Eventos de Negocio para Contexto Adicional

```php
// ✅ Combina auditoría automática con eventos de negocio
$patient->status = PatientStatus::INACTIVE;
$this->em->flush(); // Auditoría técnica

$this->auditLogger->logPatientUpdated(
    patientId: $patient->id,
    changes: ['status' => ['before' => 'active', 'after' => 'inactive']],
    metadata: ['reason' => 'Patient requested account deactivation (GDPR)']
);
```

## Entidades Auditadas

Las siguientes entidades se auditan automáticamente:

- `Patient` - Pacientes
- `Invoice` - Facturas
- `Appointment` - Citas
- `Customer` - Clientes
- `Record` - Registros médicos
- `User` - Usuarios

Todos los cambios (INSERT/UPDATE/DELETE) se registran automáticamente en `audit_trail`.

## Recursos Adicionales

- Documentación completa: `docs/AUDIT_SYSTEM.md`
- Código fuente listener: `src/Infrastructure/Audit/DoctrineAuditListener.php`
- Código fuente logger: `src/Infrastructure/Audit/AuditLogger.php`
- Entidades: `src/Domain/Entity/AuditTrail.php`, `src/Domain/Entity/DomainEvent.php`
- Tests: `tests/Unit/Infrastructure/Audit/`, `tests/Integration/Audit/`

## Configuración Avanzada

### Desactivar Auditoría Temporalmente

```php
// En .env.local para desarrollo
AUDIT_TRAIL_ENABLED=false
DOMAIN_EVENTS_ENABLED=false
```

### Verificar Estado de Auditoría

```php
if ($this->auditLogger->isEnabled()) {
    // Auditoría de eventos está activa
}
```

### Limpieza de Logs Antiguos (Futuro)

```bash
# Comando planificado para futuras versiones
php bin/console app:audit:cleanup --older-than="2 years" --dry-run
```
