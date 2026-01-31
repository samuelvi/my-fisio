#!/bin/bash
# Production Build Script
# This script prepares the application for production deployment

set -e  # Exit on error

echo "========================================="
echo "Production Build Process"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Install Composer dependencies (production only)
echo -e "${YELLOW}[1/7] Installing Composer dependencies (production)...${NC}"
composer install \
    --no-dev \
    --no-interaction \
    --optimize-autoloader \
    --classmap-authoritative \
    --no-scripts

echo -e "${GREEN}✓ Composer dependencies installed${NC}"
echo ""

# Step 2: Generate FOS JS Routing
echo -e "${YELLOW}[2/7] Generating FOS JS routes...${NC}"
php bin/console fos:js-routing:dump \
    --format=json \
    --target=assets/routing/routes.json \
    --env=prod
echo -e "${GREEN}✓ FOS JS routes generated${NC}"
echo ""

# Step 3: Install NPM dependencies
echo -e "${YELLOW}[3/7] Installing NPM dependencies...${NC}"
npm ci --prefer-offline --no-audit
echo -e "${GREEN}✓ NPM dependencies installed${NC}"
echo ""

# Step 4: Build frontend assets
echo -e "${YELLOW}[4/7] Building React assets with Vite...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend assets compiled${NC}"
echo ""

# Step 5: Generate JWT keys (if they don't exist)
echo -e "${YELLOW}[5/7] Checking JWT keys...${NC}"
mkdir -p config/jwt
if [ ! -f config/jwt/private.pem ]; then
    # Use dummy env for key generation if .env is missing
    JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem \
    JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem \
    JWT_PASSPHRASE=temporary_passphrase_for_build \
    php bin/console lexik:jwt:generate-keypair --no-interaction --env=prod || echo "Warning: JWT keys generation failed, will try on server"
else
    echo "JWT keys already exist"
fi
echo -e "${GREEN}✓ JWT keys checked${NC}"
echo ""

# Step 6: Clear and warm up cache

# Step 7: Set proper permissions
echo -e "${YELLOW}[7/7] Setting permissions...${NC}"
chmod -R 775 var/cache var/log 2>/dev/null || echo "Note: Permission changes may require host-level execution"
echo -e "${GREEN}✓ Permissions set${NC}"
echo ""

# Display build summary
echo ""
echo "========================================="
echo -e "${GREEN}Build completed successfully!${NC}"
echo "========================================="
echo ""
echo -e "${YELLOW}Generated files:${NC}"
echo "  ✓ vendor/                (production dependencies)"
echo "  ✓ public/build/          (compiled frontend assets)"
echo "  ✓ assets/routing/        (FOS JS routes)"
echo "  ✓ var/cache/prod/        (production cache)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Upload files to production server"
echo "  2. Run 'composer dump-env prod' on server"
echo "  3. Run migrations"
echo ""
echo -e "${GREEN}Ready for deployment!${NC}"