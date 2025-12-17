.PHONY: help build up down restart logs ps shell-php shell-db composer symfony cache-clear db-create db-migrate db-fixtures test clean install

# Default target
.DEFAULT_GOAL := help

# Docker compose file location
DOCKER_COMPOSE = docker-compose -f docker/dev/docker-compose.yaml

# Colors for terminal output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
NC     := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(GREEN)Physiotherapy Clinic Management System - Development Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(YELLOW)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(GREEN)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Docker Management

build: ## Build all Docker containers
	@echo "$(GREEN)Building Docker containers...$(NC)"
	$(DOCKER_COMPOSE) build

up: ## Start all containers in background
	@echo "$(GREEN)Starting containers...$(NC)"
	$(DOCKER_COMPOSE) up -d

down: ## Stop and remove all containers
	@echo "$(YELLOW)Stopping containers...$(NC)"
	$(DOCKER_COMPOSE) down

restart: down up ## Restart all containers

stop: ## Stop all containers without removing
	@echo "$(YELLOW)Stopping containers...$(NC)"
	$(DOCKER_COMPOSE) stop

logs: ## Show logs from all containers (use: make logs service=php)
	@if [ -z "$(service)" ]; then \
		$(DOCKER_COMPOSE) logs -f; \
	else \
		$(DOCKER_COMPOSE) logs -f $(service); \
	fi

ps: ## Show running containers
	$(DOCKER_COMPOSE) ps

##@ Container Access

shell-php: ## Access PHP container shell
	@echo "$(GREEN)Accessing PHP container...$(NC)"
	$(DOCKER_COMPOSE) exec php sh

shell-db: ## Access PostgreSQL database shell
	@echo "$(GREEN)Accessing PostgreSQL...$(NC)"
	$(DOCKER_COMPOSE) exec postgres psql -U physiotherapy_user -d physiotherapy_db

shell-redis: ## Access Redis CLI
	@echo "$(GREEN)Accessing Redis CLI...$(NC)"
	$(DOCKER_COMPOSE) exec redis redis-cli

##@ Symfony & Composer

composer: ## Run composer command (use: make composer cmd="install")
	@if [ -z "$(cmd)" ]; then \
		echo "$(YELLOW)Usage: make composer cmd=\"your-command\"$(NC)"; \
	else \
		$(DOCKER_COMPOSE) exec php composer $(cmd); \
	fi

symfony: ## Run Symfony console command (use: make symfony cmd="cache:clear")
	@if [ -z "$(cmd)" ]; then \
		echo "$(YELLOW)Usage: make symfony cmd=\"your-command\"$(NC)"; \
	else \
		$(DOCKER_COMPOSE) exec php php bin/console $(cmd); \
	fi

cache-clear: ## Clear Symfony cache
	@echo "$(GREEN)Clearing cache...$(NC)"
	$(DOCKER_COMPOSE) exec php php bin/console cache:clear

##@ Database

db-create: ## Create database
	@echo "$(GREEN)Creating database...$(NC)"
	$(DOCKER_COMPOSE) exec php php bin/console doctrine:database:create --if-not-exists

db-drop: ## Drop database
	@echo "$(YELLOW)Dropping database...$(NC)"
	$(DOCKER_COMPOSE) exec php php bin/console doctrine:database:drop --force

db-migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(NC)"
	$(DOCKER_COMPOSE) exec php php bin/console doctrine:migrations:migrate --no-interaction

db-migration-create: ## Create new migration (use: make db-migration-create name="YourMigration")
	@if [ -z "$(name)" ]; then \
		$(DOCKER_COMPOSE) exec php php bin/console doctrine:migrations:generate; \
	else \
		$(DOCKER_COMPOSE) exec php php bin/console doctrine:migrations:generate --namespace="$(name)"; \
	fi

db-fixtures: ## Load database fixtures
	@echo "$(GREEN)Loading fixtures...$(NC)"
	$(DOCKER_COMPOSE) exec php php bin/console doctrine:fixtures:load --no-interaction

db-reset: db-drop db-create db-migrate db-fixtures ## Reset database (drop, create, migrate, fixtures)

db-validate: ## Validate doctrine mapping
	$(DOCKER_COMPOSE) exec php php bin/console doctrine:schema:validate

##@ Testing

test: ## Run PHPUnit tests
	@echo "$(GREEN)Running tests...$(NC)"
	$(DOCKER_COMPOSE) exec php php bin/phpunit

test-coverage: ## Run tests with coverage
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	$(DOCKER_COMPOSE) exec php php bin/phpunit --coverage-html var/coverage

##@ Project Setup

install: build up composer-install db-setup ## Full project installation
	@echo "$(GREEN)Project installed successfully!$(NC)"
	@echo "$(GREEN)Application: http://localhost$(NC)"
	@echo "$(GREEN)MailPit UI: http://localhost:8025$(NC)"

composer-install: ## Install composer dependencies
	@echo "$(GREEN)Installing composer dependencies...$(NC)"
	$(DOCKER_COMPOSE) exec php composer install

db-setup: db-create db-migrate ## Setup database (create + migrate)

##@ Cleanup

clean: down ## Stop containers and remove volumes
	@echo "$(YELLOW)Removing volumes...$(NC)"
	$(DOCKER_COMPOSE) down -v

clean-cache: ## Remove Symfony cache and logs
	@echo "$(YELLOW)Cleaning cache and logs...$(NC)"
	$(DOCKER_COMPOSE) exec php rm -rf var/cache/* var/log/*

##@ Utilities

mailpit: ## Open MailPit web interface
	@echo "$(GREEN)Opening MailPit...$(NC)"
	@open http://localhost:8025 2>/dev/null || xdg-open http://localhost:8025 2>/dev/null || echo "Please open http://localhost:8025 in your browser"

urls: ## Show all service URLs
	@echo "$(GREEN)Service URLs:$(NC)"
	@echo "  Application:  http://localhost"
	@echo "  MailPit UI:   http://localhost:8025"
	@echo "  PostgreSQL:   localhost:5432"
	@echo "  Redis:        localhost:6379"
