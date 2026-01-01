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

# Step 2: Generate optimized .env.local.php
echo -e "${YELLOW}[2/7] Generating optimized .env.local.php...${NC}"
if [ -f .env.prod ]; then
    composer dump-env prod
    echo -e "${GREEN}✓ .env.local.php generated from .env.prod${NC}"
else
    echo -e "${RED}⚠ Warning: .env.prod not found. Skipping .env.local.php generation.${NC}"
    echo -e "${YELLOW}  You should create .env.prod with your production configuration.${NC}"
fi
echo ""

# Step 3: Generate FOS JS Routing
echo -e "${YELLOW}[3/7] Generating FOS JS routes...${NC}"
php bin/console fos:js-routing:dump \
    --format=json \
    --target=assets/routing/routes.json \
    --env=prod
echo -e "${GREEN}✓ FOS JS routes generated${NC}"
echo ""

# Step 4: Install NPM dependencies
echo -e "${YELLOW}[4/7] Installing NPM dependencies...${NC}"
npm ci --prefer-offline --no-audit
echo -e "${GREEN}✓ NPM dependencies installed${NC}"
echo ""

# Step 5: Build frontend assets
echo -e "${YELLOW}[5/7] Building React assets with Vite...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend assets compiled${NC}"
echo ""

# Step 6: Clear and warm up cache
echo -e "${YELLOW}[6/7] Clearing and warming up Symfony cache...${NC}"
php bin/console cache:clear --env=prod --no-warmup
php bin/console cache:warmup --env=prod
echo -e "${GREEN}✓ Cache cleared and warmed up${NC}"
echo ""

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
if [ -f .env.local.php ]; then
    echo "  ✓ .env.local.php         (optimized environment)"
fi
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review .env.prod for production configuration"
echo "  2. Ensure config/jwt/*.pem keys are present"
echo "  3. Upload files to production server (see docs/DEPLOYMENT.md)"
echo "  4. Set APP_ENV=prod on the server"
echo "  5. Run database migrations"
echo ""
echo -e "${GREEN}Ready for deployment!${NC}"
