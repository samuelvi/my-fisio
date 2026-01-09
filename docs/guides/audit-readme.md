# Sistema de Auditoría - MyPhysio

## Resumen Ejecutivo

El sistema de auditoría de MyPhysio proporciona trazabilidad completa de todas las operaciones realizadas en la aplicación, cumpliendo con requisitos de compliance, seguridad y buenas prácticas médicas.

### Características Principales

✅ **Dos tablas especializadas**
- Audit Trail: Cambios técnicos automáticos en base de datos (compliance)
- Domain Events: Eventos de negocio siguiendo Event Sourcing (arquitectura event-driven)

✅ **Implementación personalizada**
- Sin dependencias externas (bundles)
- Control total sobre la lógica de auditoría
- Nomenclatura estándar de la industria

✅ **Activación/Desactivación flexible**
- Control independiente vía variables de entorno
- Sin impacto en código cuando está deshabilitado

✅ **Compliance RGPD/GDPR**
- Registro completo de accesos y modificaciones
- Información de usuario, IP y timestamp

✅ **Rendimiento optimizado**
- Overhead mínimo (~5-10%)
- Índices optimizados para consultas comunes

## Documentación Disponible

### Para Usuarios y Administradores

📖 **[AUDIT_SYSTEM.md](./AUDIT_SYSTEM.md)** - Documentación Principal
- Descripción del sistema
- Configuración por entorno
- Entidades auditadas
- Consultas útiles
- Compliance y seguridad
- Rendimiento

📝 **[AUDIT_EXAMPLES.md](./AUDIT_EXAMPLES.md)** - Ejemplos Prácticos
- Ejemplos básicos de uso
- Ejemplos avanzados
- Consultas comunes
- Casos de uso reales
- Mejores prácticas

### Para Desarrolladores

🔧 **[../private/docs/AUDIT_TECHNICAL.md](../private/docs/AUDIT_TECHNICAL.md)** - Documentación Técnica
- Arquitectura del sistema
- Flujo de funcionamiento
- Esquema de base de datos
- APIs y servicios
- Testing
- Optimización

## Inicio Rápido

### 1. Activar el Sistema

```bash
# En .env.local o .env.prod
AUDIT_TRAIL_ENABLED=true
DOMAIN_EVENTS_ENABLED=true
```

### 2. Ejecutar Migraciones

```bash
php bin/console doctrine:migrations:migrate
```

### 3. Usar en Código

```php
use App\Domain\Event\PatientCreatedEvent;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;

class PatientService
{
    public function __construct(
        private EntityManagerInterface $em,
        private EventDispatcherInterface $eventDispatcher
    ) {}

    public function createPatient(array $data): Patient
    {
        $patient = new Patient();
        // ... configurar paciente

        // 1. Guardar (Audit Trail automático vía DoctrineAuditListener)
        $this->em->persist($patient);
        $this->em->flush();

        // 2. Disparar evento (Domain Event registrado automáticamente)
        $this->eventDispatcher->dispatch(
            new PatientCreatedEvent($patient),
            PatientCreatedEvent::NAME
        );

        return $patient;
    }
}
```

## Arquitectura

```
┌─────────────────────────────────────────────┐
│         Aplicación (API/Web)                │
└──────────┬──────────────────┬───────────────┘
           │                  │
           ▼                  ▼
  ┌──────────────────┐  ┌─────────────────────┐
  │ Audit Trail      │  │ Domain Events       │
  │                  │  │                     │
  │ Doctrine         │  │ AuditLogger +       │
  │ AuditListener    │  │ EventSubscriber     │
  │ (onFlush)        │  │                     │
  └────────┬─────────┘  └────────┬────────────┘
           │                     │
           ▼                     ▼
  ┌────────────────┐    ┌────────────────────┐
  │ audit_trail    │    │ domain_events      │
  │                │    │                    │
  │ • entity_type  │    │ • event_id (UUID)  │
  │ • entity_id    │    │ • event_name       │
  │ • operation    │    │ • aggregate_type   │
  │ • changes      │    │ • aggregate_id     │
  │ • changed_by   │    │ • payload          │
  │ • changed_at   │    │ • metadata         │
  │ • ip_address   │    │ • user             │
  │ • user_agent   │    │ • occurred_at      │
  └────────────────┘    │ • correlation_id   │
                        └────────────────────┘
```

## Entidades Auditadas

### Audit Trail (Técnica)

Todas las operaciones INSERT/UPDATE/DELETE en:
- **Patient** - Pacientes
- **Invoice** - Facturas
- **Appointment** - Citas
- **Customer** - Clientes
- **Record** - Historiales clínicos
- **User** - Usuarios

### Domain Events (Negocio)

