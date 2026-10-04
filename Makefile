.DEFAULT_GOAL := help
# Lifecycle, migrations and test preparation must run in order, even with make -j.
.NOTPARALLEL:

DOCKER_COMPOSE ?= docker compose
DOCKER_COMPOSE_DEV = $(DOCKER_COMPOSE) -f docker/dev/docker-compose.yaml -f docker/dev/docker-compose.override.yaml
TEST_WEB_PORT ?= 8081
E2E_BASE_URL ?= http://127.0.0.1:$(TEST_WEB_PORT)
DOCKER_COMPOSE_TEST = TEST_WEB_PORT=$(TEST_WEB_PORT) $(DOCKER_COMPOSE) -f docker/test/docker-compose.yaml
PHP = $(DOCKER_COMPOSE_DEV) exec -T php
CONSOLE = $(PHP) php bin/console
NODE = $(DOCKER_COMPOSE_DEV) exec -T node_watch
TEST_PHP = $(DOCKER_COMPOSE_TEST) exec -T php_test
TEST_CONSOLE = $(TEST_PHP) php bin/console

.PHONY: help guard-real-repo node22-guard require-pkg require-cmd
.PHONY: deps-check deps-add deps-add-dev deps-audit deps-install
.PHONY: dev-build dev-up dev-down dev-restart dev-logs dev-ps dev-clean
.PHONY: dev-shell dev-shell-php dev-shell-db dev-shell-redis dev-shell-node dev-watch-logs
.PHONY: composer composer-install composer-update composer-dump-autoload symfony dump-routes cache-clear cache-warmup clean-cache
.PHONY: db-create db-drop db-migrate db-migration-create db-fixtures db-populate-customers db-reset db-validate db-setup
.PHONY: phpstan cs-check cs-fix rector rector-fix quality-check
.PHONY: test-build test-up test-down test-logs test-shell-php test-assets-build test-prepare test-reset-db test-fix-cache-perms
.PHONY: test test-unit test-coverage test-frontend test-e2e-prepare test-e2e test-e2e-ui test-e2e-video test-all
.PHONY: dev-install dev-quick-start jwt-setup jwt-setup-test build-assets prod-release urls mailpit
.PHONY: opencode-init opencode-link opencode-verify opencode-open opencode-start

##@ Project

help: ## List available commands
	@awk 'BEGIN {FS = ":.*##"; print "PCMS — make <target>"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  %-24s %s\n", $$1, $$2} /^##@/ {printf "\n%s\n", substr($$0, 5)}' $(MAKEFILE_LIST)

guard-real-repo:
	@test -f composer.json && test -f playwright.config.ts && test -d src && test -d tests || { echo "Run make from the pcms project root."; exit 1; }

node22-guard:
	@node -e "if (Number(process.versions.node.split('.')[0]) < 22) { console.error('Node.js 22+ is required.'); process.exit(1); }"

require-pkg:
	@test -n "$(pkg)" || { echo 'Usage: make deps-check|deps-add|deps-add-dev pkg=package'; exit 1; }

require-cmd:
	@test -n "$(cmd)" || { echo 'Usage: make composer|symfony cmd="command"'; exit 1; }

dev-install: dev-build dev-up composer-install jwt-setup db-setup dump-routes urls ## Install the project from its lockfiles

dev-quick-start: dev-install

##@ Development containers

dev-build: guard-real-repo ## Build development images
	$(DOCKER_COMPOSE_DEV) build

dev-up: guard-real-repo ## Start services and wait for health checks
	$(DOCKER_COMPOSE_DEV) up -d --wait --wait-timeout 120

dev-down: guard-real-repo ## Stop development containers
	$(DOCKER_COMPOSE_DEV) down

dev-restart: dev-down dev-up ## Recreate development containers

dev-logs: ## Follow logs (optional: service=php)
	$(DOCKER_COMPOSE_DEV) logs -f $(service)

dev-ps: ## Show service status
	$(DOCKER_COMPOSE_DEV) ps

dev-shell: dev-shell-php

dev-shell-php: ## Open PHP shell
	$(DOCKER_COMPOSE_DEV) exec php sh

dev-shell-db: ## Open MariaDB shell
	$(DOCKER_COMPOSE_DEV) exec mariadb mariadb -u physiotherapy_user -pphysiotherapy_pass physiotherapy_db

