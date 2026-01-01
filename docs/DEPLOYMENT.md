# Production Deployment Guide

This guide covers deploying the Physiotherapy Clinic Management System to any production hosting environment (VPS, shared hosting, cloud providers, etc.).

---

## Quick Start

### Automated Build (Recommended)

Use the dedicated production build container to prepare your application:

```bash
make prod-build
```

This command uses a **dedicated Docker container** configured for production builds and will:
- ✅ Install production dependencies only (no dev packages)
- ✅ Generate optimized `.env.local.php` from `.env.prod`
- ✅ Generate FOS JS routing files
- ✅ Install NPM dependencies
- ✅ Build and optimize React assets with Vite
- ✅ Clear and warm up production cache with OPcache enabled

**Why use the build container?**
- Consistent builds across different machines
- Production-optimized PHP configuration (OPcache, etc.)
- No dev tools or dependencies in final artifacts
- Clean, isolated build environment

### Manual Deployment

If you prefer manual control or `make` is not available:

```bash
# 1. Install production dependencies
composer install --no-dev --optimize-autoloader --no-interaction

# 2. Generate routing files
php bin/console fos:js-routing:dump --format=json --target=assets/routing/routes.json

# 3. Install frontend dependencies
npm ci

# 4. Build frontend assets
npm run build

# 5. Clear and warm up cache
php bin/console cache:clear --env=prod --no-warmup
php bin/console cache:warmup --env=prod
```

---

## Understanding the Problem

**Symptom:** Application tries to load assets from Vite dev server (port 5173) instead of compiled files.

**Root Cause:** `APP_ENV` is set to `dev` instead of `prod`.

**Solution:** Ensure `APP_ENV=prod` is configured in your production environment.

---

## Environment Configuration

### Required Environment Variables

Your production server must have `APP_ENV=prod` configured. Choose one method:

#### Method 1: Environment Variables Panel (Recommended)

Most hosting providers (cPanel, Plesk, Ionos, etc.) have an environment variables section:

1. Log in to your hosting control panel
2. Navigate to PHP Settings or Environment Variables
3. Add:
   - `APP_ENV=prod`
   - `APP_DEBUG=0`

#### Method 2: `.env.local` File

Create `.env.local` on the server with production values:

```bash
APP_ENV=prod
APP_DEBUG=0
```

**Note:** The `.env.local` file is gitignored, so create it directly on the server.

#### Method 3: `.env.local.php` File (Recommended for Performance)

The `make prod-build` command automatically generates an optimized `.env.local.php` file from your `.env.prod`. This PHP file is:
- **Faster to load** than parsing .env files
- **Pre-parsed into a PHP array**
- **Recommended for production**

Simply upload `.env.local.php` to your server. Symfony will use this file instead of `.env` files.

#### Method 4: `.env.prod` File

Copy the provided `.env.prod` file to your server and configure it with your production values (see Configuration Checklist below).

---

## Configuration Checklist

Update these values for your production environment (in `.env.prod` or environment variables):

### Security (Critical)

```bash
# Generate a secure 32+ character random string
APP_SECRET=your_secure_random_secret_here
```

**Generate a secure secret:**
```bash
php -r "echo bin2hex(random_bytes(32));"
```

### Database

```bash
DATABASE_URL="mysql://db_user:db_password@db_host:3306/db_name?serverVersion=mariadb-11.0.0&charset=utf8mb4"
```

Update with your hosting provider's database credentials.

### Domain & CORS

```bash
# Your production domain
DEFAULT_URI=https://your-domain.com

# Allowed CORS origins (regex pattern)
CORS_ALLOW_ORIGIN='^https?://(your-domain\.com)(:[0-9]+)?$'
```

### Email (Optional)

```bash
# Configure your SMTP server
MAILER_DSN=smtp://smtp.example.com:587?encryption=tls&auth_mode=login&username=user&password=pass
```

### JWT Keys

Ensure JWT keys are present and readable:

```bash
config/jwt/private.pem
config/jwt/public.pem
```

**If missing, generate them:**
```bash
php bin/console lexik:jwt:generate-keypair
```

