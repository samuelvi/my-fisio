# Test Plan: Draft System - Manual Testing

## Objetivos
Verificar que el sistema de drafts funciona correctamente en el formulario de facturas.

## Pre-requisitos
- Aplicación corriendo en http://localhost
- Usuario autenticado: tina@tinafisio.com
- Navegador con DevTools abierto (para ver localStorage y console)

## Escenarios de Prueba

### 1. Auto-guardado cada 5 segundos ⏱️

**Pasos:**
1. Abrir http://localhost/invoices/new
2. Llenar algunos campos del formulario:
   - Customer Name: "Test Draft Customer"
   - Tax ID: "12345678X"
   - Address: "Test Address 123"
3. Esperar 5 segundos sin enviar el formulario
4. Abrir DevTools > Application > Local Storage > http://localhost
5. Buscar la key `draft_invoice`

**Resultado esperado:**
✅ Después de 5 segundos, debería aparecer `draft_invoice` en localStorage con los datos del formulario
✅ NO debe aparecer ninguna alerta visible (auto-save silencioso)
✅ El draft guardado tiene `savedByError: false`

---

### 2. Detección de draft existente al recargar 🔄

**Pasos:**
1. Continuar desde el test anterior (con draft guardado por auto-save)
2. Recargar la página (F5 o Cmd+R)
3. Observar si aparece alguna alerta

**Resultado esperado:**
✅ NO aparece ninguna alerta (auto-save silencioso, savedByError: false)
✅ El draft existe en localStorage pero no interrumpe al usuario
✅ El usuario puede seguir editando normalmente

---

### 3. Guardado en error de red 🌐❌ (Draft con alerta ROJA)

**Pasos:**
1. Llenar el formulario de factura completamente
2. Abrir DevTools > Network tab
3. Activar "Offline" mode
4. Hacer clic en "Confirmar emisión" (intentar guardar)
5. Verificar localStorage y observar la alerta

**Resultado esperado:**
✅ Aparece error en el formulario (no se puede guardar)
✅ Se guarda draft automáticamente con `savedByError: true`
✅ Aparece alerta ROJA sticky en la parte superior
✅ Alerta dice "Error de red - Borrador guardado"
✅ Dos botones: "Recuperar borrador" y "Descartar borrador"

---

### 4. Recuperar draft de error de red 📥

**Pasos:**
1. Con la alerta roja visible (del test anterior)
2. Recargar la página
3. Hacer clic en "Recuperar borrador"
4. Observar el modal de confirmación
5. Hacer clic en "Sí, recuperar"

**Resultado esperado:**
✅ Aparece modal de confirmación con título "Recuperar borrador"
✅ Al confirmar, el formulario se llena con los datos del draft
✅ La alerta roja desaparece
✅ El draft permanece en localStorage pero con `savedByError: false`

---

### 5. Descartar draft de error de red 🗑️

**Pasos:**
1. Crear un draft con error de red (seguir pasos del test 3)
2. Recargar la página para que aparezca la alerta roja
3. Hacer clic en "Descartar borrador"
4. Observar el modal de confirmación
5. Hacer clic en "Sí, descartar"
6. Verificar localStorage

**Resultado esperado:**
✅ Aparece modal de confirmación con título "Descartar borrador"
✅ Modal tiene icono rojo de advertencia
✅ Al confirmar, la alerta desaparece
✅ `draft_invoice` se elimina de localStorage
✅ Al recargar, NO aparece la alerta (no hay draft)

---

### 6. Limpieza automática al guardar exitosamente ✨

**Pasos:**
1. Llenar el formulario de factura completamente:
   - Customer Name: "Draft Test Success"
   - Tax ID: "87654321Y"
   - Address: "Success Street 456"
   - Email: "test@example.com"
   - Añadir una línea con concept, quantity, price
2. Esperar 5 segundos (para que se guarde el draft)
3. Verificar que existe `draft_invoice` en localStorage
4. Hacer clic en "Confirmar emisión" (submit)
5. Esperar a que la factura se guarde exitosamente
6. Verificar localStorage

**Resultado esperado:**
✅ Antes de enviar: `draft_invoice` existe en localStorage con `savedByError: false`
✅ Después de guardar: Se redirige a /invoices
✅ `draft_invoice` se eliminó automáticamente de localStorage
✅ Al volver a /invoices/new NO hay draft ni alerta

---

### 7. Auto-guardado silencioso en modo edición ✏️

**Pasos:**
1. Ir a /invoices
2. Editar una factura existente (clic en Edit)
3. Modificar algunos campos (nombre, dirección, etc.)
4. Esperar 5 segundos
5. Verificar localStorage
6. Recargar la página
7. Observar si aparece alguna alerta

**Resultado esperado:**
✅ Aparece `draft_invoice` en localStorage después de 5 segundos
✅ El draft tiene `savedByError: false`
✅ Al recargar, NO aparece ninguna alerta (auto-save silencioso)
✅ Al guardar exitosamente, el draft se elimina

---

### 8. Cancelar modales con ESC ⌨️

**Pasos:**
1. Crear un draft con error de red (seguir test 3)
2. Recargar página para ver alerta roja
3. Hacer clic en "Recuperar borrador"
4. Presionar tecla ESC
5. Hacer clic en "Descartar borrador"
6. Presionar tecla ESC

**Resultado esperado:**
✅ Modal de recuperar se cierra al presionar ESC
✅ Modal de descartar se cierra al presionar ESC
✅ No se ejecuta ninguna acción
✅ La alerta roja sigue visible

---

## Verificaciones Adicionales

### Console Logs esperados:
```
[useDraft] Network error detected, saving draft (solo en errores de red)
```

### LocalStorage Structure:
```json
{
  "draft_invoice": {
    "type": "invoice",
    "data": {
      "date": "2026-01-05",
      "customerName": "Test Draft Customer",
      "customerTaxId": "12345678X",
      "customerAddress": "Test Address 123",
      "customerPhone": "",
      "customerEmail": "",
      "invoiceNumber": "",
      "lines": [...]
    },
    "timestamp": 1736082345678,
    "formId": "invoice-new-1736082340000"
  }
}
```

---

## Resultados

Completar esta tabla después de las pruebas:

| Test | Status | Notas |
|------|--------|-------|
| 1. Auto-guardado 10s | ⬜ | |
| 2. Detección draft | ⬜ | |
| 3. Recuperar draft | ⬜ | |
| 4. Descartar draft | ⬜ | |
| 5. Limpieza auto | ⬜ | |
| 6. Error de red | ⬜ | |
| 7. No en edición | ⬜ | |
| 8. ESC cancela | ⬜ | |

---

## Bugs Encontrados

(Anotar aquí cualquier bug o comportamiento inesperado)

---

## Conclusión

(Resumen de los resultados de las pruebas)
