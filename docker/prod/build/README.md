# Production Build Container

This directory contains the Docker configuration for building the application for production deployment.

## Purpose

The production build container provides a clean, isolated environment to:
- Install production-only Composer dependencies
- Compile frontend assets with Vite
- Generate optimized `.env.local.php` for better performance
- Prepare optimized caches and autoloaders
- Ensure consistent builds across different development machines

## Files

- **Dockerfile**: Production build container image definition
- **build.sh**: Automated build script that runs all preparation steps
- **docker-compose.build.yaml**: Docker Compose configuration for the build process

## Usage

### Quick Build

```bash
make prod-build
```

This command will:
1. Build the production container image
2. Run the build script inside the container
3. Generate all production artifacts in your local directory

### What Gets Generated

After running `make prod-build`, the following files/directories are created:

- `vendor/` - Production-only Composer dependencies (no dev packages)
- `public/build/` - Compiled frontend assets (CSS, JS, images)
- `assets/routing/` - Generated FOS JS routing files
- `var/cache/prod/` - Pre-warmed Symfony production cache
- `.env.local.php` - Optimized environment configuration (if .env.prod exists)

### Cleaning Build Artifacts

To remove production build artifacts and restore dev environment:

```bash
make prod-build-clean
```

This will:
- Remove `.env.local.php`
- Remove production cache
- Reinstall development dependencies

## Build Process Details

The build script (`build.sh`) performs these steps in order:

1. **Install Composer dependencies** (production only)
   - No dev packages
   - Optimized autoloader
   - Classmap authoritative mode

2. **Generate `.env.local.php`**
   - Converts `.env.prod` to optimized PHP array
   - Faster than parsing .env files
   - Requires `composer dump-env prod`

3. **Generate FOS JS routes**
   - Exports Symfony routes to JSON for frontend
   - Used by React Router integration

4. **Install NPM dependencies**
   - Clean install with `npm ci`
   - Uses package-lock.json for reproducible builds

5. **Build frontend assets**
   - Vite compilation in production mode
   - Minification and optimization
   - Code splitting and tree shaking

6. **Clear and warm up cache**
   - Clears any existing production cache
   - Pre-warms cache for faster first request

7. **Set permissions**
   - Makes cache and log directories writable

## Environment Variables

The build container uses these environment variables:

- `APP_ENV=prod` - Forces production mode
- `APP_DEBUG=0` - Disables debug mode
- `COMPOSER_ALLOW_SUPERUSER=1` - Allows Composer to run as root (safe in container)

## Configuration Requirements

Before running `make prod-build`, ensure:

1. **`.env.prod` exists** with production configuration
2. **JWT keys are present** in `config/jwt/`
3. **Dev containers are running** (for some dependencies)

## Deployment Workflow

Typical workflow for deploying to production:

```bash
# 1. Prepare production configuration
cp .env.prod.example .env.prod
# Edit .env.prod with production values

# 2. Build production artifacts
make prod-build

# 3. Deploy to server
make prod-deploy server=user@yourserver.com:/var/www/app

# 4. On the server, run migrations
ssh user@yourserver.com
cd /var/www/app
php bin/console doctrine:migrations:migrate --env=prod --no-interaction
```

## Why a Separate Build Container?

Using a dedicated build container instead of dev containers provides:

- **Clean environment**: No dev dependencies or tools
- **Production configuration**: PHP configured for production (OPcache, etc.)
- **Reproducibility**: Same build on any machine
- **Security**: No dev tools in final artifacts
- **Optimization**: Production-specific optimizations enabled

## Troubleshooting

### Build fails with "composer: command not found"

The Dockerfile includes Composer installation. Rebuild the image:

```bash
docker-compose -f docker/prod/docker-compose.build.yaml build --no-cache
```

### NPM build fails

Ensure Node.js and NPM are installed in the container. Check Dockerfile for Node installation.

### .env.local.php not generated

Make sure `.env.prod` exists in the project root. The build script will skip this step if the file is missing.

### Permission errors

The build container runs as root inside Docker but writes to your local filesystem. File ownership may need adjustment:

```bash
sudo chown -R $USER:$USER vendor/ public/build/ var/
```

## Advanced Usage

### Manual Build Steps

If you need to run individual build steps:

```bash
# Start build container
docker-compose -f docker/prod/docker-compose.build.yaml run --rm build /bin/sh

# Inside the container, run individual commands:
composer install --no-dev --optimize-autoloader
npm run build
php bin/console cache:warmup --env=prod
```

### Custom Build Script

You can modify `build.sh` to add custom build steps specific to your deployment needs.

## See Also

- [Production Deployment Guide](../../../docs/DEPLOYMENT.md)
- [Docker Production Configuration](../README.md)
- [Makefile Documentation](../../../Makefile)
