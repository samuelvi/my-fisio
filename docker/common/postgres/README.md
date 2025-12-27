# PostgreSQL Initialization Scripts

**Location**: `docker/common/postgres/`

Este directorio contiene scripts SQL que se ejecutan **automáticamente** cuando el contenedor de PostgreSQL se crea por primera vez.

## 🎯 ¿Por qué aquí y no en las migraciones?

Las **extensiones de PostgreSQL son infraestructura**, no parte del schema de la aplicación:

### ❌ Problemas de ponerlas en migraciones:
- Si regeneras migraciones desde cero, se pierden
- Mezcla infraestructura con lógica de negocio
- Difícil de mantener en múltiples entornos
- No es portable entre DBMS

### ✅ Ventajas de esta aproximación:
- **Automático**: Se ejecuta al crear el contenedor
- **Declarativo**: Está versionado con el código
- **Separación de concerns**: Infraestructura vs. Schema
- **Predecible**: Funciona igual en dev, test, prod
- **Documentado**: Claro qué extensiones se usan y por qué

## 📁 Archivos en este directorio

### `01-init-extensions.sql`
Instala las extensiones de PostgreSQL necesarias:
- **unaccent**: Búsquedas sin acentos (ej: "garcia" encuentra "García")
- **pg_trgm**: Búsquedas por similitud con trigrams (%)
- **fuzzystrmatch**: Distancia de Levenshtein (tolerancia a typos)

Los archivos se ejecutan en **orden alfabético** (01-*, 02-*, etc.).

## 🚀 Cómo funciona

### Configuración en docker-compose.yml:
```yaml
postgres:
  image: postgres:16-alpine
  volumes:
    # 🎯 Scripts de inicialización (ruta relativa desde cada entorno)
    - ../common/postgres:/docker-entrypoint-initdb.d:ro
```

### Flujo de ejecución:
1. **Primera vez**: Al crear el contenedor, PostgreSQL ejecuta todos los `.sql` y `.sh` en `/docker-entrypoint-initdb.d/`
2. **Los scripts se ejecutan**: Solo la primera vez (cuando el volumen está vacío)
3. **Extensiones instaladas**: Listas para usar en migraciones y queries

### Si ya tienes contenedores creados (IMPORTANTE):

Los scripts de inicialización **solo se ejecutan cuando el volumen de datos está vacío**. Si ya tienes contenedores corriendo, necesitas aplicar las extensiones manualmente:

#### Opción 1: Recrear contenedores (BORRA DATOS) ⚠️
```bash
# Desarrollo
cd docker/dev
docker-compose down -v
docker-compose up -d

# Test
cd docker/test
docker-compose down -v
docker-compose up -d
```

#### Opción 2: Aplicar manualmente (CONSERVA DATOS) ✅
```bash
# Desarrollo
docker-compose -f docker/dev/docker-compose.yaml exec postgres \
  psql -U physiotherapy_user -d physiotherapy_db \
  -f /docker-entrypoint-initdb.d/01-init-extensions.sql

# Test
docker-compose -f docker/test/docker-compose.yaml exec postgres_test \
  psql -U physiotherapy_user -d physiotherapy_test_db \
  -f /docker-entrypoint-initdb.d/01-init-extensions.sql
```

## 🔧 Para entornos de producción

### Opción 1: Docker Compose (recomendado) ✅

El entorno de producción está en `docker/prod/docker-compose.yaml` y **ya incluye** el montaje del script:

```yaml
postgres:
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ../common/postgres:/docker-entrypoint-initdb.d:ro  # ✅ Ya configurado
```

**Primera vez** (creación inicial):
```bash
cd docker/prod
cp .env.example .env
# Editar .env con contraseñas seguras
docker-compose up -d
# Las extensiones se instalan automáticamente ✅
```

**Si el contenedor ya existe** (aplicar manualmente):
```bash
docker-compose -f docker/prod/docker-compose.yaml exec postgres \
  psql -U physiotherapy_user -d physiotherapy_db \
  -f /docker-entrypoint-initdb.d/01-init-extensions.sql
```

**Verificar extensiones en producción:**
```bash
make prod-db-check
# O manualmente:
docker-compose -f docker/prod/docker-compose.yaml exec postgres \
  psql -U physiotherapy_user -d physiotherapy_db -c "\dx"
```

### Opción 2: PostgreSQL nativo (servidor sin Docker)

Ejecutar manualmente antes de las migraciones:
```bash
psql -U user -d database -f docker/common/postgres/01-init-extensions.sql
```

### Opción 3: En el servidor PostgreSQL (configuración permanente)

Agregar al postgresql.conf:
```
shared_preload_libraries = 'pg_trgm'
```

Y ejecutar una vez como superusuario:
```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
```

### ⚠️ Importante para Producción

1. **Backups**: Las extensiones NO se incluyen en dumps por defecto. Asegúrate de reinstalarlas después de restore:
   ```bash
   psql -U user -d database -f docker/common/postgres/01-init-extensions.sql
   ```

2. **Permisos**: En producción, el usuario de la app (`physiotherapy_user`) no puede crear extensiones. Usa un superusuario:
   ```bash
   # Como superusuario postgres
   docker-compose -f docker/prod/docker-compose.yaml exec -u postgres postgres \
     psql -d physiotherapy_db -f /docker-entrypoint-initdb.d/01-init-extensions.sql
   ```

3. **Testing antes de deploy**: Siempre prueba las extensiones en staging antes de aplicarlas en producción.

## 📝 Agregar nuevas extensiones

1. Edita `01-init-extensions.sql` (o crea `02-otra-extension.sql`)
2. Agrega la extensión con `CREATE EXTENSION IF NOT EXISTS nombre;`
3. Documenta para qué se usa
4. Recrear contenedor: `docker-compose down -v && docker-compose up -d`

## ✅ Verificar extensiones instaladas

```bash
docker-compose exec postgres psql -U physiotherapy_user -d physiotherapy_db -c "\dx"
```

Deberías ver:
```
                                      List of installed extensions
      Name      | Version |   Schema   |                   Description
----------------+---------+------------+--------------------------------------------------
 fuzzystrmatch  | 1.1     | public     | determine similarities and distance between strings
 pg_trgm        | 1.6     | public     | text similarity measurement and index searching
 unaccent       | 1.1     | public     | text search dictionary that removes accents
```

## 🎓 Recursos

- [PostgreSQL Docker Image - Initialization Scripts](https://hub.docker.com/_/postgres)
- [unaccent extension](https://www.postgresql.org/docs/current/unaccent.html)
- [pg_trgm extension](https://www.postgresql.org/docs/current/pgtrgm.html)
- [fuzzystrmatch extension](https://www.postgresql.org/docs/current/fuzzystrmatch.html)
