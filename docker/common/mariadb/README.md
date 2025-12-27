# MariaDB Initialization Scripts

**Location**: `docker/common/mariadb/`

Este directorio contiene scripts SQL que se ejecutan **automáticamente** cuando el contenedor de MariaDB se crea por primera vez.

## 🎯 Diferencias con PostgreSQL

A diferencia de PostgreSQL que requería extensiones especiales (`unaccent`, `pg_trgm`, `fuzzystrmatch`), **MariaDB no necesita extensiones adicionales** para búsquedas insensibles a mayúsculas y acentos.

### ✅ Ventajas de MariaDB para búsquedas de texto:

- **Collations nativas**: MariaDB incluye collations que ya son case-insensitive y accent-insensitive
- **utf8mb4_unicode_ci**: Compara texto ignorando mayúsculas y acentos automáticamente
- **Sin columnas generadas**: No necesitamos columnas `full_name_normalized`
- **SQL más simple**: Las búsquedas usan `LOWER()` estándar sin funciones especiales

### Ejemplo de búsqueda:

```sql
-- PostgreSQL (requería unaccent y columna generada)
WHERE full_name_normalized LIKE '%garcia%'

-- MariaDB (SQL estándar)
WHERE LOWER(full_name) LIKE LOWER('%García%')
-- Encuentra: "García", "garcia", "GARCIA", etc.
```

## 📁 Archivos en este directorio

### `01-init.sql`
Configuración inicial de la base de datos:
- Establece el character set a `utf8mb4` (soporte completo de Unicode)
- Configura la collation a `utf8mb4_unicode_ci` (comparaciones insensibles a mayúsculas/acentos)
- Archivo preparado para futuras extensiones

Los archivos se ejecutan en **orden alfabético** (01-*, 02-*, etc.).

## 🚀 Cómo funciona

### Configuración en docker-compose.yml:

```yaml
mariadb:
  image: mariadb:11
  volumes:
    # 🎯 Scripts de inicialización (ruta relativa desde cada entorno)
    - ../common/mariadb:/docker-entrypoint-initdb.d:ro
```

### Flujo de ejecución:

1. **Primera vez**: Al crear el contenedor, MariaDB ejecuta todos los `.sql` y `.sh` en `/docker-entrypoint-initdb.d/`
2. **Los scripts se ejecutan**: Solo la primera vez (cuando el volumen está vacío)
3. **Base de datos configurada**: Lista para usar con búsquedas estándar

### Si ya tienes contenedores creados:

Los scripts de inicialización **solo se ejecutan cuando el volumen de datos está vacío**. Si ya tienes contenedores corriendo:

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
docker-compose -f docker/dev/docker-compose.yaml exec mariadb \
  mysql -u physiotherapy_user -pphysiotherapy_pass physiotherapy_db \
  < docker/common/mariadb/01-init.sql

# Test
docker-compose -f docker/test/docker-compose.yaml exec mariadb_test \
  mysql -u physiotherapy_user -pphysiotherapy_pass physiotherapy_test_db \
  < docker/common/mariadb/01-init.sql
```

## 🔧 Para entornos de producción

### Opción 1: Docker Compose (recomendado) ✅

**Primera vez** (creación inicial):

```bash
cd docker/prod
cp .env.example .env
# Editar .env con contraseñas seguras
docker-compose up -d
# La configuración se aplica automáticamente ✅
```

**Si el contenedor ya existe** (aplicar manualmente):

```bash
docker-compose -f docker/prod/docker-compose.yaml exec mariadb \
  mysql -u physiotherapy_user -pPASSWORD physiotherapy_db \
  < docker/common/mariadb/01-init.sql
```

**Verificar configuración en producción:**

```bash
docker-compose -f docker/prod/docker-compose.yaml exec mariadb \
  mysql -u physiotherapy_user -pPASSWORD physiotherapy_db \
  -e "SHOW VARIABLES LIKE 'character_set_database'; SHOW VARIABLES LIKE 'collation_database';"
```

### Opción 2: MariaDB nativo (servidor sin Docker)

Ejecutar manualmente antes de las migraciones:

```bash
mysql -u user -p database < docker/common/mariadb/01-init.sql
```

## 📝 Agregar nuevas configuraciones

1. Edita `01-init.sql` (o crea `02-otro-script.sql`)
2. Agrega la configuración necesaria
3. Documenta para qué se usa
4. Recrear contenedor: `docker-compose down -v && docker-compose up -d`

## ✅ Verificar configuración

```bash
docker-compose exec mariadb mysql -u physiotherapy_user -pphysiotherapy_pass physiotherapy_db \
  -e "SHOW VARIABLES LIKE 'character_set%'; SHOW VARIABLES LIKE 'collation%';"
```

Deberías ver:

```
+--------------------------+----------------------------+
| Variable_name            | Value                      |
+--------------------------+----------------------------+
| character_set_database   | utf8mb4                    |
| collation_database       | utf8mb4_unicode_ci         |
+--------------------------+----------------------------+
```

## 🎓 Recursos

- [MariaDB Docker Image - Initialization Scripts](https://hub.docker.com/_/mariadb)
- [MariaDB Character Sets and Collations](https://mariadb.com/kb/en/character-sets/)
- [utf8mb4 Character Set](https://mariadb.com/kb/en/unicode/)
- [Collation Comparison](https://mariadb.com/kb/en/setting-character-sets-and-collations/)