| Entidad      | Eventos Disponibles                                      |
|--------------|----------------------------------------------------------|
| **Patient**  | patient.created, patient.updated                         |
| **Invoice**  | invoice.issued, invoice.cancelled                        |
| **Appointment** | appointment.scheduled, appointment.updated, appointment.cancelled |
| **Customer** | customer.created, customer.updated                       |
| **Record**   | record.created, record.updated                           |

## Eventos de Negocio Disponibles

```php
// Pacientes
PatientCreatedEvent      → 'patient.created'
PatientUpdatedEvent      → 'patient.updated'

// Facturas
InvoiceIssuedEvent       → 'invoice.issued'
InvoiceCancelledEvent    → 'invoice.cancelled'

// Citas
AppointmentScheduledEvent → 'appointment.scheduled'
AppointmentUpdatedEvent   → 'appointment.updated'
AppointmentCancelledEvent → 'appointment.cancelled'

// Clientes
CustomerCreatedEvent     → 'customer.created'
CustomerUpdatedEvent     → 'customer.updated'

// Historiales
RecordCreatedEvent       → 'record.created'
RecordUpdatedEvent       → 'record.updated'
```

## Variables de Entorno

### `AUDIT_TRAIL_ENABLED`

**Valores**: `true` | `false`

**Función**: Activa/desactiva el registro automático de cambios en la tabla audit_trail.

**Cuándo usar**:
- ✅ `true` en producción (obligatorio para compliance)
- ✅ `true` en staging para testing completo
- ❌ `false` en desarrollo (mejor rendimiento)
- ❌ `false` en tests unitarios (independencia de tests)

**Ejemplo**:
```bash
# Producción
AUDIT_TRAIL_ENABLED=true

# Desarrollo
AUDIT_TRAIL_ENABLED=false
```

### `DOMAIN_EVENTS_ENABLED`

**Valores**: `true` | `false`

**Función**: Activa/desactiva el registro de eventos de dominio en la tabla domain_events.

**Cuándo usar**:
- ✅ `true` en producción (trazabilidad completa y event sourcing)
- ✅ `true` en desarrollo (testing de eventos)
- ❌ `false` en tests unitarios (evitar side effects)

**Ejemplo**:
```bash
# Producción
DOMAIN_EVENTS_ENABLED=true

# Tests
DOMAIN_EVENTS_ENABLED=false
```

## Estructura de Archivos

```
src/
├── Domain/
│   ├── Entity/
│   │   ├── AuditTrail.php           # Entidad para audit_trail
│   │   └── DomainEvent.php          # Entidad para domain_events
│   └── Event/                       # Domain Events
│       ├── PatientCreatedEvent.php
│       ├── PatientUpdatedEvent.php
│       ├── InvoiceIssuedEvent.php
│       ├── InvoiceCancelledEvent.php
│       ├── AppointmentScheduledEvent.php
│       ├── AppointmentUpdatedEvent.php
│       ├── AppointmentCancelledEvent.php
│       ├── CustomerCreatedEvent.php
│       ├── CustomerUpdatedEvent.php
│       ├── RecordCreatedEvent.php
│       └── RecordUpdatedEvent.php
│
├── Application/
│   └── EventListener/
│       └── AuditEventSubscriber.php # Escucha eventos y registra en domain_events
│
└── Infrastructure/
    └── Audit/
        ├── DoctrineAuditListener.php # Captura cambios automáticos (audit_trail)
        └── AuditLogger.php           # Servicio para domain_events

config/
└── services.yaml                     # Configuración de listeners y servicios

docs/
├── AUDIT_README.md                   # Este archivo
├── AUDIT_SYSTEM.md                   # Documentación completa
└── AUDIT_EXAMPLES.md                 # Ejemplos de uso

private/docs/
└── AUDIT_TECHNICAL.md                # Documentación técnica
```

## Tablas de Base de Datos

### Audit Trail (Compliance)

```sql
-- Tabla de cambios técnicos
audit_trail (
    id,
    entity_type,      -- 'Patient', 'Invoice', etc.
    entity_id,
    operation,        -- 'created', 'updated', 'deleted'
    changes,          -- JSON: {"field": {"before": val, "after": val}}
    changed_at,
    changed_by,       -- FK a users
    ip_address,
    user_agent
)

-- Índices optimizados
idx_entity (entity_type, entity_id, changed_at)
idx_operation (operation, changed_at)
idx_changed_by (changed_by, changed_at)
```

### Domain Events (Event Sourcing)

```sql
-- Tabla de eventos de dominio
domain_events (
    id,
    event_id,         -- UUID único
    event_name,       -- 'patient.created', 'invoice.cancelled', etc.
    event_version,    -- Para evolución del schema
    aggregate_type,   -- 'Patient', 'Invoice', etc.
    aggregate_id,
    payload,          -- JSON: datos completos del evento
    metadata,         -- JSON: contexto adicional
    occurred_at,      -- Tiempo de negocio
    recorded_at,      -- Tiempo técnico
    user_id,          -- FK a users
    correlation_id,   -- Para tracking de operaciones relacionadas
    causation_id      -- ID del evento que causó este evento
)

-- Índices optimizados
idx_aggregate_stream (aggregate_type, aggregate_id, occurred_at)
idx_event_name (event_name, occurred_at)
idx_occurred (occurred_at)
idx_correlation (correlation_id)
```