---

## Files to Upload

### Required Files/Directories

```
✅ public/               (including public/build/ with compiled assets)
✅ src/
✅ config/
✅ vendor/              (production dependencies only)
✅ bin/
✅ templates/
✅ migrations/
✅ var/cache/prod/      (pre-warmed production cache)
✅ .env.local.php       (optimized environment - recommended)
   OR .env.prod         (alternative)
```

**Note:** After running `make prod-build`, your local directory will contain production artifacts. To clean them and restore your dev environment:

```bash
make prod-build-clean
```

### Files to EXCLUDE

```
❌ .git/
❌ node_modules/
❌ docker/
❌ tests/
❌ .env.dev
❌ .env.test
❌ .env.local (if it contains dev settings)
❌ var/cache/*
❌ var/log/*
```

### Example rsync Command

```bash
rsync -avz \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='docker' \
  --exclude='tests' \
  --exclude='var/cache' \
  --exclude='var/log' \
  --exclude='.env.dev' \
  --exclude='.env.test' \
  ./ user@server:/path/to/app/
```

---

## Server Configuration

### Web Server Document Root

**Point your web server to:** `/path/to/app/public`

### Apache (.htaccess)

The `.htaccess` file is already configured. Ensure `mod_rewrite` is enabled:

```bash
a2enmod rewrite
```

### Nginx

If using Nginx, configure:

```nginx
server {
    server_name your-domain.com;
    root /path/to/app/public;

    location / {
        try_files $uri /index.php$is_args$args;
    }

    location ~ ^/index\.php(/|$) {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
        internal;
    }

    location ~ \.php$ {
        return 404;
    }
}
```

### File Permissions

```bash
# Make writable directories
chmod -R 775 var/cache var/log var/sessions

# Set owner (adjust www-data to your web server user)
chown -R www-data:www-data var/
```

---

## Database Setup

### Run Migrations

After uploading files, apply database migrations:

```bash
php bin/console doctrine:migrations:migrate --env=prod --no-interaction
```

### Import Existing Data (Optional)

If migrating from legacy system:

```bash
# Import SQL dump
mysql -u user -p database_name < backup.sql

# Or run migration command if available
php bin/console app:migrate-legacy-data
```

---

## Post-Deployment Verification

### 1. Check Homepage

Visit: `https://your-domain.com/`

Expected: Homepage loads without errors.

### 2. Verify Assets Load

Open browser console (F12). Assets should load from `/build/assets/` (NOT port 5173).

### 3. Test Authentication

Try logging in to verify JWT authentication works.

### 4. Check Error Logs

If issues occur, check:

```bash
var/log/prod.log
```

---

## Common Issues & Solutions

### Issue: Port 5173 Still Referenced

**Symptoms:** Assets try to load from `http://[::]:5173/`

**Solution:**
1. Verify `APP_ENV=prod` is set
2. Clear cache on server: `php bin/console cache:clear --env=prod`
3. Rebuild assets: `npm run build`

### Issue: 500 Internal Server Error

**Symptoms:** White screen or 500 error

**Solution:**
1. Check `var/log/prod.log` for errors
2. Verify file permissions (var/cache, var/log must be writable)
3. Check `.htaccess` or Nginx config is correct

### Issue: Database Connection Error

**Symptoms:** Cannot connect to database

**Solution:**
1. Verify `DATABASE_URL` in `.env.prod` matches hosting credentials
2. Test connection: `php bin/console doctrine:query:sql "SELECT 1" --env=prod`
3. Check database host/port are correct

### Issue: JWT Authentication Not Working

**Symptoms:** Login fails or returns 401

**Solution:**
1. Verify `config/jwt/private.pem` and `public.pem` exist
2. Check file permissions (readable by web server)
3. Regenerate if needed: `php bin/console lexik:jwt:generate-keypair`

### Issue: Assets Not Loading (404)

**Symptoms:** CSS/JS files return 404

**Solution:**
1. Verify `public/build/` directory exists and contains files
2. Run `npm run build` again
3. Check web server document root points to `public/`

---

## Maintenance Mode