dev-shell-redis: ## Open Redis CLI
	$(DOCKER_COMPOSE_DEV) exec redis redis-cli

dev-shell-node: ## Open Node shell
	$(DOCKER_COMPOSE_DEV) exec node_watch sh

dev-watch-logs: ## Follow Vite logs
	$(DOCKER_COMPOSE_DEV) logs -f node_watch

dev-clean: guard-real-repo ## Remove development containers and Docker volumes (not bind-mounted data)
	$(DOCKER_COMPOSE_DEV) down -v

##@ Dependencies

composer: require-cmd ## Run Composer (cmd="validate")
	$(PHP) composer $(cmd)

composer-install: ## Install locked PHP dependencies, including development tools
	$(PHP) composer install --no-interaction --prefer-dist --optimize-autoloader

composer-update: ## Update PHP dependencies and lockfile
	$(PHP) composer update --no-interaction

composer-dump-autoload: ## Regenerate PHP autoload files
	$(PHP) composer dump-autoload --optimize

deps-check: node22-guard require-pkg ## Check a frontend package (pkg=name@version)
	pnpm run deps:check -- $(pkg)

deps-add: node22-guard require-pkg ## Add a checked frontend dependency (pkg=name@version)
	pnpm run deps:add -- $(pkg)

deps-add-dev: node22-guard require-pkg ## Add a checked frontend dev dependency (pkg=name@version)
	pnpm run deps:add:dev -- $(pkg)

deps-audit: node22-guard ## Audit frontend dependencies
	pnpm run deps:audit

deps-install: node22-guard ## Install locked frontend dependencies without lifecycle scripts
	pnpm run deps:install

##@ Symfony and database

symfony: require-cmd ## Run console command (cmd="debug:router")
	$(CONSOLE) $(cmd)

jwt-setup: ## Generate development JWT keys
	$(PHP) sh -c 'mkdir -p config/jwt; if [ -f config/jwt/private.pem ] && ! openssl rsa -check -in config/jwt/private.pem -passin "pass:$$JWT_PASSPHRASE" -noout >/dev/null 2>&1; then rm -f config/jwt/private.pem config/jwt/public.pem; fi; php bin/console lexik:jwt:generate-keypair --skip-if-exists && chmod 666 config/jwt/*.pem'

dump-routes: ## Generate frontend API routes
	$(CONSOLE) fos:js-routing:dump --format=json --target=assets/routing/routes.json

cache-clear: ## Clear Symfony cache
	$(CONSOLE) cache:clear

cache-warmup: ## Warm Symfony cache
	$(CONSOLE) cache:warmup

clean-cache: ## Delete Symfony cache and logs
	$(PHP) sh -c 'rm -rf var/cache/* var/log/*'

db-create: ## Create database if missing
	$(CONSOLE) doctrine:database:create --if-not-exists

db-drop: ## Drop development database
	$(CONSOLE) doctrine:database:drop --force

db-migrate: ## Apply migrations
	$(CONSOLE) doctrine:migrations:migrate --no-interaction

db-migration-create: ## Generate an empty migration (optional: name=namespace)
	$(CONSOLE) doctrine:migrations:generate $(if $(name),--namespace="$(name)")

db-fixtures: ## Replace development data with fixtures
	$(CONSOLE) doctrine:fixtures:load --no-interaction

db-populate-customers: ## Populate billing customers (optional: reset=1)
	$(CONSOLE) app:migration:populate-customers --reset=$(or $(reset),0)

db-setup: db-create db-migrate

db-reset: db-drop db-setup db-fixtures ## Recreate development database with fixtures

db-validate: ## Validate Doctrine mappings and schema
	$(CONSOLE) doctrine:schema:validate

##@ Build and quality

build-assets: dump-routes ## Build frontend assets, then refresh cache
	$(NODE) pnpm run build
	$(MAKE) cache-clear cache-warmup

phpstan: ## Run PHPStan
	$(PHP) vendor/bin/phpstan analyse src --level=8

cs-check: ## Check PHP style
	$(PHP) vendor/bin/php-cs-fixer fix --dry-run --diff

cs-fix: ## Fix PHP style
	$(PHP) vendor/bin/php-cs-fixer fix

