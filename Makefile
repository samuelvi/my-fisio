.PHONY: help dev-build dev-up dev-down dev-restart dev-logs dev-ps dev-shell-php dev-shell-db dev-shell-redis dev-shell-node dev-watch-logs composer composer-install composer-update composer-require composer-require-dev composer-remove composer-validate composer-dump-autoload symfony cache-clear cache-warmup db-create db-drop db-collation db-migrate db-migration-create db-fixtures db-reset db-validate install-api install-cache install-redis-bundle install-event-store install-all-packages phpstan-install phpstan cs-fixer-install cs-check cs-fix rector-install rector rector-fix quality-tools quality-check test test-unit test-e2e test-all test-coverage dev-install init-symfony wait-for-services db-setup success-message dev-quick-start dev-clean clean-cache mailpit urls test-up test-down test-build test-logs test-shell-php test-reset-db test-e2e-ui prod-up prod-down prod-restart prod-logs prod-status prod-health prod-db-migrate prod-db-check prod-db-backup prod-db-restore prod-cache-clear prod-cache-warmup

# Default target
.DEFAULT_GOAL := help

# Docker compose file locations
DOCKER_COMPOSE_DEV = docker-compose -f docker/dev/docker-compose.yaml -f docker/dev/docker-compose.override.yaml
DOCKER_COMPOSE_TEST = docker-compose -f docker/test/docker-compose.yaml
DOCKER_COMPOSE_PROD = docker-compose -f docker/prod/docker-compose.yaml
DOCKER_COMPOSE_BUILD = docker-compose -f docker/prod/docker-compose.build.yaml

