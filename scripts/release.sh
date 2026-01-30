#!/bin/bash
# scripts/release.sh
# Shared Logic for Production Release
# Usage: ./scripts/release.sh <server> <tag>

set -e # Exit on error

# --- Load Environment Variables ---
# We load .env first, then override with .env.local if it exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
fi
# ----------------------------------

# Configuration priority: Arg 1 > Env Var SERVER > .env.local DEPLOY_SERVER
SERVER="${1:-${SERVER:-$DEPLOY_SERVER}}"

# Configuration priority: Arg 2 > Env Var TAG > Date-based generation
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
docker cp "$CONTAINER_ID:/var/www/html/." "$RELEASE_DIR/"
docker rm "$CONTAINER_ID" > /dev/null

echo -e "${GREEN}✓ Artifact saved to $RELEASE_DIR${NC}"
echo ""

# --- 2. DEPLOY (RSYNC) ---
HOST=$(echo "$SERVER" | cut -d: -f1)
REMOTE_PATH=$(echo "$SERVER" | cut -d: -f2)

echo -e "${YELLOW}[3/4] Deploying to $HOST:$REMOTE_PATH...${NC}"
echo -e "${YELLOW}⚠ This will overwrite files on the server. Continuing in 3 seconds...${NC}"
sleep 3

rsync -avz --progress \
    --exclude='.git/' \
    --exclude='.github/' \
    --exclude='.agents/' \
    --exclude='.skills/' \
    --exclude='.claude/' \
    --exclude='.idea/' \
    --exclude='.vscode/' \
    --exclude='node_modules/' \
    --exclude='var/cache/' \
    --exclude='var/log/' \
    --exclude='docker/' \
    --exclude='tests/' \
    --exclude='scripts/' \
    --exclude='private/' \
    --exclude='.env.dev' \
    --exclude='.env.test' \
    --exclude='.env.local' \
    --exclude='Makefile' \
    --exclude='*.md' \
    --exclude='*.dist' \
    --exclude='*.lock' \
    --include='composer.lock' \
    --include='package-lock.json' \
    --include='symfony.lock' \
    --exclude='.php-cs-fixer*' \
    --exclude='phpstan*' \
    --exclude='phpunit*' \
    --exclude='rector.php' \
    --exclude='playwright*' \
    --exclude='tsconfig*' \
    --exclude='vite.config.js' \
    --exclude='tailwind.config.js' \
    --exclude='postcss.config.js' \
    --exclude='compose.yaml' \
    --exclude='compose.override.yaml' \
    --exclude='docker-compose*' \
    "$RELEASE_DIR/" "$HOST:$REMOTE_PATH/"

echo ""

# --- 3. POST-DEPLOY TASKS (SSH) ---
echo -e "${YELLOW}[4/4] Running remote post-deployment tasks...${NC}"
# We try to use local composer.phar if available, otherwise global composer
ssh "$HOST" "cd $REMOTE_PATH && \
    COMPOSER_CMD='composer'; \
    if [ -f composer.phar ]; then COMPOSER_CMD='php composer.phar'; fi; \
    echo '  > Regenerating .env.local.php...' && \
    \$COMPOSER_CMD dump-env prod && \
    echo '  > Running migrations...' && \
    php bin/console doctrine:migrations:migrate --no-interaction && \
    echo '  > Clearing cache...' && \
    php bin/console cache:clear && \
    php bin/console cache:warmup"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}🚀 Release $TAG deployed successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"