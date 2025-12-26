.PHONY: help dev-build dev-up dev-down dev-restart dev-logs dev-ps dev-shell-php dev-shell-db dev-shell-redis dev-shell-node dev-watch-logs composer composer-install composer-update composer-require composer-require-dev composer-remove composer-validate composer-dump-autoload symfony cache-clear cache-warmup db-create db-drop db-migrate db-migration-create db-fixtures db-reset db-validate install-api install-cache install-redis-bundle install-event-store install-all-packages phpstan-install phpstan cs-fixer-install cs-check cs-fix rector-install rector rector-fix quality-tools quality-check test test-unit test-e2e test-all test-coverage dev-install init-symfony wait-for-services db-setup success-message dev-quick-start dev-clean clean-cache mailpit urls test-up test-down test-build test-logs test-shell-php test-reset-db test-e2e-ui

# Default target
.DEFAULT_GOAL := help

# Docker compose file locations
DOCKER_COMPOSE_DEV = docker-compose -f docker/dev/docker-compose.yaml -f docker/dev/docker-compose.override.yaml
DOCKER_COMPOSE_TEST = docker-compose -f docker/test/docker-compose.yaml

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

##@ Container Access (Dev)

dev-shell-php: ## Access PHP container shell
	@echo "$(GREEN)Accessing PHP container...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php sh

dev-shell-db: ## Access PostgreSQL database shell
	@echo "$(GREEN)Accessing PostgreSQL...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec postgres psql -U physiotherapy_user -d physiotherapy_db

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

db-drop: ## Drop database
	@echo "$(YELLOW)Dropping database...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec php bin/console doctrine:database:drop --force

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

test-all: test-unit test-e2e ## Run full test suite (unit + E2E)

##@ Project Setup

dev-install: dev-build dev-up wait-for-services init-symfony install-all-packages db-setup success-message ## Full project installation (Dev)

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
	@until $(DOCKER_COMPOSE_DEV) exec postgres pg_isready -U physiotherapy_user > /dev/null 2>&1; do \
		echo "$(YELLOW)Waiting for PostgreSQL...$(NC)"; \
		sleep 2; \
	done
	@echo "$(GREEN)PostgreSQL is ready!$(NC)"
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
	@echo "  • PostgreSQL:       $(YELLOW)localhost:5432$(NC)"
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
	@echo "  PostgreSQL:       localhost:5432"
	@echo "  Redis:            localhost:6379"