### Enable Maintenance

Create a maintenance page:

```bash
touch public/maintenance.html
```

Add to `.htaccess` (before other rules):

```apache
# Maintenance mode
RewriteCond %{REQUEST_URI} !^/maintenance\.html$
RewriteCond %{DOCUMENT_ROOT}/maintenance.html -f
RewriteRule ^ /maintenance.html [R=503,L]
ErrorDocument 503 /maintenance.html
Header set Cache-Control "max-age=0, no-store"
```

### Disable Maintenance

```bash
rm public/maintenance.html
```

---

## Performance Optimization

### 1. OPcache (PHP)

Ensure OPcache is enabled in production:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.validate_timestamps=0  ; Disable in production
```

### 2. Composer Autoloader

Already optimized by `make prod-build`, but can be run manually:

```bash
composer dump-autoload --optimize --no-dev
```

### 3. Symfony Cache

Cache is pre-warmed by `make prod-build`. If needed manually:

```bash
php bin/console cache:warmup --env=prod
```

---

## Security Checklist

- [ ] `APP_ENV=prod` and `APP_DEBUG=0`
- [ ] `APP_SECRET` is a strong random value (not default)
- [ ] Database credentials are secure (not default)
- [ ] JWT keys (`config/jwt/*.pem`) have restricted permissions
- [ ] CORS origins restricted to your domain only
- [ ] HTTPS enabled (SSL certificate installed)
- [ ] File permissions correct (no world-writable directories)
- [ ] Error reporting disabled in production (`display_errors=Off`)
- [ ] Unnecessary files removed (`.git/`, `tests/`, `docker/`)

---

## Rollback Plan

### Before Deployment

1. **Backup database:**
   ```bash
   mysqldump -u user -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Backup current files:**
   ```bash
   tar -czf backup_app_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/app/
   ```

### If Deployment Fails

1. Restore database from backup
2. Restore files from backup
3. Check `var/log/prod.log` for error details
4. Revert environment variables if changed

---

## Hosting-Specific Notes

### Shared Hosting (cPanel, Plesk)

- Use **File Manager** or **FTP** to upload files
- Set **Document Root** to `public/` in domain settings
- Use **PHP Settings** or **MultiPHP INI Editor** to set environment variables
- **Cron jobs** can be configured for scheduled tasks

### VPS / Dedicated Server

- Use **SSH** and **rsync** for file transfer
- Configure **Nginx/Apache** virtual host manually
- Set **environment variables** in systemd, Apache, or Nginx config
- Consider using **process managers** (supervisord) for queue workers

### Cloud Providers (AWS, Azure, GCP)

- Use **CI/CD pipelines** for automated deployment
- Store **secrets** in AWS Secrets Manager, Azure Key Vault, or GCP Secret Manager
- Use **managed databases** (RDS, Cloud SQL)
- Enable **auto-scaling** and **load balancing**

### Docker (Production)

If deploying with Docker, use the provided production config:

```bash
# Start production containers
make prod-up

# Check status
make prod-status

# View logs
make prod-logs
```

---

## Monitoring & Logs

### Application Logs

```bash
# View production logs
tail -f var/log/prod.log

# View web server logs
tail -f /var/log/nginx/error.log  # Nginx
tail -f /var/log/apache2/error.log  # Apache
```

### Recommended Monitoring

- **Uptime monitoring:** UptimeRobot, Pingdom
- **Error tracking:** Sentry, Rollbar
- **Performance monitoring:** New Relic, Datadog
- **Log aggregation:** Loggly, Papertrail

---

## Support & Troubleshooting

### Debug Mode (Temporary)

**ONLY for troubleshooting in production:**

```bash
APP_DEBUG=1
```

**⚠️ WARNING:** Never leave debug mode enabled in production! It exposes sensitive information.

### Check Configuration

```bash
# Verify environment
php bin/console about --env=prod

# Check database connection
php bin/console doctrine:query:sql "SELECT 1" --env=prod

# Validate Doctrine schema
php bin/console doctrine:schema:validate --env=prod
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-01
**For:** Production Deployment (Platform-Agnostic)