## Consultas Frecuentes

### Ver eventos recientes (Domain Events)

```sql
SELECT
    de.occurred_at,
    u.email as user,
    de.event_name,
    de.aggregate_type,
    de.aggregate_id,
    de.metadata->>'$.ip_address' as ip_address
FROM domain_events de
LEFT JOIN users u ON de.user_id = u.id
ORDER BY de.occurred_at DESC
LIMIT 50;
```

### Ver cambios técnicos de una entidad (Audit Trail)

```sql
SELECT
    at.changed_at,
    u.email as changed_by,
    at.operation,
    at.changes
FROM audit_trail at
LEFT JOIN users u ON at.changed_by = u.id
WHERE at.entity_type = 'Patient' AND at.entity_id = '123'
ORDER BY at.changed_at DESC;
```

### Ver facturas canceladas (Domain Events)

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

## Mejores Prácticas

### ✅ DO - Hacer

- Activar ambos niveles de auditoría en producción
- Proporcionar contexto útil en metadata
- Documentar razones para acciones críticas
- Revisar logs periódicamente
- Establecer política de retención
- Proteger acceso a logs (solo admin/superadmin)

### ❌ DON'T - No Hacer

- Desactivar auditoría en producción sin razón
- Auditar operaciones de lectura masivas
- Almacenar contraseñas o datos sensibles innecesarios
- Editar/eliminar logs manualmente
- Ignorar regulaciones RGPD sobre retención

## Rendimiento

### Impacto Medido

- **Audit Trail**: +5-8% en operaciones de escritura
- **Domain Events**: +3% en operaciones auditadas
- **Ambas activas**: +8-11% total

### Optimizaciones Implementadas

1. Índices optimizados en ambas tablas
2. Doctrine onFlush para captura eficiente de cambios
3. Serialización inteligente de valores
4. Flush único por operación

### Optimizaciones Futuras

1. Procesamiento asíncrono de eventos
2. Particionamiento por fecha
3. Archivado automático de logs antiguos
4. Compresión de payloads grandes

## Soporte

- **Dudas de uso**: Consultar [AUDIT_EXAMPLES.md](./AUDIT_EXAMPLES.md)
- **Implementación**: Consultar [AUDIT_TECHNICAL.md](../private/docs/AUDIT_TECHNICAL.md)
- **Problemas**: Crear issue en repositorio del proyecto
- **Mejoras**: Pull requests bienvenidos

## Changelog

### v2.0.0 (2026-01-XX) - Architecture Redesign

- ✅ Implementación personalizada (sin bundles externos)
- ✅ Dos tablas especializadas: audit_trail y domain_events
- ✅ Nomenclatura estándar de la industria
- ✅ DoctrineAuditListener para cambios automáticos
- ✅ Event Sourcing pattern para domain_events
- ✅ Soporte completo para correlation_id y causation_id
- ✅ Variables de entorno renombradas (AUDIT_TRAIL_ENABLED, DOMAIN_EVENTS_ENABLED)

### v1.0.0 (2024-01-XX) - Initial Release

- ✅ Sistema de auditoría técnica con SimpleThings Bundle
- ✅ Sistema de auditoría de negocio con Domain Events
- ✅ Configuración vía variables de entorno
- ✅ Entidades core auditadas (Patient, Invoice, Appointment, Customer, Record, User)
- ✅ Eventos de negocio para operaciones críticas
- ✅ Documentación completa
- ✅ Ejemplos de uso
- ✅ Queries optimizadas con índices

## Roadmap

### v1.1.0 - Mejoras de Rendimiento

- [ ] Procesamiento asíncrono de audit logs
- [ ] Comando de archivado automático
- [ ] Dashboard de estadísticas

### v1.2.0 - Funcionalidades Avanzadas

- [ ] Interfaz web para consultar logs
- [ ] Exportación de reportes
- [ ] Alertas de actividad sospechosa
- [ ] Verificación de integridad con hash

### v2.0.0 - Compliance Avanzado

- [ ] Firma digital de logs críticos
- [ ] Integración con SIEM
- [ ] Retención automática según regulaciones
- [ ] Anonimización automática (RGPD)

## Licencia

El sistema de auditoría es parte de MyPhysio y está sujeto a la misma licencia del proyecto principal.

---

**Última actualización**: 2024-01-02
**Mantenedor**: Equipo de Desarrollo MyPhysio