rector: ## Preview Rector changes
	$(PHP) vendor/bin/rector process src --dry-run

rector-fix: ## Apply Rector changes
	$(PHP) vendor/bin/rector process src

quality-check: phpstan cs-check ## Run PHP static analysis and style checks

##@ Tests

test-build: guard-real-repo ## Build test images
	$(DOCKER_COMPOSE_TEST) build

test-up: guard-real-repo ## Start test services (TEST_WEB_PORT=8081)
	$(DOCKER_COMPOSE_TEST) up -d --wait --wait-timeout 120

test-down: guard-real-repo ## Stop test containers, retaining database files
	$(DOCKER_COMPOSE_TEST) down --remove-orphans

test-logs: ## Follow test logs
	$(DOCKER_COMPOSE_TEST) logs -f $(service)

test-shell-php: ## Open test PHP shell
	$(DOCKER_COMPOSE_TEST) exec php_test sh

test-assets-build: ## Install locked frontend dependencies and build test assets
	$(DOCKER_COMPOSE_TEST) run --rm node_test sh -c 'corepack enable && pnpm install --frozen-lockfile && pnpm run build:test'

jwt-setup-test:
	$(TEST_PHP) sh -c 'mkdir -p config/jwt && php bin/console lexik:jwt:generate-keypair --skip-if-exists && chmod 666 config/jwt/*.pem'

test-prepare: test-up
	$(TEST_PHP) sh -c 'if [ ! -f vendor/autoload.php ]; then composer install --no-interaction --prefer-dist --optimize-autoloader; fi'
	$(MAKE) jwt-setup-test

test: test-prepare ## Run PHPUnit
	$(TEST_PHP) php bin/phpunit

test-unit: test

test-coverage: test-prepare ## Run PHPUnit with HTML coverage (requires a coverage driver)
	$(TEST_PHP) php bin/phpunit --coverage-html var/coverage

test-frontend: ## Run Vitest in the development Node container
	$(NODE) pnpm run test:unit

test-reset-db: ## Replace test database with fixtures
	$(TEST_CONSOLE) doctrine:schema:drop --force --full-database
	$(TEST_CONSOLE) doctrine:schema:create
	$(TEST_CONSOLE) doctrine:fixtures:load --no-interaction

test-fix-cache-perms:
	$(TEST_PHP) sh -c 'rm -rf var/cache/test && mkdir -p var/cache/test/doctrine/orm/Proxies && chmod -R 777 var/cache/test'

test-e2e-prepare: node22-guard test-prepare test-fix-cache-perms
	$(TEST_CONSOLE) cache:clear
	$(MAKE) test-reset-db
	corepack pnpm exec bddgen test -c playwright.config.ts

test-e2e: test-e2e-prepare ## Run Playwright (optional: file=path, args="--project=bdd")
	E2E_BASE_URL="$(E2E_BASE_URL)" corepack pnpm exec playwright test $(file) $(args)

test-e2e-ui: ## Run Playwright UI
	$(MAKE) test-e2e args="--ui $(args)"

test-e2e-video: ## Keep videos for all selected Playwright tests
	PLAYWRIGHT_VIDEO=on $(MAKE) test-e2e

test-all: test test-frontend test-e2e ## Run PHP, frontend and browser tests

##@ Utilities

prod-release: ## Build and deploy (optional: server=host tag=version)
	@SERVER="$(server)" TAG="$(tag)" ./scripts/release.sh

urls: ## Show development URLs
	@printf '%s\n' 'Application: http://localhost' 'Vite: http://localhost:5173' 'MailPit: http://localhost:8025' 'Adminer: http://localhost:8080' 'MariaDB: localhost:3306' 'Redis: localhost:6379'

mailpit: ## Open MailPit
	@open http://localhost:8025 2>/dev/null || xdg-open http://localhost:8025 2>/dev/null || echo 'http://localhost:8025'

opencode-init:
	$(MAKE) -C opencode-bundle bundle-init-all

opencode-link:
	$(MAKE) -C opencode-bundle link-parent

opencode-verify:
	$(MAKE) -C opencode-bundle bundle-verify-all

opencode-open:
	$(MAKE) -C opencode-bundle opencode-all ARGS="$(ARGS)"

opencode-start: opencode-init opencode-link opencode-verify opencode-open ## Start the optional local OpenCode bundle
