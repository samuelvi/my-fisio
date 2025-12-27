# MariaDB Production Configuration

Este directorio contiene la configuración personalizada de MariaDB para el entorno de **producción**.

## 📁 Archivos

### `my.cnf`
Archivo de configuración optimizado para producción:

#### Character Set y Collation
- `character-set-server = utf8mb4` - Soporte completo de Unicode (incluye emojis)
- `collation-server = utf8mb4_unicode_ci` - Comparaciones insensibles a mayúsculas/acentos

#### Optimizaciones de Performance
- `max_connections = 200` - Máximo de conexiones simultáneas
- `innodb_buffer_pool_size = 1G` - Caché de InnoDB (ajustar según RAM disponible)
- `innodb_log_file_size = 256M` - Tamaño de logs de transacciones
- `innodb_flush_log_at_trx_commit = 2` - Balance entre rendimiento y durabilidad
- `query_cache_size = 128M` - Caché de queries (útil para queries repetitivas)

#### Monitoring y Logging
- `slow_query_log = 1` - Activa el log de queries lentas
- `long_query_time = 2` - Queries que tardan más de 2 segundos se loguean

#### Backups y Replicación
- `log_bin` - Binary logging activado para backups point-in-time
- `expire_logs_days = 7` - Los binary logs se mantienen 7 días

### `data/`
Carpeta para la persistencia de datos de MariaDB. Los datos se almacenan en el host usando bind mounts.

## 🎯 Ajustar para tu servidor

### Según la RAM disponible:

```ini
# Servidor con 2GB RAM
innodb_buffer_pool_size = 512M
query_cache_size = 64M

# Servidor con 4GB RAM
innodb_buffer_pool_size = 1G
query_cache_size = 128M

# Servidor con 8GB+ RAM
innodb_buffer_pool_size = 2G
query_cache_size = 256M
```

**Regla general**: El `innodb_buffer_pool_size` debería ser ~50-70% de la RAM total del servidor dedicado a MariaDB.

### Según el patrón de uso:

```ini
# Muchas lecturas repetitivas (ej: catálogos, búsquedas)
query_cache_type = 1
query_cache_size = 256M

# Muchas escrituras (el query cache puede ser contraproducente)
query_cache_type = 0
```

## 🚀 Aplicar cambios

Si modificas el archivo `my.cnf`:

```bash
# Reiniciar MariaDB para aplicar cambios
docker-compose -f docker/prod/docker-compose.yaml restart mariadb

# Verificar que los cambios se aplicaron
docker-compose -f docker/prod/docker-compose.yaml exec mariadb \
  mysql -u physiotherapy_user -pPASSWORD -e "SHOW VARIABLES LIKE 'innodb_buffer%';"
```

## 📊 Monitoreo

### Ver queries lentas:

```bash
# Ver el archivo de slow query log
docker-compose -f docker/prod/docker-compose.yaml exec mariadb \
  tail -f /var/lib/mysql/slow-query.log
```

### Ver binary logs:

```bash
# Listar binary logs
docker-compose -f docker/prod/docker-compose.yaml exec mariadb \
  mysql -u physiotherapy_user -pPASSWORD -e "SHOW BINARY LOGS;"
```

### Ver uso de buffer pool:

```bash
docker-compose -f docker/prod/docker-compose.yaml exec mariadb \
  mysql -u physiotherapy_user -pPASSWORD \
  -e "SHOW ENGINE INNODB STATUS\G" | grep -A 20 "BUFFER POOL"
```

## 🔒 Seguridad

- Los archivos de configuración se montan como **read-only** (`:ro`)
- Las contraseñas se manejan vía variables de entorno en `.env`
- El puerto 3306 **no está expuesto** externamente (solo accesible vía red interna de Docker)

## 📚 Recursos

- [MariaDB Server System Variables](https://mariadb.com/kb/en/server-system-variables/)
- [InnoDB System Variables](https://mariadb.com/kb/en/innodb-system-variables/)
- [Optimizing MariaDB for Performance](https://mariadb.com/kb/en/optimization-and-tuning/)
