# AGENTS.md - Guía para Agentes de IA

## Objetivo
Este documento contiene instrucciones específicas para agentes de IA que trabajan en este proyecto.

## Responsabilidades del Agente

### 1. Documentación de Ingeniería Inversa
**IMPORTANTE**: Cuando se implementen nuevas características, cambios o mejoras en el código:

- **SIEMPRE** actualizar la documentación pertinente en `private/docs/`
- Documentar **a modo de ingeniería inversa**: registrar lo que se ha implementado, no lo que se planea hacer
- Mantener la coherencia con la estructura de documentación existente
- Actualizar los archivos relevantes según el tipo de cambio:
  - Validaciones → `08-VALIDATIONS-AND-QUALITY.md`
  - Arquitectura → `04-SYSTEM-ARCHITECTURE.md`
  - Especificaciones técnicas → `05-TECHNICAL-SPECIFICATIONS.md`
  - Modelo de datos → `06-DATA-MODEL.md`
  - Seguridad → `07-SECURITY-AND-COMPLIANCE.md`
  - etc.

### 2. Estructura de Documentación

#### Formato de Actualización
Al documentar cambios, incluir:
- **Fecha de implementación**
- **Descripción del cambio**
- **Archivos modificados**
- **Razón del cambio**
- **Impacto en el sistema**
- **Ejemplos de uso (si aplica)**

#### Ejemplo
```markdown
## [2025-12-31] Sistema de Validación React-Symfony

### Descripción
Implementado sistema completo de mapeo de errores de validación desde Symfony a React.

### Archivos Modificados
- `assets/components/invoices/InvoiceForm.tsx`

### Implementación
[Detalles técnicos...]
```

### 3. Actualización de Resúmenes
Cuando se realicen cambios significativos:
- Actualizar `00-SUMMARY.md` con un resumen de alto nivel
- Si el cambio afecta decisiones arquitectónicas, actualizar `01-EXECUTIVE-SUMMARY.md`

### 4. Mantenimiento de Coherencia
- Verificar que la documentación existente no contradiga los nuevos cambios
- Actualizar referencias cruzadas entre documentos
- Mantener el formato y estilo consistente con el resto de la documentación

### 5. Gestión de Traducciones

**CRÍTICO**: Cada vez que trabajes con textos en pantallas, formularios, listados, mensajes de error, etc., SIEMPRE debes:

1. **Verificar que existen traducciones** para todos los textos mostrados al usuario
2. **Añadir traducciones en AMBOS idiomas**: español (`es`) e inglés (`en`)
3. **Ubicación de archivos de traducción**:
   - Mensajes generales: `translations/messages.{es,en}.yaml`
   - Mensajes de validación: `translations/validators.{es,en}.yaml`

4. **Proceso de verificación**:
   - Buscar el key de traducción en el código (ej: `t('invoice_address_required')`)
   - Verificar que existe en `translations/messages.es.yaml`
   - Verificar que existe en `translations/messages.en.yaml`
   - Si no existe, añadirla en AMBOS archivos

5. **Notas importantes**:
   - Los mensajes de error de validación de Symfony usan `translations/validators.{es,en}.yaml`
   - Los mensajes de interfaz de React usan `translations/messages.{es,en}.yaml`
   - Después de añadir traducciones, ejecutar `make cache-clear` para que Symfony las reconozca

**Ejemplo:**
```yaml
# translations/validators.es.yaml
invoice_address_required: "La dirección es obligatoria."

# translations/validators.en.yaml
invoice_address_required: "Address is required."
```

## Flujo de Trabajo Recomendado

1. **Implementar el cambio** en el código
2. **Probar exhaustivamente** la implementación:
   - ✅ Verificar que la funcionalidad básica funciona correctamente
   - ✅ Ejecutar tests E2E relevantes: `npx playwright test tests/e2e/[archivo].spec.js`
   - ✅ Verificar que no hay errores en consola del navegador
   - ✅ Verificar que no hay errores en logs del servidor
   - ✅ Probar casos edge (valores límite, campos vacíos, etc.)
   - ✅ **NUNCA** dar por completada una tarea sin probarla primero
3. **Documentar** en `private/docs/` los cambios realizados
4. **Verificar coherencia** con documentación existente
5. **Actualizar índices** si se añaden nuevas secciones

### Comandos de Prueba Comunes

```bash
# Tests E2E de facturas
npx playwright test tests/e2e/invoices.spec.js

# Tests E2E específicos
npx playwright test tests/e2e/invoices.spec.js -g "nombre del test"

# Verificar que la aplicación carga
curl -s http://127.0.0.1:8081/invoices | grep -q "MyPhysio"

# Limpiar cache de Symfony
make cache-clear
```

## Notas Adicionales

- La documentación debe ser clara y concisa
- Usar ejemplos de código cuando sea apropiado
- Incluir diagramas o capturas si ayudan a la comprensión
- Mantener un registro cronológico de cambios importantes
