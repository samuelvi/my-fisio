# Production Deployment

This directory contains the production Docker Compose configuration for the Physiotherapy Clinic Management System.

## 🚨 Security First

**CRITICAL**: Production environments require careful security configuration. Follow all steps below.

## 📋 Prerequisites

- Docker Engine 24.0+
- Docker Compose V2
- SSL certificates (for HTTPS)
- Secure server environment (firewall configured, SSH hardened)

## 🚀 Initial Setup

### 1. Configure Environment Variables

```bash
cd docker/prod
cp .env.example .env
nano .env  # or vim, emacs, etc.
```

**Required variables** (MUST be changed):
- `POSTGRES_PASSWORD`: Strong database password (32+ chars)
- `REDIS_PASSWORD`: Strong Redis password (32+ chars)
- `APP_SECRET`: Generate with `openssl rand -hex 32`
- `JWT_PASSPHRASE`: Secure passphrase for JWT signing

### 2. Generate Secrets

```bash
# App secret
openssl rand -hex 32

# For JWT keys (if not already generated)
mkdir -p ../../config/jwt
openssl genpkey -out ../../config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096
openssl pkey -in ../../config/jwt/private.pem -out ../../config/jwt/public.pem -pubout
```

### 3. SSL Configuration (HTTPS)

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Option 1: Copy existing certificates
cp /path/to/your/cert.crt nginx/ssl/
cp /path/to/your/cert.key nginx/ssl/

# Option 2: Generate self-signed (DEV/TESTING ONLY)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/selfsigned.key \
  -out nginx/ssl/selfsigned.crt
```

**Note**: For production, use Let's Encrypt or commercial certificates.

### 4. Build and Start

```bash
# From project root
make prod-up

# Or manually
cd docker/prod
docker-compose up -d
```

### 5. Initialize Database

```bash
# Run migrations (FIRST TIME ONLY)
make prod-db-migrate

# Verify extensions are installed
make prod-db-check
```

## 🔧 Common Operations

### Start/Stop Services

```bash
make prod-up        # Start all services
make prod-down      # Stop all services (keeps data)
make prod-restart   # Restart all services
make prod-status    # Check service status
```

### Database Operations

```bash
make prod-db-migrate     # Apply pending migrations
make prod-db-check       # Verify PostgreSQL extensions
make prod-db-backup      # Create database backup
```

### Logs & Monitoring

```bash
make prod-logs              # Tail all logs
make prod-logs service=php  # Tail specific service
make prod-health            # Check health status
```

### Cache Management

```bash
make prod-cache-clear    # Clear application cache
make prod-cache-warmup   # Warm up cache
```

## 🔒 Security Checklist

Before going live, ensure:

- [ ] All default passwords changed
- [ ] SSL certificates installed and valid
- [ ] Firewall configured (only 80/443 exposed)
- [ ] PostgreSQL not exposed externally (internal network only)
- [ ] Redis password protected
- [ ] APP_SECRET is unique and secure
- [ ] .env file has proper permissions (600)
- [ ] Regular backups configured
- [ ] Monitoring and alerting set up
- [ ] Log rotation configured

## 📊 Monitoring

### Health Checks

All services have health checks configured:
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`
- **Nginx**: HTTP health endpoint
- **PHP**: FPM status

### View Health Status

```bash
docker-compose ps
```

Healthy services show `healthy` status.

## 💾 Backup & Recovery

### Manual Backup

```bash
# Full database backup
make prod-db-backup

# Backup location: ./backups/backup_YYYYMMDD_HHMMSS.sql
```

### Restore from Backup

```bash
# CAUTION: This will overwrite current data
make prod-db-restore file=path/to/backup.sql
```

### Automated Backups

Set up a cron job (recommended):

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/project && make prod-db-backup
```

## 🔄 Updates & Maintenance

### Update Application Code

```bash
# 1. Pull latest code
git pull origin main

# 2. Build assets (if needed)
npm run build

# 3. Restart services
make prod-restart

# 4. Clear cache
make prod-cache-clear

# 5. Run migrations (if any)
make prod-db-migrate
```

### Update Docker Images

```bash
# Pull latest images
cd docker/prod
docker-compose pull

# Recreate containers
docker-compose up -d --force-recreate
```

## 🚨 Troubleshooting

### Services won't start

```bash
# Check logs
make prod-logs

# Check specific service
docker-compose logs postgres
docker-compose logs php
```

### Database connection errors

```bash
# Verify PostgreSQL is running and healthy
docker-compose ps postgres

# Check database connection
docker-compose exec postgres psql -U physiotherapy_user -d physiotherapy_db -c "SELECT version();"
```

### Permission errors

```bash
# Fix var directory permissions
docker-compose exec php chown -R www-data:www-data /var/www/html/var
```

## ⚠️ IMPORTANT NOTES

### What NOT to do in Production

❌ **NEVER** run these commands:
- `make prod-db-reset` (DOESN'T EXIST - by design)
- `docker-compose down -v` (deletes all data)
- Manual database drops
- Test data loaders

✅ **DO** use these instead:
- Proper migrations for schema changes
- Backups before any major operation
- Staging environment for testing

### Data Persistence

All data is stored in Docker named volumes:
- `postgres_data`: Database files
- `redis_data`: Redis persistence
- `app_var`: Application cache and logs

**Volumes survive container recreation** but can be lost if explicitly deleted.

## 📚 Additional Resources

- [Docker Compose Best Practices](https://docs.docker.com/compose/production/)
- [PostgreSQL Production Checklist](https://wiki.postgresql.org/wiki/Production_Server_Setup)
- [Symfony Production Deployment](https://symfony.com/doc/current/deployment.html)

## 🆘 Support

For issues or questions:
1. Check logs: `make prod-logs`
2. Verify health: `make prod-health`
3. Review this README
4. Consult main project documentation
