#!/bin/bash
# scripts/release.sh
# Shared Logic for Production Release
# Usage: ./scripts/release.sh <server> <tag>

set -e # Exit on error

# --- Load Environment Variables ---
if [ -f .env ]; then set -a; source .env; set +a; fi
if [ -f .env.local ]; then set -a; source .env.local; set +a; fi

# Configuration priority
SERVER="${1:-${SERVER:-$DEPLOY_SERVER}}"
TAG="${2:-${TAG:-v$(date +'%Y%m%d%H%M%S')}}"
APP_NAME="physiotherapy-dist"
RELEASE_DIR="var/releases/$TAG"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$SERVER" ]; then
    echo -e "${RED}Error: Server argument required${NC}"
    echo "Usage: $0 <user@host:/path> [tag]"
    exit 1
fi

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Production Release Process${NC}"
echo -e "${GREEN}Server: $SERVER${NC}"
echo -e "${GREEN}Tag:    $TAG${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# --- 1. BUILD & EXTRACT ---
echo -e "${YELLOW}[1/4] Building isolated production image...${NC}"
docker build -f docker/prod/dist/Dockerfile -t "$APP_NAME:$TAG" .

echo -e "${YELLOW}[2/4] Exporting artifact...${NC}"
mkdir -p "$RELEASE_DIR"
CONTAINER_ID=$(docker create "$APP_NAME:$TAG")
rm -rf "$RELEASE_DIR"/*

# Copy application files
docker cp "$CONTAINER_ID:/var/www/html/." "$RELEASE_DIR/"

# Copy composer binary from the container itself
echo -e "${YELLOW}Extracting composer from Docker image...${NC}"
docker cp "$CONTAINER_ID:/usr/bin/composer" "$RELEASE_DIR/composer.phar"

docker rm "$CONTAINER_ID" > /dev/null
echo -e "${GREEN}✓ Artifact and tools saved to $RELEASE_DIR${NC}"
echo ""

# --- 2. DEPLOY (RSYNC) ---
HOST=$(echo "$SERVER" | cut -d: -f1)
REMOTE_PATH=$(echo "$SERVER" | cut -d: -f2)

echo -e "${YELLOW}[3/4] Deploying to $HOST:$REMOTE_PATH...${NC}"
echo -e "${YELLOW}⚠ This will overwrite files on the server. Continuing in 3 seconds...${NC}"
sleep 3

rsync -avz --delete --progress \
    --include='composer.phar' \
    --include='public/build/**' \
    --exclude='.DS_Store' \
    --exclude='.git/' \
    --exclude='.github/' \
    --exclude='node_modules/' \
    --exclude='var/cache/' \
    --exclude='var/log/' \
    --exclude='tests/' \
    --exclude='assets/' \
    --exclude='config/jwt/' \
    --exclude='.env.local' \
    --exclude='.env.prod.local' \
    --exclude='.env.local.php' \
    --exclude='*.md' \
    "$RELEASE_DIR/" "$HOST:$REMOTE_PATH/"

echo ""

# --- 3. POST-DEPLOY TASKS (SSH) ---
echo -e "${YELLOW}[4/4] Running remote post-deployment tasks...${NC}"

# We pass REMOTE_PATH as an environment variable to the SSH session
ssh "$HOST" "REMOTE_PATH=$REMOTE_PATH" /bin/bash << 'EOF'
    set -e
    cd "$REMOTE_PATH"
    export APP_ENV=prod

    # 1. Detect correct PHP CLI binary
    if command -v php8.4-cli >/dev/null 2>&1; then
        PHP_BIN='php8.4-cli'
    elif command -v php-cli >/dev/null 2>&1; then
        PHP_BIN='php-cli'
    else
        PHP_BIN='php'
    fi

    echo "Using PHP binary: $PHP_BIN"

    # 2. Determine Composer command
    if [ -f ./composer.phar ]; then
        COMPOSER_CMD="$PHP_BIN ./composer.phar"
    else
        COMPOSER_CMD="composer"
    fi

    echo "Using composer command: $COMPOSER_CMD"

    echo "  > Cleaning up development files..."
    rm -rf .DS_Store .dockerignore .editorconfig .env.prod .features-gen .gitignore .gitignore.additions .phpunit.cache agents assets claude-* gemini-* openai-* skills docs package.json package-lock.json test-results sync-server.sh

    echo "  > Checking JWT keys..."
    mkdir -p config/jwt
    $PHP_BIN bin/console lexik:jwt:generate-keypair --skip-if-exists --no-interaction --env=prod

    echo "  > Regenerating .env.local.php..."
    $COMPOSER_CMD dump-env prod

    echo "  > Checking database state..."
    if $PHP_BIN bin/console dbal:run-sql "SELECT 1 FROM doctrine_migration_versions LIMIT 1" --env=prod >/dev/null 2>&1; then
        echo "    - Database connection verified."
        echo "    - Running migrations..."
        $PHP_BIN bin/console doctrine:migrations:migrate --no-interaction --env=prod
    else
        echo "    - Database migration table not found or connection issue."
        echo "    - Skipping dangerous schema:create. Please run migrations manually if this is a new setup."
    fi

    echo "  > Clearing and warming up cache..."
    rm -rf var/cache/*
    $PHP_BIN bin/console cache:warmup --env=prod

    echo "  > Resetting Web OpCache..."
    # Execute the reset script via local curl to the web server
    # This ensures we clear the Web OpCache pools
    curl -s -k "http://localhost/scripts/opcache_reset.php" || echo "Warning: Local OpCache reset call failed"
EOF

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}🚀 Release $TAG deployed successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
