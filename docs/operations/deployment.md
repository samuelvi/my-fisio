# Production Deployment Guide

This guide covers deploying the Physiotherapy Clinic Management System to any production hosting environment (VPS, shared hosting, cloud providers, etc.).

---

## Quick Start

### 1. One-Time Setup

**Configure your target server:**
Create or edit `.env.local` in your project root and add your production server details:

```ini
###> production/deployment ###
# Format: user@host:/path/to/app
DEPLOY_SERVER=user@your-domain.com:/var/www/html
###< production/deployment ###
```

**Setup Passwordless Deployment (Optional but Recommended):**
To avoid typing your password every time you deploy, set up SSH keys.

#### Option A: Use Default Key (Quickest)
If you already have a default key (`~/.ssh/id_rsa`) and want to reuse it:

1.  **Copy it to your server:**
    ```bash
    ssh-copy-id user@your-domain.com
    ```

#### Option B: Dedicated Key (Best Practice)
It is safer to generate a specific key for production so it's separate from your GitHub/personal keys.

1.  **Generate a specific key:**
    ```bash
    # -f defines the filename
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_prod_key
    ```
2.  **Copy this specific key to the server:**
    ```bash
    ssh-copy-id -i ~/.ssh/id_prod_key.pub user@your-domain.com
    ```
3.  **Configure your SSH Client:**
    Edit (or create) your `~/.ssh/config` file to map the key to the host:
    
    ```ssh
    # ~/.ssh/config
    Host your-domain.com
        User user
        IdentityFile ~/.ssh/id_prod_key
    ```

Now, when you run `make prod-release`, SSH (and rsync) will automatically use the correct key for that domain.

### 2. Build & Deploy

Run a single command to build the application in an isolated Docker container and deploy it:

```bash
make prod-release
```

**What this does:**
1.  **Builds** a clean, optimized artifact in `var/releases/vYYYYMMDD...` (ignoring local dev files).
2.  **Uploads** the artifact to your server via `rsync`.
3.  **Executes** remote tasks (migrations, cache clearing) automatically.

**Rollback:**
To redeploy a specific previous version from your local history:
```bash
make prod-release tag=v20260130120000
```

---

## Detailed Workflow (Under the Hood)

### Automated Build

The `make prod-release` command triggers an isolated build process:

- ✅ **Isolation**: Your local development environment (vendor, node_modules) is NOT touched.
- ✅ **Cleanliness**: The release folder contains *only* what is needed for production.
- ✅ **Optimization**: Installs production dependencies, compiles assets with Vite, and pre-warms the cache.

**Output:** A timestamped folder in `var/releases/` containing the ready-to-deploy application.

### Deployment Strategy

The system uses `rsync` to synchronize the built artifact with your server.
- **Includes:** Optimized vendor, compiled assets (`public/build`), source code.
- **Excludes:** `.git`, tests, docker config, dev tools (`php-cs-fixer`), and environment secrets (`.env.local`).

After file sync, it connects via SSH to run:
1. `composer dump-env prod` (optimizes .env)
2. `doctrine:migrations:migrate` (updates database)
3. `cache:clear` & `cache:warmup`

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