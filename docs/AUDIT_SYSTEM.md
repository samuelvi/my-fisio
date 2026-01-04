# Sistema de Auditoría

## Descripción General

El sistema de auditoría de MyPhysio proporciona un registro completo de todas las acciones y cambios realizados en la aplicación, cumpliendo con requisitos de compliance, seguridad y trazabilidad.

El sistema opera con dos tablas especializadas:

### 1. **Audit Trail** (Compliance)
Rastrea automáticamente todos los cambios en la base de datos (CREATE, UPDATE, DELETE) mediante un listener de Doctrine personalizado.

### 2. **Domain Events** (Event Sourcing)
Registra eventos de negocio siguiendo patrones de Event Sourcing con contexto completo, metadata y soporte para correlation IDs.

## Configuración

El sistema de auditoría puede ser activado/desactivado mediante variables de entorno:

```bash
# Audit Trail (cambios técnicos)
AUDIT_TRAIL_ENABLED=true|false

# Domain Events (eventos de negocio)
DOMAIN_EVENTS_ENABLED=true|false
```

### Configuración por Entorno

#### Desarrollo (.env.dev)
```bash
AUDIT_TRAIL_ENABLED=false      # Deshabilitado para mejor rendimiento
DOMAIN_EVENTS_ENABLED=true     # Habilitado para testing
```

#### Testing (.env.test)
```bash
AUDIT_TRAIL_ENABLED=false      # Los tests deben ser independientes
DOMAIN_EVENTS_ENABLED=false    # Los tests deben ser independientes
```

#### Producción (.env.prod)
```bash
AUDIT_TRAIL_ENABLED=true       # Obligatorio para compliance
DOMAIN_EVENTS_ENABLED=true     # Obligatorio para trazabilidad y event sourcing
```

## Audit Trail

### Funcionamiento

Utiliza un **DoctrineAuditListener** personalizado que escucha el evento `onFlush` de Doctrine para capturar automáticamente todos los cambios en las entidades auditadas.

### Tabla `audit_trail`

Campos:
- `id` - ID autoincremental
- `entity_type` - Tipo de entidad ('Patient', 'Invoice', etc.)
- `entity_id` - ID de la entidad afectada
- `operation` - Operación realizada ('created', 'updated', 'deleted')
- `changes` - JSON con cambios: `{"field": {"before": val, "after": val}}`
- `changed_at` - Timestamp del cambio
- `changed_by` - Usuario que realizó el cambio (FK a users)
- `ip_address` - IP del usuario
- `user_agent` - Navegador/dispositivo del usuario

### Entidades Auditadas

Las siguientes entidades se auditan automáticamente:
- ✅ `Patient` (Pacientes)
- ✅ `Appointment` (Citas)
- ✅ `Invoice` (Facturas)
- ✅ `Record` (Historiales clínicos)
- ✅ `Customer` (Clientes)
- ✅ `User` (Usuarios)

### Consultar Audit Trail

```php
// Obtener el historial de cambios de un paciente
$auditTrail = $entityManager->getRepository(AuditTrail::class)->findBy([
    'entityType' => 'Patient',
    'entityId' => $patientId
], ['changedAt' => 'DESC']);

// Ver qué campos cambiaron
foreach ($auditTrail as $entry) {
    echo $entry->operation . " at " . $entry->changedAt->format('Y-m-d H:i:s');

    foreach ($entry->changes as $field => $change) {
        echo "  $field: {$change['before']} → {$change['after']}";
    }
}
```

## Domain Events

### Funcionamiento

Registra eventos de negocio en la tabla `domain_events` siguiendo el patrón Event Sourcing. Los eventos se disparan explícitamente desde el código de negocio y son capturados por el **AuditEventSubscriber**.

### Tabla `domain_events`

Campos:
- `id` - ID autoincremental
- `event_id` - UUID único del evento
- `event_name` - Nombre del evento ('patient.created', 'invoice.cancelled', etc.)
- `event_version` - Versión del schema del evento (para evolución)
- `aggregate_type` - Tipo de agregado ('Patient', 'Invoice', etc.)
- `aggregate_id` - ID del agregado
- `payload` - JSON con datos completos del evento
- `metadata` - JSON con contexto adicional
- `occurred_at` - Timestamp de negocio (cuándo ocurrió el evento)
- `recorded_at` - Timestamp técnico (cuándo se guardó)
- `user_id` - Usuario que disparó el evento (FK a users)
- `correlation_id` - ID para rastrear operaciones relacionadas
- `causation_id` - ID del evento que causó este evento (cadena de causalidad)

### Información Registrada

Para cada evento se registra:
- 📋 **Tipo de agregado** afectado (Patient, Invoice, etc.)
- 🆔 **ID del agregado**
- 🎯 **Nombre del evento** (patient.created, invoice.cancelled, etc.)
- 👤 **Usuario** que disparó el evento (o null para eventos del sistema)
- 🕐 **Timestamps** (occurred_at, recorded_at)
- 🌐 **IP Address** y **User Agent** (en metadata)
- 📊 **Payload** completo del evento
- 📝 **Metadata** adicional (razones, notas, contexto)
- 🔗 **Correlation y Causation IDs** para rastreo de operaciones

### Eventos Disponibles

#### Pacientes
- `patient.created` - Paciente creado
- `patient.updated` - Datos del paciente actualizados

#### Facturas
- `invoice.issued` - Factura emitida
- `invoice.cancelled` - Factura anulada (con razón en payload)

#### Citas
- `appointment.scheduled` - Cita programada
- `appointment.updated` - Cita modificada
- `appointment.cancelled` - Cita cancelada (con razón en payload)

#### Clientes
- `customer.created` - Cliente creado
- `customer.updated` - Cliente actualizado

