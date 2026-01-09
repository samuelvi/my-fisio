# Production Deployment Guide

This guide covers deploying the Physiotherapy Clinic Management System to any production hosting environment (VPS, shared hosting, cloud providers, etc.).

---

## Quick Start

### Automated Build (Recommended)

Use the dedicated isolated production build to prepare your application:

```bash
make prod-build
```

This command uses a **dedicated Docker container** to build the application in isolation and exports the artifacts to the `dist/` directory. It ensures:
- ✅ **Isolation**: Your local development environment (vendor, node_modules) is NOT touched.
- ✅ **Cleanliness**: The `dist/` folder contains *only* what is needed for production.
- ✅ **Optimization**: Installs production dependencies, compiles assets, and generates optimized configuration.

**Output:** A `dist/` folder containing the ready-to-deploy application.

### Deploying

Once built, you can deploy the contents of the `dist/` folder to your server:

```bash
make prod-deploy server=user@your-server:/var/www/html
```

Or manually using rsync:

```bash
rsync -avz --exclude='.git' dist/ user@your-server:/var/www/html/
```

---

## Understanding the Workflow

1.  **Build**: `make prod-build` creates a temporary Docker container, runs the build process (composer install --no-dev, npm run build, cache warmup), and copies the result to `dist/`.
2.  **Deploy**: You simply copy the content of `dist/` to your production server's document root.

This strategy prevents "works on my machine" issues and ensures you don't accidentally deploy development files or configuration.

---

## Environment Configuration

### Required Environment Variables

Your production server must have `APP_ENV=prod` configured.

#### Method 1: `.env.local.php` (Recommended for Performance)

The `make prod-build` command automatically generates an optimized `.env.local.php` file from your `.env.prod` (if present) inside the build. This file is included in the `dist/` folder.

**Note**: You should verify the contents of `.env.local.php` or ensure your server environment variables override it if needed.

#### Method 2: Environment Variables on Server

Set these directly in your web server configuration (Nginx/Apache) or hosting panel:

```bash
APP_ENV=prod
APP_DEBUG=0
APP_SECRET=your_secure_random_secret
DATABASE_URL=...
```

---

## Configuration Checklist

Update these values for your production environment (in `.env.prod` before building, or on the server):

### Security (Critical)

```bash
# Generate a secure 32+ character random string
APP_SECRET=your_secure_random_secret_here
```

### Database

```bash
DATABASE_URL="mysql://db_user:db_password@db_host:3306/db_name?serverVersion=mariadb-11.0.0&charset=utf8mb4"
```

### Domain & CORS

```bash
# Your production domain
DEFAULT_URI=https://your-domain.com

# Allowed CORS origins (regex pattern)
CORS_ALLOW_ORIGIN='^https?://(your-domain\.com)(:[0-9]+)?$'
```

### JWT Keys

Ensure JWT keys are present and readable on the server:
`config/jwt/private.pem` and `public.pem`.

If they are not in the `dist/` folder (usually ignored for security), you must generate or upload them manually to the server:

```bash
# On the server
php bin/console lexik:jwt:generate-keypair
```

---

## Server Configuration

### Web Server Document Root

**Point your web server to:** `/path/to/app/public`

### Nginx Configuration Example

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

After deployment, ensure the web server user (e.g., `www-data`) has write access to:

```bash
chmod -R 775 var/cache var/log
chown -R www-data:www-data var/
```

---

## Post-Deployment

### 1. Run Migrations

```bash
php bin/console doctrine:migrations:migrate --env=prod --no-interaction
```

### 2. Verify

Visit your site and check `var/log/prod.log` if you encounter issues.

---

## Common Issues

### Assets Not Loading (404)
- Ensure your web server root points to `public/`.
- Ensure `make prod-build` completed successfully.

### 500 Internal Server Error
- Check `var/log/prod.log`.
- Check file permissions.

---

**Document Version:** 1.1 (Updated for Isolated Build Strategy)
**Last Updated:** 2026-01-01