# Colors for terminal output
GREEN  := [0;32m
YELLOW := [0;33m
NC     := [0m # No Color

##@ General

help: ## Display this help message
	@echo "$(GREEN)Physiotherapy Clinic Management System - Development Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(YELLOW)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(GREEN)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Docker Management (Dev)

dev-build: ## Build all Docker containers (Dev)
	@echo "$(GREEN)Building Docker containers (Dev)...$(NC)"
	$(DOCKER_COMPOSE_DEV) build

dev-up: ## Start all containers in background (Dev)
	@echo "$(GREEN)Starting containers (Dev)...$(NC)"
	$(DOCKER_COMPOSE_DEV) up -d

dev-down: ## Stop and remove all containers (Dev)
	@echo "$(YELLOW)Stopping containers (Dev)...$(NC)"
	$(DOCKER_COMPOSE_DEV) down

dev-restart: dev-down dev-up ## Restart all containers (Dev)


dev-stop: ## Stop all containers without removing (Dev)
	@echo "$(YELLOW)Stopping containers (Dev)...$(NC)"
	$(DOCKER_COMPOSE_DEV) stop

dev-logs: ## Show logs from all containers (Dev) (use: make dev-logs service=php)
	@if [ -z "$(service)" ]; then \
		$(DOCKER_COMPOSE_DEV) logs -f; \
	else \
		$(DOCKER_COMPOSE_DEV) logs -f $(service); \
	fi

dev-ps: ## Show running containers (Dev)
	$(DOCKER_COMPOSE_DEV) ps

##@ Docker Management (Test)

test-build: ## Build all Docker containers (Test)
	@echo "$(GREEN)Building Docker containers (Test)...$(NC)"
	$(DOCKER_COMPOSE_TEST) build

test-up: ## Start all containers in background (Test)
	@echo "$(GREEN)Starting containers (Test)...$(NC)"
	$(DOCKER_COMPOSE_TEST) up -d

test-down: ## Stop and remove all containers (Test)
	@echo "$(YELLOW)Stopping containers (Test)...$(NC)"
	$(DOCKER_COMPOSE_TEST) down -v

test-logs: ## Show logs from all containers (Test)
	$(DOCKER_COMPOSE_TEST) logs -f

test-shell-php: ## Access PHP container shell (Test)
	$(DOCKER_COMPOSE_TEST) exec php_test sh

test-assets-build: ## Build frontend assets in test environment
	$(DOCKER_COMPOSE_TEST) run --rm node_test npm run build

##@ Docker Management (Production)

prod-up: ## Start all containers (Production) - SAFE: Starts services
	@echo "$(GREEN)Starting containers (Production)...$(NC)"
	@if [ ! -f "docker/prod/.env" ]; then \
		echo "$(YELLOW)ERROR: docker/prod/.env not found!$(NC)"; \
		echo "$(YELLOW)Copy docker/prod/.env.example to docker/prod/.env and configure it.$(NC)"; \
		exit 1; \
	fi
	$(DOCKER_COMPOSE_PROD) up -d

prod-down: ## Stop containers (Production) - SAFE: Stops without removing data
	@echo "$(YELLOW)Stopping containers (Production)...$(NC)"
	@echo "$(YELLOW)Note: Data volumes are preserved$(NC)"
	$(DOCKER_COMPOSE_PROD) down

prod-restart: prod-down prod-up ## Restart containers (Production)

prod-logs: ## Show logs (Production) (use: make prod-logs service=php)
	@if [ -z "$(service)" ]; then \
		$(DOCKER_COMPOSE_PROD) logs -f; \
	else \
		$(DOCKER_COMPOSE_PROD) logs -f $(service); \
	fi

prod-status: ## Show container status (Production)
	@echo "$(GREEN)Production container status:$(NC)"
	$(DOCKER_COMPOSE_PROD) ps

prod-health: ## Check health status (Production)
	@echo "$(GREEN)Checking health status...$(NC)"
	@$(DOCKER_COMPOSE_PROD) ps --format json | grep -q "health" && \
		echo "$(GREEN)Health checks enabled$(NC)" || \
		echo "$(YELLOW)No health checks configured$(NC)"

##@ Production Database Operations (SAFE - No destructive commands)

prod-db-migrate: ## Apply migrations (Production)
	@echo "$(GREEN)Running migrations (Production)...$(NC)"
	@echo "$(YELLOW)⚠ This will modify the production database schema$(NC)"
	@read -p "Continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(DOCKER_COMPOSE_PROD) exec php php bin/console doctrine:migrations:migrate --no-interaction; \
	else \
		echo "$(YELLOW)Migration cancelled$(NC)"; \
	fi

prod-db-check: ## Verify MariaDB connection (Production)
	@echo "$(GREEN)Checking MariaDB connection (Production)...$(NC)"
	$(DOCKER_COMPOSE_PROD) exec mariadb mariadb -u physiotherapy_user -p$$MARIADB_PASSWORD physiotherapy_db -e "SHOW DATABASES;"

prod-db-backup: ## Create database backup (Production)
	@echo "$(GREEN)Creating database backup (Production)...$(NC)"
	@mkdir -p docker/prod/backups
	@BACKUP_FILE="docker/prod/backups/backup_$$(date +%Y%m%d_%H%M%S).sql"; \
	$(DOCKER_COMPOSE_PROD) exec -T mariadb mariadb-dump -u physiotherapy_user -p$$MARIADB_PASSWORD physiotherapy_db > $$BACKUP_FILE; \
	echo "$(GREEN)Backup created: $$BACKUP_FILE$(NC)"

prod-db-restore: ## Restore database from backup (use: make prod-db-restore file=path/to/backup.sql)
	@if [ -z "$(file)" ]; then \
		echo "$(YELLOW)Usage: make prod-db-restore file=path/to/backup.sql$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)⚠ WARNING: This will restore the database from backup$(NC)"
	@echo "$(YELLOW)⚠ Current data may be overwritten$(NC)"
	@read -p "Continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cat $(file) | $(DOCKER_COMPOSE_PROD) exec -T mariadb mariadb -u physiotherapy_user -p$$MARIADB_PASSWORD physiotherapy_db; \
		echo "$(GREEN)Database restored from: $(file)$(NC)"; \
	else \
		echo "$(YELLOW)Restore cancelled$(NC)"; \
	fi

##@ Production Cache Operations

prod-cache-clear: ## Clear application cache (Production)
	@echo "$(GREEN)Clearing cache (Production)...$(NC)"
	$(DOCKER_COMPOSE_PROD) exec php php bin/console cache:clear --env=prod --no-warmup

prod-cache-warmup: ## Warm up cache (Production)
	@echo "$(GREEN)Warming up cache (Production)...$(NC)"
	$(DOCKER_COMPOSE_PROD) exec php php bin/console cache:warmup --env=prod

##@ Production Build & Deploy

prod-build: ## Build production-ready application using dedicated build container
	@echo "$(GREEN)=========================================$(NC)"
	@echo "$(GREEN)Production Build Process$(NC)"
	@echo "$(GREEN)=========================================$(NC)"
	@echo ""
	@echo "$(YELLOW)Building production container image...$(NC)"
	$(DOCKER_COMPOSE_BUILD) build
	@echo ""
	@echo "$(YELLOW)Running production build script...$(NC)"
	$(DOCKER_COMPOSE_BUILD) run --rm build /var/www/html/docker/prod/build/build.sh
	@echo ""
	@echo "$(GREEN)=========================================$(NC)"
	@echo "$(GREEN)Production build completed!$(NC)"
	@echo "$(GREEN)=========================================$(NC)"
	@echo ""
	@echo "$(YELLOW)Deploy with:$(NC)"
	@echo "  make prod-deploy server=user@host:/path/to/app"
	@echo ""
	@echo "$(YELLOW)Or manually with rsync:$(NC)"
	@echo "  rsync -avz --exclude='.git' --exclude='node_modules' --exclude='var/cache' --exclude='var/log' --exclude='docker' --exclude='tests' --exclude='.env.dev' --exclude='.env.test' ./ user@server:/path/to/app/"
	@echo ""
	@echo "$(YELLOW)See docs/DEPLOYMENT.md for detailed instructions$(NC)"

prod-build-clean: ## Clean production build artifacts and restore dev environment
	@echo "$(YELLOW)Cleaning production build artifacts...$(NC)"
	@if [ -f .env.local.php ]; then rm .env.local.php && echo "$(GREEN)✓ Removed .env.local.php$(NC)"; fi
	@if [ -d var/cache/prod ]; then rm -rf var/cache/prod && echo "$(GREEN)✓ Removed production cache$(NC)"; fi
	@echo "$(YELLOW)Restoring development dependencies...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php composer install --optimize-autoloader --no-interaction
	@echo "$(GREEN)✓ Development environment restored$(NC)"

prod-deploy: ## Deploy to production server (use: make prod-deploy server=user@host:/path)
	@if [ -z "$(server)" ]; then \
		echo "$(RED)Error: server parameter required$(NC)"; \
		echo "$(YELLOW)Usage: make prod-deploy server=user@host:/path/to/app$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Deploying to $(server)...$(NC)"
	@echo "$(YELLOW)⚠ This will overwrite files on the server$(NC)"
	@read -p "Continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		rsync -avz --progress \
			--exclude='.git' \
			--exclude='node_modules' \
			--exclude='var/cache' \
			--exclude='var/log' \
			--exclude='docker' \
			--exclude='tests' \
			--exclude='.env.dev' \
			--exclude='.env.test' \
			--exclude='.env.local' \
			./ $(server)/; \
		echo "$(GREEN)✓ Deployment completed!$(NC)"; \
		echo "$(YELLOW)Don't forget to:$(NC)"; \
		echo "  1. Set APP_ENV=prod on the server"; \
		echo "  2. Run migrations: php bin/console doctrine:migrations:migrate --env=prod"; \
		echo "  3. Verify application is working"; \
	else \
		echo "$(YELLOW)Deployment cancelled$(NC)"; \
	fi

##@ Container Access (Dev)

dev-shell-php: ## Access PHP container shell
	@echo "$(GREEN)Accessing PHP container...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php sh

dev-shell-db: ## Access MariaDB database shell
	@echo "$(GREEN)Accessing MariaDB...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec mariadb mariadb -u physiotherapy_user -pphysiotherapy_pass physiotherapy_db

dev-shell-redis: ## Access Redis CLI
	@echo "$(GREEN)Accessing Redis CLI...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec redis redis-cli

dev-shell-node: ## Access Node watch container shell
	@echo "$(GREEN)Accessing Node watch container...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec node_watch sh

dev-watch-logs: ## Show logs from Vite watch container
	$(DOCKER_COMPOSE_DEV) logs -f node_watch

##@ Symfony & Composer

composer: ## Run composer command (use: make composer cmd="install")
	@if [ -z "$(cmd)" ]; then \
		echo "$(YELLOW)Usage: make composer cmd=\"your-command\"$(NC)"
	else \
		$(DOCKER_COMPOSE_DEV) exec php composer $(cmd); \
	fi

composer-install: ## Install composer dependencies
	@echo "$(GREEN)Installing composer dependencies...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php composer install --no-interaction --prefer-dist --optimize-autoloader

composer-update: ## Update composer dependencies
	@echo "$(GREEN)Updating composer dependencies...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php composer update --no-interaction

composer-require: ## Install a package (use: make composer-require pkg="vendor/package")
	@if [ -z "$(pkg)" ]; then \
		echo "$(YELLOW)Usage: make composer-require pkg=\"vendor/package\"$(NC)"
	else \
		$(DOCKER_COMPOSE_DEV) exec php composer require $(pkg); \
	fi

composer-require-dev: ## Install a dev package (use: make composer-require-dev pkg="vendor/package")
	@if [ -z "$(pkg)" ]; then \
		echo "$(YELLOW)Usage: make composer-require-dev pkg=\"vendor/package\"$(NC)"
	else \
		$(DOCKER_COMPOSE_DEV) exec php composer require --dev $(pkg); \
	fi

composer-remove: ## Remove a package (use: make composer-remove pkg="vendor/package")
	@if [ -z "$(pkg)" ]; then \
		echo "$(YELLOW)Usage: make composer-remove pkg=\"vendor/package\"$(NC)"
	else \
		$(DOCKER_COMPOSE_DEV) exec php composer remove $(pkg); \
	fi

composer-validate: ## Validate composer.json
	@echo "$(GREEN)Validating composer.json...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php composer validate --strict

composer-dump-autoload: ## Regenerate autoload files
	@echo "$(GREEN)Dumping autoload...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php composer dump-autoload --optimize

symfony: ## Run Symfony console command (use: make symfony cmd="cache:clear")
	@if [ -z "$(cmd)" ]; then \
		echo "$(YELLOW)Usage: make symfony cmd=\"your-command\"$(NC)"
	else \
		$(DOCKER_COMPOSE_DEV) exec php php bin/console $(cmd); \
	fi

dump-routes: ## Dump FOS JS Routing routes to JSON
	@echo "$(GREEN)Dumping exposed routes...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php php bin/console fos:js-routing:dump --format=json --target=assets/routing/routes.json

cache-clear: ## Clear Symfony cache
	@echo "$(GREEN)Clearing cache...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php php bin/console cache:clear

cache-warmup: ## Warmup Symfony cache
	@echo "$(GREEN)Warming up cache...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php php bin/console cache:warmup

##@ Database

db-create: ## Create database
	@echo "$(GREEN)Creating database...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php php bin/console doctrine:database:create --if-not-exists
	@$(MAKE) db-collation
	@$(MAKE) db-extensions

db-drop: ## Drop database
	@echo "$(YELLOW)Dropping database...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php bin/console doctrine:database:drop --force

db-collation: ## MariaDB uses utf8mb4_unicode_ci by default (Dev)
	@echo "$(GREEN)MariaDB uses utf8mb4_unicode_ci collation by default$(NC)"

db-extensions: ## MariaDB extensions are configured in init scripts (Dev)
	@echo "$(GREEN)MariaDB extensions are automatically configured via init scripts$(NC)"

db-migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php bin/console doctrine:migrations:migrate --no-interaction

db-migration-create: ## Create new migration (use: make db-migration-create name="YourMigration")
	@if [ -z "$(name)" ]; then \
		$(DOCKER_COMPOSE_DEV) exec php php bin/console doctrine:migrations:generate; \
	else \
		$(DOCKER_COMPOSE_DEV) exec php bin/console doctrine:migrations:generate --namespace="$(name)"; \
	fi

db-fixtures: ## Load database fixtures
	@echo "$(GREEN)Loading fixtures...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php bin/console doctrine:fixtures:load --no-interaction

db-populate-customers: ## Populate customers from existing data (use reset=1 to restart)
	@echo "$(GREEN)Populating customers...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php bin/console app:migration:populate-customers --reset=$(reset)

db-reset: db-drop db-create db-migrate db-fixtures ## Reset database (drop, create, migrate, fixtures)

db-validate: ## Validate doctrine mapping
	$(DOCKER_COMPOSE_DEV) exec php php bin/console doctrine:schema:validate

##@ Symfony Package Installation

install-api: ## Install API Platform
	@echo "$(GREEN)Installing API Platform...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php composer require api

install-security: ## Install Security components (already included in base)
	@echo "$(GREEN)Security components are already installed$(NC)"

install-cache: ## Install Cache component
	@echo "$(GREEN)Installing Cache component...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php composer require symfony/cache

install-redis-bundle: ## Install Redis Bundle
	@echo "$(GREEN)Installing Redis Bundle...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php composer require snc/redis-bundle

install-event-store: ## Install Broadway Event Store
	@echo "$(GREEN)Installing Broadway Event Store...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php composer require broadway/broadway broadway/event-store-dbal

install-uuid: ## Install UUID/ULID support (already included)
	@echo "$(GREEN)UUID support is already installed$(NC)"

install-serializer: ## Install Serializer component (already included)
	@echo "$(GREEN)Serializer component is already installed$(NC)"

install-messenger: ## Install Messenger component (already included)
	@echo "$(GREEN)Messenger component is already installed$(NC)"

install-all-packages: composer-install install-redis-bundle install-event-store ## Install all recommended packages

##@ Code Quality

phpstan-install: ## Install PHPStan
	@echo "$(GREEN)Installing PHPStan...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php composer require --dev phpstan/phpstan phpstan/phpstan-symfony phpstan/phpstan-doctrine

phpstan: ## Run PHPStan analysis
	@echo "$(GREEN)Running PHPStan...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php vendor/bin/phpstan analyse src --level=8

cs-fixer-install: ## Install PHP CS Fixer
	@echo "$(GREEN)Installing PHP CS Fixer...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php composer require --dev friendsofphp/php-cs-fixer

cs-check: ## Check code style
	@echo "$(GREEN)Checking code style...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php vendor/bin/php-cs-fixer fix --dry-run --diff

cs-fix: ## Fix code style
	@echo "$(GREEN)Fixing code style...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php vendor/bin/php-cs-fixer fix

rector-install: ## Install Rector
	@echo "$(GREEN)Installing Rector...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php composer require --dev rector/rector

rector: ## Run Rector
	@echo "$(GREEN)Running Rector...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php vendor/bin/rector process src --dry-run

rector-fix: ## Run Rector and apply changes
	@echo "$(GREEN)Running Rector with fixes...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php vendor/bin/rector process src

quality-tools: phpstan-install cs-fixer-install ## Install all quality tools

quality-check: phpstan cs-check ## Run all quality checks

##@ Testing (PHPUnit)

test: test-all ## Run full test suite (unit + E2E)

test-unit: ## Run PHPUnit tests (Test containers)
	@echo "$(GREEN)Running PHPUnit tests...$(NC)"
	@if [ -z "$$$(docker ps -q -f name=test_physiotherapy_php)" ]; then \
		echo "$(YELLOW)Starting Test Environment...$(NC)"; \
		make test-up; \
		sleep 5; \
	fi
	$(DOCKER_COMPOSE_TEST) exec -T php_test composer install --no-interaction --prefer-dist --optimize-autoloader
	$(DOCKER_COMPOSE_TEST) exec -T php_test mkdir -p config/jwt
	$(DOCKER_COMPOSE_TEST) exec -T php_test php bin/console lexik:jwt:generate-keypair --skip-if-exists
	$(DOCKER_COMPOSE_TEST) exec -T php_test php bin/phpunit

test-coverage: ## Run tests with coverage
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php php bin/phpunit --coverage-html var/coverage

##@ E2E Testing (Playwright)

test-reset-db: ## Reset Test Database
	@echo "$(GREEN)Resetting Test Database...$(NC)"
	$(DOCKER_COMPOSE_TEST) exec php_test php bin/console doctrine:schema:drop --force --full-database
	$(DOCKER_COMPOSE_TEST) exec php_test php bin/console doctrine:schema:create
	$(DOCKER_COMPOSE_TEST) exec php_test php bin/console doctrine:fixtures:load --no-interaction

test-e2e: ## Run Playwright E2E tests (Headless) (use: make test-e2e file="tests/e2e/login.spec.js")
	@echo "$(GREEN)Running E2E Tests (Headless)...$(NC)"
	@if [ -z "$$$(docker ps -q -f name=test_physiotherapy_php)" ]; then \
		echo "$(YELLOW)Starting Test Environment...$(NC)"; \
		make test-up; \
		sleep 5; \
	fi
	$(DOCKER_COMPOSE_TEST) exec -T php_test mkdir -p config/jwt
	$(DOCKER_COMPOSE_TEST) exec -T php_test php bin/console lexik:jwt:generate-keypair --skip-if-exists
	$(DOCKER_COMPOSE_TEST) exec -T php_test php bin/console cache:clear
	make test-reset-db
	npx playwright test $(file)

test-e2e-ui: ## Run Playwright E2E tests (UI Mode) (use: make test-e2e-ui file="tests/e2e/login.spec.js")
	@echo "$(GREEN)Running E2E Tests (UI Mode)...$(NC)"
	@if [ -z "$$$(docker ps -q -f name=test_physiotherapy_php)" ]; then \
		echo "$(YELLOW)Starting Test Environment...$(NC)"; \
		make test-up; \
		sleep 5; \
	fi
	npx playwright test --ui $(file)

test-e2e-video: ## Run E2E test with video recording (use: make test-e2e-video file="tests/e2e/login.spec.js")
	@echo "$(GREEN)Running E2E Test with Video Recording...$(NC)"
	@if [ -z "$$$(docker ps -q -f name=test_physiotherapy_php)" ]; then \
		echo "$(YELLOW)Starting Test Environment...$(NC)"; \
		make test-up; \
		sleep 5; \
	fi
	$(DOCKER_COMPOSE_TEST) exec -T php_test mkdir -p config/jwt
	$(DOCKER_COMPOSE_TEST) exec -T php_test php bin/console lexik:jwt:generate-keypair --skip-if-exists
	make test-reset-db
	@echo "$(YELLOW)Enabling video recording...$(NC)"
	@perl -i -pe 's/video: '\''retain-on-failure'\''/video: '\''on'\''/' playwright.config.cjs
	@npx playwright test $(file) || true
	@echo "$(YELLOW)Restoring video config...$(NC)"
	@perl -i -pe 's/video: '\''on'\''/video: '\''retain-on-failure'\''/' playwright.config.cjs
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║  Test completed! Video recording:                         ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@VIDEO_PATH=$$(find var/log/playwright/test-results -name "*.webm" -type f 2>/dev/null | head -n 1); \
	if [ -n "$$VIDEO_PATH" ]; then \
		echo "$(GREEN)📹 Video saved at:$(NC)"; \
		echo "   $(YELLOW)$$VIDEO_PATH$(NC)"; \
		echo ""; \
		echo "$(GREEN)To open the video:$(NC)"; \
		echo "   open $$VIDEO_PATH"; \
		echo ""; \
		echo "$(GREEN)To view HTML report:$(NC)"; \
		echo "   npx playwright show-report var/log/playwright/report"; \
	else \
		echo "$(YELLOW)⚠ No video found. Test may have been skipped or failed to record.$(NC)"; \
	fi

test-all: test-unit test-e2e ## Run full test suite (unit + E2E)

##@ Project Setup

dev-install: dev-build dev-up wait-for-services init-symfony install-all-packages db-setup dump-routes success-message ## Full project installation (Dev)

init-symfony: ## Initialize Symfony application
	@echo "$(GREEN)Initializing Symfony application...$(NC)"
	@if [ ! -f "bin/console" ]; then \
		echo "$(YELLOW)Creating Symfony skeleton...$(NC)"; \
		$(DOCKER_COMPOSE_DEV) exec php composer create-project symfony/skeleton:"7.4.*" temp; \
		$(DOCKER_COMPOSE_DEV) exec php sh -c "cp -r temp/* temp/.* . 2>/dev/null || true"; \
		$(DOCKER_COMPOSE_DEV) exec php rm -rf temp; \
	else \
		echo "$(GREEN)Symfony already initialized$(NC)"; \
	fi

wait-for-services: ## Wait for services to be ready
	@echo "$(YELLOW)Waiting for services to be ready...$(NC)"
	@sleep 5
	@until $(DOCKER_COMPOSE_DEV) exec mariadb mariadb -u physiotherapy_user -pphysiotherapy_pass -e "SELECT 1" > /dev/null 2>&1; do \
		echo "$(YELLOW)Waiting for MariaDB...$(NC)"; \
		sleep 2; \
	done
	@echo "$(GREEN)MariaDB is ready!$(NC)"
	@until $(DOCKER_COMPOSE_DEV) exec redis redis-cli ping > /dev/null 2>&1; do \
		echo "$(YELLOW)Waiting for Redis...$(NC)"; \
		sleep 2; \
	done
	@echo "$(GREEN)Redis is ready!$(NC)"


db-setup: db-create db-migrate ## Setup database (create + migrate)

success-message: ## Display success message
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║  Project installed successfully!                          ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Service URLs:$(NC)"
	@echo "  • Application:      $(YELLOW)http://localhost$(NC)"
	@echo "  • Vite Dev Server:  $(YELLOW)http://localhost:5173$(NC)"
	@echo "  • MailPit UI:       $(YELLOW)http://localhost:8025$(NC)"
	@echo "  • Adminer UI:       $(YELLOW)http://localhost:8080$(NC)"
	@echo "  • MariaDB:          $(YELLOW)localhost:3306$(NC)"
	@echo "  • Redis:            $(YELLOW)localhost:6379$(NC)"
	@echo ""
	@echo "$(GREEN)Next steps:$(NC)"
	@echo "  1. Run 'make symfony cmd=\"make:controller\"' to create your first controller"
	@echo "  2. Run 'make symfony cmd=\"make:entity\"' to create entities"
	@echo "  3. Run 'make db-migration-create' to create migrations"
	@echo "  4. Run 'make help' to see all available commands"
	@echo ""

dev-quick-start: dev-build dev-up wait-for-services composer-install db-setup success-message ## Quick start (assumes Symfony is already initialized)

##@ Cleanup

dev-clean: dev-down ## Stop containers and remove volumes
	@echo "$(YELLOW)Removing volumes...$(NC)"
	$(DOCKER_COMPOSE_DEV) down -v

clean-cache: ## Remove Symfony cache and logs
	@echo "$(YELLOW)Cleaning cache and logs...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php rm -rf var/cache/* var/log/*

##@ Utilities

mailpit: ## Open MailPit web interface
	@echo "$(GREEN)Opening MailPit...$(NC)"
	@open http://localhost:8025 2>/dev/null || xdg-open http://localhost:8025 2>/dev/null || echo "Please open http://localhost:8025 in your browser"

urls: ## Show all service URLs
	@echo "$(GREEN)Service URLs:$(NC)"
	@echo "  Application:      http://localhost"
	@echo "  Vite Dev Server:  http://localhost:5173"
	@echo "  MailPit UI:       http://localhost:8025"
	@echo "  Adminer UI:       http://localhost:8080"
	@echo "  MariaDB:          localhost:3306"
	@echo "  Redis:            localhost:6379"