#### Historiales Clínicos
- `record.created` - Historial creado
- `record.updated` - Historial modificado

### Consultar Domain Events

```php
// Obtener todos los eventos de un paciente
$events = $entityManager->getRepository(DomainEvent::class)->findBy([
    'aggregateType' => 'Patient',
    'aggregateId' => $patientId
], ['occurredAt' => 'DESC']);

// Buscar eventos por nombre
$cancelledInvoices = $entityManager->getRepository(DomainEvent::class)->findBy([
    'eventName' => 'invoice.cancelled'
], ['occurredAt' => 'DESC']);

// Obtener eventos correlacionados
$relatedEvents = $entityManager->getRepository(DomainEvent::class)->findBy([
    'correlationId' => $correlationId
], ['occurredAt' => 'ASC']);
```

## Uso en el Código

### Disparar Eventos de Negocio

```php
use App\Domain\Event\PatientCreatedEvent;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;

class PatientService
{
    public function __construct(
        private EventDispatcherInterface $eventDispatcher,
        private EntityManagerInterface $em
    ) {}

    public function createPatient(array $data): Patient
    {
        $patient = Patient::create(...);

        // 1. Guardar (Audit Trail se registra automáticamente)
        $this->em->persist($patient);
        $this->em->flush();

        // 2. Disparar evento (Domain Event se registra automáticamente)
        $this->eventDispatcher->dispatch(
            new PatientCreatedEvent($patient),
            PatientCreatedEvent::NAME
        );

        return $patient;
    }
}
```

### Eventos con Metadata

```php
// Cancelar factura con razón
$this->eventDispatcher->dispatch(
    new InvoiceCancelledEvent(
        invoice: $invoice,
        reason: 'Duplicate invoice',
        metadata: ['original_invoice_id' => 123]
    ),
    InvoiceCancelledEvent::NAME
);
```

## Compliance y Seguridad

### RGPD / GDPR

⚠️ **Importante**: Los logs de auditoría contienen datos personales y están sujetos al RGPD.

- Los logs deben tener el mismo tratamiento que los datos principales
- El derecho al olvido aplica también a los logs de auditoría
- Implementar retención de datos según normativa

### Retención de Datos

Se recomienda:
- **Audit Trail**: Mantener mínimo 1 año, ideal 3-5 años
- **Domain Events**: Mantener según requisitos legales y de event sourcing (5-10 años o indefinido)
- Implementar archivado automático de logs antiguos
- No eliminar eventos de acciones críticas (facturas, consentimientos)

### Inmutabilidad

Los registros de auditoría son **inmutables** por diseño:
- No se pueden editar ni eliminar manualmente
- Solo lectura para usuarios normales
- Acceso restringido a administradores

### Acceso a Logs

- 👥 **Usuarios normales**: No tienen acceso
- 🔧 **Administradores**: Solo lectura
- 🔐 **Superadmin**: Lectura y exportación

## Rendimiento

### Impacto

- **Audit Trail**: ~5-8% overhead en escrituras
- **Domain Events**: ~3% overhead en operaciones auditadas
- **Ambas activas**: ~8-11% total

### Optimización

Si el rendimiento es crítico:

1. **Desactivar en desarrollo/testing**
   ```bash
   AUDIT_TRAIL_ENABLED=false
   DOMAIN_EVENTS_ENABLED=false
   ```

2. **Índices optimizados**
   - Ambas tablas tienen índices para consultas comunes
   - `audit_trail`: idx_entity, idx_operation, idx_changed_by
   - `domain_events`: idx_aggregate_stream, idx_event_name, idx_correlation

3. **Futuras optimizaciones**
   - Procesamiento asíncrono con Messenger
   - Particionamiento de tablas por fecha
   - Archivado automático en storage frío

## Consultas Útiles

### Ver eventos recientes (Domain Events)
```sql
SELECT
    de.occurred_at,
    de.event_name,
    de.aggregate_type,
    u.email as user,
    de.metadata->>'$.ip_address' as ip
FROM domain_events de
LEFT JOIN users u ON de.user_id = u.id
ORDER BY de.occurred_at DESC
LIMIT 50;
```

### Ver cambios técnicos de una entidad (Audit Trail)
```sql
SELECT
    at.changed_at,
    at.operation,
    u.email as changed_by,
    at.changes
FROM audit_trail at
LEFT JOIN users u ON at.changed_by = u.id
WHERE at.entity_type = 'Patient' AND at.entity_id = '123'
ORDER BY at.changed_at DESC;
```

### Facturas canceladas con razones
```sql
SELECT
    de.aggregate_id as invoice_id,
    de.occurred_at,
    de.payload->>'$.cancellation_reason' as reason,
    u.email as cancelled_by
FROM domain_events de
LEFT JOIN users u ON de.user_id = u.id
WHERE de.event_name = 'invoice.cancelled'
ORDER BY de.occurred_at DESC;
```

### Reconstruir estado de un agregado (Event Sourcing)
```sql
-- Obtener todos los eventos de una factura en orden cronológico
SELECT
    event_name,
    payload,
    occurred_at
FROM domain_events
WHERE aggregate_type = 'Invoice' AND aggregate_id = '123'
ORDER BY occurred_at ASC;
```

## Soporte

Para preguntas o issues relacionados con el sistema de auditoría:
- Consultar [AUDIT_EXAMPLES.md](./AUDIT_EXAMPLES.md) para ejemplos prácticos
- Revisar [AUDIT_TECHNICAL.md](../private/docs/AUDIT_TECHNICAL.md) para detalles técnicos
- Consultar código fuente en `src/Infrastructure/Audit/`
- Contactar al equipo de desarrollo
