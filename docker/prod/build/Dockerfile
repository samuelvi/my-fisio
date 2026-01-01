# Production Build Container
# This Dockerfile creates a container to prepare the application for production deployment
# It installs dependencies, compiles assets, and optimizes the application

FROM php:8.4-fpm-alpine AS builder

# Install system dependencies
RUN apk add --no-cache \
    bash \
    git \
    zip \
    unzip \
    libzip-dev \
    icu-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    nodejs \
    npm

# Install PHP extensions required for production
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        intl \
        opcache \
        zip \
        gd \
        bcmath \
        mbstring

# Install Redis extension
RUN apk add --no-cache pcre-dev $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del pcre-dev $PHPIZE_DEPS

# Configure PHP for production
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Production PHP configuration
RUN echo "memory_limit = 512M" >> $PHP_INI_DIR/conf.d/custom.ini && \
    echo "upload_max_filesize = 100M" >> $PHP_INI_DIR/conf.d/custom.ini && \
    echo "post_max_size = 100M" >> $PHP_INI_DIR/conf.d/custom.ini && \
    echo "max_execution_time = 300" >> $PHP_INI_DIR/conf.d/custom.ini && \
    echo "date.timezone = Europe/Madrid" >> $PHP_INI_DIR/conf.d/custom.ini && \
    echo "opcache.enable = 1" >> $PHP_INI_DIR/conf.d/custom.ini && \
    echo "opcache.memory_consumption = 128" >> $PHP_INI_DIR/conf.d/custom.ini && \
    echo "opcache.max_accelerated_files = 10000" >> $PHP_INI_DIR/conf.d/custom.ini && \
    echo "opcache.validate_timestamps = 0" >> $PHP_INI_DIR/conf.d/custom.ini && \
    echo "opcache.enable_cli = 1" >> $PHP_INI_DIR/conf.d/custom.ini

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Set production environment
ENV APP_ENV=prod
ENV COMPOSER_ALLOW_SUPERUSER=1

# This is a build container - it will be used with bind mounts
# No COPY commands here, as we'll mount the source code at runtime
